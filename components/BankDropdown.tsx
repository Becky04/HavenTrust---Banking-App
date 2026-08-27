"use client";

import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
    if (accounts[0] && setValue) {
      setValue("senderBank", accounts[0].appwriteItemId);
    }
  }, [accounts, setValue]);

  const handleBankChange = (id: string) => {
    const account = accounts.find((acc) => acc.appwriteItemId === id);
    if (!account) return;
    setSelected(account);
    const newUrl = formUrlQuery({
      params: searchParams.toString(),
      key: "id",
      value: id,
    });
    router.push(newUrl, { scroll: false });

    if (setValue) {
      setValue("senderBank", id, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  if (!selected) {
    return (
      <Select disabled>
        <SelectTrigger className={`flex w-full bg-white gap-3 ${otherStyles}`}>
          <p className="text-gray-400">Select a bank account</p>
        </SelectTrigger>
      </Select>
    );
  }
  return (
    <Select
      value={selected.appwriteItemId || ""}
      onValueChange={(value) => handleBankChange(value)}
    >
      <SelectTrigger className={`flex w-full bg-white gap-3 ${otherStyles}`}>
        <Image
          src="icons/credit-card.svg"
          width={20}
          height={20}
          alt="account"
        />
        <p className="line-clamp-1 w-full text-left">
          {selected?.officialName || selected?.name}
        </p>
      </SelectTrigger>
      <SelectContent
        className={`w-full bg-white ${otherStyles}`}
        position="popper"
        side="bottom"
        align="start"
        sideOffset={5}
        style={{ width: "var(--radix-select-trigger-width)" }} // ← add this
      >
        <SelectGroup>
          <SelectLabel className="py-2 font-normal text-gray-500">
            Select a bank to display
          </SelectLabel>
          {accounts.map((account: Account) => (
            <SelectItem
              key={account.appwriteItemId}
              value={account.appwriteItemId}
              className="cursor-pointer border-t"
            >
              <div className="flex flex-row items-center gap-2">
                <p className="text-16 font-medium">{account.officialName}</p>
                <p className="text-14 font-medium text-blue-600">
                  {formatAmount(account.currentBalance)}
                </p>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
