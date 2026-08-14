import { AuthCard } from "@/components/auth-card";
import RegisterForm from "./_components/RegisterForm";

const RegistrationPage = () => {
  return (
    <AuthCard title="Create account" description="Enter your details to get started.">
      <RegisterForm />
    </AuthCard>
  );
};

export default RegistrationPage;
