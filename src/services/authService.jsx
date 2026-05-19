export const googleLogin = async (idToken, deviceId) => {
  const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/google`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      id_token: idToken,
      device_id: deviceId,
    }),
  });

  // Baca body HANYA SEKALI
  const data = await res.json();

  // Debug response
  console.log("RESPONSE:", data);

  // Handle error dari server
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Login failed");
  }

  return data;
};

export const loginWithDevice = async (deviceId) => {
  const res = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}/auth/device-login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        device_id: deviceId,
      }),
    },
  );

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message);
  }

  return data;
};
