import { useCallback, useEffect, useRef, useState } from 'react';

import {
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
  TestIds
} from 'react-native-google-mobile-ads';


export const useRewardAd = ({


  adUnitId = TestIds.REWARDED,
  // adUnitId = 'ca-app-pub-9585050600434012/1419313473',

  reward = {
    amount: 1,
    type: 'coin',
  },


  cooldown = 0,

  autoLoad = true,

  retryDelay = 3000,

  onReward,

  onAdOpened,

  onAdClosed,

  onAdFailed,

}) => {

  const [loaded, setLoaded] = useState(false);

  const [loading, setLoading] = useState(false);

  const [showing, setShowing] = useState(false);

  const [cooldownLeft, setCooldownLeft] = useState(0);

  const adRef = useRef(null);

  const cooldownInterval = useRef(null);

  const createAd = useCallback(() => {

    adRef.current = RewardedAd.createForAdRequest(
      adUnitId,
      {
        requestNonPersonalizedAdsOnly: true,
      }
    );

  }, [adUnitId]);

  const startCooldown = useCallback(() => {

    if (cooldown <= 0) return;

    setCooldownLeft(cooldown);

    cooldownInterval.current = setInterval(() => {

      setCooldownLeft((prev) => {

        if (prev <= 1) {

          clearInterval(cooldownInterval.current);

          return 0;
        }

        return prev - 1;

      });

    }, 1000);

  }, [cooldown]);

  const loadAd = useCallback(() => {

    if (!adRef.current) {
      createAd();
    }

    setLoading(true);

    adRef.current.load();

  }, [createAd]);

  useEffect(() => {

    createAd();

    const unsubscribeLoaded =
      adRef.current.addAdEventListener(
        RewardedAdEventType.LOADED,
        () => {

          setLoaded(true);
          setLoading(false);
          console.log('Ad Loaded')

        }
      );

    const unsubscribeOpened =
      adRef.current.addAdEventListener(
        AdEventType.OPENED,
        () => {

          setShowing(true);
          onAdOpened?.();

        }
      );

    const unsubscribeClosed =
      adRef.current.addAdEventListener(
        AdEventType.CLOSED,
        () => {

          setShowing(false);
          setLoaded(false);

          onAdClosed?.();
          loadAd();


        }
      );

    const unsubscribeReward =
      adRef.current.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        () => {

          onReward?.(reward);
          startCooldown();

        }
      );

    const unsubscribeError =
      adRef.current.addAdEventListener(
        AdEventType.ERROR,
        (error) => {

          setLoaded(false);
          setLoading(false);

          onAdFailed?.(error);

          setTimeout(() => {
            loadAd();
          }, retryDelay);

        }
      );

    if (autoLoad) {
      loadAd();
    }

    return () => {

      unsubscribeLoaded();
      unsubscribeOpened();
      unsubscribeClosed();
      unsubscribeReward();
      unsubscribeError();

      if (cooldownInterval.current) {
        clearInterval(cooldownInterval.current);
      }

    };

  }, [
    autoLoad,
    createAd,
    loadAd,
    onReward,
    reward,
    retryDelay,
    onAdOpened,
    onAdClosed,
    onAdFailed,
    startCooldown,
  ]);

  const canShow =
    loaded &&
    !loading &&
    !showing &&
    cooldownLeft <= 0;

  const showAd = useCallback(async () => {

    if (!canShow) {
      return false;
    }

    try {

      await adRef.current.show();

      return true;

    } catch (err) {

      return false;

    }

  }, [canShow]);

  return {

    loaded,

    loading,

    showing,

    cooldownLeft,

    canShow,

    loadAd,

    showAd,

  };

};

export default useRewardAd;