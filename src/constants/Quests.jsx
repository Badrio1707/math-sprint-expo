import Images from "./Images";

export const QUESTS = [
  {
    id: 1,
    icon: Images.Logo,

    title: "Beginer",
    description: "Passed 5 level",

    progress: 5,
    passed: 0,

    actionType: "play",
    actionText: "Play",

    rewards: [
      {
        name: "iq",
        image: Images.Brain,
        value: 10, // 2 IQ per level × 5 level
      },
      {
        name: "coin",
        image: Images.Coin,
        value: 1000, // Bonus progres awal
      },
    ],
  },

  {
    id: 2,
    icon: Images.Logo,

    title: "Comulative Ads",
    description: "Watch total 25 ads",

    progress: 25,
    passed: 0,

    actionType: "25ads",
    actionText: "Go",

    rewards: [
      {
        name: "iq",
        image: Images.Brain,
        value: 25, // Reward utama untuk engagement tinggi
      },
      {
        name: "coin",
        image: Images.Coin,
        value: 3000,
      },
    ],
  },

  {
    id: 3,
    icon: Images.Logo,

    title: "Daily Ads",
    description: "Watch 10 ads here",

    progress: 10,
    passed: 0,

    actionType: "10ads",
    actionText: "Watch",

    cooldown: 60,
    cooldownLeft: 0,
    lastClaimAt: null,

    rewards: [
      {
        name: "iq",
        image: Images.Brain,
        value: 10, // 5% dari target 200 IQ challenge dasar
      },
      {
        name: "coin",
        image: Images.Coin,
        value: 1500,
      },
    ],
  },

  {
    id: 4,
    icon: Images.Logo,

    title: "Keep Online",
    description: "Spend total 30 min online",

    progress: 30,
    passed: 0,

    actionType: "playtime",
    actionText: "Play",

    rewards: [
      {
        name: "iq",
        image: Images.Brain,
        value: 5,
      },
      {
        name: "coin",
        image: Images.Coin,
        value: 750,
      },
    ],
  },

  {
    id: 5,
    icon: Images.Logo,

    title: "Math Master",
    description: "Streak 25 corect answer in a row",

    progress: 25,
    passed: 0,

    actionType: "streak",
    actionText: "Play",

    rewards: [
      {
        name: "iq",
        image: Images.Brain,
        value: 20, // Skill-based quest, reward IQ lebih tinggi
      },
      {
        name: "coin",
        image: Images.Coin,
        value: 2500,
      },
    ],
  },
];
export default QUESTS;
