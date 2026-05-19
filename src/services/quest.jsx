import api from "./api";

export const getQuests = async () => {
  const res = await api.get("/quests");

  return res.data;
};

export const progressQuest = async (questType, amount = 1) => {
  const res = await api.post("/quests/progress", {
    quest_type: questType,
    amount,
  });

  return res.data;
};
