import { Image, Text, TouchableOpacity, View } from "react-native";
import Images from "../constants/Images";

const QuestCard = ({ quest, onPress, disabled, buttonText, button }) => {
  const percentage = (quest.passed / quest.progress) * 100;

  return (
    <View className="bg-[#fffefc] w-full rounded-2xl border border-gray-300 flex-row justify-between items-center p-3 gap-3">
      <Image source={quest.icon} className="w-10 h-12" resizeMode="contain" />

      <View className="flex-1">
        <Text className="font-Nunito-Black text-base text-gray-600">
          {quest.title}
        </Text>

        <Text className="font-Nunito-SemiBold text-sm text-gray-400">
          {quest.description}
        </Text>

        <View className="mt-1 justify-center items-center rounded-full border border-gray-300 w-full bg-[#f2f3ef] relative overflow-hidden">
          <View
            style={{
              width: `${percentage}%`,
            }}
            className="rounded-full h-5 absolute left-0 bottom-0 bg-[#6bff46]"
          />

          <Text className="font-Nunito-Black text-sm text-gray-600 z-10">
            {quest.passed}/{quest.progress}
          </Text>
        </View>
      </View>

      <View className="gap-2">
        <View className="flex-row justify-center gap-2 items-center">
          {quest.rewards.map((reward, index) => {
            return (
              <View
                key={index}
                className="bg-[#009da8] h-10 w-10 p-1 rounded-lg items-center relative"
              >
                <Image
                  source={reward.image}
                  className="h-full w-full"
                  resizeMode="contain"
                />
                <Text className="z-10 absolute bottom-0 text-xs font-Nunito-Black text-white">
                  {reward.value}
                </Text>
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          disabled={disabled}
          onPress={onPress}
          className="justify-center items-center min-w-24 max-h-10 rounded-xl"
        >
          <Image
            source={button}
            className="w-full h-full"
            resizeMode="stretch"
          />
          <Text className="text-base font-bold text-white absolute">
            {buttonText}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default QuestCard;
