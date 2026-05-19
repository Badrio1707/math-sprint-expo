// src/stores/useMusicStore.js
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { AppState } from "react-native";
import { create } from "zustand";

export const useMusicStore = create((set, get) => ({
  /* ---------------------------------------------------------------------- */
  /* State                                                                  */
  /* ---------------------------------------------------------------------- */

  player: null,
  appState: AppState.currentState,

  isMusicOn: true,
  isReady: false,
  isPlaying: false,
  isInitialized: false,

  /* ---------------------------------------------------------------------- */
  /* Basic Setters                                                           */
  /* ---------------------------------------------------------------------- */

  setIsMusicOn: (value) => {
    set({ isMusicOn: value });
  },

  /* ---------------------------------------------------------------------- */
  /* Initialization                                                          */
  /* ---------------------------------------------------------------------- */

  initialize: async () => {
    // Hindari inisialisasi berulang
    if (get().isInitialized) {
      return;
    }

    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
      });

      const player = createAudioPlayer(
        require("../../assets/sfx/bg_music.mp3"),
      );

      // Musik berulang terus
      player.loop = true;

      set({
        player,
        isReady: true,
        isInitialized: true,
      });

      // Auto play jika music ON
      if (get().isMusicOn) {
        player.play();

        set({
          isPlaying: true,
        });
      }

      console.log("🎵 Music initialized");
    } catch (error) {
      console.log("music init error", error);
    }
  },

  /* ---------------------------------------------------------------------- */
  /* App State Handling                                                      */
  /* ---------------------------------------------------------------------- */

  handleAppStateChange: (nextState) => {
    const { appState, player, isMusicOn } = get();

    const wasActive = appState === "active";
    const isActive = nextState === "active";

    // Simpan state terbaru
    set({
      appState: nextState,
    });

    if (!player) {
      return;
    }

    // Masuk background → pause
    if (wasActive && !isActive) {
      player.pause();

      set({
        isPlaying: false,
      });
    }

    // Kembali foreground → resume jika music ON
    if (!wasActive && isActive) {
      if (isMusicOn) {
        player.play();

        set({
          isPlaying: true,
        });
      }
    }
  },

  /* ---------------------------------------------------------------------- */
  /* Controls                                                                */
  /* ---------------------------------------------------------------------- */

  playMusic: async () => {
    const { player, isReady } = get();

    if (!player || !isReady) {
      return;
    }

    player.play();

    set({
      isPlaying: true,
    });
  },

  pauseMusic: async () => {
    const { player, isReady } = get();

    if (!player || !isReady) {
      return;
    }

    player.pause();

    set({
      isPlaying: false,
    });
  },

  toggleMusic: async () => {
    const { player, isMusicOn } = get();

    const next = !isMusicOn;

    set({
      isMusicOn: next,
    });

    if (!player) {
      return;
    }

    if (next) {
      player.play();

      set({
        isPlaying: true,
      });
    } else {
      player.pause();

      set({
        isPlaying: false,
      });
    }
  },

  resumeMusic: async () => {
    const { player, isMusicOn } = get();

    if (!isMusicOn || !player) {
      return;
    }

    player.play();

    set({
      isPlaying: true,
    });
  },

  /* ---------------------------------------------------------------------- */
  /* Cleanup                                                                 */
  /* ---------------------------------------------------------------------- */

  release: () => {
    const { player } = get();

    try {
      player?.pause?.();
      player?.remove?.();
    } catch (error) {
      console.log("music release error", error);
    }

    set({
      player: null,
      isReady: false,
      isPlaying: false,
      isInitialized: false,
    });
  },
}));
