import "server-only";
import { cookies } from "next/headers";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

/** Calls one of this app's own API routes from a Server Component, forwarding the session cookie. */
export async function serverFetch(path: string, init?: RequestInit) {
  const cookieHeader = (await cookies()).toString();
  return fetch(`${APP_URL}${path}`, {
    ...init,
    headers: { ...init?.headers, Cookie: cookieHeader },
    cache: "no-store",
  });
}
