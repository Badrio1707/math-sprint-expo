// src/stores/useAuthStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { loginWithDevice } from "../services/authService";
import { getDeviceId } from "../utils/getDeviceId";
import { secureStorage } from "../utils/secureStorage";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // ========================
      // STATE
      // ========================
      user: null,
      token: null,
      loading: true,

      // ========================
      // GETTERS
      // ========================
      get isLoggedIn() {
        const { user, token } = get();
        return !!user && !!token;
      },

      // ========================
      // INITIALIZATION
      // ========================
      initializeAuth: async () => {
        try {
          // Jika sudah ada token hasil rehydration dari SecureStore,
          // cukup matikan loading.
          if (get().token) {
            set({ loading: false });
            return;
          }

          // Auto login menggunakan device ID
          const deviceId = await getDeviceId();
          const response = await loginWithDevice(deviceId);

          if (response?.token) {
            set({
              user: response.user,
              token: response.token,
            });

            console.log("✅ Auto login success");
          }
        } catch (error) {
          console.log("ℹ️ No account linked to device");
        } finally {
          set({ loading: false });
        }
      },

      // ========================
      // ACTIONS
      // ========================
      login: async (data) => {
        set({
          user: data.user,
          token: data.token,
        });
      },

      logout: async () => {
        set({
          user: null,
          token: null,
          loading: false,
        });

        // Hapus data persist dari Expo SecureStore
        await useAuthStore.persist.clearStorage();
      },

      reset: () => {
        set({
          user: null,
          token: null,
          loading: false,
        });
      },
    }),
    {
      name: "auth-store",
      storage: secureStorage,

      // Hanya simpan data yang diperlukan
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),

      // Setelah data selesai dimuat dari SecureStore
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.loading = false;
        }
      },
    },
  ),
);
