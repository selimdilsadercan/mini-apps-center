import { setCookie, getCookie } from "@/lib/cookies";

const AUTH_SESSION_COOKIE = "everything_auth_session";

export type WebAuthSession = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

export function persistWebAuthSession(session: WebAuthSession) {
  setCookie(AUTH_SESSION_COOKIE, JSON.stringify(session), 30);
}

export function readWebAuthSession(): WebAuthSession | null {
  const raw = getCookie(AUTH_SESSION_COOKIE);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as WebAuthSession;
    if (!parsed?.uid) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearWebAuthSession() {
  setCookie(AUTH_SESSION_COOKIE, "", -1);
}

export function webAuthSessionToUser(session: WebAuthSession) {
  return {
    uid: session.uid,
    email: session.email,
    displayName: session.displayName,
    photoURL: session.photoURL,
  };
}
