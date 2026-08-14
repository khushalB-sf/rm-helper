"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthCard } from "@/components/auth-card";

const VerifyEmailStatus = () => {
  const token = useSearchParams().get("token");
  const [state, setState] = useState<{ message: string; success: boolean } | null>(
    token ? null : { message: "Missing verification token.", success: false },
  );

  useEffect(() => {
    if (!token) return;
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((res) => res.json().then((data) => ({ message: data.message, success: res.ok })))
      .then(setState);
  }, [token]);

  return (
    <AuthCard title="Email verification">
      {state ? (
        <Alert variant={state.success ? "default" : "destructive"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : (
        <p className="text-sm text-muted-foreground">Verifying...</p>
      )}
      <Link href="/login" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
        Go to login
      </Link>
    </AuthCard>
  );
};

export default VerifyEmailStatus;
