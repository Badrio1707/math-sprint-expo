// src/hooks/useRecoverEnergyModal.js

import Images from "../constants/Images";
import { useAd } from "../contexts/AdProvider";
import { useModalStore } from "../stores/useModalStore";
import { useSfxStore } from "../stores/useSfxStore";
import { useUserStore } from "../stores/useUserStore";

const ENERGY_REWARD_AMOUNT = 3;

export default function useRecoverEnergyModal() {
  /* ---------------------------------------------------------------------- */
  /* Stores                                                                 */
  /* ---------------------------------------------------------------------- */

  const showModal = useModalStore((state) => state.showModal);

  const playPass = useSfxStore((state) => state.playPass);
  const playFail = useSfxStore((state) => state.playFail);

  const updateUserData = useUserStore((state) => state.updateUserData);
  const resetDailyEnergyRecoveryIfNeeded = useUserStore(
    (state) => state.resetDailyEnergyRecoveryIfNeeded,
  );

  /* ---------------------------------------------------------------------- */
  /* Ad Provider (belum dimigrasi ke Zustand)                               */
  /* ---------------------------------------------------------------------- */

  const { showAd, loading: adLoading } = useAd();

  /* ---------------------------------------------------------------------- */
  /* Main Function                                                           */
  /* ---------------------------------------------------------------------- */

  const showRecoverEnergyModal = async () => {
    // Pastikan reset harian dijalankan sebelum membaca data terbaru
    await resetDailyEnergyRecoveryIfNeeded();

    // Ambil state terbaru langsung dari store agar tidak terkena stale closure
    const latestUserData = useUserStore.getState().userData;

    const maxRecovery = latestUserData?.energy?.max_recovery ?? 5;

    const recoverLeft = latestUserData?.energy?.recover_left ?? maxRecovery;

    /* -------------------------------------------------------------------- */
    /* Recovery Limit Habis                                                 */
    /* -------------------------------------------------------------------- */

    if (recoverLeft <= 0) {
      playFail();

      showModal({
        title: "No Recovery left today",
        description:
          "You already used all energy recoveries today.\nCome back tomorrow.",
        button: {
          label: "OK",
          image: Images.Button,
        },
      });

      return;
    }

    /* -------------------------------------------------------------------- */
    /* Show Watch Ad Modal                                                  */
    /* -------------------------------------------------------------------- */

    showModal({
      title: "Restore More Energy",
      description:
        `Watch Ad to get +${ENERGY_REWARD_AMOUNT} Energy.\n` +
        `Recovery left today: ${recoverLeft}/${maxRecovery}`,

      rewards: [
        {
          icon: Images.Energy,
          value: ENERGY_REWARD_AMOUNT,
        },
      ],

      button: {
        label: adLoading ? "LOADING..." : "WATCH",
        image: Images.Button,

        onPress: async () => {
          const success = await showAd(async () => {
            /* -------------------------------------------------------------- */
            /* Update User Data                                               */
            /* -------------------------------------------------------------- */

            updateUserData((prev) => {
              const energy = prev.energy || {};

              const current = energy.current ?? 10;
              const maxRecovery = energy.max_recovery ?? 5;
              const recoverLeft = energy.recover_left ?? maxRecovery;

              return {
                ...prev,
                energy: {
                  ...energy,

                  // Reward ads boleh melebihi energy.max
                  current: current + ENERGY_REWARD_AMOUNT,

                  // Kurangi jatah recovery harian
                  recover_left: Math.max(recoverLeft - 1, 0),

                  // Simpan tanggal reset harian
                  recovery_reset_date:
                    energy.recovery_reset_date ||
                    new Date().toISOString().split("T")[0],

                  // Karena current bisa >= max,
                  // hentikan cooldown otomatis
                  last_recovery_at: null,
                },
              };
            });

            /* -------------------------------------------------------------- */
            /* Play Success SFX                                               */
            /* -------------------------------------------------------------- */

            playPass();

            /* -------------------------------------------------------------- */
            /* Show Success Modal                                             */
            /* -------------------------------------------------------------- */

            showModal({
              title: "Congrats!",
              description: `You got +${ENERGY_REWARD_AMOUNT} Energy.`,

              rewards: [
                {
                  icon: Images.Energy,
                  value: ENERGY_REWARD_AMOUNT,
                },
              ],

              button: {
                label: "OK",
                image: Images.Button,
              },
            });
          });

          return success;
        },
      },
    });
  };

  return showRecoverEnergyModal;
}
