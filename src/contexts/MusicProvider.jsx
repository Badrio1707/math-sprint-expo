import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

const MusicContext = createContext();
export const useMusic = () => useContext(MusicContext);

export const MusicProvider = ({ children }) => {
  const playerRef = useRef(null);
  const appState = useRef(AppState.currentState);

  const [isMusicOn, setIsMusicOn] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  /* ------------------------------------------------------------------ */
  /* INIT                                                               */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
        });

        const player = createAudioPlayer(
          require("../../assets/sfx/bg_music.mp3"),
        );

        player.loop = true;

        playerRef.current = player;

        if (isMusicOn) {
          player.play();
          setIsPlaying(true);
        }

        if (mounted) setIsReady(true);
      } catch (e) {
        console.log("music init error", e);
      }
    };

    init();

    return () => {
      mounted = false;
      playerRef.current?.pause?.();
      playerRef.current = null;
    };
  }, []);

  /* ------------------------------------------------------------------ */
  /* APP STATE HANDLER (INI YANG FIX PROBLEM KAMU)                     */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      const wasActive = appState.current === "active";
      const isActive = nextState === "active";

      appState.current = nextState;

      if (!playerRef.current) return;

      // 🔥 masuk background → pause otomatis
      if (wasActive && !isActive) {
        playerRef.current.pause();
        setIsPlaying(false);
      }

      // 🔥 balik ke foreground → play lagi kalau user ON
      if (!wasActive && isActive) {
        if (isMusicOn) {
          playerRef.current.play();
          setIsPlaying(true);
        }
      }
    });

    return () => sub.remove();
  }, [isMusicOn]);

  /* ------------------------------------------------------------------ */
  /* CONTROLS                                                          */
  /* ------------------------------------------------------------------ */

  const playMusic = async () => {
    if (!playerRef.current || !isReady) return;

    playerRef.current.play();
    setIsPlaying(true);
  };

  const pauseMusic = async () => {
    if (!playerRef.current || !isReady) return;

    playerRef.current.pause();
    setIsPlaying(false);
  };

  const toggleMusic = async () => {
    const next = !isMusicOn;
    setIsMusicOn(next);

    if (!playerRef.current) return;

    if (next) {
      playerRef.current.play();
      setIsPlaying(true);
    } else {
      playerRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resumeMusic = async () => {
    if (!isMusicOn || !playerRef.current) return;

    playerRef.current.play();
    setIsPlaying(true);
  };

  return (
    <MusicContext.Provider
      value={{
        isMusicOn,
        isReady,
        isPlaying,

        toggleMusic,
        playMusic,
        pauseMusic,
        resumeMusic,

        setIsMusicOn,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};
