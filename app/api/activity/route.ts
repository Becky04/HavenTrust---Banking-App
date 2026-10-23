import { NextResponse } from "next/server";
import { ACTIVITY_COOKIE, activityCookieOptions } from "@/lib/session-config";

export async function POST() {
  // If the session had expired, middleware already returned 401 before this runs.
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ACTIVITY_COOKIE, String(Date.now()), activityCookieOptions);
  return res;
}
