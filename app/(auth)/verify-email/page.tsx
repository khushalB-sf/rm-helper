import { Suspense } from "react";
import VerifyEmailStatus from "./_components/VerifyEmailStatus";

const VerifyEmailPage = () => (
  <Suspense>
    <VerifyEmailStatus />
  </Suspense>
);

export default VerifyEmailPage;
