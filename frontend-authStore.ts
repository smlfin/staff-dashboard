// src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  employeeCode: string;
  email: string;
  firstName: string;
  lastName: string;
  branch: string;
  designation: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setAccessToken: (token: string) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (user: User, accessToken: string) => void;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user }),
      setAccessToken: (token) => set({ accessToken: token }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      login: (user, accessToken) => set({
        user,
        accessToken,
        isAuthenticated: true,
        error: null
      }),

      logout: () => set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        error: null
      }),

      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
        // accessToken is NOT persisted for security (in-memory only)
      })
    }
  )
);
