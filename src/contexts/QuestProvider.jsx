import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useRef, useState } from "react";

import QUESTS from "../constants/Quests";
import { getUserQuests, saveUserQuests } from "../services/questApi";
import { useAuthStore } from "../stores/useAuthStore";

const STORAGE_KEY = "@mathsprint_quests";
const LAST_RESET_KEY = "@mathsprint_last_quest_reset";

const QuestContext = createContext();

export const useQuest = () => useContext(QuestContext);

/* -------------------------------------------------------------------------- */
/* Utils                                                                      */
/* -------------------------------------------------------------------------- */

const getTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDefaultQuests = () =>
  QUESTS.map((quest) => ({
    ...quest,
    passed: 0,
    claimed: false,
    lastClaimAt: null,
    cooldownLeft: 0,
  }));

/* -------------------------------------------------------------------------- */
/* Provider                                                                   */
/* -------------------------------------------------------------------------- */

export const QuestProvider = ({ children }) => {
  const [quests, setQuests] = useState(getDefaultQuests());
  const [loading, setLoading] = useState(true);

  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const authLoading = useAuthStore((state) => state.loading);

  const saveTimeoutRef = useRef(null);
  const wasLoggedInRef = useRef(false);
  const hasInitializedRef = useRef(false);

  const isLoggedIn = !!user && !!token;

  /* ------------------------------------------------------------------------ */
  /* Helpers                                                                  */
  /* ------------------------------------------------------------------------ */

  const calculateCooldownLeft = (quest) => {
    if (!quest.cooldown || !quest.lastClaimAt) {
      return 0;
    }

    if ((quest.passed || 0) >= quest.progress) {
      return 0;
    }

    const diff = Math.floor((Date.now() - quest.lastClaimAt) / 1000);

    return Math.max((quest.cooldown || 0) - diff, 0);
  };

  const sanitizeQuests = (data) =>
    data.map(({ cooldownLeft, ...quest }) => quest);

  const mergeWithDefaults = (savedQuests = []) =>
    QUESTS.map((defaultQuest) => {
      const savedQuest = savedQuests.find(
        (quest) => quest.id === defaultQuest.id,
      );

      const mergedQuest = {
        ...defaultQuest,
        passed: 0,
        claimed: false,
        lastClaimAt: null,
        ...(savedQuest || {}),
      };

      return {
        ...mergedQuest,
        cooldownLeft: calculateCooldownLeft(mergedQuest),
      };
    });

  /* ------------------------------------------------------------------------ */
  /* Storage                                                                  */
  /* ------------------------------------------------------------------------ */

  const saveQuests = async (data) => {
    try {
      const sanitized = sanitizeQuests(data);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    } catch (error) {
      console.error("Failed to save quests:", error);
    }
  };

  const saveQuestsToServer = async (data) => {
    if (!isLoggedIn) {
      return;
    }

    try {
      const sanitized = sanitizeQuests(data);

      await saveUserQuests(sanitized, getTodayString());

      console.log("💾 Saving quests to server");
    } catch (error) {
      console.error("Failed to save quests to server:", error);
    }
  };

  const loadQuests = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);

      if (!stored) {
        const defaults = getDefaultQuests();
        setQuests(defaults);
        return defaults;
      }

      const parsed = JSON.parse(stored);
      const merged = mergeWithDefaults(parsed);

      setQuests(merged);

      return merged;
    } catch (error) {
      console.error("Failed to load quests:", error);

      const defaults = getDefaultQuests();
      setQuests(defaults);

      return defaults;
    }
  };

  const loadQuestsFromServer = async () => {
    if (!isLoggedIn) {
      return false;
    }

    try {
      const response = await getUserQuests();

      if (!response?.quests) {
        return false;
      }

      const merged = mergeWithDefaults(response.quests);

      setQuests(merged);
      await saveQuests(merged);

      return true;
    } catch (error) {
      console.error("Failed to load quests from server:", error);
      return false;
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Reset                                                                    */
  /* ------------------------------------------------------------------------ */

  const applyQuests = async (data, syncServer = true) => {
    setQuests(data);

    await saveQuests(data);

    if (syncServer && isLoggedIn) {
      await saveQuestsToServer(data);
    }
  };

  const checkAndResetDailyQuests = async () => {
    try {
      const today = getTodayString();
      const lastReset = await AsyncStorage.getItem(LAST_RESET_KEY);

      if (lastReset === today) {
        return false;
      }

      console.log("🔄 Daily quest reset:", today);

      const defaults = getDefaultQuests();

      await applyQuests(defaults, true);

      await AsyncStorage.setItem(LAST_RESET_KEY, today);

      return true;
    } catch (error) {
      console.error("Failed to reset daily quests:", error);
      return false;
    }
  };

  const resetQuests = async () => {
    try {
      const defaults = getDefaultQuests();

      await applyQuests(defaults, true);

      await AsyncStorage.setItem(LAST_RESET_KEY, getTodayString());
    } catch (error) {
      console.error("Failed to reset quests:", error);
    }
  };

  // Tambahkan function ini di dalam QuestProvider,
  // misalnya tepat di bawah resetQuests()

  const clearAllQuests = async () => {
    try {
      console.log("🗑️ Clearing all quest data...");

      // 1. Reset ke default quest
      const defaults = getDefaultQuests();

      // 2. Update state React
      setQuests(defaults);

      // 3. Simpan ke AsyncStorage (overwrite data lama)
      const sanitized = sanitizeQuests(defaults);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));

      // 4. Update tanggal reset agar dianggap sudah reset hari ini
      await AsyncStorage.setItem(LAST_RESET_KEY, getTodayString());

      // 5. Simpan ke server jika user login
      if (isLoggedIn) {
        await saveUserQuests(sanitized, getTodayString());
        console.log("☁️ Quest data cleared on server");
      }

      // 6. Reload ulang dari storage/server agar state benar-benar sinkron
      if (isLoggedIn) {
        const loadedFromServer = await loadQuestsFromServer();

        if (!loadedFromServer) {
          await loadQuests();
        }
      } else {
        await loadQuests();
      }

      console.log("✅ All quest data cleared and reloaded");
    } catch (error) {
      console.error("Failed to clear all quest data:", error);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Initialization                                                           */
  /* ------------------------------------------------------------------------ */

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
  }, [authLoading, user, token]);

  /* ------------------------------------------------------------------------ */
  /* Sync After Login                                                         */
  /* ------------------------------------------------------------------------ */

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
  }, [authLoading, user, token]);

  /* ------------------------------------------------------------------------ */
  /* Auto Save                                                                */
  /* ------------------------------------------------------------------------ */

  /* ------------------------------------------------------------------------ */
  /* Auto Save                                                                */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (loading || authLoading) {
      return;
    }

    console.log("🔍 Auto Save Effect Triggered");

    // Simpan ke local storage
    saveQuests(quests);

    // Jika belum login, tidak perlu sync ke server
    if (!isLoggedIn) {
      return;
    }

    // Hapus timeout sebelumnya
    // (jangan hapus timeout pada cleanup, karena cleanup akan dipanggil
    // setiap kali quests berubah dan dapat membatalkan timeout sebelum sempat jalan)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    console.log("⏳ Scheduling save to server in 5 seconds");

    // Simpan snapshot data saat ini agar tidak terkena stale closure
    const questsSnapshot = quests;

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveQuestsToServer(questsSnapshot);
      } catch (error) {
        console.error("Failed to auto save quests to server:", error);
      }
    }, 3000);

    // Cleanup hanya saat component unmount
    // (tidak perlu clearTimeout di sini)
  }, [quests, loading, authLoading, isLoggedIn]);

  /* ------------------------------------------------------------------------ */
  /* Cleanup Timeout on Unmount                                               */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Playtime Progress                                                        */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    // Jangan jalankan sebelum data selesai di-load
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

          // Jika quest sudah selesai, tidak perlu update
          if (quest.passed >= quest.progress) {
            return quest;
          }

          hasChanged = true;

          return {
            ...quest,
            passed: Math.min((quest.passed || 0) + 1, quest.progress),
          };
        });

        // Jika tidak ada perubahan, kembalikan reference lama
        // sehingga React tidak melakukan re-render dan Auto Save tidak dipanggil.
        if (!hasChanged) {
          return prev;
        }

        console.log("⏱️ Playtime progress updated");

        // Mengembalikan array baru => quests berubah
        // => useEffect Auto Save akan otomatis terpanggil.
        return updated;
      });
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [loading, authLoading]);

  /* ------------------------------------------------------------------------ */
  /* Daily Reset Checker                                                      */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const interval = setInterval(() => {
      checkAndResetDailyQuests();
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [user, token]);

  /* ------------------------------------------------------------------------ */
  /* Cooldown Timer                                                           */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const interval = setInterval(() => {
      setQuests((prev) => {
        let hasChanged = false;

        const updated = prev.map((quest) => {
          if (!quest.cooldown) {
            return quest;
          }

          const remaining = calculateCooldownLeft(quest);

          // Tidak ada perubahan
          if (quest.cooldownLeft === remaining) {
            return quest;
          }

          hasChanged = true;

          return {
            ...quest,
            cooldownLeft: remaining,
          };
        });

        // Jika tidak ada perubahan sama sekali,
        // kembalikan array lama agar React tidak menganggap state berubah.
        if (!hasChanged) {
          return prev;
        }

        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Actions                                                                  */
  /* ------------------------------------------------------------------------ */

  const updateQuest = (id, updater) => {
    setQuests((prev) =>
      prev.map((quest) => {
        if (quest.id !== id) {
          return quest;
        }

        const updates =
          typeof updater === "function" ? updater(quest) : updater;

        return {
          ...quest,
          ...updates,
        };
      }),
    );
  };

  const addProgress = (type, amount = 1) => {
    setQuests((prev) =>
      prev.map((quest) => {
        if (quest.actionType !== type) {
          return quest;
        }

        return {
          ...quest,
          passed: Math.min((quest.passed || 0) + amount, quest.progress),
        };
      }),
    );
  };

  const triggerCooldown = (id) => {
    setQuests((prev) =>
      prev.map((quest) => {
        if (quest.id !== id) {
          return quest;
        }

        if (quest.passed >= quest.progress) {
          return {
            ...quest,
            cooldownLeft: 0,
          };
        }

        return {
          ...quest,
          lastClaimAt: Date.now(),
          cooldownLeft: quest.cooldown || 0,
        };
      }),
    );
  };

  const claimQuest = (id) => {
    updateQuest(id, {
      claimed: true,
    });
  };

  /* ------------------------------------------------------------------------ */
  /* Provider                                                                 */
  /* ------------------------------------------------------------------------ */

  return (
    <QuestContext.Provider
      value={{
        quests,
        loading,

        setQuests,
        updateQuest,
        addProgress,
        triggerCooldown,
        claimQuest,

        resetQuests,
        clearAllQuests,
        reloadQuests: loadQuests,

        saveQuests,
        saveQuestsToServer,
      }}
    >
      {children}
    </QuestContext.Provider>
  );
};
