import { create } from "zustand";

import {
  DEFAULT_USER_DATA,
  getUserProfile,
  saveUserProfile,
} from "../services/userApi";

import { secureStorage } from "../utils/secureStorage";
import { useAuthStore } from "./useAuthStore";

const STORAGE_KEY = "mathsprint-user-profile";
const ENERGY_RECOVERY_INTERVAL = 60 * 60 * 1000; // 1 jam

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const mergeWithDefaults = (data = {}) => ({
  ...DEFAULT_USER_DATA,
  ...data,

  daily_login: {
    ...DEFAULT_USER_DATA.daily_login,
    ...(data.daily_login || {}),
  },

  energy: {
    ...DEFAULT_USER_DATA.energy,
    ...(data.energy || {}),
  },
});

const getTodayString = () => {
  return new Date().toISOString().split("T")[0];
};

/* -------------------------------------------------------------------------- */
/* Store                                                                      */
/* -------------------------------------------------------------------------- */

export const useUserStore = create((set, get) => ({
  /* ------------------------------------------------------------------------ */
  /* State                                                                    */
  /* ------------------------------------------------------------------------ */

  userData: DEFAULT_USER_DATA,
  loading: true,

  saveTimeout: null,
  energyInterval: null,
  hasInitialized: false,

  /* ------------------------------------------------------------------------ */
  /* Basic Setters                                                            */
  /* ------------------------------------------------------------------------ */

  setLoading: (loading) => set({ loading }),

  setUserData: (updater) => {
    if (typeof updater === "function") {
      set((state) => ({
        userData: mergeWithDefaults(updater(state.userData)),
      }));
    } else {
      set({
        userData: mergeWithDefaults(updater),
      });
    }
  },

  updateUserData: (updates) => {
    set((state) => {
      const next =
        typeof updates === "function"
          ? updates(state.userData)
          : { ...state.userData, ...updates };

      return {
        userData: mergeWithDefaults(next),
      };
    });

    get().triggerAutoSave();
  },

  /* ------------------------------------------------------------------------ */
  /* Local Storage                                                            */
  /* ------------------------------------------------------------------------ */

  saveToLocal: async (data = get().userData) => {
    try {
      await secureStorage.setItem(STORAGE_KEY, {
        state: data,
        version: 0,
      });
    } catch (error) {
      console.error("Failed to save user profile locally:", error);
    }
  },

  loadFromLocal: async () => {
    try {
      const stored = await secureStorage.getItem(STORAGE_KEY);

      if (!stored?.state) {
        return DEFAULT_USER_DATA;
      }

      return mergeWithDefaults(stored.state);
    } catch (error) {
      console.error("Failed to load user profile locally:", error);
      return DEFAULT_USER_DATA;
    }
  },

  /* ------------------------------------------------------------------------ */
  /* Server                                                                   */
  /* ------------------------------------------------------------------------ */

  saveToServer: async (data = get().userData) => {
    const { user, token } = useAuthStore.getState();
    const isLoggedIn = !!user && !!token;

    if (!isLoggedIn) {
      return;
    }

    try {
      const serverData = await saveUserProfile(data);

      if (serverData) {
        const merged = mergeWithDefaults(serverData);
        await get().saveToLocal(merged);
      }

      console.log("💾 User profile saved to server");
    } catch (error) {
      console.error("Failed to save user profile to server:", error);
    }
  },

  loadFromServer: async () => {
    const { user, token } = useAuthStore.getState();
    const isLoggedIn = !!user && !!token;

    if (!isLoggedIn) {
      return null;
    }

    try {
      const data = await getUserProfile();
      return mergeWithDefaults(data);
    } catch (error) {
      console.error("Failed to load user profile from server:", error);
      return null;
    }
  },

  /* ------------------------------------------------------------------------ */
  /* Apply Data                                                               */
  /* ------------------------------------------------------------------------ */

  applyUserData: async (data, syncServer = true) => {
    const { user, token } = useAuthStore.getState();
    const isLoggedIn = !!user && !!token;

    const merged = mergeWithDefaults(data);

    set({
      userData: merged,
    });

    await get().saveToLocal(merged);

    if (syncServer && isLoggedIn) {
      await get().saveToServer(merged);
    }

    return merged;
  },

  /* ------------------------------------------------------------------------ */
  /* Initialization                                                           */
  /* ------------------------------------------------------------------------ */

  initializeUserData: async () => {
    const { user, token, loading: authLoading } = useAuthStore.getState();

    if (authLoading) {
      return;
    }

    const isLoggedIn = !!user && !!token;

    try {
      if (isLoggedIn) {
        const serverData = await get().loadFromServer();

        if (serverData) {
          console.log("📥 Loaded user profile from server");

          set({
            userData: serverData,
          });

          await get().saveToLocal(serverData);
        } else {
          console.log("🆕 Creating default user profile");
          await get().applyUserData(DEFAULT_USER_DATA, true);
        }
      } else {
        const localData = await get().loadFromLocal();

        set({
          userData: localData,
        });
      }
    } catch (error) {
      console.error("Failed to initialize user profile:", error);

      set({
        userData: DEFAULT_USER_DATA,
      });
    } finally {
      set({
        loading: false,
        hasInitialized: true,
      });

      get().startEnergyRecovery();
    }
  },

  /* ------------------------------------------------------------------------ */
  /* Auto Save                                                                */
  /* ------------------------------------------------------------------------ */

  triggerAutoSave: () => {
    const { loading, hasInitialized, userData, saveTimeout } = get();
    const { user, token, loading: authLoading } = useAuthStore.getState();

    if (loading || authLoading || !hasInitialized) {
      return;
    }

    const isLoggedIn = !!user && !!token;

    // Simpan ke local
    get().saveToLocal(userData);

    if (!isLoggedIn) {
      return;
    }

    // Clear timeout lama
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Debounce save ke server
    const timeout = setTimeout(() => {
      get().saveToServer(userData);
    }, 3000);

    set({
      saveTimeout: timeout,
    });
  },

  /* ------------------------------------------------------------------------ */
  /* Reward Helper                                                            */
  /* ------------------------------------------------------------------------ */

  applyRewards: (rewards = []) => {
    get().updateUserData((prev) => {
      const updated = { ...prev };

      rewards.forEach((reward) => {
        const { name, value = 0 } = reward;

        if (typeof updated[name] !== "number") {
          updated[name] = 0;
        }

        updated[name] += value;
      });

      return updated;
    });
  },

  /* ------------------------------------------------------------------------ */
  /* Currency & Stats Helpers                                                 */
  /* ------------------------------------------------------------------------ */

  addCoin: (amount) => {
    get().updateUserData((prev) => ({
      ...prev,
      coin: prev.coin + amount,
    }));
  },

  subtractCoin: (amount) => {
    get().updateUserData((prev) => ({
      ...prev,
      coin: Math.max(prev.coin - amount, 0),
    }));
  },

  addHoldedCoin: (amount) => {
    get().updateUserData((prev) => ({
      ...prev,
      holded_coin: prev.holded_coin + amount,
    }));
  },

  addIQ: (amount) => {
    get().updateUserData((prev) => ({
      ...prev,
      iq: prev.iq + amount,
    }));
  },

  addContribute: (amount) => {
    get().updateUserData((prev) => ({
      ...prev,
      contribute: prev.contribute + amount,
    }));
  },

  setStageLevel: (level) => {
    get().updateUserData((prev) => ({
      ...prev,
      stage_level: Math.max(level, 1),
    }));
  },

  /* ------------------------------------------------------------------------ */
  /* Daily Login                                                              */
  /* ------------------------------------------------------------------------ */

  incrementDailyLoginStreak: () => {
    get().updateUserData((prev) => ({
      ...prev,
      daily_login: {
        ...prev.daily_login,
        streak: prev.daily_login.streak + 1,
        last_login: Date.now(),
        claimed_today: false,
      },
    }));
  },

  claimDailyLoginReward: () => {
    get().updateUserData((prev) => ({
      ...prev,
      daily_login: {
        ...prev.daily_login,
        claimed_today: true,
      },
    }));
  },

  /* ------------------------------------------------------------------------ */
  /* Energy Helpers                                                           */
  /* ------------------------------------------------------------------------ */

  hasEnoughEnergy: (amount = 1) => {
    const energy = get().userData?.energy;
    return (energy?.current ?? 0) >= amount;
  },

  consumeEnergy: (amount = 1) => {
    if (!get().hasEnoughEnergy(amount)) {
      return false;
    }

    get().updateUserData((prev) => {
      const wasFull = prev.energy.current >= prev.energy.max;
      const newCurrent = Math.max(prev.energy.current - amount, 0);

      return {
        ...prev,
        energy: {
          ...prev.energy,
          current: newCurrent,
          last_recovery_at:
            wasFull && newCurrent < prev.energy.max
              ? Date.now()
              : prev.energy.last_recovery_at,
        },
      };
    });

    return true;
  },

  restoreEnergy: (amount = 1) => {
    get().updateUserData((prev) => {
      const current = prev.energy.current;
      const max = prev.energy.max;
      const newCurrent = current + amount;

      return {
        ...prev,
        energy: {
          ...prev.energy,
          current: newCurrent,
          last_recovery_at:
            newCurrent >= max
              ? null
              : (prev.energy.last_recovery_at ?? Date.now()),
        },
      };
    });
  },

  setEnergy: (amount) => {
    get().updateUserData((prev) => {
      const newCurrent = Math.max(0, Math.min(amount, prev.energy.max));

      return {
        ...prev,
        energy: {
          ...prev.energy,
          current: newCurrent,
          last_recovery_at: newCurrent >= prev.energy.max ? null : Date.now(),
        },
      };
    });
  },

  resetDailyEnergyRecoveryIfNeeded: () => {
    const today = getTodayString();

    get().updateUserData((prev) => {
      const energy = prev.energy;

      if (energy.recovery_reset_date !== today) {
        return {
          ...prev,
          energy: {
            ...energy,
            recover_left: energy.max_recovery,
            recovery_reset_date: today,
          },
        };
      }

      return prev;
    });
  },

  getEnergyRecoveryTime: () => {
    const energy = get().userData?.energy;

    if (!energy) return 0;

    if (energy.current >= energy.max) {
      return 0;
    }

    const lastRecovery = energy.last_recovery_at || Date.now();
    const elapsed = Date.now() - lastRecovery;
    const remaining = ENERGY_RECOVERY_INTERVAL - elapsed;

    return Math.max(Math.ceil(remaining / 1000), 0);
  },

  /* ------------------------------------------------------------------------ */
  /* Actions                                                                  */
  /* ------------------------------------------------------------------------ */

  resetUserData: async () => {
    await get().applyUserData(DEFAULT_USER_DATA, true);
  },

  reloadUserData: async () => {
    const { user, token } = useAuthStore.getState();
    const isLoggedIn = !!user && !!token;

    const data = isLoggedIn
      ? (await get().loadFromServer()) || (await get().loadFromLocal())
      : await get().loadFromLocal();

    set({
      userData: data,
    });
  },

  saveUserData: async () => {
    await get().saveToServer(get().userData);
  },

  /* ------------------------------------------------------------------------ */
  /* Energy Recovery Interval                                                 */
  /* ------------------------------------------------------------------------ */

  startEnergyRecovery: () => {
    const currentInterval = get().energyInterval;

    if (currentInterval) {
      clearInterval(currentInterval);
    }

    const recoverEnergy = () => {
      let hasChanged = false;

      get().setUserData((prev) => {
        const energy = prev?.energy;

        if (!energy) {
          return prev;
        }

        if (energy.current >= energy.max) {
          if (energy.last_recovery_at !== null) {
            hasChanged = true;

            return {
              ...prev,
              energy: {
                ...energy,
                last_recovery_at: null,
              },
            };
          }

          return prev;
        }

        if (!energy.last_recovery_at) {
          hasChanged = true;

          return {
            ...prev,
            energy: {
              ...energy,
              last_recovery_at: Date.now(),
            },
          };
        }

        const elapsed = Date.now() - energy.last_recovery_at;

        if (elapsed < ENERGY_RECOVERY_INTERVAL) {
          return prev;
        }

        const recovered = Math.floor(elapsed / ENERGY_RECOVERY_INTERVAL);
        const newCurrent = Math.min(energy.current + recovered, energy.max);

        hasChanged = true;

        return {
          ...prev,
          energy: {
            ...energy,
            current: newCurrent,
            last_recovery_at:
              newCurrent >= energy.max
                ? null
                : energy.last_recovery_at +
                  recovered * ENERGY_RECOVERY_INTERVAL,
          },
        };
      });

      if (hasChanged) {
        get().triggerAutoSave();
      }
    };

    recoverEnergy();

    const interval = setInterval(recoverEnergy, 30000);

    set({
      energyInterval: interval,
    });
  },

  stopEnergyRecovery: () => {
    const interval = get().energyInterval;

    if (interval) {
      clearInterval(interval);
    }

    set({
      energyInterval: null,
    });
  },
}));
