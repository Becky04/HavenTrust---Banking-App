const PAYSTACK_BASE_URL = "https://api.paystack.co";

const paystackRequest = async (endpoint: string, options: RequestInit = {}) => {
  const res = await fetch(`${PAYSTACK_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY!}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error?.message || "Paystack API error");
  }

  return res.json();
};

// Step 1 — create a transfer recipient
const createTransferRecipient = async ({
  name,
  accountNumber,
  bankCode,
}: {
  name: string;
  accountNumber: string;
  bankCode: string;
}) => {
  return paystackRequest("/transferrecipient", {
    method: "POST",
    body: JSON.stringify({
      type: "nuban",
      name,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: "NGN",
    }),
  });
};

// Step 2 — initiate the transfer
export const initiatePaystackTransfer = async ({
  amount,
  recipientCode,
  description,
}: {
  amount: number;
  recipientCode: string;
  description: string;
}) => {
  return paystackRequest("/transfer", {
    method: "POST",
    body: JSON.stringify({
      source: "balance",
      amount, // in kobo
      recipient: recipientCode,
      reason: description,
      reference: `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    }),
  });
};

// Main function — creates recipient then transfers
export const sendPaystackTransfer = async ({
  amount,
  name,
  accountNumber,
  bankCode,
  description,
}: {
  amount: number;
  name: string;
  accountNumber: string;
  bankCode: string;
  description: string;
}) => {
  const recipient = await createTransferRecipient({
    name,
    accountNumber,
    bankCode,
  });
  const recipientCode = recipient.data.recipient_code;
  return initiatePaystackTransfer({ amount, recipientCode, description });
};

export const resolveAccount = async (
  accountNumber: string,
  bankCode: string,
) => {
  return paystackRequest(
    `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
  );
};
