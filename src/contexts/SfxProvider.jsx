// src/contexts/SfxProvider.jsx

import { createContext, useContext, useRef } from "react";
import { createAudioPlayer } from "expo-audio";

const SfxContext = createContext();

export const useSfx = () => useContext(SfxContext);

export const SfxProvider = ({ children }) => {
  const correctRef = useRef(null);
  const wrongRef = useRef(null);
  const passRef = useRef(null);
  const failRef = useRef(null);

  const initCorrect = () => {
    if (!correctRef.current) {
      correctRef.current = createAudioPlayer(
        require("../../assets/sfx/answer_correct.mp3"),
      );
    }
  };

  const initWrong = () => {
    if (!wrongRef.current) {
      wrongRef.current = createAudioPlayer(
        require("../../assets/sfx/answer_wrong.mp3"),
      );
    }
  };

  const initPass = () => {
    if (!passRef.current) {
      passRef.current = createAudioPlayer(
        require("../../assets/sfx/level_pass.mp3"),
      );
    }
  };

  const initFail = () => {
    if (!failRef.current) {
      failRef.current = createAudioPlayer(
        require("../../assets/sfx/level_fail.mp3"),
      );
    }
  };

  const playCorrect = async () => {
    try {
      initCorrect();
      const p = correctRef.current;
      p.seekTo(0);
      p.play();
    } catch (e) {
      console.log("SFX correct error:", e);
    }
  };

  const playWrong = async () => {
    try {
      initWrong();
      const p = wrongRef.current;
      p.seekTo(0);
      p.play();
    } catch (e) {
      console.log("SFX wrong error:", e);
    }
  };

  const playPass = async () => {
    try {
      initPass();
      const p = passRef.current;
      p.seekTo(0);
      p.play();
    } catch (e) {
      console.log("SFX level pass error:", e);
    }
  };

  const playFail = async () => {
    try {
      initFail();
      const p = failRef.current;
      p.seekTo(0);
      p.play();
    } catch (e) {
      console.log("SFX level fail error:", e);
    }
  };

  return (
    <SfxContext.Provider value={{ playCorrect, playWrong, playPass, playFail }}>
      {children}
    </SfxContext.Provider>
  );
};
