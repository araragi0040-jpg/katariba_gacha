import crypto from 'crypto';
import { verifyGachaTicket } from '@/lib/gacha-ticket';
import { callGas } from '@/lib/gacha-gas';
import { handleOptions, jsonError, jsonOk } from '@/lib/gacha-response';

export const runtime = 'nodejs';

type SpinResponse = {
  ok: true;
  result: {
    figureId: number;
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

export async function POST(request: Request) {
  const origin = request.headers.get('origin');

  try {
    const body = await request.json();
    const ticket = body?.ticket || '';
    if (!ticket) {
      return jsonError('ticketがありません。', 401, origin);
    }

    const payload = verifyGachaTicket(ticket);
    const requestId = crypto.randomUUID();

    const gasData = await callGas<SpinResponse>({
      action: 'spin',
      userId: payload.userId,
      displayName: payload.displayName,
      requestId,
      costPt: 1,
    });

    return jsonOk(gasData, origin);
  } catch (error: any) {
    return jsonError(error?.message || 'ガチャ実行に失敗しました。', 400, origin);
  }
}
