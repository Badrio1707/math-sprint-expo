// src/services/userApi.js

import { apiFetch } from "./api";

/* -------------------------------------------------------------------------- */
/* Default User Data                                                          */
/* -------------------------------------------------------------------------- */

export const DEFAULT_USER_DATA = {
  coin: 0,
  holded_coin: 0,
  iq: 0,
  contribute: 0,
  stage_level: 1,

  energy: {
    current: 10,
    max: 10,
    last_recovery_at: null,

    // Reward Ads Limit
    max_recovery: 5,
    recover_left: 5,
    recovery_reset_date: null, // YYYY-MM-DD
  },

  daily_login: {
    streak: 0,
    last_login: null,
    claimed_today: false,
  },
};

/* -------------------------------------------------------------------------- */
/* API                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * GET /api/user-profile
 */
export const getUserProfile = async () => {
  try {
    const response = await apiFetch("/user-profile");

    return {
      ...DEFAULT_USER_DATA,
      ...(response.data || {}),

      daily_login: {
        ...DEFAULT_USER_DATA.daily_login,
        ...(response.data?.daily_login || {}),
      },

      energy: {
        ...DEFAULT_USER_DATA.energy,
        ...(response.data?.energy || {}),
      },
    };
  } catch (error) {
    console.error("Failed to get user profile:", error);
    return DEFAULT_USER_DATA;
  }
};

/**
 * POST /api/user-profile
 */
export const saveUserProfile = async (data) => {
  try {
    const response = await apiFetch("/user-profile", {
      method: "POST",
      body: JSON.stringify(data),
    });

    return response.data || data;
  } catch (error) {
    console.error("Failed to save user profile:", error);
    throw error;
  }
};

/**
 * Update sebagian data.
 */
export const updateUserProfile = async (updates) => {
  const current = await getUserProfile();

  const merged = {
    ...current,
    ...updates,
    daily_login: {
      ...current.daily_login,
      ...(updates.daily_login || {}),
    },
  };

  return saveUserProfile(merged);
};

/* -------------------------------------------------------------------------- */
/* Coin                                                                       */
/* -------------------------------------------------------------------------- */

export const addCoin = async (amount) => {
  const current = await getUserProfile();

  return updateUserProfile({
    coin: current.coin + amount,
  });
};

export const subtractCoin = async (amount) => {
  const current = await getUserProfile();

  return updateUserProfile({
    coin: Math.max(current.coin - amount, 0),
  });
};

export const setCoin = async (amount) => {
  return updateUserProfile({
    coin: Math.max(amount, 0),
  });
};

/* -------------------------------------------------------------------------- */
/* Holded Coin                                                                */
/* -------------------------------------------------------------------------- */

export const addHoldedCoin = async (amount) => {
  const current = await getUserProfile();

  return updateUserProfile({
    holded_coin: current.holded_coin + amount,
  });
};

export const setHoldedCoin = async (amount) => {
  return updateUserProfile({
    holded_coin: Math.max(amount, 0),
  });
};

/* -------------------------------------------------------------------------- */
/* IQ                                                                         */
/* -------------------------------------------------------------------------- */

export const addIQ = async (amount) => {
  const current = await getUserProfile();

  return updateUserProfile({
    iq: current.iq + amount,
  });
};

export const setIQ = async (amount) => {
  return updateUserProfile({
    iq: Math.max(amount, 0),
  });
};

/* -------------------------------------------------------------------------- */
/* Contribute                                                                 */
/* -------------------------------------------------------------------------- */

export const addContribute = async (amount) => {
  const current = await getUserProfile();

  return updateUserProfile({
    contribute: current.contribute + amount,
  });
};

export const setContribute = async (amount) => {
  return updateUserProfile({
    contribute: Math.max(amount, 0),
  });
};

/* -------------------------------------------------------------------------- */
/* Stage Level                                                                */
/* -------------------------------------------------------------------------- */

export const setStageLevel = async (level) => {
  return updateUserProfile({
    stage_level: Math.max(level, 1),
  });
};

export const incrementStageLevel = async () => {
  const current = await getUserProfile();

  return updateUserProfile({
    stage_level: current.stage_level + 1,
  });
};

/* -------------------------------------------------------------------------- */
/* Daily Login                                                                */
/* -------------------------------------------------------------------------- */

export const updateDailyLogin = async (updates) => {
  return updateUserProfile({
    daily_login: updates,
  });
};

export const incrementLoginStreak = async () => {
  const current = await getUserProfile();

  return updateUserProfile({
    daily_login: {
      streak: current.daily_login.streak + 1,
      last_login: Date.now(),
      claimed_today: false,
    },
  });
};

export const claimDailyLoginReward = async () => {
  return updateUserProfile({
    daily_login: {
      claimed_today: true,
    },
  });
};

export const resetDailyLoginClaim = async () => {
  return updateUserProfile({
    daily_login: {
      claimed_today: false,
    },
  });
};
