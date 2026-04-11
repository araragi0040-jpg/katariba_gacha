type GasAction = 'session' | 'spin';

type GasRequestBody = {
  action: GasAction;
  userId: string;
  displayName?: string;
  requestId?: string;
  costPt?: number;
};

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set.`);
  return value;
}

export async function callGas<T>(body: GasRequestBody): Promise<T> {
  const endpoint = getRequiredEnv('GAS_WEB_APP_URL');
  const serverKey = getRequiredEnv('GAS_INTERNAL_SECRET');

  const params = new URLSearchParams();
  params.set('serverKey', serverKey);
  params.set('action', body.action);
  params.set('userId', body.userId);

  if (body.displayName) params.set('displayName', body.displayName);
  if (body.requestId) params.set('requestId', body.requestId);
  if (typeof body.costPt === 'number') params.set('costPt', String(body.costPt));

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'Accept': 'application/json',
    },
    body: params.toString(),
    cache: 'no-store',
  });

  const text = await res.text();
  let data: any = {};
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`GAS response parse error: ${text}`);
  }

  if (!res.ok || !data.ok) {
    throw new Error(data.message || 'GAS API error');
  }

  return data as T;
}
