// React wrapper for the HugoSplash paywall widget.
// Drop this <HugoSplashPaywall /> component into any React app.
//
// The widget itself is vanilla JS; we just ensure the script loads once and
// mount the widget div at the right place.

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    HugoSplash?: { mount?: (el: HTMLElement) => void };
  }
}

const SCRIPT_SRC = "https://hugosplash.com/paywall.js";

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load HugoSplash script"));
    document.head.appendChild(s);
  });
}

export interface HugoSplashPaywallProps {
  paywallId: string;
  theme?: "light" | "dark";
  apiBase?: string;
  onUnlock?: () => void;
  redirectUrl?: string;
}

export function HugoSplashPaywall({
  paywallId,
  theme = "light",
  apiBase,
  onUnlock,
  redirectUrl,
}: HugoSplashPaywallProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    // Expose the onUnlock callback via a window-scoped function the widget can call
    const callbackName = `__hgspl_onUnlock_${paywallId.replace(/-/g, "")}`;
    if (onUnlock) (window as any)[callbackName] = onUnlock;

    loadScript()
      .then(() => {
        if (cancelled || !ref.current) return;
        ref.current.setAttribute("data-paywall-id", paywallId);
        ref.current.setAttribute("data-theme", theme);
        if (apiBase) ref.current.setAttribute("data-api-base", apiBase);
        if (redirectUrl) ref.current.setAttribute("data-redirect", redirectUrl);
        if (onUnlock) ref.current.setAttribute("data-on-unlock", callbackName);
        // Let the widget's auto-mount logic pick it up
        window.HugoSplash?.mount?.(ref.current);
      })
      .catch(console.error);

    return () => {
      cancelled = true;
      if (onUnlock) delete (window as any)[callbackName];
    };
  }, [paywallId, theme, apiBase, redirectUrl, onUnlock]);

  return <div ref={ref} />;
}

// Usage:
//
// import { HugoSplashPaywall } from "./HugoSplashPaywall";
//
// export default function ArticlePage() {
//   return (
//     <article>
//       <h1>Premium content</h1>
//       <p>Preview paragraph that everyone sees…</p>
//       <HugoSplashPaywall
//         paywallId="00000000-0000-0000-0000-000000000000"
//         onUnlock={() => console.log("Unlocked!")}
//       />
//     </article>
//   );
// }
