"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Provider global untuk aplikasi.
 * Membungkus aplikasi dengan `SessionProvider` sehingga hook session
 * dari `next-auth` dapat digunakan di sisi client.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
