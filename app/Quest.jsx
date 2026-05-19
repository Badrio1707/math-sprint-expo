import { useRouter } from "expo-router";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import QuestCard from "../src/components/QuestCard";
import Images from "../src/constants/Images";

import { useAd } from "../src/contexts/AdProvider";
import useRewardModal from "../src/hooks/useRewardModal";

// ✅ Zustand Store
import { useModalStore } from "../src/stores/useModalStore";
import { useQuestStore } from "../src/stores/useQuestStore";
import { useUserStore } from "../src/stores/useUserStore";

const Quest = () => {
  /* ---------------------------------------------------------------------- */
  /* Quest Store                                                            */
  /* ---------------------------------------------------------------------- */

  const quests = useQuestStore((state) => state.quests);
  const setQuests = useQuestStore((state) => state.setQuests);
  const saveQuests = useQuestStore((state) => state.saveQuests);
  const saveQuestsToServer = useQuestStore((state) => state.saveQuestsToServer);
  const resetQuests = useQuestStore((state) => state.resetQuests);
  const claimQuest = useQuestStore((state) => state.claimQuest);

  /* ---------------------------------------------------------------------- */
  /* Other Hooks                                                            */
  /* ---------------------------------------------------------------------- */

  const applyRewards = useUserStore((state) => state.applyRewards);
  const { showAd } = useAd();

  const showLoading = useModalStore((state) => state.showLoading);
  const hideLoading = useModalStore((state) => state.hideLoading);
  const showRewardModal = useRewardModal();
  const router = useRouter();

  /* ---------------------------------------------------------------------- */
  /* Helpers                                                                */
  /* ---------------------------------------------------------------------- */

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  /**
   * Claim reward helper.
   * Menggunakan snapshot terbaru dari Zustand agar data yang disimpan
   * sudah mencakup perubahan `claimed: true`.
   */
  const handleClaim = async (quest) => {
    showLoading();

    try {
      // Apply reward ke user
      applyRewards(quest.rewards);

      // Update quest menjadi claimed
      claimQuest(quest.id);

      // Ambil state terbaru setelah claim
      const updatedQuests = useQuestStore.getState().quests;

      // Simpan langsung
      await saveQuests(updatedQuests);
      await saveQuestsToServer(updatedQuests);

      // Tampilkan modal reward
      showRewardModal(quest.rewards);
    } finally {
      hideLoading();
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Render                                                                 */
  /* ---------------------------------------------------------------------- */

  return (
    <SafeAreaView className="p-5 gap-3 max-h-full">
      <View className="flex-row">
        <View className="gap-3">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()}>
              <Image source={Images.BackButton} className="h-8 w-8" />
            </TouchableOpacity>

            <Text className="font-Nunito-Black text-3xl text-gray-600">
              Daily Task
            </Text>
          </View>

          <View className="flex-row items-center gap-2 p-2 border border-gray-300 rounded-2xl">
            <Image source={Images.Calendar} className="w-10 h-10" />

            <View>
              <Text className="text-gray-500 font-Nunito-Bold text-sm">
                Complete daily task and
              </Text>
              <Text className="text-gray-500 font-Nunito-Bold text-sm">
                get rewards!!
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-1 relative">
          <Image
            source={Images.MenuChar}
            className="absolute -bottom-5 right-0 w-28 h-28"
            resizeMode="contain"
          />
        </View>
      </View>

      <View className="bg-[#f2f3ef] w-full h-32 rounded-2xl border border-gray-300" />

      <ScrollView>
        <View className="gap-3">
          {quests.map((quest) => {
            const handlePress = async () => {
              /* ---------------------------------------------------------- */
              /* CLAIMABLE QUESTS                                            */
              /* ---------------------------------------------------------- */

              if (quest.passed >= quest.progress) {
                await handleClaim(quest);
                return;
              }

              /* ---------------------------------------------------------- */
              /* DAILY ADS (10ads)                                           */
              /* ---------------------------------------------------------- */

              if (quest.actionType === "10ads") {
                // Masih cooldown → blokir
                if (quest.cooldownLeft > 0) {
                  return;
                }

                await showAd(async () => {
                  const now = Date.now();
                  let updatedQuests = [];

                  // Update quest
                  setQuests((prev) => {
                    updatedQuests = prev.map((q) => {
                      if (q.actionType !== "10ads") {
                        return q;
                      }

                      const nextPassed = Math.min(
                        (q.passed || 0) + 1,
                        q.progress,
                      );

                      const isCompleted = nextPassed >= q.progress;

                      return {
                        ...q,
                        passed: nextPassed,
                        lastClaimAt: isCompleted ? null : now,
                        cooldownLeft: isCompleted ? 0 : q.cooldown || 0,
                      };
                    });

                    return updatedQuests;
                  });

                  // Tunggu sebentar agar state selesai diproses
                  await new Promise((resolve) => setTimeout(resolve, 50));

                  // Simpan langsung
                  await saveQuests(updatedQuests);
                  await saveQuestsToServer(updatedQuests);
                });

                return;
              }

              /* ---------------------------------------------------------- */
              /* QUEST YANG BELUM SELESAI                                    */
              /* ---------------------------------------------------------- */

              // play, 25ads, playtime, streak → kembali ke halaman sebelumnya
              router.back();
            };

            return (
              <QuestCard
                key={quest.id}
                quest={quest}
                disabled={quest.claimed || quest.cooldownLeft > 0}
                onPress={handlePress}
                button={
                  // Jika quest sudah diklaim
                  quest.claimed
                    ? Images.ButtonDisable
                    : // Jika quest selesai dan belum diklaim
                      quest.passed >= quest.progress
                      ? Images.Button
                      : // Khusus quest Daily Ads
                        quest.actionType === "10ads"
                        ? // Jika cooldown aktif
                          quest.cooldownLeft > 0
                          ? Images.ButtonDisable
                          : // Cooldown selesai
                            Images.Button
                        : // Quest lain yang belum selesai
                          Images.ButtonDisable
                }
                buttonText={
                  // Sudah diklaim
                  quest.claimed
                    ? "Done"
                    : // Selesai dan siap diklaim
                      quest.passed >= quest.progress
                      ? "Claim"
                      : // Sedang cooldown
                        quest.cooldownLeft > 0
                        ? formatTime(quest.cooldownLeft)
                        : // Belum selesai
                          quest.actionText
                }
              />
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Quest;
