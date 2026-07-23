"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LockKeyhole } from "lucide-react";
import { api, ApiError, getToken, setToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (getToken()) router.replace("/");
  }, [router]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.login(password);
      setToken(res.token);
      router.replace("/");
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setError("Wrong password.");
      } else if (err instanceof ApiError && err.status === 503) {
        setError("Dashboard auth is not configured on the backend.");
      } else {
        setError(err instanceof ApiError ? err.message : "Unexpected error.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <form
        onSubmit={submit}
        className="card-in flex w-full max-w-sm flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-raised"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <LockKeyhole className="size-4" />
          </span>
          <div>
            <h1 className="font-semibold">Curation Dashboard</h1>
            <p className="text-xs text-muted-foreground">
              Enter the dashboard password to continue.
            </p>
          </div>
        </div>
        <Input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          aria-label="Password"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button variant="primary" type="submit" disabled={!password || busy}>
          {busy && <Loader2 className="animate-spin" />}
          Sign in
        </Button>
      </form>
    </div>
  );
}
