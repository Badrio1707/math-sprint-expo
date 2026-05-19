// src/stores/useSfxStore.js
import { createAudioPlayer } from "expo-audio";
import { create } from "zustand";

export const useSfxStore = create((set, get) => ({
  correctPlayer: null,
  wrongPlayer: null,
  passPlayer: null,
  failPlayer: null,

  initCorrect: () => {
    if (!get().correctPlayer) {
      set({
        correctPlayer: createAudioPlayer(
          require("../../assets/sfx/answer_correct.mp3"),
        ),
      });
    }
  },

  initWrong: () => {
    if (!get().wrongPlayer) {
      set({
        wrongPlayer: createAudioPlayer(
          require("../../assets/sfx/answer_wrong.mp3"),
        ),
      });
    }
  },

  initPass: () => {
    if (!get().passPlayer) {
      set({
        passPlayer: createAudioPlayer(
          require("../../assets/sfx/level_pass.mp3"),
        ),
      });
    }
  },

  initFail: () => {
    if (!get().failPlayer) {
      set({
        failPlayer: createAudioPlayer(
          require("../../assets/sfx/level_fail.mp3"),
        ),
      });
    }
  },

  playCorrect: async () => {
    try {
      get().initCorrect();
      const player = get().correctPlayer;
      player.seekTo(0);
      player.play();
    } catch (e) {
      console.log("SFX correct error:", e);
    }
  },

  playWrong: async () => {
    try {
      get().initWrong();
      const player = get().wrongPlayer;
      player.seekTo(0);
      player.play();
    } catch (e) {
      console.log("SFX wrong error:", e);
    }
  },

  playPass: async () => {
    try {
      get().initPass();
      const player = get().passPlayer;
      player.seekTo(0);
      player.play();
    } catch (e) {
      console.log("SFX level pass error:", e);
    }
  },

  playFail: async () => {
    try {
      get().initFail();
      const player = get().failPlayer;
      player.seekTo(0);
      player.play();
    } catch (e) {
      console.log("SFX level fail error:", e);
    }
  },

  releaseAll: () => {
    const { correctPlayer, wrongPlayer, passPlayer, failPlayer } = get();

    correctPlayer?.remove?.();
    wrongPlayer?.remove?.();
    passPlayer?.remove?.();
    failPlayer?.remove?.();

    set({
      correctPlayer: null,
      wrongPlayer: null,
      passPlayer: null,
      failPlayer: null,
    });
  },
}));
