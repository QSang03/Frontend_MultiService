"use client";

import { useEffect } from "react";

export default function NoTranslateCleanup() {
  useEffect(() => {
    // Ensure document marked notranslate
    try {
      document.documentElement.setAttribute("translate", "no");
      document.body?.setAttribute("translate", "no");
    } catch {
      // ignore
    }

    // Remove common attributes and UI elements injected by translation extensions
    const removeInjected = () => {
      // attributes like fdprocessedid (seen from some translate/toolbar extensions)
      document.querySelectorAll('[fdprocessedid]').forEach((el) => el.removeAttribute('fdprocessedid'));

      // Google Translate inserts select/iframes with these classes/ids
      document.querySelectorAll('.goog-te-banner-frame, .goog-te-combo, .goog-te-spinner, #goog-gt-tt, .goog-te-spinner-pos').forEach((el) => el.remove());

      // Some extensions wrap or add translation spans — remove translate-related attributes
      document.querySelectorAll('[data-translate], [data-google-translate]').forEach((el) => {
        try { el.removeAttribute('data-translate'); el.removeAttribute('data-google-translate'); } catch {};
      });
    };

    // Run once immediately and again shortly after to catch late inserts
    removeInjected();
    const t = setTimeout(removeInjected, 500);

    return () => clearTimeout(t);
  }, []);

  return null;
}
