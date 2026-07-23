"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "./api";

/** Redirects to /login when no token is stored. Returns true once the token
 *  check has passed, so pages can defer fetching until then. */
export function useAuthGuard(): boolean {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (getToken()) {
      setReady(true);
    } else {
      router.replace("/login");
    }
  }, [router]);

  return ready;
}
