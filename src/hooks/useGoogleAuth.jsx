import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { googleLogin } from "../services/authService";
import { useAuthStore } from "../stores/useAuthStore";
import { getDeviceId } from "../utils/getDeviceId";

export const useGoogleAuth = () => {
  const login = useAuthStore((state) => state.login);

  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();

      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.idToken || userInfo.data?.idToken;

      const deviceId = await getDeviceId();
      console.log("Device", deviceId);

      const data = await googleLogin(idToken, deviceId);

      await login(data);
    } catch (err) {
      console.log("GOOGLE ERROR:", err);
      throw err;
    }
  };

  return { signIn };
};
