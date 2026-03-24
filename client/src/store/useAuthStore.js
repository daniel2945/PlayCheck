// src/store/useAuthStore.js
import { create } from 'zustand';
import API_CALL from '../api/API_CALL';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem("user_data")) || null,
  token: localStorage.getItem("token") || null,
  loading: false,

  setAuth: (user, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user_data", JSON.stringify(user));
    set({ user, token });
  },

  // התנתקות מהמערכת
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_data");
    set({ user: null, token: null });
  },

  // אימות המשתמש מול השרת (מה שעשינו ב-useEffect של App)
  checkAuth: async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const data = await API_CALL("/api/auth/me");
      if (data.success) {
        set({ user: data.data });
        localStorage.setItem("user_data", JSON.stringify(data.data));
      }
    } catch (err) {
      console.error("Auth check failed", err);
      localStorage.removeItem("token");
      localStorage.removeItem("user_data");
      set({ user: null, token: null });
    }
  },

  setUserPc: (pcSpecs) => {
    set((state) => {
      if (state.user) {
        const updatedUser = { ...state.user, myPc: pcSpecs };
        localStorage.setItem("user_data", JSON.stringify(updatedUser));
        return { user: updatedUser };
      }
      return state;
    });
  }
}));

export default useAuthStore;