"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { logoutAccount } from "@/lib/actions/user.actions";
import { INACTIVITY_LIMIT_MS } from "@/lib/session-config";

const PING_INTERVAL_MS = 30 * 1000;

interface InactivityTrackerProps {
  children: React.ReactNode;
}

export default function InactivityTracker({
  children,
}: InactivityTrackerProps) {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let isLoggingOut = false;
    let lastPing = 0;

    const handleLogout = async () => {
      if (isLoggingOut) return;
      isLoggingOut = true;

      window.dispatchEvent(new Event("close-mono-widget"));

      try {
        await logoutAccount();
      } catch (error) {
        // logoutAccount ends with redirect(), which throws internally; ignore
      } finally {
        router.push("/sign-in");
      }
    };

    // Tells the server the user is active. A 401 means the session already expired.
    const ping = async (force = false) => {
      const now = Date.now();
      if (!force && now - lastPing < PING_INTERVAL_MS) return;
      lastPing = now;

      try {
        const res = await fetch("/api/activity", { method: "POST" });
        if (res.status === 401) handleLogout();
      } catch {
        // Offline or network blip: the next ping will retry
      }
    };

    const resetTimer = () => {
      if (isLoggingOut) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(handleLogout, INACTIVITY_LIMIT_MS);
      ping();
    };

    // User returned to the tab or the computer woke up
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        ping(true);
        resetTimer();
      }
    };

    window.addEventListener("mono-activity", resetTimer);
    document.addEventListener("visibilitychange", handleVisibility);

    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
    ];
    events.forEach((e) => window.addEventListener(e, resetTimer));

    resetTimer();

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("mono-activity", resetTimer);
      document.removeEventListener("visibilitychange", handleVisibility);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [router]);

  return <>{children}</>;
}
