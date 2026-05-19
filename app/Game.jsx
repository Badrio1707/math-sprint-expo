import { useRouter } from "expo-router";
import {
  Image,
  ImageBackground,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Images from "../src/constants/Images";
import useExitHandler from "../src/hooks/useExitHandler";
import useGameEngine from "../src/hooks/useGameEngine";
import { useUserStore } from "../src/stores/useUserStore";
import { formatNumber } from "../src/utils/formatNumber";

const Game = () => {
  const {
    level,
    currentQuestion,
    questionNumber,
    totalQuestions,
    formattedTime,
    selectedAnswer,
    selectedAnswerCorrect,

    hintAnswer,
    eliminatedOptions,

    answerQuestion,
    useHint,
    useExtraTime,
    useElimination,

    hintLeft,
    extraTimeLeft,
    eliminationLeft,
  } = useGameEngine();

  const router = useRouter();
  const userData = useUserStore((state) => state.userData);

  const handleBack = useExitHandler(
    () => {
      if (router.canGoBack()) router.back();
      else router.replace("/");
    },
    {
      title: "Back to Home",
      description: "Progress will end, continue?",
    },
  );

  return (
    <SafeAreaView className="p-5 h-full justify-between">
      {/* ================= HEADER ================= */}
      <View className="flex-row gap-3 w-full items-center">
        <TouchableOpacity onPress={handleBack}>
          <Image source={Images.BackButton} className="h-10 w-10" />
        </TouchableOpacity>

        <View className="flex-row flex-1 gap-2">
          {/* COIN */}
          <View className="h-10 flex-1 justify-center">
            <View className="h-12 w-12 border-2 border-border bg-bg rounded-full absolute z-10 justify-center items-center">
              <Image source={Images.Coin} className="h-[70%] w-[70%]" />
            </View>
            <View className="h-10 flex-1 justify-center ml-3 border-2 border-border rounded-full pl-10 bg-bg">
              <Text className="font-Nunito-Black text-lg text-gray-600">
                {formatNumber(userData?.coin)}
              </Text>
            </View>
          </View>

          {/* IQ */}
          <View className="h-10 flex-1 justify-center">
            <View className="h-12 w-12 border-2 border-border bg-bg rounded-full absolute z-10 justify-center items-center">
              <Image source={Images.Brain} className="h-[70%] w-[70%]" />
            </View>
            <View className="h-10 flex-1 justify-center ml-3 border-2 border-border rounded-full pl-10 bg-bg">
              <Text className="font-Nunito-Black text-lg text-gray-600">
                {formatNumber(userData?.iq)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ================= QUESTION ================= */}
      <View className="flex-1 gap-3 items-center justify-center p-3">
        <View className="flex-row w-full justify-between">
          <View className="w-24 border-2 border-border items-center justify-center p-2 rounded-lg">
            <Text className="text-sm font-Nunito-Bold text-gray-500">
              Question
            </Text>
            <Text className="text-lg font-Nunito-Black text-gray-600">
              <Text className="text-green-500">{questionNumber}</Text>/
              {totalQuestions}
            </Text>
          </View>

          <View className="w-24 border-2 border-border items-center justify-center p-2 rounded-lg">
            <Text className="text-sm font-Nunito-Bold text-gray-500">
              Timer
            </Text>
            <Text className="text-lg font-Nunito-Black text-gray-600">
              {formattedTime}
            </Text>
          </View>
        </View>

        {/* QUESTION BOX */}
        <ImageBackground
          source={Images.Board}
          resizeMode="stretch"
          className="w-full h-52 items-center justify-center"
        >
          <ImageBackground
            source={Images.ButtonDisable}
            resizeMode="stretch"
            className="w-28 h-10 absolute -top-4 items-center justify-center"
          >
            <Text className="absolute font-Nunito-Black text-bg">
              {`Level ${level}`}
            </Text>
          </ImageBackground>
          <Text className="text-4xl font-Nunito-Black text-gray-700 text-center px-3">
            {currentQuestion?.text}
          </Text>
        </ImageBackground>

        {/* ================= OPTIONS ================= */}
        <View className="w-full gap-3">
          {currentQuestion?.options?.map((option, index) => {
            const labels = ["A", "B", "C", "D"];

            const isSelected = selectedAnswer === option;
            const isCorrect = selectedAnswerCorrect;
            const isHint = hintAnswer === option;
            const isRemoved = eliminatedOptions.includes(option);

            return (
              <TouchableOpacity
                key={index}
                onPress={() => answerQuestion(option)}
                disabled={selectedAnswer !== null || isRemoved}
                className={`flex-row w-full h-16 rounded-lg border-2 items-center px-3
                  
                  ${
                    isSelected
                      ? isCorrect
                        ? "bg-green-100 border-green-500"
                        : "bg-red-100 border-red-500"
                      : isHint
                        ? "bg-green-50 border-green-400"
                        : "bg-bg border-border"
                  }

                  ${isRemoved ? "opacity-30" : ""}
                `}
              >
                {/* LABEL */}
                <View className="w-10 h-10 bg-green-500 rounded-full justify-center items-center">
                  <Text className="text-white font-Nunito-Black">
                    {labels[index]}
                  </Text>
                </View>

                {/* OPTION TEXT */}
                <View className="flex-1 items-center">
                  <Text className="text-2xl font-Nunito-Black text-gray-600">
                    {option}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ================= POWER UPS ================= */}
      <View className="flex-row h-28 justify-center items-center gap-3">
        <TouchableOpacity
          onPress={useHint}
          className="w-20 h-20 border-2 border-border relative rounded-lg items-center justify-center"
        >
          <View className="justify-center items-center p-1 bg-danger absolute -right-2 -top-2 rounded-lg">
            <Text className="font-Nunito-Bold text-sm text-white">
              {hintLeft}
            </Text>
          </View>
          <Image source={Images.LampHint} className="w-10 h-10" />
          <Text className="text-xs font-Nunito-Bold text-gray-600">Hint</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={useExtraTime}
          className="w-20 h-20 border-2 border-border relative rounded-lg items-center justify-center"
        >
          <View className="justify-center items-center p-1 bg-danger absolute -right-2 -top-2 rounded-lg">
            <Text className="font-Nunito-Bold text-sm text-white">
              {extraTimeLeft}
            </Text>
          </View>
          <Image source={Images.StopwatchPlus} className="w-10 h-10" />
          <Text className="text-xs font-Nunito-Bold text-gray-600">Time</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={useElimination}
          className="w-20 h-20 border-2 border-border relative rounded-lg items-center justify-center"
        >
          <View className="justify-center items-center p-1 bg-danger absolute -right-2 -top-2 rounded-lg">
            <Text className="font-Nunito-Bold text-sm text-white">
              {eliminationLeft}
            </Text>
          </View>
          <Image source={Images.MagnifyingGlass} className="w-10 h-10" />
          <Text className="text-xs font-Nunito-Bold text-gray-600">
            Eliminate
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Game;
