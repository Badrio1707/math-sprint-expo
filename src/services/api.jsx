// src/services/api.js
import { useAuthStore } from "../stores/useAuthStore";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const apiFetch = async (endpoint, options = {}) => {
  // Ambil token langsung dari Zustand (tanpa hook)
  const token = useAuthStore.getState().token;

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch (error) {
    console.error("Invalid JSON response:");
    console.error(text);

    throw new Error(
      `Server returned non-JSON response (status ${response.status})`,
    );
  }

  if (!response.ok) {
    throw data;
  }

  return data;
};
