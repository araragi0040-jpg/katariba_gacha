import { createGachaTicket } from '@/lib/gacha-ticket';
import { getCurrentUserFromNewsApp } from '@/lib/gacha-auth';
import { handleOptions, jsonError, jsonOk } from '@/lib/gacha-response';

export const runtime = 'nodejs';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  const origin = request.headers.get('origin');
  const currentUser = await getCurrentUserFromNewsApp(request);

  if (!currentUser) {
    return jsonError('ログイン状態を確認できませんでした。', 401, origin);
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get('mode') === 'admin' ? 'admin' : 'user';

  if (mode === 'admin' && !currentUser.isAdmin) {
    return jsonError('運営モードの権限がありません。', 403, origin);
  }

  const ticket = createGachaTicket({
    userId: currentUser.userId,
    displayName: currentUser.displayName,
    role: mode,
  }, 600);

  const githubBase = process.env.GACHA_GITHUB_PAGE_URL;
  if (!githubBase) {
    return jsonError('GACHA_GITHUB_PAGE_URL が未設定です。', 500, origin);
  }

  const redirectUrl = `${githubBase.replace(/\/$/, '')}/?ticket=${encodeURIComponent(ticket)}`;

  return jsonOk({
    ok: true,
    ticket,
    redirectUrl,
    expiresInSeconds: 600,
  }, origin);
}
