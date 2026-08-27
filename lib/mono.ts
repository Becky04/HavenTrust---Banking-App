// lib/mono.ts

const MONO_BASE_URL = "https://api.withmono.com/v2";

export const monoRequest = async (
  endpoint: string,
  options: RequestInit = {},
) => {
  const res = await fetch(`${MONO_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "mono-sec-key": process.env.MONO_SECRET_KEY!,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error?.message || "Mono API error");
  }

  return res.json();
};

// DirectPay transfer — call this when user wants to send money
export const initiateMonoTransfer = async ({
  accountId,
  amount,
  description,
  customer,
}: {
  accountId: string;
  amount: number;
  description: string;
  customer: { name: string; email: string };
}) => {
  return monoRequest("/payments/initiate", {
    method: "POST",
    body: JSON.stringify({
      account: accountId,
      amount,
      type: "onetime-debit",
      description,
      reference: `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      customer, // ✅ add this
    }),
  });
};

export const getMonoAccountDetails = async (accountId: string) => {
  const response = await monoRequest(`/accounts/${accountId}`);
  return response.data.account; // has account_number, institution.bank_code, name
};
