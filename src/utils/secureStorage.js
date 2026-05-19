// src/utils/secureStorage.js
import * as SecureStore from "expo-secure-store";
import { createJSONStorage } from "zustand/middleware";

/**
 * Reusable storage adapter untuk Zustand Persist menggunakan Expo SecureStore.
 *
 * Penggunaan:
 *
 * import { create } from "zustand";
 * import { persist } from "zustand/middleware";
 * import { secureStorage } from "../utils/secureStorage";
 *
 * export const useAuthStore = create(
 *   persist(
 *     (set) => ({
 *       user: null,
 *       token: null,
 *       login: (data) => set({ user: data.user, token: data.token }),
 *     }),
 *     {
 *       name: "auth-store",
 *       storage: secureStorage,
 *     }
 *   )
 * );
 */
export const secureStorage = createJSONStorage(() => ({
  /**
   * Ambil data dari SecureStore.
   * createJSONStorage akan otomatis:
   * - JSON.parse() saat membaca
   * - JSON.stringify() saat menulis
   *
   * Jadi fungsi ini cukup mengembalikan string mentah.
   */
  getItem: async (name) => {
    return await SecureStore.getItemAsync(name);
  },

  /**
   * Simpan string JSON ke SecureStore.
   */
  setItem: async (name, value) => {
    await SecureStore.setItemAsync(name, value);
  },

  /**
   * Hapus data dari SecureStore.
   */
  removeItem: async (name) => {
    await SecureStore.deleteItemAsync(name);
  },
}));
