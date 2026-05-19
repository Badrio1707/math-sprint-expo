// src/utils/restoreRewardImages.js

import RewardImages from "../constants/RewardImages";

export default function restoreRewardImages(rewards = []) {
  return rewards.map((reward) => ({
    ...reward,
    image: RewardImages[reward.name] || null,
  }));
}
