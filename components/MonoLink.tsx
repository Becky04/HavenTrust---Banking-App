// components/MonoLink.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import {
  createMonoCustomer,
  exchangeMonoToken,
} from "@/lib/actions/user.actions";
import Image from "next/image";
import MonoConnect from "@mono.co/connect.js";

interface MonoLinkProps {
  user: User;
  variant?: "primary" | "ghost" | "default";
}
const MonoLink = ({ user, variant }: MonoLinkProps) => {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const monoConnect = useRef<any>(null);

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
        await exchangeMonoToken({ code, user });
        router.push("/");
      },
      onClose: () => console.log("Mono widget closed"),
    });

    instance.setup();
    monoConnect.current = instance;
    setReady(true);
  }, [user]);

  const handleOpen = () => {
    if (monoConnect.current && ready) {
      monoConnect.current.open();
    }
  };

  return (
    <>
      {variant === "primary" ? (
        <Button
          onClick={handleOpen}
          disabled={!ready}
          className="plaidlink-primary"
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
        <Button onClick={handleOpen} className="plaidlink-default">
          <Image
            src="/icons/connect-bank.svg"
            alt="connect bank"
            width={24}
            height={24}
          />
          <p className="text-[16px] font-semibold text-black-2">Connect bank</p>
        </Button>
      )}
    </>
  );
};

export default MonoLink;
