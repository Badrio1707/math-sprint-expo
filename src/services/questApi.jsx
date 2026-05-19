import { apiFetch } from "./api";

export const getUserQuests = async () => {
  return apiFetch("/user/quests", {
    method: "GET",
  });
};

export const saveUserQuests = async (quests, lastResetDate = null) => {
  return apiFetch("/user/quests", {
    method: "POST",
    body: JSON.stringify({
      quests,
      last_reset_date: lastResetDate,
    }),
  });
};
