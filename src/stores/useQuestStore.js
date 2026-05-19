// src/stores/useQuestStore.js
import { create } from "zustand";

import QUESTS from "../constants/Quests";
import { getUserQuests, saveUserQuests } from "../services/questApi";
import { secureStorage } from "../utils/secureStorage";
import { useAuthStore } from "./useAuthStore";

const STORAGE_KEY = "mathsprint-quests";
const LAST_RESET_KEY = "mathsprint-last-quest-reset";

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

/* -------------------------------------------------------------------------- */
/* Store                                                                      */
/* -------------------------------------------------------------------------- */

export const useQuestStore = create((set, get) => ({
  /* ------------------------------------------------------------------------ */
  /* State                                                                    */
  /* ------------------------------------------------------------------------ */

  quests: getDefaultQuests(),
  loading: true,

  /* ------------------------------------------------------------------------ */
  /* Basic Setters                                                            */
  /* ------------------------------------------------------------------------ */

  setLoading: (loading) => set({ loading }),

  setQuests: (updater) => {
    if (typeof updater === "function") {
      set((state) => ({
        quests: updater(state.quests),
      }));
    } else {
      set({
        quests: updater,
      });
    }
  },

  /* ------------------------------------------------------------------------ */
  /* Storage                                                                  */
  /* ------------------------------------------------------------------------ */

  saveQuests: async (data = get().quests) => {
    try {
      const sanitized = sanitizeQuests(data);

      // secureStorage menggunakan API StorageValue dari Zustand,
      // sehingga kita simpan dalam format yang sama.
      await secureStorage.setItem(STORAGE_KEY, {
        state: sanitized,
        version: 0,
      });
    } catch (error) {
      console.error("Failed to save quests:", error);
    }
  },

  loadQuests: async () => {
    try {
      const stored = await secureStorage.getItem(STORAGE_KEY);

      if (!stored?.state) {
        const defaults = getDefaultQuests();
        set({ quests: defaults });
        return defaults;
      }

      const merged = mergeWithDefaults(stored.state);

      set({ quests: merged });

      return merged;
    } catch (error) {
      console.error("Failed to load quests:", error);

      const defaults = getDefaultQuests();
      set({ quests: defaults });

      return defaults;
    }
  },

  /* ------------------------------------------------------------------------ */
  /* Server Sync                                                              */
  /* ------------------------------------------------------------------------ */

  saveQuestsToServer: async (data = get().quests) => {
    const { user, token } = useAuthStore.getState();
    const isLoggedIn = !!user && !!token;

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
  },

  loadQuestsFromServer: async () => {
    const { user, token } = useAuthStore.getState();
    const isLoggedIn = !!user && !!token;

    if (!isLoggedIn) {
      return false;
    }

    try {
      const response = await getUserQuests();

      if (!response?.quests) {
        return false;
      }

      const merged = mergeWithDefaults(response.quests);

      set({ quests: merged });

      await get().saveQuests(merged);

      return true;
    } catch (error) {
      console.error("Failed to load quests from server:", error);
      return false;
    }
  },

  /* ------------------------------------------------------------------------ */
  /* Apply                                                                    */
  /* ------------------------------------------------------------------------ */

  applyQuests: async (data, syncServer = true) => {
    const { user, token } = useAuthStore.getState();
    const isLoggedIn = !!user && !!token;

    set({ quests: data });

    await get().saveQuests(data);

    if (syncServer && isLoggedIn) {
      await get().saveQuestsToServer(data);
    }
  },

  /* ------------------------------------------------------------------------ */
  /* Reset                                                                    */
  /* ------------------------------------------------------------------------ */

  checkAndResetDailyQuests: async () => {
    try {
      const today = getTodayString();
      const lastResetData = await secureStorage.getItem(LAST_RESET_KEY);
      const lastReset = lastResetData?.state || null;

      if (lastReset === today) {
        return false;
      }

      console.log("🔄 Daily quest reset:", today);

      const defaults = getDefaultQuests();

      await get().applyQuests(defaults, true);

      await secureStorage.setItem(LAST_RESET_KEY, {
        state: today,
        version: 0,
      });

      return true;
    } catch (error) {
      console.error("Failed to reset daily quests:", error);
      return false;
    }
  },

  resetQuests: async () => {
    try {
      const defaults = getDefaultQuests();

      await get().applyQuests(defaults, true);

      await secureStorage.setItem(LAST_RESET_KEY, {
        state: getTodayString(),
        version: 0,
      });
    } catch (error) {
      console.error("Failed to reset quests:", error);
    }
  },

  clearAllQuests: async () => {
    try {
      console.log("🗑️ Clearing all quest data...");

      const defaults = getDefaultQuests();
      const sanitized = sanitizeQuests(defaults);

      set({ quests: defaults });

      await secureStorage.setItem(STORAGE_KEY, {
        state: sanitized,
        version: 0,
      });

      await secureStorage.setItem(LAST_RESET_KEY, {
        state: getTodayString(),
        version: 0,
      });

      const { user, token } = useAuthStore.getState();
      const isLoggedIn = !!user && !!token;

      if (isLoggedIn) {
        await saveUserQuests(sanitized, getTodayString());
        console.log("☁️ Quest data cleared on server");
      }

      if (isLoggedIn) {
        const loadedFromServer = await get().loadQuestsFromServer();

        if (!loadedFromServer) {
          await get().loadQuests();
        }
      } else {
        await get().loadQuests();
      }

      console.log("✅ All quest data cleared and reloaded");
    } catch (error) {
      console.error("Failed to clear all quest data:", error);
    }
  },

  /* ------------------------------------------------------------------------ */
  /* Actions                                                                  */
  /* ------------------------------------------------------------------------ */

  updateQuest: (id, updater) => {
    set((state) => ({
      quests: state.quests.map((quest) => {
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
    }));
  },

  addProgress: (type, amount = 1) => {
    set((state) => ({
      quests: state.quests.map((quest) => {
        if (quest.actionType !== type) {
          return quest;
        }

        return {
          ...quest,
          passed: Math.min((quest.passed || 0) + amount, quest.progress),
        };
      }),
    }));
  },

  triggerCooldown: (id) => {
    set((state) => ({
      quests: state.quests.map((quest) => {
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
    }));
  },

  claimQuest: (id) => {
    get().updateQuest(id, {
      claimed: true,
    });
  },

  /* ------------------------------------------------------------------------ */
  /* Alias                                                                    */
  /* ------------------------------------------------------------------------ */

  reloadQuests: async () => {
    return await get().loadQuests();
  },
}));
