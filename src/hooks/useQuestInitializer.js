// src/hooks/useQuestInitializer.js
import { useEffect, useRef } from "react";

import { useAuthStore } from "../stores/useAuthStore";
import { useQuestStore } from "../stores/useQuestStore";

export const useQuestInitializer = () => {
  /* ---------------------------------------------------------------------- */
  /* Auth State                                                             */
  /* ---------------------------------------------------------------------- */

  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const authLoading = useAuthStore((state) => state.loading);

  const isLoggedIn = !!user && !!token;

  /* ---------------------------------------------------------------------- */
  /* Quest State & Actions                                                  */
  /* ---------------------------------------------------------------------- */

  const quests = useQuestStore((state) => state.quests);
  const loading = useQuestStore((state) => state.loading);

  const setLoading = useQuestStore((state) => state.setLoading);
  const setQuests = useQuestStore((state) => state.setQuests);

  const loadQuests = useQuestStore((state) => state.loadQuests);
  const loadQuestsFromServer = useQuestStore(
    (state) => state.loadQuestsFromServer,
  );
  const saveQuests = useQuestStore((state) => state.saveQuests);
  const saveQuestsToServer = useQuestStore((state) => state.saveQuestsToServer);
  const checkAndResetDailyQuests = useQuestStore(
    (state) => state.checkAndResetDailyQuests,
  );

  /* ---------------------------------------------------------------------- */
  /* Refs                                                                   */
  /* ---------------------------------------------------------------------- */

  const saveTimeoutRef = useRef(null);
  const wasLoggedInRef = useRef(false);
  const hasInitializedRef = useRef(false);

  /* ---------------------------------------------------------------------- */
  /* Initialization                                                         */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (authLoading) {
      return;
    }

    const initialize = async () => {
      try {
        if (!isLoggedIn) {
          await loadQuests();
        } else {
          const wasReset = await checkAndResetDailyQuests();

          if (!wasReset) {
            const loadedFromServer = await loadQuestsFromServer();

            if (!loadedFromServer) {
              await loadQuests();
            }
          }
        }
      } finally {
        setLoading(false);

        hasInitializedRef.current = true;
        wasLoggedInRef.current = isLoggedIn;
      }
    };

    initialize();
  }, [
    authLoading,
    user,
    token,
    isLoggedIn,
    loadQuests,
    loadQuestsFromServer,
    checkAndResetDailyQuests,
    setLoading,
  ]);

  /* ---------------------------------------------------------------------- */
  /* Sync After Login                                                       */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (authLoading || !hasInitializedRef.current) {
      return;
    }

    if (!wasLoggedInRef.current && isLoggedIn) {
      const syncAfterLogin = async () => {
        try {
          const loaded = await loadQuestsFromServer();

          if (!loaded) {
            await saveQuestsToServer(quests);
          }
        } catch (error) {
          console.error("Failed to sync quests after login:", error);
        }
      };

      syncAfterLogin();
    }

    wasLoggedInRef.current = isLoggedIn;
  }, [
    authLoading,
    user,
    token,
    isLoggedIn,
    quests,
    loadQuestsFromServer,
    saveQuestsToServer,
  ]);

  /* ---------------------------------------------------------------------- */
  /* Auto Save                                                              */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (loading || authLoading) {
      return;
    }

    console.log("🔍 Auto Save Effect Triggered");

    // Simpan ke SecureStore
    saveQuests(quests);

    // Jika belum login, tidak perlu sync ke server
    if (!isLoggedIn) {
      return;
    }

    // Hapus timeout sebelumnya
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    console.log("⏳ Scheduling save to server in 3 seconds");

    // Snapshot untuk menghindari stale closure
    const questsSnapshot = quests;

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveQuestsToServer(questsSnapshot);
      } catch (error) {
        console.error("Failed to auto save quests to server:", error);
      }
    }, 3000);
  }, [
    quests,
    loading,
    authLoading,
    isLoggedIn,
    saveQuests,
    saveQuestsToServer,
  ]);

  /* ---------------------------------------------------------------------- */
  /* Cleanup Timeout on Unmount                                             */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Playtime Progress                                                      */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (loading || authLoading) {
      return;
    }

    const interval = setInterval(() => {
      setQuests((prev) => {
        let hasChanged = false;

        const updated = prev.map((quest) => {
          // Hanya quest dengan actionType = "playtime"
          if (quest.actionType !== "playtime") {
            return quest;
          }

          // Jika quest sudah selesai
          if (quest.passed >= quest.progress) {
            return quest;
          }

          hasChanged = true;

          return {
            ...quest,
            passed: Math.min((quest.passed || 0) + 1, quest.progress),
          };
        });

        // Tidak ada perubahan, kembalikan reference lama
        if (!hasChanged) {
          return prev;
        }

        console.log("⏱️ Playtime progress updated");

        return updated;
      });
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [loading, authLoading, setQuests]);

  /* ---------------------------------------------------------------------- */
  /* Daily Reset Checker                                                    */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const interval = setInterval(() => {
      checkAndResetDailyQuests();
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [user, token, checkAndResetDailyQuests]);

  /* ---------------------------------------------------------------------- */
  /* Cooldown Timer                                                         */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const interval = setInterval(() => {
      setQuests((prev) => {
        let hasChanged = false;

        const updated = prev.map((quest) => {
          if (!quest.cooldown) {
            return quest;
          }

          let remaining = 0;

          if (quest.lastClaimAt) {
            if ((quest.passed || 0) >= quest.progress) {
              remaining = 0;
            } else {
              const diff = Math.floor((Date.now() - quest.lastClaimAt) / 1000);

              remaining = Math.max((quest.cooldown || 0) - diff, 0);
            }
          }

          // Tidak berubah
          if (quest.cooldownLeft === remaining) {
            return quest;
          }

          hasChanged = true;

          return {
            ...quest,
            cooldownLeft: remaining,
          };
        });

        // Tidak ada perubahan sama sekali
        if (!hasChanged) {
          return prev;
        }

        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [setQuests]);
};
