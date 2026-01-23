const TOKEN_KEY = "sof.token";
const USER_KEY = "sof.user";

export type SubscriptionInfo = {
  status?: string;
  trial_ends_at?: string;
  grace_days?: number;
};

export type SessionUser = {
  id?: string | number;
  name?: string;
  email?: string;
  role?: string;
  empresa_id?: string | number;
  subscription?: SubscriptionInfo;
};

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
};

export const getUser = (): SessionUser | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
};

export const setUser = (user: SessionUser) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearUser = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(USER_KEY);
};

export const clearSession = () => {
  clearToken();
  clearUser();
};
