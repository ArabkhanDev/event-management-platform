import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api, TOKEN_KEY, USER_KEY } from "./api";
import type { AuthResponse, User } from "../types/api";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  /** Creates the account and sends a verification email — does not log in. */
  register: (name: string, email: string, password: string) => Promise<void>;
  /** Confirms the account and logs it in, same as a fresh login. */
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  /** Sets the new password and logs the account in. */
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState<User | null>(() => readStoredUser());

  const persist = useCallback((res: AuthResponse) => {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.post<AuthResponse>("/auth/login", { email, password }, { auth: false });
      persist(res);
    },
    [persist]
  );

  const register = useCallback(async (name: string, email: string, password: string) => {
    await api.post<void>("/auth/register", { name, email, password }, { auth: false });
  }, []);

  const verifyEmail = useCallback(
    async (token: string) => {
      const res = await api.post<AuthResponse>("/auth/verify-email", { token }, { auth: false });
      persist(res);
    },
    [persist]
  );

  const resendVerification = useCallback(async (email: string) => {
    await api.post<void>("/auth/resend-verification", { email }, { auth: false });
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await api.post<void>("/auth/forgot-password", { email }, { auth: false });
  }, []);

  const resetPassword = useCallback(
    async (token: string, newPassword: string) => {
      const res = await api.post<AuthResponse>("/auth/reset-password", { token, newPassword }, { auth: false });
      persist(res);
    },
    [persist]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, login, register, verifyEmail, resendVerification, forgotPassword, resetPassword, logout }),
    [user, token, login, register, verifyEmail, resendVerification, forgotPassword, resetPassword, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
