import { ActivityIndicator, Modal, View } from "react-native";

import { useAd } from "../contexts/AdProvider";

export default function AdLoading() {
  const { loading } = useAd();

  return (
    <Modal visible={loading} transparent animationType="fade">
      <View
        className="flex-1 justify-center items-center"
        style={{
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
      >
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    </Modal>
  );
}
