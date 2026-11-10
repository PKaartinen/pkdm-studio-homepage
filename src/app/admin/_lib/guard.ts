import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/adminAuth";

/** True when the current request carries a valid admin session cookie. */
export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return verifySessionToken(jar.get(ADMIN_COOKIE)?.value);
}

/**
 * Defence in depth for server actions: middleware already guards /admin, but
 * every action re-checks the session itself.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new AdminAuthError();
}

export class AdminAuthError extends Error {
  constructor() {
    super("Your admin session has expired. Reload the page and sign in again.");
    this.name = "AdminAuthError";
  }
}
