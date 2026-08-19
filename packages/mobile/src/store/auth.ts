/**
 * Auth Context — provides login/logout state to the entire mobile app.
 * Wraps the secure token storage + API login.
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthUser } from '@cewers/shared';
import { api, storeSession, clearSession, getStoredUser, getAccessToken } from '../api/client';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session on app launch
    (async () => {
      const token = await getAccessToken();
      if (token) {
        const stored = await getStoredUser();
        if (stored) setUser(stored);
      }
      setIsLoading(false);
    })();
  }, []);

  const login = async (phone: string, password: string) => {
    const session = await api.post<{ accessToken: string; refreshToken: string; user: AuthUser }>(
      '/api/auth/login',
      { phone, password },
    );
    await storeSession(session);
    setUser(session.user);
  };

  const logout = async () => {
    await clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
