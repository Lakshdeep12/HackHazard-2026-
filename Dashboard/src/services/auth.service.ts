import type { LoginPayload, SignupPayload, AuthSession } from "@/types/api";

const TOKEN_KEY = "aegisflow.auth.session";
const API_KEY_KEY = "aegisflow.auth.api_key";

function buildSession(email: string, apiKey?: string): AuthSession {
  const now = Date.now();
  return {
    accessToken: `local-access-${now}`,
    refreshToken: `local-refresh-${now}`,
    expiresAt: now + 1000 * 60 * 60 * 8,
    role: "admin",
    user: {
      id: `u_${email}`,
      name: email.split("@")[0],
      email,
    },
    apiKey,
  };
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthSession> {
    const apiKey = localStorage.getItem(API_KEY_KEY) ?? undefined;
    const session = buildSession(payload.email, apiKey);
    localStorage.setItem(TOKEN_KEY, JSON.stringify(session));
    return session;
  },

  async signup(payload: SignupPayload): Promise<AuthSession> {
    const session = buildSession(payload.email);
    session.user.name = payload.name;
    localStorage.setItem(TOKEN_KEY, JSON.stringify(session));
    return session;
  },

  async logout(): Promise<void> {
    localStorage.removeItem(TOKEN_KEY);
  },

  async refresh(session: AuthSession | null): Promise<AuthSession | null> {
    if (!session) return null;
    if (session.expiresAt > Date.now() + 30_000) return session;
    const next = { ...session, accessToken: `local-access-${Date.now()}`, expiresAt: Date.now() + 1000 * 60 * 60 * 8 };
    localStorage.setItem(TOKEN_KEY, JSON.stringify(next));
    return next;
  },

  getPersistedSession(): AuthSession | null {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  },

  setApiKey(apiKey: string): void {
    localStorage.setItem(API_KEY_KEY, apiKey);
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return;
    try {
      const session = JSON.parse(raw) as AuthSession;
      localStorage.setItem(TOKEN_KEY, JSON.stringify({ ...session, apiKey }));
    } catch {
      // Ignore invalid session cache.
    }
  },
};
