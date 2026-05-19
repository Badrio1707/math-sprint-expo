// src/hooks/useMusicInitializer.js
import { useEffect } from "react";
import { AppState } from "react-native";

import { useMusicStore } from "../stores/useMusicStore";

export const useMusicInitializer = () => {
  const initialize = useMusicStore((state) => state.initialize);
  const handleAppStateChange = useMusicStore(
    (state) => state.handleAppStateChange,
  );
  const release = useMusicStore((state) => state.release);

  // Initialize sekali
  useEffect(() => {
    initialize();
  }, [initialize]);

  // AppState listener
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, [handleAppStateChange]);

  // Cleanup saat unmount
  useEffect(() => {
    return () => {
      release();
    };
  }, [release]);
};
