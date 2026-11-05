import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let active = true;

    try {
      const result = AccessibilityInfo.isReduceMotionEnabled?.();
      if (result && typeof result.then === "function") {
        result
          .then((value) => {
            if (active) setReduced(value);
          })
          .catch(() => undefined);
      }
    } catch {
      // Keep the default when the platform cannot report the preference.
    }

    let subscription: { remove?: () => void } | undefined;
    try {
      subscription = AccessibilityInfo.addEventListener?.("reduceMotionChanged", (value) => {
        if (active) setReduced(value);
      });
    } catch {
      subscription = undefined;
    }

    return () => {
      active = false;
      subscription?.remove?.();
    };
  }, []);

  return reduced;
}