// app/_layout.jsx
import { Stack, useRouter, useSegments } from "expo-router";
import "./global.css";

import { ActivityIndicator, ImageBackground, Text, View } from "react-native";
import Images from "../src/constants/Images";

import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import AdLoading from "../src/components/AdLoading";
import { initGoogle } from "../src/config/google";

// ❌ HAPUS AuthProvider
// import { AuthProvider, useAuth } from "../src/contexts/AuthProvider";

// ✅ GANTI DENGAN ZUSTAND STORE
import { useAuthStore } from "../src/stores/useAuthStore";

// Provider lain tetap dipakai (selama belum dimigrasi ke Zustand)
import { AdProvider } from "../src/contexts/AdProvider";
import { NotificationProvider } from "../src/contexts/NotificationContext";

import { useQuestInitializer } from "../src/hooks/useQuestInitializer";

import AppInitializer from "../src/utils/AppInitializer";

import * as Notifications from "expo-notifications";
import Toast from "react-native-toast-message";
import GlobalModal from "../src/components/GlobalModal";
import { useMusicInitializer } from "../src/hooks/useMusicInitializer";
import { useUserStore } from "../src/stores/useUserStore";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

SplashScreen.preventAutoHideAsync();

function QuestBootstrap() {
  useQuestInitializer();
  return null;
}

function MusicBootstrap() {
  useMusicInitializer();
  return null;
}

function UserBootstrap() {
  const initializeUserData = useUserStore((state) => state.initializeUserData);

  useEffect(() => {
    initializeUserData();
  }, []);

  return null;
}

// =====================================================
// APP CONTENT
// =====================================================
function AppContent() {
  const loading = useAuthStore((state) => state.loading);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  // Hitung langsung
  const isLoggedIn = !!user && !!token;

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const currentRoute = segments[0];

    if (!isLoggedIn && currentRoute !== "Login") {
      router.replace("/Login");
    } else if (isLoggedIn && currentRoute === "Login") {
      router.replace("/");
    }
  }, [isLoggedIn, segments, loading]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "transparent" },
      }}
    />
  );
}

// =====================================================
// TOAST CONFIG
// =====================================================
const toastConfig = {
  error: ({ text1, text2 }) => (
    <View className="mx-5 px-4 py-3 rounded-2xl border border-red-300 bg-white">
      <Text className="font-Nunito-Bold text-red-500">{text1}</Text>
      {text2 ? <Text className="text-gray-500 mt-1">{text2}</Text> : null}
    </View>
  ),

  success: ({ text1, text2 }) => (
    <View className="mx-5 px-4 py-3 rounded-2xl border border-green-300 bg-white">
      <Text className="font-Nunito-Bold text-green-600">{text1}</Text>
      {text2 ? <Text className="text-gray-500 mt-1">{text2}</Text> : null}
    </View>
  ),
};

// =====================================================
// ROOT LAYOUT
// =====================================================
export default function RootLayout() {
  const [loaded, error] = useFonts({
    "Nunito-Black": require("../assets/fonts/Nunito-Black.ttf"),
    "Nunito-Bold": require("../assets/fonts/Nunito-Bold.ttf"),
    "Nunito-ExtraBold": require("../assets/fonts/Nunito-ExtraBold.ttf"),
    "Nunito-Light": require("../assets/fonts/Nunito-Light.ttf"),
    "Nunito-Medium": require("../assets/fonts/Nunito-Medium.ttf"),
    "Nunito-Regular": require("../assets/fonts/Nunito-Regular.ttf"),
    "Nunito-SemiBold": require("../assets/fonts/Nunito-SemiBold.ttf"),
  });

  // Ambil action initializeAuth dari Zustand
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  // Hide splash setelah font selesai
  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // Init Google sekali
  useEffect(() => {
    initGoogle();
  }, []);

  // Inisialisasi auth sekali saat aplikasi dibuka
  useEffect(() => {
    if (loaded || error) {
      initializeAuth();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <NotificationProvider>
      {/* ❌ AuthProvider DIHAPUS */}
      {/* <SfxProvider> */}
      {/* <ModalProvider> */}
      {/* <QuestProvider> */}
      {/* <MusicProvider> */}
      <AdProvider>
        {/* <UserProvider> */}
        <UserBootstrap />
        <QuestBootstrap />
        <MusicBootstrap />

        <AppInitializer>
          <ImageBackground
            source={Images.Background}
            resizeMode="cover"
            className="flex-1"
          >
            <AppContent />
            <AdLoading />
            <GlobalModal />
            <Toast config={toastConfig} position="bottom" />
          </ImageBackground>
        </AppInitializer>
        {/* </UserProvider> */}
      </AdProvider>
      {/* </MusicProvider> */}
      {/* </QuestProvider> */}
      {/* </ModalProvider> */}
      {/* </SfxProvider> */}
    </NotificationProvider>
  );
}
