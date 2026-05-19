import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import Images from "../constants/Images";
import { useAd } from "../contexts/AdProvider";
import { useModalStore } from "../stores/useModalStore";
import { useQuestStore } from "../stores/useQuestStore";
import { useSfxStore } from "../stores/useSfxStore";
import { useUserStore } from "../stores/useUserStore";
import { generateQuestions } from "../utils/generateQuestion";

const QUESTIONS_PER_LEVEL = 5;
const LEVEL_TIME = 60;
const MID_REWARD_AFTER = 3;
const COIN_MULTIPLIER = 24;
const TIME_EXTENSION = 30;
const EXTRA_TIME_AMOUNT = 30;
const MAX_POWERUP_USE = 2;

const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const formatTime = (seconds) => {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
};

const createLevel = () => ({
  questions: generateQuestions(QUESTIONS_PER_LEVEL),
  currentIndex: 0,
  correctCount: 0,

  selectedAnswer: null,
  selectedAnswerCorrect: null,

  timer: LEVEL_TIME,
  isFinished: false,
  isPaused: false,
  timeExpiredHandled: false,

  midRewardCoin: 0,
  finalRewardCoin: 0,
  finalRewardIQ: 0,

  hintAnswer: null,
  eliminatedOptions: [],
});

export default function useGameEngine() {
  const userData = useUserStore((state) => state.userData);
  const updateUserData = useUserStore((state) => state.updateUserData);
  const saveUserData = useUserStore((state) => state.saveUserData);
  const showModal = useModalStore((state) => state.showModal);
  const { showAd } = useAd();

  const playFail = useSfxStore((state) => state.playFail);
  const playCorrect = useSfxStore((state) => state.playCorrect);
  const playWrong = useSfxStore((state) => state.playWrong);
  const playPass = useSfxStore((state) => state.playPass);

  const addProgress = useQuestStore((state) => state.addProgress);
  const router = useRouter();

  const [level, setLevel] = useState(userData?.stage_level || 1);
  const [powerups, setPowerups] = useState({
    hint: 0,
    extraTime: 0,
    elimination: 0,
  });
  // Tambahkan state baru setelah state powerups
  const [timeRecoveryUsed, setTimeRecoveryUsed] = useState(false);
  const [game, setGame] = useState(createLevel());
  const [correctAnswerStreak, setCorrectAnswerStreak] = useState(0);

  const currentQuestion = game.questions[game.currentIndex];

  const canUse = (type) => powerups[type] < MAX_POWERUP_USE;

  /* =========================
   TIMER (UPDATED)
   - Recovery dari Time's Up hanya 1x per level
========================== */
  useEffect(() => {
    if (game.isFinished || game.isPaused) return;

    if (game.timer <= 0 && !game.timeExpiredHandled) {
      setGame((prev) => ({
        ...prev,
        timer: 0,
        timeExpiredHandled: true,
      }));

      setTimeout(() => {
        playFail();

        // Pause game saat modal tampil
        setGame((prev) => ({
          ...prev,
          isPaused: true,
        }));

        // ==========================================
        // SUDAH PERNAH RECOVER DI LEVEL INI
        // ==========================================
        if (timeRecoveryUsed) {
          showModal({
            closable: false,
            title: "Time's Up!",
            description:
              "You have already used your time recovery for this level.",
            button: {
              label: "OK",
              image: Images.ButtonDisable,
              onPress: () => {
                if (router.canGoBack()) router.back();
                else router.replace("/");
              },
            },
          });

          return;
        }

        // ==========================================
        // BELUM PERNAH RECOVER → BOLEH WATCH AD
        // ==========================================
        showModal({
          closable: false,
          title: "Time's Up!",
          description: `Watch an ad to get ${TIME_EXTENSION} extra seconds and continue playing.`,
          buttons: [
            {
              label: "Exit",
              image: Images.ButtonDisable,
              onPress: () => {
                if (router.canGoBack()) router.back();
                else router.replace("/");
              },
            },
            {
              label: "Watch Ad",
              image: Images.Button,
              onPress: async () => {
                const rewarded = await showAd(() => {
                  // Tandai bahwa recovery level ini sudah digunakan
                  setTimeRecoveryUsed(true);

                  // Resume game
                  setGame((prev) => ({
                    ...prev,
                    timer: TIME_EXTENSION,
                    isPaused: false,
                    timeExpiredHandled: false,
                  }));
                });

                // Jika iklan gagal / ditutup sebelum reward
                if (!rewarded) {
                  if (router.canGoBack()) router.back();
                  else router.replace("/");
                }
              },
            },
          ],
        });
      }, 0);

      return;
    }

    const interval = setInterval(() => {
      setGame((prev) => ({
        ...prev,
        timer: prev.timer - 1,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [
    game.timer,
    game.isFinished,
    game.isPaused,
    game.timeExpiredHandled,
    timeRecoveryUsed,
  ]);

  /* =========================
     ASK NEXT LEVEL (RESTORED FULL)
  ========================== */
  const askNextLevel = useCallback(() => {
    showModal({
      closable: false,
      title: "Continue Playing?",
      description: "1 Energy will be used to start the next level.",
      rewards: [
        {
          icon: Images.Energy,
          value: 1,
        },
      ],
      buttons: [
        {
          label: "Home",
          image: Images.ButtonDisable,
          onPress: async () => {
            updateUserData({
              stage_level: level + 1,
            });

            await saveUserData();

            if (router.canGoBack()) router.back();
            else router.replace("/");
          },
        },
        {
          label: "Next Level",
          image: Images.Button,
          onPress: async () => {
            if ((userData.energy?.current ?? 0) < 1) {
              setTimeout(() => {
                playFail();
                showModal({
                  title: "Not Enough Energy",
                  description: "You need at least 1 Energy.",
                  button: {
                    label: "OK",
                    image: Images.Button,
                    onPress: async () => {
                      updateUserData({
                        stage_level: level + 1,
                      });

                      await saveUserData();

                      if (router.canGoBack()) router.back();
                      else router.replace("/");
                    },
                  },
                });
              }, 300);
              return;
            }

            updateUserData((prev) => ({
              ...prev,
              energy: {
                ...prev.energy,
                current: Math.max(prev.energy.current - 1, 0),
              },
            }));

            await continueToNextLevel();
          },
        },
      ],
    });
  }, [router, userData, updateUserData, continueToNextLevel]);

  /* =========================
     ANSWER (FLOW LAMA + POWERUPS SAFE)
  ========================== */
  const answerQuestion = useCallback(
    (selectedOption) => {
      if (game.selectedAnswer !== null || game.isFinished) return;

      const isCorrect = selectedOption === currentQuestion.answer;

      if (isCorrect) playCorrect();
      else playWrong();

      const nextIndex = game.currentIndex + 1;
      const nextCorrect = game.correctCount + (isCorrect ? 1 : 0);

      setGame((prev) => ({
        ...prev,
        selectedAnswer: selectedOption,
        selectedAnswerCorrect: isCorrect,
        correctCount: nextCorrect,
      }));

      setTimeout(() => {
        /* MID REWARD (UNCHANGED UI) */
        if (nextIndex === MID_REWARD_AFTER) {
          const bonus = randomInt(5, 10) * COIN_MULTIPLIER;

          setGame((prev) => ({
            ...prev,
            currentIndex: nextIndex,
            selectedAnswer: null,
            selectedAnswerCorrect: null,
            isPaused: true,
            midRewardCoin: bonus,
          }));

          showModal({
            closable: false,
            title: "Bonus Reward!",
            description: "Watch an ad to claim your bonus coins.",
            rewards: [
              {
                icon: Images.Coin,
                value: bonus,
              },
            ],
            buttons: [
              {
                label: "No Thanks",
                image: Images.ButtonDisable,
                onPress: () => setGame((p) => ({ ...p, isPaused: false })),
              },
              {
                label: "Watch Ad",
                image: Images.Button,
                onPress: () => {
                  showAd(() => {
                    updateUserData({
                      coin: (userData.coin || 0) + bonus,
                    });

                    showModal({
                      closable: false,
                      title: "Reward Claimed!",
                      rewards: [
                        {
                          icon: Images.Coin,
                          value: bonus,
                        },
                      ],
                      button: {
                        label: "Continue",
                        image: Images.Button,
                        onPress: () => {
                          // Resume timer setelah user menutup modal reward
                          setGame((prev) => ({
                            ...prev,
                            isPaused: false,
                            selectedAnswerCorrect: null,
                          }));
                        },
                      },
                    });
                  });
                },
              },
            ],
          });

          return;
        }

        /* LEVEL COMPLETE (FULL RESTORED FLOW) */
        if (nextIndex >= QUESTIONS_PER_LEVEL) {
          const rewardIQ = nextCorrect;
          const rewardCoin = randomInt(10, 25) * COIN_MULTIPLIER;

          setGame((prev) => ({
            ...prev,
            isFinished: true,
            selectedAnswer: null,
            finalRewardCoin: rewardCoin,
            selectedAnswerCorrect: null,
            finalRewardIQ: rewardIQ,
          }));

          playPass();

          showModal({
            closable: false,
            title: "Level Complete!",
            description:
              `You answered ${rewardIQ} questions correctly.\n` +
              `Watch an ad to double your coin reward.`,
            rewards: [
              {
                icon: Images.Brain,
                value: rewardIQ,
              },
              {
                icon: Images.Coin,
                value: rewardCoin,
              },
            ],
            buttons: [
              {
                label: "No Thanks",
                image: Images.ButtonDisable,
                onPress: async () => {
                  // Berikan reward normal
                  updateUserData({
                    coin: (userData.coin || 0) + rewardCoin,
                    iq: (userData.iq || 0) + rewardIQ,
                  });

                  // Progress quest play
                  addProgress("play", 1);

                  // Tampilkan modal next level
                  setTimeout(() => {
                    askNextLevel();
                  }, 200);
                },
              },
              {
                label: "Watch Ad",
                image: Images.Button,
                onPress: async () => {
                  const rewarded = await showAd(async () => {
                    // Reward double coin
                    updateUserData({
                      coin: (userData.coin || 0) + rewardCoin * 2,
                      iq: (userData.iq || 0) + rewardIQ,
                    });
                  });

                  // Jika iklan gagal / ditutup sebelum reward,
                  // tetap berikan reward normal
                  if (!rewarded) {
                    updateUserData({
                      coin: (userData.coin || 0) + rewardCoin,
                      iq: (userData.iq || 0) + rewardIQ,
                    });
                  }

                  // Progress quest play
                  addProgress("play", 1);

                  // Tampilkan modal next level
                  setTimeout(() => {
                    askNextLevel();
                  }, 200);
                },
              },
            ],
          });

          return;
        }

        /* NEXT QUESTION */
        setGame((prev) => ({
          ...prev,
          currentIndex: nextIndex,
          selectedAnswer: null,
          selectedAnswerCorrect: null,
        }));
      }, 600);
    },
    [game, currentQuestion, userData],
  );

  /* =========================
     POWERUPS (ONLY ADDITION)
  ========================== */

  const useHint = () => {
    if (game.isFinished || game.isPaused) return;

    if (!canUse("hint")) {
      showModal({
        closable: false,
        title: "Sorry",
        description: "All hint already use",
        button: {
          label: "OK",
          image: Images.Button,
        },
      });
      return;
    }

    setGame((prev) => ({ ...prev, isPaused: true }));

    showModal({
      closable: false,
      title: "Use Hint?",
      buttons: [
        {
          label: "Watch Ad",
          image: Images.Button,
          onPress: async () => {
            const rewarded = await showAd(() => {
              setPowerups((prev) => ({
                ...prev,
                hint: prev.hint + 1,
              }));
              setGame((prev) => ({
                ...prev,
                isPaused: false,
                hintAnswer: currentQuestion.answer,
              }));
            });

            if (!rewarded) {
              setGame((prev) => ({
                ...prev,
                isPaused: false,
              }));
            }
          },
        },
      ],
    });
  };

  const useExtraTime = () => {
    if (game.isFinished || game.isPaused) return;

    if (!canUse("extraTime")) {
      showModal({
        closable: false,
        title: "Sorry",
        description: "All extra time already use",
        button: {
          label: "OK",
          image: Images.Button,
        },
      });
      return;
    }

    setGame((prev) => ({ ...prev, isPaused: true }));

    showModal({
      closable: false,
      title: "Extra Time?",
      buttons: [
        {
          label: "Watch Ad",
          image: Images.Button,
          onPress: async () => {
            const rewarded = await showAd(() => {
              setPowerups((prev) => ({
                ...prev,
                extraTime: prev.extraTime + 1,
              }));
              setGame((prev) => ({
                ...prev,
                isPaused: false,
                timer: prev.timer + EXTRA_TIME_AMOUNT,
              }));
            });

            if (!rewarded) {
              setGame((prev) => ({
                isPaused: false,
              }));
            }
          },
        },
      ],
    });
  };

  const useElimination = () => {
    if (game.isFinished || game.isPaused) return;

    if (!canUse("elimination")) {
      showModal({
        closable: false,
        title: "Sorry",
        description: "All elimination already use",
        button: {
          label: "OK",
          image: Images.Button,
        },
      });
      return;
    }

    setGame((prev) => ({ ...prev, isPaused: true }));

    const correct = currentQuestion.answer;
    const wrong = currentQuestion.options.filter((o) => o !== correct);
    const removed = wrong.sort(() => 0.5 - Math.random()).slice(0, 2);

    showModal({
      closable: false,
      title: "Eliminate?",
      buttons: [
        {
          label: "Watch Ad",
          image: Images.Button,
          onPress: async () => {
            const rewarded = await showAd(() => {
              setPowerups((prev) => ({
                ...prev,
                elimination: prev.elimination + 1,
              }));
              setGame((prev) => ({
                ...prev,
                isPaused: false,
                eliminatedOptions: removed,
              }));
            });

            if (!rewarded) {
              setGame((prev) => ({
                ...prev,
                isPaused: false,
              }));
            }
          },
        },
      ],
    });
  };

  /* =========================
     CONTINUE LEVEL (FIX ERROR)
  ========================== */
  /* =========================
   CONTINUE LEVEL
   Reset time recovery setiap level baru
========================== */
  const continueToNextLevel = useCallback(async () => {
    const nextLevel = level + 1;

    updateUserData({
      stage_level: nextLevel,
    });

    setLevel(nextLevel);
    await saveUserData();

    // Reset time recovery untuk level baru
    setTimeRecoveryUsed(false);

    // Reset data level
    setGame(createLevel());
  }, [level, updateUserData]);

  return {
    level,

    currentQuestion,
    questionNumber: game.currentIndex + 1,
    totalQuestions: QUESTIONS_PER_LEVEL,

    correctCount: game.correctCount,

    timer: game.timer,
    formattedTime: formatTime(game.timer),

    selectedAnswer: game.selectedAnswer,
    selectedAnswerCorrect: game.selectedAnswerCorrect,

    midRewardCoin: game.midRewardCoin,
    finalRewardCoin: game.finalRewardCoin,
    finalRewardIQ: game.finalRewardIQ,

    hintAnswer: game.hintAnswer,
    eliminatedOptions: game.eliminatedOptions,

    hintUsed: game.hintUsed,
    extraTimeUsed: game.extraTimeUsed,
    eliminationUsed: game.eliminationUsed,

    useHint,
    useExtraTime,
    useElimination,

    hintLeft: MAX_POWERUP_USE - powerups.hint,
    extraTimeLeft: MAX_POWERUP_USE - powerups.extraTime,
    eliminationLeft: MAX_POWERUP_USE - powerups.elimination,

    answerQuestion,

    continueToNextLevel,
  };
}
