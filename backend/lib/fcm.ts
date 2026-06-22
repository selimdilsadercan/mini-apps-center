/**
 * Firebase Cloud Messaging (HTTP v1) — push bildirim gönderimi.
 *
 * Service account Encore secret olarak servis katmanında okunur ve configureFcm() ile buraya verilir.
 */

export type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

export type FcmSendResult = {
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
};

let serviceAccount: ServiceAccount | null = null;

export function parseServiceAccount(json: string): ServiceAccount | null {
  try {
    const parsed = JSON.parse(json) as ServiceAccount;
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Servis katmanından Firebase service account JSON ile çağırın. */
export function configureFcm(serviceAccountJson: string): void {
  serviceAccount = parseServiceAccount(serviceAccountJson);
}

export function isFcmConfigured(): boolean {
  return serviceAccount !== null;
}

function base64UrlEncode(input: string | Buffer): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claimSet = base64UrlEncode(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${claimSet}`;

  const crypto = await import("crypto");
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(unsigned);
  sign.end();
  const signature = base64UrlEncode(sign.sign(sa.private_key));

  const jwt = `${unsigned}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    throw new Error(`FCM token exchange failed: ${res.status}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function sendV1(
  accessToken: string,
  projectId: string,
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<{ ok: boolean; invalidToken: boolean }> {
  const message: Record<string, unknown> = {
    token,
    notification: { title, body },
    android: { priority: "HIGH" },
    apns: {
      headers: { "apns-priority": "10" },
      payload: { aps: { sound: "default" } },
    },
  };
  if (data && Object.keys(data).length > 0) {
    message.data = data;
  }

  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    },
  );

  if (res.ok) return { ok: true, invalidToken: false };

  const errText = await res.text();
  const invalidToken =
    res.status === 404 ||
    errText.includes("UNREGISTERED") ||
    errText.includes("INVALID_ARGUMENT");

  console.warn(`[FCM] send failed (${res.status}): ${errText.slice(0, 200)}`);
  return { ok: false, invalidToken };
}

/**
 * Verilen FCM token listesine push gönderir.
 * configureFcm() çağrılmamışsa mock modda çalışır (log only).
 */
export async function sendPushToTokens(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<FcmSendResult> {
  if (tokens.length === 0) {
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  if (!serviceAccount) {
    console.log(
      `[FCM mock] ${tokens.length} token(s): "${title}" — ${body.slice(0, 80)}`,
    );
    return { successCount: tokens.length, failureCount: 0, invalidTokens: [] };
  }

  const accessToken = await getAccessToken(serviceAccount);
  let successCount = 0;
  let failureCount = 0;
  const invalidTokens: string[] = [];

  for (const token of tokens) {
    const result = await sendV1(
      accessToken,
      serviceAccount.project_id,
      token,
      title,
      body,
      data,
    );
    if (result.ok) {
      successCount++;
    } else {
      failureCount++;
      if (result.invalidToken) invalidTokens.push(token);
    }
  }

  return { successCount, failureCount, invalidTokens };
}
