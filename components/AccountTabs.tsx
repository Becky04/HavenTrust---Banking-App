"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { BankTabItem } from "@/components/BankTabitem";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AccountTabs = ({
  accounts,
  initialId,
  syncServer = false,
  children,
}: AccountTabsProps) => {
  const [activeId, setActiveId] = useState(initialId);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (value: string) => {
    setActiveId(value);

    const params = new URLSearchParams(searchParams.toString());
    params.set("id", value);
    const url = `${pathname}?${params.toString()}`;

    if (syncServer) {
      startTransition(() => router.replace(url, { scroll: false }));
    } else {
      window.history.replaceState(null, "", url);
    }
  };

  return (
    <Tabs
      value={activeId}
      onValueChange={handleChange}
      className="flex w-full flex-col"
    >
      <TabsList className="recent-transactions-tablist mb-4">
        {accounts.map((account) => (
          <TabsTrigger key={account.id} value={account.appwriteItemId}>
            <BankTabItem account={account} appwriteItemId={activeId} />
          </TabsTrigger>
        ))}
      </TabsList>

      {children}
    </Tabs>
  );
};

export default AccountTabs;
