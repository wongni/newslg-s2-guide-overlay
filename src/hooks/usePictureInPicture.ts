"use client";

import { useCallback, useRef, useState } from "react";

interface PipOptions {
  width?: number;
  height?: number;
}

export function usePictureInPicture() {
  const [isPipOpen, setIsPipOpen] = useState(false);
  const pipWindowRef = useRef<Window | null>(null);

  const isSupported =
    typeof window !== "undefined" && "documentPictureInPicture" in window;

  const openPip = useCallback(
    async (options: PipOptions = {}) => {
      if (!isSupported) {
        console.warn("Document PiP not supported. Use Chrome/Edge 116+.");
        return null;
      }

      try {
        const pipWindow =
          await (window as unknown as { documentPictureInPicture: { requestWindow: (opts: { width: number; height: number }) => Promise<Window> } }).documentPictureInPicture.requestWindow({
            width: options.width || 420,
            height: options.height || 680,
          });

        pipWindow.addEventListener("pagehide", () => {
          setIsPipOpen(false);
          pipWindowRef.current = null;
        });

        pipWindowRef.current = pipWindow;
        setIsPipOpen(true);
        return pipWindow;
      } catch (error) {
        console.error("Failed to open PiP window:", error);
        return null;
      }
    },
    [isSupported]
  );

  const closePip = useCallback(() => {
    if (pipWindowRef.current) {
      pipWindowRef.current.close();
      pipWindowRef.current = null;
      setIsPipOpen(false);
    }
  }, []);

  return {
    isSupported,
    isPipOpen,
    pipWindow: pipWindowRef.current,
    openPip,
    closePip,
  };
}
