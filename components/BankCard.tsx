import { formatAmount } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import Copy from "./Copy";

const BankCard = ({
  account,
  userName,
  showBalance = true,
}: CreditCardProps) => {
  return (
    <div className="flex flex-col">
      <Link href="/" className="bank-card">
        <div className="bank-card_content">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-12 font-semibold tracking-wider text-white/70">
                HAVENTRUST
              </p>

              <span className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white">
                <span className="size-1.5 rounded-full bg-green-400" />
                Active
              </span>
            </div>

            <h1 className="mt-1 text-16 font-semibold text-white">
              {account.officialName}
            </h1>

            {showBalance && (
              <p className="mt-2 font-ibm-plex-serif text-xl font-black text-white">
                {formatAmount(account.simulatedBalance ?? 0)}
              </p>
            )}
          </div>
          <article className="flex flex-col gap-2">
            <div className="flex justify-between">
              <h1 className="text-12 font-semibold text-white">{userName}</h1>
              <h2 className="text-12 font-semibold text-white">●● / ●●</h2>
            </div>
            <p className="text-14 font-semibold tracking-[1.1px] text-white">
              ●●●● ●●●● ●●●●{" "}
              <span className="text-16">
                {account.simulatedAccountNumber.slice(-4)}
              </span>
            </p>
          </article>
        </div>

        <div className="bank-card_icon">
          <Image src="/icons/Paypass.svg" width={20} height={24} alt="pay" />
          <Image
            src="/icons/mastercard.svg"
            width={45}
            height={32}
            alt="mastercard"
            className="ml-5"
          />
        </div>
        <Image
          src="/icons/lines.png"
          width={316}
          height={190}
          alt="lines"
          className="absolute top-0 left-0"
        />
      </Link>

      {showBalance &&
        account?.shareableId &&
        account?.simulatedAccountNumber && (
          <>
            <div className="mt-2 flex items-center gap-1 min-w-0">
              <p className="shrink-0 text-xs font-medium leading-none text-gray-600 pl-2">
                Shareable ID:
              </p>
              <div className="min-w-0 self-center">
                <Copy title={account.shareableId} />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 min-w-0">
              <p className="shrink-0 text-xs font-medium leading-none text-gray-600 pl-2">
                Account No:
              </p>
              <div className="min-w-0 self-center">
                <Copy title={account.simulatedAccountNumber} />
              </div>
            </div>
          </>
        )}
    </div>
  );
};

export default BankCard;
