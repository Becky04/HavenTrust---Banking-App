"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { exchangeMonoToken } from "@/lib/actions/user.actions";
import Image from "next/image";
import MonoConnect from "@mono.co/connect.js";
import { cn } from "@/lib/utils";

interface MonoLinkProps {
  user: User;
  variant?: "primary" | "ghost" | "default";
  onOpen?: () => void;
  onClose?: () => void;
  isActive?: boolean;
}

const MonoLink = ({
  user,
  variant,
  onOpen,
  onClose,
  isActive = false,
}: MonoLinkProps) => {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const monoConnect = useRef<any>(null);

  // Always-fresh refs so the Mono instance never needs to be recreated
  const onCloseRef = useRef(onClose);
  const userRef = useRef(user);
  const routerRef = useRef(router);
  onCloseRef.current = onClose;
  userRef.current = user;
  routerRef.current = router;

  useEffect(() => {
    const instance = new MonoConnect({
      key: process.env.NEXT_PUBLIC_MONO_PUBLIC_KEY!,
      scope: "auth",
      data: {
        customer: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
        },
      },
      onSuccess: async ({ code }: { code: string }) => {
        await exchangeMonoToken({ code, user: userRef.current });
        routerRef.current.push("/");
      },
      onClose: () => {
        onCloseRef.current?.();
        window.dispatchEvent(new Event("mono-widget-closed"));
      },
      onEvent: () => {
        window.dispatchEvent(new Event("mono-activity"));
      },
    });

    instance.setup();
    monoConnect.current = instance;
    setReady(true);

    const handleCloseMono = () => monoConnect.current?.close();
    window.addEventListener("close-mono-widget", handleCloseMono);

    return () => {
      window.removeEventListener("close-mono-widget", handleCloseMono);
      monoConnect.current = null;
      setReady(false);
    };
    // Only recreate if the customer identity actually changes
  }, [user.firstName, user.lastName, user.email]);

  const handleOpen = () => {
    if (monoConnect.current && ready) {
      onOpen?.();
      monoConnect.current.open();
    }
  };

  return (
    <>
      {variant === "primary" ? (
        <Button
          onClick={handleOpen}
          disabled={!ready}
          className="monolink-primary"
        >
          Connect bank
        </Button>
      ) : variant === "ghost" ? (
        <button
          onClick={handleOpen}
          disabled={!ready}
          className="mobilenav-sheet_close w-full"
        >
          <Image
            src="/icons/connect-bank.svg"
            alt="connect bank"
            width={20}
            height={20}
          />
          <p className="text-16 font-semibold text-black-2">Connect bank</p>
        </button>
      ) : (
        <Button
          onClick={handleOpen}
          disabled={!ready}
          className={cn("monolink-default disabled:opacity-100", {
            "bg-bank-gradient": isActive,
          })}
        >
          <Image
            src="/icons/connect-bank.svg"
            alt="connect bank"
            width={24}
            height={24}
            className={cn({
              "brightness-[3] invert-0": isActive,
            })}
          />
          <p
            className={cn("text-[16px] font-semibold", {
              "text-white": isActive,
              "text-black-2": !isActive,
            })}
          >
            Connect bank
          </p>
        </Button>
      )}
    </>
  );
};

export default MonoLink;
