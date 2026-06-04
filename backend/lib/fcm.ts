import { secret } from "encore.dev/config";
import crypto from "node:crypto";

const firebaseServiceAccount = secret("FirebaseServiceAccount");
const fcmServerKey = secret("FcmServerKey");

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

export interface PushSendResult {
  successCount: number;
  failureCount: number;
  errors: string[];
}

function parseServiceAccount(): ServiceAccount | null {
  try {
    const raw = firebaseServiceAccount();
    if (!raw?.trim()) return null;
    const parsed = JSON.parse(raw) as ServiceAccount;
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
      return null;
    }
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
    return parsed;
  } catch {
    return null;
  }
}

function getLegacyKey(): string | null {
  try {
    const key = fcmServerKey();
    return key?.trim() ? key.trim() : null;
  } catch {
    return null;
  }
}

export function isFcmConfigured(): boolean {
  return !!(parseServiceAccount() || getLegacyKey());
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(
    JSON.stringify({
      iss: sa.client_email,
      sub: sa.client_email,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
    }),
  );
  const unsigned = `${header}.${claim}`;
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(unsigned)
    .sign(sa.private_key, "base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  const jwt = `${unsigned}.${signature}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FCM OAuth failed: ${res.status} ${text}`);
  }

  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) {
    throw new Error("FCM OAuth: missing access_token");
  }
  return json.access_token;
}

async function sendV1(
  token: string,
  title: string,
  body: string,
  data: Record<string, string>,
): Promise<void> {
  const sa = parseServiceAccount();
  if (!sa) throw new Error("FirebaseServiceAccount secret not configured");

  const accessToken = await getAccessToken(sa);
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          data,
          android: { priority: "high" },
          apns: { payload: { aps: { sound: "default" } } },
        },
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FCM v1 ${res.status}: ${text}`);
  }
}

async function sendLegacy(
  token: string,
  title: string,
  body: string,
  data: Record<string, string>,
): Promise<void> {
  const key = getLegacyKey();
  if (!key) throw new Error("FcmServerKey secret not configured");

  const res = await fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: {
      Authorization: `key=${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: token,
      priority: "high",
      notification: { title, body, sound: "default" },
      data,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FCM legacy ${res.status}: ${text}`);
  }

  const json = (await res.json()) as { success?: number; failure?: number; results?: { error?: string }[] };
  if (json.failure && json.failure > 0) {
    const err = json.results?.[0]?.error ?? "unknown";
    throw new Error(`FCM legacy failure: ${err}`);
  }
}

export async function sendPushToTokens(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, string>,
): Promise<PushSendResult> {
  const unique = [...new Set(tokens.filter(Boolean))];
  if (unique.length === 0) {
    return { successCount: 0, failureCount: 0, errors: ["No FCM tokens"] };
  }

  if (!isFcmConfigured()) {
    return {
      successCount: 0,
      failureCount: unique.length,
      errors: ["FCM not configured. Set FirebaseServiceAccount or FcmServerKey in Encore secrets."],
    };
  }

  const stringData = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, String(v)]),
  );

  const useV1 = !!parseServiceAccount();
  let successCount = 0;
  const errors: string[] = [];

  for (const token of unique) {
    try {
      if (useV1) {
        await sendV1(token, title, body, stringData);
      } else {
        await sendLegacy(token, title, body, stringData);
      }
      successCount++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(msg);
      console.error("[FCM] send failed:", msg);
    }
  }

  return {
    successCount,
    failureCount: unique.length - successCount,
    errors,
  };
}
