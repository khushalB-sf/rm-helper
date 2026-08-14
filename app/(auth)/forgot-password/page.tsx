import { AuthCard } from "@/components/auth-card";
import ForgotPasswordForm from "./_components/ForgotPasswordForm";

const ForgotPasswordPage = () => {
  return (
    <AuthCard title="Forgot password" description="Enter your email and we'll send you a reset link.">
      <ForgotPasswordForm />
    </AuthCard>
  );
};

export default ForgotPasswordPage;
