import { webhookPost } from '@/lib/luckybird/http.mjs';
export const runtime = 'nodejs';
export async function POST(request: Request) { return webhookPost(request); }
