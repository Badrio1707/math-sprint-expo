import { createContext, useContext, useEffect, useState } from "react";

import { clearAuth, getAuth, saveAuth } from "../services/storage";

import { loginWithDevice } from "../services/authService";
import { getDeviceId } from "../utils/getDeviceId";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const isLoggedIn = !!user && !!token;

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // 1. cek auth lokal
      const data = await getAuth();

      if (data?.token) {
        setUser(data.user);
        setToken(data.token);
        return;
      }

      // 2. auto login via device
      const deviceId = await getDeviceId();

      const response = await loginWithDevice(deviceId);

      if (response?.token) {
        setUser(response.user);
        setToken(response.token);

        await saveAuth(response);

        console.log("✅ Auto login success");
      }
    } catch (error) {
      console.log("ℹ️ No account linked to device");
    } finally {
      setLoading(false);
    }
  };

  const login = async (data) => {
    setUser(data.user);
    setToken(data.token);

    await saveAuth(data);
  };

  const logout = async () => {
    setUser(null);
    setToken(null);

    await clearAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isLoggedIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
