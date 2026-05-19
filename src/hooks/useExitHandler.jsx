import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { BackHandler } from "react-native";
import Images from "../constants/Images";
import { useModalStore } from "../stores/useModalStore";
import { useSfxStore } from "../stores/useSfxStore";

export default function useExitHandler(onConfirm, options = {}) {
  const showModal = useModalStore((state) => state.showModal);

  const playFail = useSfxStore((state) => state.playFail);

  const { title = "Confirm", description = "Are you sure?" } = options;

  const handleBack = useCallback(() => {
    showModal(
      {
        title,
        description,

        button: {
          label: "EXIT",
          onPress: onConfirm,
          image: Images.ButtonDanger,
        },
      },
      playFail(),
    );

    return true; // ⛔ block default back
  }, [title, description, onConfirm]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", handleBack);

      return () => sub.remove();
    }, [handleBack]),
  );

  return handleBack;
}
