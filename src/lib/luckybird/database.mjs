// @ts-check
import 'server-only';
import { Client, neonConfig } from '@neondatabase/serverless';
import { LuckyError } from './config.mjs';

/** @param {string} databaseUrl */
export function databaseClient(databaseUrl) {
  neonConfig.webSocketConstructor = globalThis.WebSocket;
  return new Client({ connectionString: databaseUrl, connectionTimeoutMillis: 10000 });
}
/** @template T @param {{mode: string, databaseUrl: string}} config @param {(db: import('@neondatabase/serverless').Client) => Promise<T>} action */
export async function withDatabase(config, action) {
  const client = databaseClient(config.databaseUrl);
  try {
    await client.connect();
    const result = await client.query('SELECT mode FROM luckybird.environment WHERE singleton = true');
    if (result.rows[0]?.mode !== config.mode) throw new LuckyError('MODE_MISMATCH');
    return await action(client);
  } finally { await client.end().catch(() => {}); }
}
