import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthCard } from "@/components/auth-card";
import ResetPasswordForm from "./_components/ResetPasswordForm";

const ResetPasswordPage = async (props: PageProps<"/reset-password">) => {
  const { token } = await props.searchParams;

  if (!token || typeof token !== "string") {
    return (
      <AuthCard title="Reset password">
        <Alert variant="destructive">
          <AlertDescription>Missing or invalid reset link.</AlertDescription>
        </Alert>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Reset password" description="Enter your new password below.">
      <ResetPasswordForm token={token} />
    </AuthCard>
  );
};

export default ResetPasswordPage;
