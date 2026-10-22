/** Валідація Telegram initData (HMAC-SHA256) */

export async function validateInitData(initData: string, botToken: string): Promise<{ ok: true; userId: string; user: any } | { ok: false; error: string }> {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return { ok: false, error: 'No hash' };

    params.delete('hash');
    // Telegram іноді додає signature (Bot API 8+)
    params.delete('signature');

    const entries = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
    const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');

    // secret_key = HMAC_SHA256(bot_token, "WebAppData")
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode('WebAppData'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const secretKey = await crypto.subtle.sign('HMAC', key, encoder.encode(botToken));

    const secretKeyObj = await crypto.subtle.importKey(
      'raw',
      secretKey,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', secretKeyObj, encoder.encode(dataCheckString));
    const signatureHex = [...new Uint8Array(signature)].map(b => b.toString(16).padStart(2, '0')).join('');

    if (signatureHex !== hash) {
      return { ok: false, error: 'Invalid signature' };
    }

    const authDate = Number(params.get('auth_date') || 0);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) { // 24 години
      return { ok: false, error: 'Init data expired' };
    }

    const userStr = params.get('user');
    if (!userStr) return { ok: false, error: 'No user' };
    const user = JSON.parse(userStr);

    return { ok: true, userId: String(user.id), user };
  } catch (e: any) {
    return { ok: false, error: e.message || 'Validation failed' };
  }
}
