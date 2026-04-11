import { verifyGachaTicket } from '@/lib/gacha-ticket';
import { callGas } from '@/lib/gacha-gas';
import { handleOptions, jsonError, jsonOk } from '@/lib/gacha-response';

export const runtime = 'nodejs';

type SessionResponse = {
  ok: true;
  session: {
    userId: string;
    displayName: string;
    pt: number;
    totalSpins: number;
    inventory: Record<string, number>;
    collectionOwned: number;
    collectionTotal: number;
  };
};

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  const origin = request.headers.get('origin');

  try {
    const url = new URL(request.url);
    const ticket = url.searchParams.get('ticket') || '';
    if (!ticket) {
      return jsonError('ticketがありません。', 401, origin);
    }

    const payload = verifyGachaTicket(ticket);

    const gasData = await callGas<SessionResponse>({
      action: 'session',
      userId: payload.userId,
      displayName: payload.displayName,
    });

    return jsonOk(gasData, origin);
  } catch (error: any) {
    return jsonError(error?.message || 'セッション取得に失敗しました。', 401, origin);
  }
}
