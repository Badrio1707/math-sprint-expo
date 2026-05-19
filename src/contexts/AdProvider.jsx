import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from "react-native-google-mobile-ads";
import Toast from "react-native-toast-message";

import Images from "../constants/Images";
import { useModalStore } from "../stores/useModalStore";
import { useMusicStore } from "../stores/useMusicStore";
import { useQuestStore } from "../stores/useQuestStore";
import { useSfxStore } from "../stores/useSfxStore";

const AdContext = createContext();
export const useAd = () => useContext(AdContext);

const MAX_REWARD_DAILY = 100;

const REWARD_SHOWN_KEY = "@mathsprint_reward_shown";
const REWARD_DATE_KEY = "@mathsprint_reward_date";

const getTodayString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(now.getDate()).padStart(2, "0")}`;
};

export const AdProvider = ({ children }) => {
  const showModal = useModalStore((state) => state.showModal);

  const playPass = useSfxStore((state) => state.playPass);
  const playFail = useSfxStore((state) => state.playFail);

  const addProgress = useQuestStore((state) => state.addProgress);

  const isMusicOn = useMusicStore((state) => state.isMusicOn);
  const pauseMusic = useMusicStore((state) => state.pauseMusic);
  const resumeMusic = useMusicStore((state) => state.resumeMusic);

  const adRef = useRef(null);
  const listenerRefs = useRef([]);
  const inProgressRef = useRef(false);

  const rewardCallbackRef = useRef(null);

  const [rewardShown, setRewardShown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showing, setShowing] = useState(false);
  const [initialized, setInitialized] = useState(false);

  /* ------------------------------------------------------------------ */
  /* STORAGE                                                            */
  /* ------------------------------------------------------------------ */

  const loadRewardCounter = async () => {
    try {
      const today = getTodayString();

      const [savedDate, savedCount] = await Promise.all([
        AsyncStorage.getItem(REWARD_DATE_KEY),
        AsyncStorage.getItem(REWARD_SHOWN_KEY),
      ]);

      if (savedDate !== today) {
        await AsyncStorage.multiSet([
          [REWARD_DATE_KEY, today],
          [REWARD_SHOWN_KEY, "0"],
        ]);
        setRewardShown(0);
      } else {
        setRewardShown(parseInt(savedCount || "0", 10));
      }
    } catch (e) {
      console.log("loadRewardCounter error", e);
      setRewardShown(0);
    } finally {
      setInitialized(true);
    }
  };

  useEffect(() => {
    loadRewardCounter();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    AsyncStorage.multiSet([
      [REWARD_DATE_KEY, getTodayString()],
      [REWARD_SHOWN_KEY, String(rewardShown)],
    ]);
  }, [rewardShown, initialized]);

  /* ------------------------------------------------------------------ */
  /* CLEANUP SAFE LISTENER                                              */
  /* ------------------------------------------------------------------ */

  const cleanupListeners = () => {
    listenerRefs.current.forEach((off) => {
      try {
        off?.();
      } catch {}
    });
    listenerRefs.current = [];
  };

  const createAd = () => {
    cleanupListeners();

    adRef.current = RewardedAd.createForAdRequest(TestIds.REWARDED, {
      requestNonPersonalizedAdsOnly: true,
    });
  };

  /* ------------------------------------------------------------------ */
  /* SHOW AD                                                            */
  /* ------------------------------------------------------------------ */

  const showAd = (onReward) => {
    if (!initialized) return Promise.resolve(false);

    // 🚫 anti double ad
    if (inProgressRef.current || loading || showing) {
      return Promise.resolve(false);
    }

    if (rewardShown >= MAX_REWARD_DAILY) {
      showModal({
        title: "Ads limit reached",
        description: `Max ${MAX_REWARD_DAILY} ads per day.`,
        button: { label: "OK", image: Images.Button },
      });
      return Promise.resolve(false);
    }

    inProgressRef.current = true;
    setLoading(true);
    rewardCallbackRef.current = onReward;

    const shouldResumeMusic = isMusicOn;

    createAd();

    return new Promise((resolve) => {
      let rewarded = false;

      const finish = (result) => {
        inProgressRef.current = false;
        setLoading(false);
        setShowing(false);
        cleanupListeners();

        if (shouldResumeMusic) resumeMusic();

        resolve(result);
      };

      // LOAD
      listenerRefs.current.push(
        adRef.current.addAdEventListener(
          RewardedAdEventType.LOADED,
          async () => {
            try {
              setLoading(false);
              setShowing(true);

              if (shouldResumeMusic) await pauseMusic();

              await adRef.current.show();
            } catch (e) {
              finish(false);
            }
          },
        ),
      );

      // REWARD
      listenerRefs.current.push(
        adRef.current.addAdEventListener(
          RewardedAdEventType.EARNED_REWARD,
          async () => {
            rewarded = true;

            setRewardShown((p) => Math.min(p + 1, MAX_REWARD_DAILY));
            addProgress("25ads", 1);

            await rewardCallbackRef.current?.();
          },
        ),
      );

      // CLOSED
      listenerRefs.current.push(
        adRef.current.addAdEventListener(AdEventType.CLOSED, () => {
          playPass();
          finish(rewarded); // 🔥 penting: hanya true jika reward benar
        }),
      );

      // ERROR
      listenerRefs.current.push(
        adRef.current.addAdEventListener(AdEventType.ERROR, (e) => {
          console.log("Ad error:", e);

          playFail();

          Toast.show({
            type: "error",
            text1: "Ad failed",
            text2: "Please try again",
          });

          finish(false);
        }),
      );

      adRef.current.load();
    });
  };

  /* ------------------------------------------------------------------ */

  return (
    <AdContext.Provider
      value={{
        loading,
        showing,
        rewardShown,
        maxRewardDaily: MAX_REWARD_DAILY,
        showAd,
        reloadRewardCounter: loadRewardCounter,
      }}
    >
      {children}
    </AdContext.Provider>
  );
};
