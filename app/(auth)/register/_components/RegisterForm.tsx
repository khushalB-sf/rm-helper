"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormField } from "@/components/form-field";

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
}

const RegisterForm = () => {
  const router = useRouter();
  const [errors, setErrors] = useState<FormErrors>({});
  const [message, setMessage] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setErrors({});
    setMessage(undefined);

    const formData = new FormData(event.currentTarget);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: formData.get("username"),
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setErrors(data.errors ?? {});
      setMessage(data.message);
      setPending(false);
      return;
    }

    router.push(data.redirectTo);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField id="username" label="Username" error={errors.username}>
        <Input id="username" name="username" required />
      </FormField>

      <FormField id="email" label="Email" error={errors.email}>
        <Input id="email" name="email" type="email" required />
      </FormField>

      <FormField id="password" label="Password" error={errors.password}>
        <Input id="password" name="password" type="password" required />
      </FormField>

      {message && (
        <Alert variant="destructive">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Button disabled={pending} type="submit" className="w-full">
        {pending ? "Creating account..." : "Sign Up"}
      </Button>

      <Link href="/login" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
        Already have an account? Log in
      </Link>
    </form>
  );
};

export default RegisterForm;
