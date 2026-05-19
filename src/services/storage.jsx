// src/services/storage.js

import * as SecureStore from "expo-secure-store";

const AUTH_KEY = "auth_data";

/**
 * Simpan data auth:
 * {
 *   user: {...},
 *   token: "..."
 * }
 */
export const saveAuth = async (data) => {
  await SecureStore.setItemAsync(
    AUTH_KEY,
    JSON.stringify({
      user: data.user,
      token: data.token,
    }),
  );
};

/**
 * Ambil data auth.
 * Return null jika belum ada.
 */
export const getAuth = async () => {
  const stored = await SecureStore.getItemAsync(AUTH_KEY);

  if (!stored) {
    return null;
  }

  return JSON.parse(stored);
};

/**
 * Hapus data auth.
 */
export const clearAuth = async () => {
  await SecureStore.deleteItemAsync(AUTH_KEY);
};
