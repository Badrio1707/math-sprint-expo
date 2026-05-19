import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useGoogleAuth } from "../src/hooks/useGoogleAuth";
import Images from "../src/constants/Images";
import Toast from "react-native-toast-message";

export default function Login() {
  const { signIn } = useGoogleAuth();

  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (loading) return;

    try {
      setLoading(true);
      await signIn();
    } catch (error) {
      console.log(error);
      Toast.show({
        type: "error",
        text1: "Login gagal",
        text2: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="justify-center items-center h-full gap-10">
      <View>
        <Image
          source={Images.Logo}
          className="w-56 h-36"
          resizeMode="stretch"
        />
      </View>
      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
        className="flex-row gap-2 justify-center items-center bg-white border border-gray-400 px-6 py-3 rounded-full"
      >
        <Image
          source={Images.Google}
          className="w-8 h-8"
          resizeMode="contain"
        />
        <Text className="text-gray-600 font-bold">Login with Google</Text>
      </TouchableOpacity>

      {/* LOADING OVERLAY */}
      {loading && (
        <View className="absolute inset-0 bg-black/50 justify-center items-center">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </SafeAreaView>
  );
}
