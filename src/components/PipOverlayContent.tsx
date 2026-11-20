"use client";

import { createPortal } from "react-dom";
import { useEffect, useState, type ReactNode } from "react";
import { GuidePanel } from "@/components/GuidePanel";
import { SupportButton } from "@/components/monetization";

interface PipPortalProps {
  pipWindow: Window;
  children: ReactNode;
}

/**
 * Document PiP 창에 메인 창의 스타일·다크모드 클래스를 복사하고 children을 렌더한다.
 * (오버레이 공통: 가이드, 트래킹 등)
 */
export function PipPortal({ pipWindow, children }: PipPortalProps) {
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
  return createPortal(children, container);
}

interface PipOverlayContentProps {
  pipWindow: Window;
}

/** 메인 가이드 오버레이 */
export function PipOverlayContent({ pipWindow }: PipOverlayContentProps) {
  return (
    <PipPortal pipWindow={pipWindow}>
      <GuidePanel compact />
      <div className="flex justify-center py-3 border-t border-zinc-700">
        <SupportButton compact />
      </div>
    </PipPortal>
  );
}
