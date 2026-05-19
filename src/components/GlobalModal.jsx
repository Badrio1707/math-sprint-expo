import { useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  ImageBackground,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Images from "../constants/Images";
import { useModalStore } from "../stores/useModalStore";

const GlobalModal = () => {
  const modal = useModalStore((state) => state.modal);
  const loadingVisible = useModalStore((state) => state.loadingVisible);
  const hideModal = useModalStore((state) => state.hideModal);

  const scaleAnim = useRef(new Animated.Value(0)).current;

  const formatValue = (val) => {
    if (val >= 1000) {
      return val / 1000 + "K";
    }

    return val;
  };

  const animatedHideModal = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      hideModal();
    });
  };

  // Jalankan animasi saat modal tampil
  if (modal.visible && scaleAnim.__getValue() === 0) {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }

  return (
    <>
      {/* ---------------------------------------------------------------------- */}
      {/* MAIN MODAL                                                             */}
      {/* ---------------------------------------------------------------------- */}
      <Modal
        visible={modal.visible}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View
          className="flex-1 justify-center items-center px-8"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <Animated.View
            style={{ transform: [{ scale: scaleAnim }] }}
            className="w-full"
          >
            <ImageBackground
              source={Images.Modal}
              resizeMode="stretch"
              className="w-full pt-8 pb-10 px-8 relative"
              style={{ minHeight: 50 }}
            >
              {modal.closable !== false && (
                <TouchableOpacity
                  onPress={animatedHideModal}
                  className="absolute -top-3 -right-3"
                >
                  <Image source={Images.CloseButton} className="w-14 h-14" />
                </TouchableOpacity>
              )}

              {/* TITLE */}
              <Text className="text-xl font-Nunito-Black text-center mb-2">
                {modal.title}
              </Text>

              {/* DESCRIPTION */}
              {modal.description ? (
                <Text className="font-Nunito-Bold text-gray-500 text-center text-sm mb-4">
                  {modal.description}
                </Text>
              ) : null}

              {/* REWARDS */}
              {modal.rewards && modal.rewards.length > 0 ? (
                <View className="mb-4">
                  <View className="flex-row justify-center gap-3">
                    {modal.rewards.map((item, index) => (
                      <View
                        key={index}
                        className="bg-gray-100 rounded-xl px-4 py-3 items-center min-w-[70px]"
                      >
                        {item.icon || item.image ? (
                          <Image
                            source={item.icon || item.image}
                            className="w-10 h-10 mb-1"
                            resizeMode="contain"
                          />
                        ) : null}

                        {item.value ? (
                          <Text className="font-Nunito-Black text-lg">
                            {formatValue(item.value)}
                          </Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {/* MULTIPLE BUTTONS */}
              {modal.buttons && modal.buttons.length > 0 ? (
                <View className="flex-row justify-center gap-3 mt-5">
                  {modal.buttons.map((btn, index) => (
                    <TouchableOpacity
                      key={index}
                      className="relative justify-center items-center"
                      onPress={() => {
                        btn.onPress?.();
                        animatedHideModal();
                      }}
                    >
                      <Image
                        source={btn.image || Images.Button}
                        className="w-28 h-14"
                        resizeMode="stretch"
                      />

                      <Text className="font-Nunito-Black text-lg text-white absolute">
                        {btn.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : modal.button ? (
                /* SINGLE BUTTON */
                <TouchableOpacity
                  className="relative mt-5 justify-center items-center self-center"
                  onPress={() => {
                    modal.button.onPress?.();
                    animatedHideModal();
                  }}
                >
                  <Image
                    source={modal.button.image || Images.Button}
                    className="w-28 h-14"
                    resizeMode="stretch"
                  />

                  <Text className="font-Nunito-Black text-lg text-white absolute">
                    {modal.button.label}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </ImageBackground>
          </Animated.View>
        </View>
      </Modal>

      {/* ---------------------------------------------------------------------- */}
      {/* LOADING OVERLAY                                                        */}
      {/* ---------------------------------------------------------------------- */}
      <Modal
        visible={loadingVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View
          className="flex-1 justify-center items-center"
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      </Modal>
    </>
  );
};

export default GlobalModal;
