
import {
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { useRewardedAd } from './hooks/useRewardedAd';

export default function App() {

  const rewardedAd = useRewardedAd({

    cooldown: 30,

    reward: {
      amount: 100,
      type: 'gold',
    },

    onReward: (reward) => {

      console.log('Reward User');

      console.log(reward);

      /*
        {
          amount: 100,
          type: 'gold'
        }
      */

    },

  });

  return (

    <View>

      <TouchableOpacity
        disabled={!rewardedAd.canShow}
        onPress={rewardedAd.showAd}
      >

        <Text>

          {
            rewardedAd.cooldownLeft > 0
              ? `Wait ${rewardedAd.cooldownLeft}s`
              : rewardedAd.loaded
                ? 'Watch Reward Ads'
                : 'Loading Ads...'
          }

        </Text>

      </TouchableOpacity>

    </View>

  );
}