import { create } from 'zustand';
import type { AuthUser } from '@cewers/shared';
import { getStoredUser, clearSession } from '../api/client';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredUser(),
  isAuthenticated: !!getStoredUser(),
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => {
    clearSession();
    set({ user: null, isAuthenticated: false });
  },
}));
