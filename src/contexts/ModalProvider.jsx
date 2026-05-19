import { createContext, useContext, useEffect, useRef, useState } from "react";
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
import { useSfxStore } from "../stores/useSfxStore";

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
  const [modal, setModal] = useState({
    visible: false,
    title: "",
    description: "",
    reward: null,
    button: null,
    closable: true, // default tetap menampilkan tombol X
  });

  const isMounted = useRef(false);

  const [loadingVisible, setLoadingVisible] = useState(false);

  const playPass = useSfxStore((state) => state.playPass);

  // Helper untuk menampilkan loading overlay
  const showLoading = () => {
    if (!isMounted.current) return;
    setLoadingVisible(true);
  };

  // Helper untuk menyembunyikan loading overlay
  const hideLoading = () => {
    if (!isMounted.current) return;
    setLoadingVisible(false);
  };

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  const formatValue = (val) => {
    if (val >= 1000) return val / 1000 + "K";
    return val;
  };

  const scaleAnim = useRef(new Animated.Value(0)).current;

  // Ubah fungsi showModal agar otomatis memakai default `closable: true`

  const showModal = (config, sound = null) => {
    if (!isMounted.current) return;
    const play = sound;
    setModal({
      visible: true,
      closable: true,
      rewards: [],
      button: null,
      buttons: null,
      ...config,
    });

    scaleAnim.setValue(0);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 120,
      useNativeDriver: true,
    }).start();
  };

  const hideModal = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      if (isMounted.current) {
        setModal((prev) => ({ ...prev, visible: false }));
      }
    });
  };

  return (
    <ModalContext.Provider
      value={{
        showModal,
        hideModal,
        showLoading,
        hideLoading,
        modal,
        loadingVisible,
      }}
    >
      {children}

      <Modal
        visible={modal.visible}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        {/* OVERLAY */}
        <View
          className="flex-1 justify-center items-center px-8"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          {/* klik luar */}
          {/* <Pressable
            className="absolute inset-0"
            onPress={hideModal}
          /> */}

          {/* MODAL BOX */}
          <Animated.View
            style={{ transform: [{ scale: scaleAnim }] }}
            className="w-full"
          >
            <ImageBackground
              source={Images.Modal}
              resizeMode="stretch"
              className="w-full pt-8 pb-10 px-8  relative"
              style={{ minHeight: 50 }} // WAJIB
            >
              {modal.closable !== false && (
                <TouchableOpacity
                  onPress={hideModal}
                  className="absolute -top-3 -right-3"
                >
                  <Image source={Images.CloseButton} className="w-14 h-14" />
                </TouchableOpacity>
              )}

              <Text className="text-xl font-Nunito-Black text-center mb-2">
                {modal.title}
              </Text>

              {modal.description && (
                <Text className="font-Nunito-Bold text-gray-500 text-center text-sm mb-4">
                  {modal.description}
                </Text>
              )}

              {modal.rewards && modal.rewards.length > 0 && (
                <View className="mb-4">
                  <View className="flex-row justify-center gap-3">
                    {modal.rewards.map((item, index) => (
                      <View
                        key={index}
                        className="bg-gray-100 rounded-xl px-4 py-3 items-center min-w-[70px]"
                      >
                        {/* ICON / IMAGE */}
                        {(item.icon || item.image) && (
                          <Image
                            source={item.icon || item.image}
                            className="w-10 h-10 mb-1"
                            resizeMode="contain"
                          />
                        )}

                        {/* VALUE */}
                        {item.value && (
                          <Text className="font-Nunito-Black text-lg">
                            {formatValue(item.value)}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* MULTIPLE BUTTONS (BARU) */}
              {modal.buttons && modal.buttons.length > 0 ? (
                <View className="flex-row justify-center gap-3 mt-5">
                  {modal.buttons.map((btn, index) => (
                    <TouchableOpacity
                      key={index}
                      className="relative justify-center items-center"
                      onPress={() => {
                        btn.onPress?.();
                        hideModal();
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
              ) : (
                /* SINGLE BUTTON (KOMPATIBILITAS LAMA) */
                modal.button && (
                  <TouchableOpacity
                    className="relative mt-5 justify-center items-center self-center"
                    onPress={() => {
                      modal.button.onPress?.();
                      hideModal();
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
                )
              )}
            </ImageBackground>
          </Animated.View>
        </View>
      </Modal>

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
    </ModalContext.Provider>
  );
};
