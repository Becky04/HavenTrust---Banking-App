"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Send,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { transferFunds } from "@/lib/actions/transaction.actions";
import { cn } from "@/lib/utils";
import { BankDropdown } from "./BankDropdown";
import TransferField, { transferLabelClass } from "./TransferField";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

const REQUEST_ID_STORAGE_KEY = "haventrust_pending_transfer_request_id";

const formSchema = z
  .object({
    transferType: z.enum(["internal", "external"]),
    recipientMethod: z.enum(["accountNumber", "shareableId"]),
    email: z.string(),
    name: z.string().max(140, "Transfer note is too long"),
    amount: z
      .string()
      .trim()
      .regex(
        /^\d+(\.\d{1,2})?$/,
        "Enter a valid amount with up to two decimal places",
      )
      .refine((value) => Number(value) > 0, "Amount must be greater than zero"),
    senderBank: z.string().min(1, "Please select a source account"),
    simulatedAccountNumber: z.string(),
    sharableId: z.string(),
    recipientBankName: z.string(),
    recipientAccountNumber: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.transferType === "internal") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["email"],
          message: "Enter a valid recipient email address",
        });
      }

      if (
        data.recipientMethod === "accountNumber" &&
        !/^\d{10}$/.test(data.simulatedAccountNumber.trim())
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["simulatedAccountNumber"],
          message: "Enter a valid 10-digit HavenTrust account number",
        });
      }

      if (
        data.recipientMethod === "shareableId" &&
        data.sharableId.trim().length < 8
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sharableId"],
          message: "Enter a valid shareable ID",
        });
      }
    }

    if (data.transferType === "external") {
      if (!data.recipientBankName.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["recipientBankName"],
          message: "Enter the recipient's bank name",
        });
      }

      if (!/^\d{10}$/.test(data.recipientAccountNumber.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["recipientAccountNumber"],
          message: "Enter a valid 10-digit account number",
        });
      }
    }
  });

type FormValues = z.infer<typeof formSchema>;

type TransferResult = {
  type: "success" | "error" | "uncertain";
  title: string;
  message: string;
};

const resultStyles = {
  success: {
    icon: CheckCircle2,
    circle: "bg-green-50 ring-8 ring-green-50/60",
    iconColor: "text-green-600",
    button: "bg-blue-600 hover:bg-blue-700",
  },
  error: {
    icon: AlertCircle,
    circle: "bg-red-50 ring-8 ring-red-50/60",
    iconColor: "text-red-500",
    button: "bg-red-600 hover:bg-red-700",
  },
  uncertain: {
    icon: AlertTriangle,
    circle: "bg-amber-50 ring-8 ring-amber-50/60",
    iconColor: "text-amber-500",
    button: "bg-amber-500 hover:bg-amber-600",
  },
} as const;

const transferTypeOptions = [
  { value: "internal", label: "HavenTrust account" },
  { value: "external", label: "Other Nigerian bank" },
];

const recipientMethodOptions = [
  { value: "accountNumber", label: "Account number" },
  { value: "shareableId", label: "Shareable ID" },
];

