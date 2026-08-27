import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { code } = await req.json();

  const response = await fetch("https://api.withmono.com/v2/accounts/auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MONO_SECRET_KEY}`,
    },
    body: JSON.stringify({
      code,
    }),
  });

  const data = await response.json();

  return NextResponse.json(data);
}
