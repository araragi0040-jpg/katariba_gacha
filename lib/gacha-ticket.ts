import crypto from 'crypto';

export type GachaTicketPayload = {
  userId: string;
  displayName?: string;
  role?: 'user' | 'admin';
  iat: number;
  exp: number;
};

function getSecret() {
  const secret = process.env.GACHA_TICKET_SECRET;
  if (!secret) throw new Error('GACHA_TICKET_SECRET is not set.');
  return secret;
}

function base64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(input: string) {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((input.length + 3) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function sign(payloadPart: string) {
  const hmac = crypto.createHmac('sha256', getSecret()).update(payloadPart).digest();
  return base64Url(hmac);
}

export function createGachaTicket(payload: Omit<GachaTicketPayload, 'iat' | 'exp'>, expiresInSeconds = 600) {
  const now = Math.floor(Date.now() / 1000);
  const finalPayload: GachaTicketPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const payloadPart = base64Url(JSON.stringify(finalPayload));
  const sigPart = sign(payloadPart);
  return `${payloadPart}.${sigPart}`;
}

export function verifyGachaTicket(token: string): GachaTicketPayload {
  const [payloadPart, sigPart] = token.split('.');
  if (!payloadPart || !sigPart) {
    throw new Error('不正なticket形式です。');
  }

  const expected = sign(payloadPart);
  if (!crypto.timingSafeEqual(Buffer.from(sigPart), Buffer.from(expected))) {
    throw new Error('ticketの署名が不正です。');
  }

  const payload = JSON.parse(fromBase64Url(payloadPart)) as GachaTicketPayload;
  const now = Math.floor(Date.now() / 1000);

  if (!payload.userId) {
    throw new Error('ticket内のuserIdが不正です。');
  }

  if (payload.exp < now) {
    throw new Error('ticketの有効期限が切れています。');
  }

  return payload;
}
