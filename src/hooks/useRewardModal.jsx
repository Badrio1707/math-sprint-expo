// src/hooks/useRewardModal.js

import Images from "../constants/Images";
import { useModalStore } from "../stores/useModalStore";
import { useSfxStore } from "../stores/useSfxStore";

/**
 * Hook reusable untuk menampilkan modal reward.
 *
 * Penggunaan:
 * const showRewardModal = useRewardModal();
 *
 * showRewardModal([
 *   { icon: Images.Coin, value: 500 },
 *   { icon: Images.Energy, value: 5 },
 * ]);
 *
 * Atau dengan title/description custom:
 * showRewardModal(
 *   quest.rewards,
 *   {
 *     title: "Quest Selesai!",
 *     description: "Kamu mendapatkan reward berikut:",
 *   }
 * );
 */
export default function useRewardModal() {
  const showModal = useModalStore((state) => state.showModal);
  const playPass = useSfxStore((state) => state.playPass);

  const showRewardModal = (rewards = [], options = {}) => {
    const {
      title = "Congrats!",
      description = "You get the Reward.",
      buttonLabel = "OK",
      buttonImage = Images.Button,
      onPress,
    } = options;

    showModal(
      {
        title,
        description,
        rewards,
        button: {
          label: buttonLabel,
          image: buttonImage,
          onPress,
        },
      },
      playPass(),
    );
  };

  return showRewardModal;
}
