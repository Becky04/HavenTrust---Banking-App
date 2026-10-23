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
