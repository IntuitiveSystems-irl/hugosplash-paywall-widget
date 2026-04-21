// React wrapper for the HugoSplash paywall widget.
// Drop this <HugoSplashPaywall /> component into any React app.
//
// The widget itself is vanilla JS; we just ensure the script loads once and
// mount the widget div at the right place.

import { useEffect, useRef } from "react";

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
  redirectUrl?: string;
}

export function HugoSplashPaywall({
  paywallId,
  theme = "light",
  redirectUrl,
}: HugoSplashPaywallProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    loadScript()
      .then(() => {
        if (cancelled || !ref.current) return;
        ref.current.setAttribute("data-paywall-id", paywallId);
        ref.current.setAttribute("data-theme", theme);
        if (redirectUrl) ref.current.setAttribute("data-redirect", redirectUrl);
        // The widget auto-mounts on any [data-paywall-id] element in the DOM.
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [paywallId, theme, redirectUrl]);

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
