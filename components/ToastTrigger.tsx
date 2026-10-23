"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

export default function ToastTrigger() {
  const searchParams = useSearchParams();
  const hasShownToast = useRef(false);

  useEffect(() => {
    const success = searchParams.get("success");

    if (success === "true" && !hasShownToast.current) {
      hasShownToast.current = true;

      toast.success("Welcome back! You have signed in successfully.", {
        duration: 4000,
        id: "sign-in-success",
      });

      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  return null;
}
