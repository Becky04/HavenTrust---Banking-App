import { NextRequest, NextResponse } from "next/server";
import {
  ACTIVITY_COOKIE,
  INACTIVITY_LIMIT_MS,
  SESSION_COOKIE,
} from "@/lib/session-config";

const AUTH_PAGES = ["/sign-in", "/sign-up"];

export async function middleware(req: NextRequest) {
  const session = req.cookies.get(SESSION_COOKIE)?.value;
  if (!session) return NextResponse.next();

  const last = Number(req.cookies.get(ACTIVITY_COOKIE)?.value ?? 0);
  const expired = !last || Date.now() - last > INACTIVITY_LIMIT_MS;
  if (!expired) return NextResponse.next();

  // Also end the session on Appwrite, not just in the browser
  try {
    await fetch(
      `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/account/sessions/current`,
      {
        method: "DELETE",
        headers: {
          "X-Appwrite-Project": process.env.NEXT_PUBLIC_APPWRITE_PROJECT!,
          "X-Appwrite-Session": session,
        },
      },
    );
  } catch {
    // Don't block logout if Appwrite is unreachable
  }

  const { pathname } = req.nextUrl;

  let res: NextResponse;
  if (AUTH_PAGES.includes(pathname)) {
    res = NextResponse.next(); // already on an auth page, just clear stale cookies
  } else if (pathname.startsWith("/api/")) {
    res = NextResponse.json({ error: "Session expired" }, { status: 401 });
  } else {
    res = NextResponse.redirect(new URL("/sign-in", req.url));
  }

  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(ACTIVITY_COOKIE);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|images).*)"],
};
