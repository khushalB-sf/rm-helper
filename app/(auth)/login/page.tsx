import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthCard } from "@/components/auth-card";
import SignInForm from "./_components/SignInForm";

const LoginPage = async (props: PageProps<"/login">) => {
  const { registered, reset } = await props.searchParams;

  return (
    <AuthCard title="Log in" description="Welcome back — enter your details to continue.">
      {(registered || reset) && (
        <Alert>
          <AlertDescription>
            {registered
              ? "Account created. Check the server console for your verification link."
              : "Password updated. Log in with your new password."}
          </AlertDescription>
        </Alert>
      )}
      <SignInForm />
    </AuthCard>
  );
};

export default LoginPage;
