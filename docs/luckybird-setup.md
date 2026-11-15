# Lucky Bird — page, checkout and community operations

## Current implementation and verified limits

The dedicated page is `/luckybird` (the site's normal trailing-slash redirect also accepts `/luckybird/`). There is no standalone homepage feature section; the top/mobile navigation says “Lucky Bird's Feather Fundraiser!”. The original two featured work stories and the existing blog remain intact. Lucky's blog story keeps `/blog/luckybird/luckysfeatherfundraiser` and now links to the dedicated page.

The owner authorized live sales, free international shipping, the existing Florida Stripe Tax setup, and a starting run of 20. The live identifiers supplied by the owner are:

- Product: `prod_VdLxh7mOJDzZB8`
- One-time price: `price_1Uc5FBHvvMGc5UBGe7WOSRoS`
- Expected amount/currency: 1000 cents / USD.

These identifiers are public configuration, not credentials. The implementation only retrieves that product/price and creates Checkout Sessions; it never creates products or prices. Their actual provider state, the live tax settings, stock and pipeline destination cannot be independently verified from this local checkout because no Stripe/Neon credentials or Vercel project linkage are available here. No real payment, refund, database migration or deployment was performed by the agent. Purchasing/submissions truthfully remain unavailable locally until their runtime configuration and database are ready. Live sales are supported by the code rather than hard-disabled; availability is checked server-side.

## Environment configuration

Keep using the **existing** Vercel project and integration-managed `STRIPE_SECRET_KEY` and `DATABASE_URL`. Do not create another Stripe product, account, sandbox, integration or duplicate credential. `.env.example` documents names only and is not loaded by the application.

| Variable | Purpose |
| --- | --- |
| `LUCKY_MODE` | Required `test` or `live`; never inferred from the visitor or silently switched. |
| `STRIPE_SECRET_KEY` | Existing server secret/restricted key matching the selected mode. Never public. |
| `DATABASE_URL` | Existing Neon URL for the intended branch/database, with `sslmode=require`. Never public. |
| `LUCKY_STRIPE_SCHEMA` | Existing pipeline schema name, default `stripe`. Set the actual destination schema; lowercase letters, underscores and digits only. |
| `STRIPE_WEBHOOK_SECRET` | This endpoint's signing secret, matching its environment. Do not reuse a secret from another webhook endpoint or overwrite an unrelated endpoint's configuration. |
| `LUCKY_SPAM_SECRET` | Strong independent secret of at least 32 characters, stored through secure environment management. Used to hash abuse-limit identifiers; never returned to clients. |
| `LUCKY_SITE_ORIGIN` | Approved site origin without a trailing slash. Defaults to `https://www.emiliosierra.com`. Use the actual sandbox preview origin for previews, or `http://localhost:3000` for local testing. |
| `LUCKY_TEST_PRODUCT_ID`, `LUCKY_TEST_PRICE_ID` | IDs from the **existing sandbox catalog** when mode is `test`. They have not been supplied yet; do not use the live IDs as substitutes. |

Use a separate Neon test branch/database and sandbox environment for testing. The application-owned `luckybird.environment` singleton records its mode; requests refuse a mismatched database. Both the Stripe API records and pipeline product/price rows must match the configured mode and product IDs. A live credential is rejected in test mode and vice versa. The Stripe-managed schema is always read-only to this application.

## Initialize application tables explicitly

The page needs application-owned inventory, order, moderation, event and rate-limit tables. The pipeline does not reserve stock or perform fulfillment. `db/luckybird/001.sql` defines these tables in `luckybird`, separate from Stripe's tables. There is no ORM and no migration during a build or request.

Once securely supplied environment variables target the confirmed **test** branch, run:

```sh
npm run luckybird -- init --apply
npm run luckybird -- verify
```

The initialization transaction uses an advisory lock and a checksummed migration ledger. It seeds 20 **saleable surprise selections**, one per checkout. This is an inventory of packages/selections, not a guarantee of 20 feathers of any particular type. Prepare enough feathers to fulfill those selections or lower the physical stock count before opening sales. Running initialization again does not reset stock. The database mode cannot be changed by rerunning initialization.

Repeat against the separate live target only when ready, with `LUCKY_MODE=live` and the existing live environment credentials. The verify command reads the existing Stripe product/price, checks their pipeline records and checks inventory setup without moving money. Provider exceptions and connection strings are withheld from output. No environment values should be pasted into chat or committed.

## Checkout, shipping and tax

The browser sends only a UUID retry identifier. Quantity is fixed at one surprise selection per checkout; price, currency, stock, shipping and tax parameters are server-controlled. A product/price ID mismatch, inactive record, recurring price, different currency/amount, wrong mode or missing pipeline record makes checkout unavailable.

Stock reservations increment atomically only when unreserved stock exists. A pending order and its immutable Checkout parameters are committed in the same database transaction. Stripe is contacted afterward using an order-derived idempotency key. Repeated requests reuse the existing order/session. Ambiguous network failures keep stock reserved until reconciliation; the server does not guess whether Stripe accepted the request.

Checkout uses the existing price, card payments, shipping-address collection, required billing-address collection, free shipping and `automatic_tax.enabled=true`. Adaptive currency pricing is disabled so the verified USD amount remains consistent. The supported international destination list lives in `src/lib/luckybird/shipping-countries.mjs`, sourced from the official installed Stripe SDK; review the actual destinations the business can fulfill before public launch. No shipping dates, delivery guarantees or carrier integrations were invented. The owner reports Florida tax is configured; actual jurisdiction/address tax results still need verification in the relevant environment. This implementation does not create tax registrations or replace the owner's tax obligations.

## Webhook and payment confirmation

After an authorized deployment, register the selected environment's endpoint:

`https://www.emiliosierra.com/api/luckybird/webhook`

For sandbox testing, use the actual separate sandbox deployment origin plus `/api/luckybird/webhook` and that endpoint's own signing secret. Select:

- `checkout.session.completed`
- `checkout.session.expired`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `charge.refunded`

Raw request bodies are bounded and signature-verified. The environment must match. The handler retrieves fresh Stripe state, verifies the order/Session relationship, line item, quantity, currency and amount, and requires successful automatic tax and shipping collection before finalization. Payment and inventory changes commit transactionally with processed-event IDs. Replays do not consume stock twice. Refund events record the refunded amount/full-refund state and never automatically restock potentially shipped merchandise. A refund arriving before its payment record is linked returns a retryable failure.

The browser return page only reads the stored order status. It never writes payment state; visiting a success URL cannot mark an order paid. No card numbers or CVC are stored by the application. Stripe-hosted Checkout handles payment details. Email and shipping details are retained only in server-owned orders for fulfillment; public status responses expose no personal information.

Checkout expires after one hour. A canceled or declined attempt is not fulfillment; its reservation is released only after Stripe confirms expiration or a definitive failure. It is never released just because a browser visits the cancel page or a local timer elapsed.

After webhook outages or ambiguous failures, run:

```sh
npm run luckybird -- reconcile
```

Schedule reconciliation in a secure operator environment if desired; it is not a public unauthenticated route. Orders with unbound, already-expired ambiguous Session creation are held and counted as `needsReview` rather than risking an oversale. Verify them against Stripe before manually releasing stock. The script retries valid pending creation using the original parameters/key and reconciles definitive paid/expired states. Do not edit order status/stock independently without reviewing both sides.

## Community moderation and photos

Google Business Profile eligibility is not established for this fundraiser. Google requires an appropriate customer-facing physical/service business presence, so no Google profile, review widget or purported Google reviews were invented. The on-site alternative uses Neon and the existing static-image directory, without new accounts or a third-party image storage service. [Google's eligibility guidance](https://support.google.com/business/answer/3038177?hl=en).

Submissions require display name, private email, message, content/publication consent and an optional HTTPS photo link. The photo URL is stored privately; the server never downloads or renders it. Everything starts `PENDING`. Only approved, consented posts can appear publicly. Text is escaped; length/body limits, honeypot, link/HTML rejection, durable per-hour IP-hash/global limits and UUID retry IDs provide basic spam protection. Honest negative feedback is not filtered for sentiment. No invented testimonials, ratings, verified-buyer labels or fundraising totals are shown.

Review pending submissions privately in Neon. Review photos/content for consent, personal information, spam and respectful language. For approved photos, obtain the actual image with permission, remove private metadata, store it under `public/images/luckybird/community/` and use a safe local filename. Never automatically fetch a submitted URL. Apply a decision with credentials securely supplied to the operations tool:

```sh
npm run luckybird -- moderate <post-uuid> approve
npm run luckybird -- moderate <post-uuid> approve /images/luckybird/community/approved-photo.jpg
npm run luckybird -- moderate <post-uuid> reject
```

Approval is owner-controlled; no public moderation endpoint or new customer accounts exist. Maintain an appropriate retention policy for order/customer data. The tool can remove unpublished posts older than 90 days:

```sh
npm run luckybird -- purge-pending --apply
```

This cleanup is manual unless scheduled securely; no automatic retention claim is made. Review/edit published content or honor removal requests directly through the private database workflow.

The owner-supplied `luckybird.png` portrait is displayed in the introduction and photo album. `luckyPhotos` in `src/content/luckybird.ts` accepts actual local image paths, alt text, captions and dimensions. The first photo becomes the hero, and the gallery uses all photos. Decorative SVG feathers are illustrations, never presented as Lucky photographs. `luckyUpdates` accepts future owner-written notes; no update dates or bird stories were fabricated. Bird-care text links to the Merck Veterinary Manual and stays general rather than diagnosing a bird or inventing care outcomes.

## Verification and remaining work

Automated checks use synthetic Stripe fixtures, mocked provider behavior and disposable local PostgreSQL (PGlite). They do not make real charges or refunds. They exercise fixed pricing, tax/shipping parameters, quantity/stock guards, retries, webhook signatures/modes, payment and refund ordering, expiration, moderation defaults, spam controls and unavailable configuration. Real multi-connection Neon contention, actual sandbox Checkout/Tax outcomes, shipping addresses, signed deliveries and live payment/refund settlement still need testing in their actual environments.

Required before selling: securely configure the existing environment, supply the existing sandbox IDs for testing, initialize/verify the separate application databases, register the appropriate webhook destinations and secrets, add any further photos, verify test flows, and complete a genuine authorized live purchase/refund only when appropriate. Never use Stripe's test cards with live credentials. The agent has not deployed or moved money.

Dependency maintenance: updated Next.js and its matching ESLint configuration to 16.4.6 to remove existing critical runtime advisories, and updated compatible `source-map-js`/`zod` transitive dependencies. The runtime-only dependency audit reports zero findings. Eight moderate development-tool findings remain in the full audit; no forced major downgrade was used. Node 22.12 still reports the pre-existing lint dependency engine requirement for Node 22.13+.
