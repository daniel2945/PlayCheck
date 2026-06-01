import { create } from "zustand";

const useGameStore = create((set, get) => ({
  games: [],
  page: 1,
  hasNextPage: false,
  filters: {
    q: "",
    year: "",
    genre: "",
  },
  loading: false,
  error: null,

  setGames: (games) => set({ games }),
  appendGames: (newGames) => set((state) => ({ games: [...state.games, ...newGames] })),
  setPage: (page) => set({ page }),
  setHasNextPage: (hasNextPage) => set({ hasNextPage }),
  setFilters: (newFilters) => set((state) => ({ 
    filters: { ...state.filters, ...newFilters },
    games: [], // Reset games on filter change
    page: 1 
  })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  resetStore: () => set({
    games: [],
    page: 1,
    hasNextPage: false,
    filters: { q: "", year: "", genre: "" },
    loading: false,
    error: null
  })
}));

export default useGameStore;
