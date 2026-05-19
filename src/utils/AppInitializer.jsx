import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

import LoadingScreen from "../components/LoadingScreen";
import OfflineScreen from "../components/OfflineScreen";

import { useAuthStore } from "../stores/useAuthStore";
import { useQuestStore } from "../stores/useQuestStore";
import { useUserStore } from "../stores/useUserStore";

const AppInitializer = ({ children }) => {
  const questLoading = useQuestStore((state) => state.loading);
  const authLoading = useAuthStore((state) => state.loading);
  const userLoading = useUserStore((state) => state.loading);

  const [isConnected, setIsConnected] = useState(true);
  const [checkingNetwork, setCheckingNetwork] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      const state = await NetInfo.fetch();

      setIsConnected(
        !!state.isConnected && state.isInternetReachable !== false,
      );

      setCheckingNetwork(false);
    };

    checkConnection();

    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(
        !!state.isConnected && state.isInternetReachable !== false,
      );
    });

    return unsubscribe;
  }, []);

  if (checkingNetwork) {
    return <LoadingScreen text="Memeriksa koneksi internet..." />;
  }

  if (!isConnected) {
    return <OfflineScreen />;
  }

  // Tunggu semua store selesai initialize
  if (authLoading || userLoading || questLoading) {
    return <LoadingScreen text="Memuat data..." />;
  }

  return children;
};

export default AppInitializer;
