import { View, Text, TouchableOpacity } from "react-native";
import NetInfo from "@react-native-community/netinfo";

const OfflineScreen = () => {
  const handleRetry = async () => {
    const state = await NetInfo.fetch();

    if (state.isConnected && state.isInternetReachable !== false) {
      // AppInitializer akan otomatis rerender melalui listener NetInfo
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-[#fbfaf6] px-8">
      <Text className="text-3xl mb-4">📡</Text>

      <Text className="text-xl font-bold text-gray-700 mb-2">
        Tidak Ada Koneksi Internet
      </Text>

      <Text className="text-gray-500 text-center mb-6">
        Periksa koneksi internet Anda lalu coba lagi.
      </Text>

      <TouchableOpacity
        onPress={handleRetry}
        className="bg-blue-500 px-6 py-3 rounded-xl"
      >
        <Text className="text-white font-bold">Coba Lagi</Text>
      </TouchableOpacity>
    </View>
  );
};

export default OfflineScreen;
