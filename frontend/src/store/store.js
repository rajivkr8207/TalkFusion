import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set) => ({
      user: null,
      activeUsers: [],
      setUser: (userData) => set({ user: userData }),
      setActiveUsers: (users) => set({ activeUsers: users }),
      clearAuth: () => set({ user: null, activeUsers: [] })
    }),
    {
      name: 'callingweb-auth',  // key in localStorage
      partialize: (state) => ({ user: state.user }) // Only persist user, not volatile activeUsers
    }
  )
);
