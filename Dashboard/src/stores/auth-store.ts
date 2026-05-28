import { create } from "zustand";
import { authService } from "@/services/auth.service";
import type { AuthSession, LoginPayload, SignupPayload } from "@/types/api";

interface AuthStoreState {
  session: AuthSession | null;
  hydrated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  hydrate: () => void;
  setApiKey: (apiKey: string) => void;
}

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  session: null,
  hydrated: false,
  async login(payload) {
    const session = await authService.login(payload);
    set({ session });
  },
  async signup(payload) {
    const session = await authService.signup(payload);
    set({ session });
  },
  async logout() {
    await authService.logout();
    set({ session: null });
  },
  async refreshSession() {
    const updated = await authService.refresh(get().session);
    set({ session: updated });
    return Boolean(updated);
  },
  hydrate() {
    const session = authService.getPersistedSession();
    set({ session, hydrated: true });
  },
  setApiKey(apiKey) {
    authService.setApiKey(apiKey);
    const current = get().session;
    if (current) set({ session: { ...current, apiKey } });
  },
}));
