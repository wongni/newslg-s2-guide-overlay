"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { GuidePanel } from "@/components/GuidePanel";

interface PipOverlayContentProps {
  pipWindow: Window;
}

export function PipOverlayContent({ pipWindow }: PipOverlayContentProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const doc = pipWindow.document;
    const body = doc.body;
    body.style.margin = "0";
    body.style.padding = "0";
    body.style.overflow = "auto";

    // Copy all stylesheets from main window into PiP
    document.querySelectorAll('link[rel="stylesheet"], style').forEach((el) => {
      doc.head.appendChild(el.cloneNode(true));
    });

    // Also copy computed Tailwind styles (Next.js injects them)
    [...document.styleSheets].forEach((sheet) => {
      try {
        const css = [...sheet.cssRules].map((r) => r.cssText).join("\n");
        if (css) {
          const style = doc.createElement("style");
          style.textContent = css;
          doc.head.appendChild(style);
        }
      } catch {
        // cross-origin sheets, skip
      }
    });

    // Copy html class (for dark mode)
    const syncHtmlClass = () => {
      doc.documentElement.className = document.documentElement.className;
    };
    syncHtmlClass();

    // Observe main html class changes to sync theme
    const observer = new MutationObserver(syncHtmlClass);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    // Create render container
    const div = doc.createElement("div");
    div.id = "pip-root";
    body.appendChild(div);
    setContainer(div);

    return () => {
      observer.disconnect();
      if (body.contains(div)) body.removeChild(div);
    };
  }, [pipWindow]);

  if (!container) return null;

  return createPortal(<GuidePanel compact />, container);
}
