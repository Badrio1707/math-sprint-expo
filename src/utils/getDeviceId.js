import * as Application from "expo-application";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const DEVICE_ID_KEY = "device_id";

export async function getDeviceId() {
  // 1. Coba ambil dari SecureStore terlebih dahulu
  let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);

  if (deviceId) {
    return deviceId;
  }

  // 2. Ambil ID perangkat yang stabil
  if (Platform.OS === "android") {
    // Android ID bersifat stabil dan tetap sama meskipun app di-uninstall
    deviceId = Application.getAndroidId();
  } else if (Platform.OS === "ios") {
    // iOS menggunakan vendor ID (stabil selama masih dari vendor yang sama)
    deviceId = await Application.getIosIdForVendorAsync();
  }

  // 3. Fallback hanya jika benar-benar gagal mendapatkan device ID
  //    (kasus sangat jarang, misalnya emulator tertentu)
  if (!deviceId) {
    deviceId = `device-${Date.now()}`;
    console.warn("⚠️ Native device ID unavailable, using fallback:", deviceId);
  }

  // 4. Simpan ke SecureStore untuk akses lebih cepat berikutnya
  await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);

  // 5. Debug log agar mudah memastikan nilai yang dipakai
  console.log("📱 Device ID:", deviceId);

  return deviceId;
}
