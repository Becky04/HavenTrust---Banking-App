export const INACTIVITY_LIMIT_MS = 3 * 60 * 1000;
export const SESSION_COOKIE = "appwrite-session";
export const ACTIVITY_COOKIE = "last-activity";

export const activityCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};
