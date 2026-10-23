"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "@/components/ui/select";
import { formUrlQuery, formatAmount } from "@/lib/utils";

export const BankDropdown = ({
  accounts = [],
  setValue,
  otherStyles,
}: BankDropdownProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selected, setSelected] = useState<Account | null>(
    accounts.length > 0 ? accounts[0] : null,
  );

  useEffect(() => {
    if (!accounts.length) {
      setSelected(null);
      return;
    }

    setSelected((current) => {
      const existing = accounts.find(
        (account) => account.appwriteItemId === current?.appwriteItemId,
      );

      return existing ?? accounts[0];
    });
  }, [accounts]);

  useEffect(() => {
    if (selected && setValue) {
      setValue("senderBank", selected.appwriteItemId, {
        shouldValidate: true,
      });
    }
  }, [selected, setValue]);

  const handleBankChange = (id: string) => {
    const account = accounts.find((item) => item.appwriteItemId === id);

    if (!account) return;

    setSelected(account);

    const newUrl = formUrlQuery({
      params: searchParams.toString(),
      key: "id",
      value: id,
    });

    router.replace(newUrl, { scroll: false });
  };

  if (!selected) {
    return (
      <Select disabled>
        <SelectTrigger
          className={`!h-auto !min-h-14 w-full rounded-xl border-gray-200 bg-gray-50 !px-4 !py-3 ${otherStyles ?? ""}`}
        >
          <span className="text-sm text-gray-500">
            No linked bank accounts available
          </span>
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={selected.appwriteItemId} onValueChange={handleBankChange}>
      <SelectTrigger
        className={`!h-auto !min-h-[4.5rem] w-full rounded-xl border-gray-200 bg-white !px-4 !py-3 shadow-sm transition hover:border-blue-300 focus:ring-2 focus:ring-blue-100 ${otherStyles ?? ""}`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
            <Image src="/icons/credit-card.svg" width={20} height={20} alt="" />
          </div>

          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-semibold text-gray-900">
              {selected.officialName || selected.name}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Balance: {formatAmount(selected.simulatedBalance ?? 0)}
            </p>
          </div>
        </div>
      </SelectTrigger>

      <SelectContent
        className="rounded-xl border-gray-200 bg-white shadow-lg"
        position="popper"
        side="bottom"
        align="start"
        sideOffset={5}
        style={{ width: "var(--radix-select-trigger-width)" }}
      >
        <SelectGroup>
          <SelectLabel className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            Choose source account
          </SelectLabel>

          {accounts.map((account: Account) => (
            <SelectItem
              key={account.appwriteItemId}
              value={account.appwriteItemId}
              className="cursor-pointer rounded-lg py-3"
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-900">
                  {account.officialName || account.name}
                </span>
                <span className="text-xs text-gray-500">
                  {formatAmount(account.simulatedBalance ?? 0)}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
