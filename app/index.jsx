import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { BackHandler, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Images from "../src/constants/Images";
import useExitHandler from "../src/hooks/useExitHandler";
import useRecoverEnergyModal from "../src/hooks/useRecoverEnergyModal";
import { formatNumber } from "../src/utils/formatNumber";

import { useQuest } from "../src/contexts/QuestProvider";
import { useModalStore } from "../src/stores/useModalStore";
import { useMusicStore } from "../src/stores/useMusicStore";
import { useUserStore } from "../src/stores/useUserStore";

export default function Index() {
  const [energyCooldown, setEnergyCooldown] = useState("");

  const router = useRouter();

  const showModal = useModalStore((state) => state.showModal);

  const isMusicOn = useMusicStore((state) => state.isMusicOn);
  const toggleMusic = useMusicStore((state) => state.toggleMusic);

  const showRecoverEnergyModal = useRecoverEnergyModal();

  const userData = useUserStore((state) => state.userData);
  const consumeEnergy = useUserStore((state) => state.consumeEnergy);
  const getEnergyRecoveryTime = useUserStore(
    (state) => state.getEnergyRecoveryTime,
  );

  const { clearAllQuests } = useQuest();

  /* -------------------------------------------------------------------------- */
  /* Energy Cooldown Display                                                    */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const formatTime = (seconds) => {
      if (seconds <= 0) return "";

      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;

      if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, "0")}:${String(
          secs,
        ).padStart(2, "0")}`;
      }

      return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
        2,
        "0",
      )}`;
    };

    const updateCooldown = () => {
      const energy = userData?.energy;

      // Jika energy penuh, tidak tampilkan cooldown
      if (!energy || energy.current >= energy.max) {
        setEnergyCooldown("");
        return;
      }

      const remainingSeconds = getEnergyRecoveryTime();

      if (remainingSeconds <= 0) {
        setEnergyCooldown("00:00");
      } else {
        setEnergyCooldown(formatTime(remainingSeconds));
      }
    };

    // Update langsung
    updateCooldown();

    // Update setiap detik
    const interval = setInterval(updateCooldown, 1000);

    return () => clearInterval(interval);
  }, [userData?.energy, getEnergyRecoveryTime]);

  /* -------------------------------------------------------------------------- */
  /* Start Game                                                                 */
  /* -------------------------------------------------------------------------- */

  const handleStartGame = async () => {
    const currentEnergy = userData?.energy?.current ?? 0;

    // Jika energy habis, tampilkan modal recovery energy
    if (currentEnergy === 0) {
      showRecoverEnergyModal();
      return;
    }

    // Kurangi energy 1
    const success = await consumeEnergy(1);

    // Jika gagal (misalnya race condition)
    if (!success) {
      return;
    }

    // Masuk ke game
    router.push("Game");
  };

  /* -------------------------------------------------------------------------- */
  /* Exit Handler                                                               */
  /* -------------------------------------------------------------------------- */

  useExitHandler(() => BackHandler.exitApp(), {
    title: "Exit Game",
    description: "Are you sure?",
  });

  return (
    <SafeAreaView>
      <View className="px-5 py-3 flex-1 min-h-[90vh] max-h-[90vh]">
        <View className="flex-row justify-between">
          {/* Kotak Kiri (Avatar/Logo) */}
          <TouchableOpacity
            onPress={() => {
              showModal({
                title: "Confirm",
                description: "You will logout, Sure?",
                button: {
                  label: "LOGOUT",
                  image: Images.ButtonDanger,
                },
              });
            }}
            className="h-20 w-16 border-2 border-border rounded-xl p-1"
          >
            <Image source={Images.Avatar} className="h-full w-full" />
          </TouchableOpacity>

          {/* Kontainer Kanan - Gunakan flex-1 agar mengambil sisa ruang */}
          {/* Berikan ml-3 (margin left) agar ada jarak dengan kotak kiri */}
          <View className="flex-1 gap-2 ml-2">
            <View className=" flex-row gap-2 mt-1">
              {/* Gunakan flex-1 pada anak agar lebar terbagi rata secara otomatis */}
              <TouchableOpacity className="h-10 flex-1 justify-center">
                <View className="h-12 w-12 border-2 border-border bg-bg rounded-full absolute z-10 justify-center items-center">
                  <Image
                    source={Images.Coin}
                    className="h-[70%] w-[70%]"
                    resizeMode="contain"
                  />
                </View>

                <View className="h-10 flex-1 justify-center ml-3 border-2 border-border rounded-full pl-10 bg-bg">
                  <Text className="font-Nunito-Black text-lg text-gray-600">
                    {formatNumber(userData?.coin)}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity className="h-10 flex-1 justify-center">
                <View className="h-12 w-12 border-2 border-border bg-bg rounded-full absolute z-10 justify-center items-center">
                  <Image
                    source={Images.Brain}
                    className="h-[70%] w-[70%]"
                    resizeMode="contain"
                  />
                </View>

                <View className="h-10 flex-1 justify-center ml-3 border-2 border-border rounded-full pl-10 bg-bg">
                  <Text className="font-Nunito-Black text-lg text-gray-600">
                    {formatNumber(userData?.iq)}
                  </Text>
                </View>
              </TouchableOpacity>
              {/* <View className="h-10 flex-1 border-2 border-border rounded-lg"></View> */}
            </View>
            <View className=" flex-row gap-2 items-center">
              {/* Energy */}
              <TouchableOpacity
                onPress={showRecoverEnergyModal}
                className="w-20 border-2 border-border rounded-full relative ml-4 justify-center items-center py-1"
              >
                <Image
                  source={Images.Energy}
                  className="w-7 h-7 absolute -left-3"
                />

                <Text className="text-sm font-Nunito-Bold text-gray-500">
                  {userData?.energy?.current}/{userData?.energy?.max}
                </Text>

                {!!energyCooldown && (
                  <Text className="text-[10px] font-Nunito-Bold text-orange-500 absolute -bottom-[15px]">
                    {energyCooldown}
                  </Text>
                )}
              </TouchableOpacity>
              <View className="h-7 flex-1 flex-row items-center justify-end gap-2 mr-3">
                <TouchableOpacity onPress={toggleMusic}>
                  <Image
                    source={isMusicOn ? Images.MusicOn : Images.MusicOff}
                    className="h-6 w-8"
                    resizeMode="contain"
                  />
                </TouchableOpacity>
                <TouchableOpacity>
                  <Image
                    source={Images.Mail}
                    className="h-6 w-8"
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
        <View className="flex-1 flex-row justify-between h-full w-full my-12 px-5">
          <View className="justify-start gap-10 h-[50%] mt-28">
            <TouchableOpacity className="h-20 w-16 border-2 bg-[#fffaf6] border-border rounded-xl p-1">
              {/* <Image source={Images.Leaderboard}/> */}
            </TouchableOpacity>
            <TouchableOpacity className="h-20 w-16 border-2 bg-[#fffaf6] border-border rounded-xl p-1">
              {/* <Image source={Images.Leaderboard}/> */}
            </TouchableOpacity>
          </View>

          <View className="flex-1 mt-20 items-center ">
            <Image
              source={Images.Logo}
              className="w-[90%] aspect-[2/1] max-h-20 "
              resizeMode="contain"
            />
            <View className="justify-center items-center px-7 h-7 my-3 mx-2 border-2 border-[#217a28] rounded-lg bg-lime-600">
              <Text className="font-Nunito-Bold text-sm text-white">
                {`Level ${userData?.stage_level}`}
              </Text>
            </View>
            <Image
              source={Images.MenuChar}
              className="w-[90%] aspect-square max-h-40 "
              resizeMode="contain"
            />
            <TouchableOpacity
              className="relative mt-5 justify-center items-center"
              onPress={handleStartGame}
            >
              <Image
                source={Images.Button}
                className="w-48 h-20"
                resizeMode="stretch"
              />
              <Text className="font-Nunito-Black text-4xl text-white absolute">
                START
              </Text>
            </TouchableOpacity>
          </View>

          <View className="justify-start gap-10 h-[50%] mt-28">
            <TouchableOpacity className="h-20 w-16 border-2 bg-[#fffaf6] border-border rounded-xl p-1">
              {/* <Image source={Images.Leaderboard}/> */}
            </TouchableOpacity>
            <TouchableOpacity className="h-20 w-16 border-2 bg-[#fffaf6] border-border rounded-xl p-1">
              {/* <Image source={Images.Leaderboard}/> */}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View className="flex-row justify-center items-center gap-2 mx-5">
        <TouchableOpacity
          onPress={() => router.navigate("/Quest")}
          className="px-3 py-2 bg-[#fffaf6] border-2 border-t-2 border-b-0 border-border rounded-lg"
        >
          <View className="items-center">
            <Image source={Images.Target} className="h-10 w-10" />
            <Text className="font-semibold">Task</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.navigate("/")}
          className="px-3 py-2 bg-[#fffaf6] border-2 border-t-2 border-b-0 border-[#e2c8b2] rounded-lg"
        >
          <View className="items-center">
            <Image source={Images.Brain} className="h-10 w-10" />
            <Text className="font-semibold">Play</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
