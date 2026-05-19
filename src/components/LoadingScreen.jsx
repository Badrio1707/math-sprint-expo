import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, Text, View } from "react-native";
import Images from "../constants/Images";

const LoadingScreen = ({ text = "Loading..." }) => {
  const progress = useRef(new Animated.Value(0)).current;
  const [displayPercent, setDisplayPercent] = useState(0);

  useEffect(() => {
    // Animasi progress bar berulang dari 0% ke 95%
    // agar terlihat seperti loading game pada umumnya.
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 0.95,
          duration: 2500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.delay(300),
        Animated.timing(progress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ]),
    );

    // Update angka persen yang ditampilkan
    const listener = progress.addListener(({ value }) => {
      setDisplayPercent(Math.floor(value * 100));
    });

    animation.start();

    return () => {
      animation.stop();
      progress.removeListener(listener);
    };
  }, [progress]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View className="flex-1 justify-center items-center bg-[#fbfaf6] px-8">
      {/* Logo */}
      <Image source={Images.Logo} className="w-56 h-36" resizeMode="stretch" />

      {/* Loading Text */}
      <Text className="mt-6 text-gray-700 font-bold text-xl text-center">
        {text}
      </Text>

      {/* Progress Bar Container */}
      <View className="mt-6 w-full max-w-[320px]">
        <View className="h-5 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
          <Animated.View
            style={{ width }}
            className="h-full bg-green-500 rounded-full"
          />
        </View>

        {/* Percentage */}
        <Text className="mt-2 text-center text-gray-600 font-semibold">
          {displayPercent}%
        </Text>
      </View>

      {/* Tip */}
      <Text className="mt-6 text-gray-500 text-center text-sm">
        Preparing your game data...
      </Text>
    </View>
  );
};

export default LoadingScreen;
