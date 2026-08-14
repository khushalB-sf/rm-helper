"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormField } from "@/components/form-field";

const SignInForm = () => {
  const router = useRouter();
  const [message, setMessage] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(undefined);

    const formData = new FormData(event.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: formData.get("username"), password: formData.get("password") }),
    });
    const data = await res.json();

    if (!res.ok) {
      setMessage(data.message);
      setPending(false);
      return;
    }

    router.push(data.redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField id="username" label="Username">
        <Input id="username" name="username" required autoComplete="username" />
      </FormField>

      <FormField id="password" label="Password">
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </FormField>

      {message && (
        <Alert variant="destructive">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Button disabled={pending} type="submit" className="w-full">
        {pending ? "Logging in..." : "Log In"}
      </Button>

      <div className="flex justify-between text-sm">
        <Link href="/register" className="text-muted-foreground underline underline-offset-4 hover:text-foreground">
          Create an account
        </Link>
        <Link href="/forgot-password" className="text-muted-foreground underline underline-offset-4 hover:text-foreground">
          Forgot password?
        </Link>
      </div>
    </form>
  );
};

export default SignInForm;