const PaymentTransferForm = ({ accounts }: PaymentTransferFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [transferResult, setTransferResult] = useState<TransferResult | null>(
    null,
  );
  const [requestId, setRequestId] = useState("");
  const [requestIdReady, setRequestIdReady] = useState(false);

  // Restore the pending request ID after mounting in the browser.
  useEffect(() => {
    try {
      const savedRequestId = sessionStorage.getItem(REQUEST_ID_STORAGE_KEY);

      const id = savedRequestId || crypto.randomUUID();

      sessionStorage.setItem(REQUEST_ID_STORAGE_KEY, id);

      setRequestId(id);
    } catch (error) {
      console.error("Unable to restore transfer request ID:", error);

      setRequestId(crypto.randomUUID());
    } finally {
      setRequestIdReady(true);
    }
  }, []);

  // Persist the ID so a refresh doesn't automatically create
  // a new request for a transfer whose outcome is unknown.
  useEffect(() => {
    if (!requestIdReady || !requestId) return;

    try {
      sessionStorage.setItem(REQUEST_ID_STORAGE_KEY, requestId);
    } catch (error) {
      console.error("Unable to save transfer request ID:", error);
    }
  }, [requestId, requestIdReady]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transferType: "internal",
      recipientMethod: "accountNumber",
      name: "",
      email: "",
      amount: "",
      senderBank: accounts[0]?.appwriteItemId ?? "",
      sharableId: "",
      simulatedAccountNumber: "",
      recipientBankName: "",
      recipientAccountNumber: "",
    },
  });

  const transferType = form.watch("transferType");
  const recipientMethod = form.watch("recipientMethod");
  const senderBankError = form.formState.errors.senderBank?.message;

  const submit = async (data: FormValues) => {
    if (isLoading || !requestIdReady || !requestId) {
      return;
    }

    setIsLoading(true);
    setTransferResult(null);
    form.clearErrors("root");

    try {
      const result = await transferFunds({
        requestId,
        senderBankId: data.senderBank,
        transferType: data.transferType,
        recipientMethod: data.recipientMethod,

        simulatedAccountNumber:
          data.transferType === "internal" &&
          data.recipientMethod === "accountNumber"
            ? data.simulatedAccountNumber.trim()
            : undefined,

        sharableId:
          data.transferType === "internal" &&
          data.recipientMethod === "shareableId"
            ? data.sharableId.trim()
            : undefined,

        email: data.transferType === "internal" ? data.email.trim() : undefined,

        recipientBankName:
          data.transferType === "external"
            ? data.recipientBankName.trim()
            : undefined,

        recipientAccountNumber:
          data.transferType === "external"
            ? data.recipientAccountNumber.trim()
            : undefined,

        amount: data.amount,
        description: data.name.trim(),
      });

      if (result?.status) {
        // Reset only after the server confirms success.
        form.reset({
          transferType: data.transferType,
          recipientMethod: data.recipientMethod,
          name: "",
          email: "",
          amount: "",
          senderBank: data.senderBank,
          sharableId: "",
          simulatedAccountNumber: "",
          recipientBankName: "",
          recipientAccountNumber: "",
        });

        setTransferResult({
          type: "success",
          title: "Transfer Successful",
          message:
            result.message || "Your transfer was completed successfully.",
        });

        // Prepare a new request ID for the next transfer.
        setRequestId(crypto.randomUUID());
      } else {
        // Keep the request ID for a safe retry.
        setTransferResult({
          type: "error",
          title: "Transfer Unsuccessful",
          message: result?.message || "We couldn't complete your transfer.",
        });
      }
    } catch (error) {
      console.error("Transfer request failed:", error);

      // A failed response does not necessarily mean the
      // server failed to complete the transfer.
      setTransferResult({
        type: "uncertain",
        title: "Transfer Status Unconfirmed",
        message:
          "We couldn't confirm your transfer status because of a connection or server error. Please check your transaction history and account balance before trying again. If the transfer is not confirmed, retry using the same request.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const styles = transferResult ? resultStyles[transferResult.type] : null;
  const ResultIcon = styles?.icon;

  return (
    <>
      <form
        onSubmit={form.handleSubmit(submit)}
        noValidate
        className="flex w-full max-w-2xl flex-col gap-5"
      >
        {/* Card 1: accounts and recipient */}
        <div className="grid gap-x-5 gap-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-6">
          <h3 className="text-base font-semibold text-gray-900 sm:col-span-2">
            Transfer details
          </h3>

          {/* Source account */}
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label className={transferLabelClass}>Source account</label>

            <BankDropdown
              accounts={accounts}
              setValue={form.setValue}
              otherStyles="!w-full"
            />

            {senderBankError && (
              <p className="text-xs text-red-500">{senderBankError}</p>
            )}
          </div>

          <TransferField
            control={form.control}
            name="transferType"
            label="Transfer type"
            variant="select"
            options={transferTypeOptions}
            className={transferLabelClass}
          />

          {/* Internal recipient */}
          {transferType === "internal" && (
            <>
              <TransferField
                control={form.control}
                name="recipientMethod"
                label="Identify recipient by"
                variant="select"
                options={recipientMethodOptions}
                className={transferLabelClass}
              />

              {recipientMethod === "accountNumber" ? (
                <TransferField
                  control={form.control}
                  name="simulatedAccountNumber"
                  label="Recipient account number"
                  placeholder="10-digit account number"
                  inputMode="numeric"
                  maxLength={10}
                />
              ) : (
                <TransferField
                  control={form.control}
                  name="sharableId"
                  label="Recipient shareable ID"
                  placeholder="Enter shareable ID"
                />
              )}

              <TransferField
                control={form.control}
                name="email"
                label="Recipient email"
                type="email"
                placeholder="recipient@example.com"
                description="Used to verify the recipient's HavenTrust account."
                className={transferLabelClass}
              />
            </>
          )}

          {/* External recipient */}
          {transferType === "external" && (
            <>
              <TransferField
                control={form.control}
                name="recipientBankName"
                label="Recipient bank"
                placeholder="e.g. Access Bank"
                className={transferLabelClass}
              />

              <TransferField
                control={form.control}
                name="recipientAccountNumber"
                label="Recipient account number"
                placeholder="10-digit account number"
                inputMode="numeric"
                maxLength={10}
                className={transferLabelClass}
              />
            </>
          )}
        </div>

        {/* Card 2: amount and note */}
        <div className="grid gap-x-5 gap-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-6">
          <h3 className="text-base font-semibold text-gray-900 sm:col-span-2">
            Amount &amp; note
          </h3>

          {/* Amount */}
          <TransferField
            control={form.control}
            name="amount"
            label="Amount (NGN)"
            prefix="₦"
            placeholder="5,000.00"
            inputMode="decimal"
            className="sm:col-span-2 text-sm font-medium text-gray-800"
          />

          {/* Note */}
          <TransferField
            control={form.control}
            name="name"
            label="Transfer note"
            variant="textarea"
            placeholder="Write a short note"
            optional
            rows={2}
            className="sm:col-span-2 text-sm font-medium text-gray-800"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading || !requestIdReady}
          className="h-12 w-full rounded-xl bg-blue-600 text-[15px] font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="mr-2 animate-spin" />
              Sending...
            </>
          ) : !requestIdReady ? (
            "Preparing..."
          ) : (
            <>
              <Send size={18} className="mr-2" />
              Transfer Funds
            </>
          )}
        </Button>
      </form>

      {/* Transfer result dialog */}
      <Dialog
        open={transferResult !== null}
        onOpenChange={(open) => {
          if (!open) {
            setTransferResult(null);
          }
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-md gap-6 rounded-3xl border-0 !bg-white p-8 shadow-2xl">
          <DialogHeader className="items-center space-y-4 text-center sm:text-center">
            {styles && ResultIcon && (
              <div
                className={cn(
                  "flex size-20 items-center justify-center rounded-full",
                  styles.circle,
                )}
              >
                <ResultIcon
                  className={cn("size-10", styles.iconColor)}
                  aria-hidden="true"
                />
              </div>
            )}

            <DialogTitle className="text-xl font-semibold text-gray-900">
              {transferResult?.title}
            </DialogTitle>

            <DialogDescription className="text-center text-sm leading-6 text-gray-600">
              {transferResult?.message}
            </DialogDescription>
          </DialogHeader>

          <Button
            type="button"
            className={cn(
              "h-12 w-full rounded-xl text-[15px] font-semibold text-white shadow-sm",
              styles?.button,
            )}
            onClick={() => setTransferResult(null)}
          >
            {transferResult?.type === "success" ? "Done" : "Close"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PaymentTransferForm;
