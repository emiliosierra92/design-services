import { orderStatusGet } from '@/lib/luckybird/http.mjs';
export const runtime = 'nodejs';
export async function GET(request: Request) { return orderStatusGet(request); }
