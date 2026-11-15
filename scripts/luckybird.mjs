// Operations tool: never called by a public route or during a build.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { configuration, stripeClient } from '../src/lib/luckybird/config.mjs';
import { databaseClient, withDatabase } from '../src/lib/luckybird/database.mjs';
import { transaction, bindSession } from '../src/lib/luckybird/store.mjs';
import { verifyExistingProduct, processSession } from '../src/lib/luckybird/service.mjs';
import { luckyProduct } from '../src/content/luckybird-product.mjs';

const [command = 'help', ...args] = process.argv.slice(2);
try {
  if (command === 'help') {
    console.log('Commands: init --apply, verify, reconcile, moderate <post UUID> <approve|reject> [local photo path], purge-pending --apply');
    console.log('Uses LUCKY_MODE and securely supplied DATABASE_URL. Init is explicit and never runs during builds.');
  } else {
    const config = configuration();
    if (command === 'init') {
      if (args.length !== 1 || args[0] !== '--apply' || !config.productId) throw new Error();
      const sql = await readFile(new URL('../db/luckybird/001.sql', import.meta.url), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const db = databaseClient(config.databaseUrl);
      try {
        await db.connect();
        await transaction(db, async () => {
          await db.query('SELECT pg_advisory_xact_lock($1)', [174410320]);
          await db.query(`CREATE SCHEMA IF NOT EXISTS luckybird; CREATE TABLE IF NOT EXISTS luckybird.migrations(version text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`);
          const history = await db.query("SELECT checksum FROM luckybird.migrations WHERE version='001'");
          if (history.rows[0] && history.rows[0].checksum !== checksum) throw new Error();
          if (!history.rows.length) {
            await db.query(sql);
            await db.query('INSERT INTO luckybird.environment(singleton,mode) VALUES(true,$1)', [config.mode]);
            await db.query("INSERT INTO luckybird.migrations(version,checksum) VALUES('001',$1)", [checksum]);
          }
          const mode = await db.query('SELECT mode FROM luckybird.environment WHERE singleton=true');
          if (mode.rows[0]?.mode !== config.mode) throw new Error();
          await db.query('INSERT INTO luckybird.inventory(product_id,on_hand) VALUES($1,$2) ON CONFLICT(product_id) DO NOTHING', [config.productId, luckyProduct.initialSaleUnits]);
        });
        console.log(`Application schema initialized in ${config.mode} mode. Existing stock was not reset.`);
      } finally { await db.end().catch(() => {}); }
    } else if (command === 'verify') {
      await withDatabase(config, async db => {
        await verifyExistingProduct(config, stripeClient(config), db);
        const inventory = await db.query('SELECT on_hand,reserved FROM luckybird.inventory WHERE product_id=$1', [config.productId]);
        console.log({ mode: config.mode, existingProductAndPriceVerified: true, pipelineVerified: true, inventoryConfigured: Boolean(inventory.rows[0]) });
      });
    } else if (command === 'reconcile') {
      const stripe = stripeClient(config);
      const summary = { reconciled: 0, needsReview: 0 };
      await withDatabase(config, async db => {
        const result = await db.query("SELECT * FROM luckybird.orders WHERE status IN ('RESERVED','OPEN') AND created_at < now() - interval '2 minutes' ORDER BY created_at LIMIT 100");
        for (const order of result.rows) {
          try {
            // Retry creation only while the original persisted parameters are valid.
            // After ambiguous creation and expiry, hold stock for manual verification.
            if (!order.stripe_session_id && Number(order.checkout_expires_at) <= Date.now()/1000) { summary.needsReview++; continue; }
            const session = order.stripe_session_id
              ? await stripe.checkout.sessions.retrieve(order.stripe_session_id)
              : await stripe.checkout.sessions.create(order.session_parameters, { idempotencyKey: `luckybird/${config.mode}/${order.id}` });
            if (session.livemode !== (config.mode === 'live') || session.metadata?.order_id !== order.id) throw new Error();
            await bindSession(db, order.id, session);
            await processSession(config, stripe, db, session.id, `reconcile/${session.id}/${session.status}/${session.payment_status}`, 'reconcile');
            summary.reconciled++;
          } catch { summary.needsReview++; }
        }
      });
      console.log(summary);
    } else if (command === 'moderate') {
      const [id, decision, photoPath] = args;
      if (!/^[0-9a-f-]{36}$/i.test(id ?? '') || !['approve','reject'].includes(decision) || (photoPath && !/^\/images\/luckybird\/community\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(photoPath))) throw new Error();
      await withDatabase(config, async db => {
        const result = await db.query('UPDATE luckybird.community_posts SET status=$2, photo_path=$3, reviewed_at=now() WHERE id=$1 AND consent=true RETURNING id', [id, decision === 'approve' ? 'APPROVED' : 'REJECTED', photoPath || null]);
        if (!result.rows.length) throw new Error();
      });
      console.log('Moderation decision recorded.');
    } else if (command === 'purge-pending' && args.length === 1 && args[0] === '--apply') {
      await withDatabase(config, db => db.query("DELETE FROM luckybird.community_posts WHERE status <> 'APPROVED' AND created_at < now() - interval '90 days'"));
      console.log('Old unpublished community submissions removed.');
    } else { throw new Error(); }
  }
} catch {
  console.error('Lucky Bird operation unavailable. Check configuration, database mode and documented command arguments. Provider details are withheld.');
  process.exitCode = 1;
}
