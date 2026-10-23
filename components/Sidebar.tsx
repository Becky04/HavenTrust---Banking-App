"use client";

import { useCallback, useEffect, useState } from "react";
import { sidebarLinks } from "@/constants";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Footer from "./Footer";
import MonoLink from "./MonoLink";

const Sidebar = ({ user }: SiderbarProps) => {
  const pathName = usePathname();
  const [isConnectBankActive, setIsConnectBankActive] = useState(false);
  const handleOpen = useCallback(() => setIsConnectBankActive(true), []);
  const handleClose = useCallback(() => setIsConnectBankActive(false), []);
  useEffect(() => {
    setIsConnectBankActive(false);
  }, [pathName]);
  useEffect(() => {
    setIsConnectBankActive(false);
  }, [pathName]);

  useEffect(() => {
    const handleClosed = () => setIsConnectBankActive(false);
    window.addEventListener("mono-widget-closed", handleClosed);
    return () => window.removeEventListener("mono-widget-closed", handleClosed);
  }, []);
  return (
    <section className="sidebar">
      <nav className="flex flex-col gap-4">
        <Link href="/" className="mb-12 cursor-pointer items-center gap-2 flex">
          <Image
            src="/icons/logo.svg"
            width={34}
            height={34}
            alt="Horizon Logo"
            className="size-[24px] max-xl:size-14"
          />
          <h1 className="sidebar-logo">HavenTrust</h1>
        </Link>

        {sidebarLinks.map((item) => {
          const isActive =
            !isConnectBankActive &&
            (item.route === "/"
              ? pathName === "/"
              : pathName === item.route ||
                pathName.startsWith(`${item.route}/`));
          return (
            <Link
              href={item.route}
              key={item.label}
              className={cn("sidebar-link", {
                "bg-bank-gradient": isActive,
              })}
            >
              <div className="relative size-6">
                <Image
                  src={item.imgURL}
                  alt={item.label}
                  fill
                  className={cn({
                    "brightness-[3] invert-0": isActive,
                  })}
                />
              </div>

              <p
                className={cn("sidebar-label", {
                  "!text-white": isActive,
                })}
              >
                {item.label}
              </p>
            </Link>
          );
        })}

        <MonoLink
          user={user}
          onOpen={handleOpen}
          onClose={handleClose}
          isActive={isConnectBankActive}
        />
      </nav>

      <Footer user={user} />
    </section>
  );
};

export default Sidebar;
