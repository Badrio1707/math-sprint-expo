// src/contexts/UserProvider.jsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useRef, useState } from "react";

import {
  DEFAULT_USER_DATA,
  getUserProfile,
  saveUserProfile,
} from "../services/userApi";
import { useAuthStore } from "../stores/useAuthStore";

const STORAGE_KEY = "@mathsprint_user_profile";
const ENERGY_RECOVERY_INTERVAL = 60 * 60 * 1000; // 1 jam

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(DEFAULT_USER_DATA);
  const [loading, setLoading] = useState(true);

  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const authLoading = useAuthStore((state) => state.loading);

  const saveTimeoutRef = useRef(null);
  const hasInitializedRef = useRef(false);
  const energyIntervalRef = useRef(null);

  const isLoggedIn = !!user && !!token;

  /* ------------------------------------------------------------------------ */
  /* Helpers                                                                  */
  /* ------------------------------------------------------------------------ */

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
    return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  };

  const resetDailyEnergyRecoveryIfNeeded = () => {
    updateUserData((prev) => {
      const energy = prev.energy;
      const today = getTodayString();

      // Jika belum pernah reset hari ini
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
  };

  const applyRewards = (rewards = []) => {
    updateUserData((prev) => {
      const updated = { ...prev };

      rewards.forEach((reward) => {
        const { name, value = 0 } = reward;

        // Jika atribut belum ada, buat default 0
        if (typeof updated[name] !== "number") {
          updated[name] = 0;
        }

        // Tambahkan reward ke field yang sesuai
        updated[name] += value;
      });

      return updated;
    });
  };

  /* ------------------------------------------------------------------------ */
  /* Local Storage                                                            */
  /* ------------------------------------------------------------------------ */

  const saveToLocal = async (data) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save user profile locally:", error);
    }
  };

  const loadFromLocal = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);

      if (!stored) {
        return DEFAULT_USER_DATA;
      }

      return mergeWithDefaults(JSON.parse(stored));
    } catch (error) {
      console.error("Failed to load user profile locally:", error);
      return DEFAULT_USER_DATA;
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Server                                                                   */
  /* ------------------------------------------------------------------------ */

  const saveToServer = async (data) => {
    if (!isLoggedIn) return;

    try {
      const serverData = await saveUserProfile(data);

      if (serverData) {
        const merged = mergeWithDefaults(serverData);
        await saveToLocal(merged);
        // Jangan panggil setUserData di sini
      }

      console.log("💾 User profile saved to server");
    } catch (error) {
      console.error("Failed to save user profile to server:", error);
    }
  };

  const loadFromServer = async () => {
    if (!isLoggedIn) {
      return null;
    }

    try {
      const data = await getUserProfile();
      console.log(data);
      return mergeWithDefaults(data);
    } catch (error) {
      console.error("Failed to load user profile from server:", error);
      return null;
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Apply Data                                                               */
  /* ------------------------------------------------------------------------ */

  const applyUserData = async (data, syncServer = true) => {
    const merged = mergeWithDefaults(data);

    setUserData(merged);

    await saveToLocal(merged);

    if (syncServer && isLoggedIn) {
      await saveToServer(merged);
    }

    return merged;
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
        if (isLoggedIn) {
          const serverData = await loadFromServer();

          if (serverData) {
            console.log("📥 Loaded user profile from server");
            setUserData(serverData);
            await saveToLocal(serverData);
          } else {
            console.log("🆕 Creating default user profile");
            await applyUserData(DEFAULT_USER_DATA, true);
          }
        } else {
          const localData = await loadFromLocal();
          setUserData(localData);
        }
      } catch (error) {
        console.error("Failed to initialize user profile:", error);
        setUserData(DEFAULT_USER_DATA);
      } finally {
        setLoading(false);
        hasInitializedRef.current = true;
      }
    };

    initialize();
  }, [authLoading, user, token]);

  /* ------------------------------------------------------------------------ */
  /* Auto Save                                                                */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (loading || authLoading || !hasInitializedRef.current) {
      return;
    }

    saveToLocal(userData);

    if (!isLoggedIn) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveToServer(userData);
    }, 3000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [userData, loading, authLoading, isLoggedIn]);

  /* ------------------------------------------------------------------------ */
  /* Energy Auto Recovery                                                     */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (loading || !hasInitializedRef.current) {
      return;
    }

    const recoverEnergy = () => {
      setUserData((prev) => {
        const energy = prev?.energy;

        if (!energy) {
          return prev;
        }

        if (energy.current >= energy.max) {
          if (energy.last_recovery_at !== null) {
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
    };

    recoverEnergy();

    if (energyIntervalRef.current) {
      clearInterval(energyIntervalRef.current);
    }

    energyIntervalRef.current = setInterval(recoverEnergy, 30000); // setiap 30 detik;

    return () => {
      if (energyIntervalRef.current) {
        clearInterval(energyIntervalRef.current);
      }
    };
  }, [loading]);

  /* ------------------------------------------------------------------------ */
  /* Generic Update                                                           */
  /* ------------------------------------------------------------------------ */

  const updateUserData = (updates) => {
    setUserData((prev) => {
      const next =
        typeof updates === "function" ? updates(prev) : { ...prev, ...updates };

      return mergeWithDefaults(next);
    });
  };

  /* ------------------------------------------------------------------------ */
  /* Currency & Stats Helpers                                                 */
  /* ------------------------------------------------------------------------ */

  const addCoin = (amount) => {
    updateUserData((prev) => ({
      ...prev,
      coin: prev.coin + amount,
    }));
  };

  const subtractCoin = (amount) => {
    updateUserData((prev) => ({
      ...prev,
      coin: Math.max(prev.coin - amount, 0),
    }));
  };

  const addHoldedCoin = (amount) => {
    updateUserData((prev) => ({
      ...prev,
      holded_coin: prev.holded_coin + amount,
    }));
  };

  const addIQ = (amount) => {
    updateUserData((prev) => ({
      ...prev,
      iq: prev.iq + amount,
    }));
  };

  const addContribute = (amount) => {
    updateUserData((prev) => ({
      ...prev,
      contribute: prev.contribute + amount,
    }));
  };

  const setStageLevel = (level) => {
    updateUserData((prev) => ({
      ...prev,
      stage_level: Math.max(level, 1),
    }));
  };

  /* ------------------------------------------------------------------------ */
  /* Daily Login Helpers                                                      */
  /* ------------------------------------------------------------------------ */

  const incrementDailyLoginStreak = () => {
    updateUserData((prev) => ({
      ...prev,
      daily_login: {
        ...prev.daily_login,
        streak: prev.daily_login.streak + 1,
        last_login: Date.now(),
        claimed_today: false,
      },
    }));
  };

  const claimDailyLoginReward = () => {
    updateUserData((prev) => ({
      ...prev,
      daily_login: {
        ...prev.daily_login,
        claimed_today: true,
      },
    }));
  };

  /* ------------------------------------------------------------------------ */
  /* Energy Helpers                                                           */
  /* ------------------------------------------------------------------------ */

  const hasEnoughEnergy = (amount = 1) => {
    return (userData?.energy?.current ?? 0) >= amount;
  };

  const consumeEnergy = (amount = 1) => {
    if (!hasEnoughEnergy(amount)) {
      return false;
    }

    updateUserData((prev) => {
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
  };

  const restoreEnergy = (amount = 1) => {
    updateUserData((prev) => {
      const current = prev.energy.current;
      const max = prev.energy.max;

      // Tambahkan energy tanpa batas (bisa melebihi max)
      const newCurrent = current + amount;

      return {
        ...prev,
        energy: {
          ...prev.energy,
          current: newCurrent,

          // Cooldown hanya aktif jika energy di bawah max.
          // Jika energy hasil reward > max, cooldown dihentikan.
          last_recovery_at:
            newCurrent >= max
              ? null
              : (prev.energy.last_recovery_at ?? Date.now()),
        },
      };
    });
  };

  const setEnergy = (amount) => {
    updateUserData((prev) => {
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
  };

  const getEnergyCooldownText = () => {
    const energy = userData?.energy;

    if (!energy) {
      return "";
    }

    if (energy.current >= energy.max) {
      return "FULL";
    }

    if (!energy.last_recovery_at) {
      return "60:00";
    }

    const elapsed = Date.now() - energy.last_recovery_at;
    const remainingMs = Math.max(ENERGY_RECOVERY_INTERVAL - elapsed, 0);

    const totalSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0",
    )}`;
  };

  const getEnergyRecoveryTime = () => {
    const energy = userData?.energy;

    if (!energy) return 0;

    // Jika energy penuh, tidak ada cooldown
    if (energy.current >= energy.max) {
      return 0;
    }

    const lastRecovery = energy.last_recovery_at || Date.now();
    const RECOVERY_INTERVAL = 60 * 60 * 1000; // 1 jam

    const elapsed = Date.now() - lastRecovery;
    const remaining = RECOVERY_INTERVAL - elapsed;

    // Return dalam detik
    return Math.max(Math.ceil(remaining / 1000), 0);
  };

  /* ------------------------------------------------------------------------ */
  /* Actions                                                                  */
  /* ------------------------------------------------------------------------ */

  const resetUserData = async () => {
    await applyUserData(DEFAULT_USER_DATA, true);
  };

  const reloadUserData = async () => {
    const data = isLoggedIn
      ? (await loadFromServer()) || (await loadFromLocal())
      : await loadFromLocal();

    setUserData(data);
  };

  /* ------------------------------------------------------------------------ */
  /* Provider                                                                 */
  /* ------------------------------------------------------------------------ */

  return (
    <UserContext.Provider
      value={{
        userData,
        loading,

        // setters
        setUserData,
        updateUserData,

        // helpers
        addCoin,
        subtractCoin,
        addHoldedCoin,
        addIQ,
        addContribute,
        setStageLevel,
        incrementDailyLoginStreak,
        claimDailyLoginReward,

        // reward helper
        applyRewards,

        // energy helpers
        consumeEnergy,
        restoreEnergy,
        setEnergy,
        getEnergyRecoveryTime, // <-- WAJIB DITAMBAHKAN
        resetDailyEnergyRecoveryIfNeeded,

        // actions
        resetUserData,
        reloadUserData: async () => {
          const data = isLoggedIn
            ? (await loadFromServer()) || (await loadFromLocal())
            : await loadFromLocal();

          setUserData(data);
        },

        // optional manual save
        saveUserData: () => saveToServer(userData),
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
