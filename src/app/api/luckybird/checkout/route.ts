import { checkoutPost } from '@/lib/luckybird/http.mjs';
export const runtime = 'nodejs';
export async function POST(request: Request) { return checkoutPost(request); }
