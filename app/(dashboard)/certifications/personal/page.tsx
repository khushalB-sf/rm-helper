import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getCurrentUserRole } from "@/lib/rbac";
import { serverFetch } from "@/lib/api";
import { PageContainer, PageHeader } from "@/components/page-header";
import { PersonalTeamNav } from "@/app/_components/PersonalTeamNav";
import CertificationsManager, { type Certification } from "../_components/CertificationsManager";

const CertificationsPage = async () => {
  const session = await getSession();
  if (!session?.userId) redirect("/login");

  const [res, current] = await Promise.all([serverFetch("/api/certifications"), getCurrentUserRole()]);
  const certifications: Certification[] = res.ok ? (await res.json()).certifications : [];

  return (
    <PageContainer className="max-w-6xl">
      <PageHeader title="Certifications" description="Certifications your manager has assigned — record when you attempted one and the result." />
      <PersonalTeamNav basePath="/certifications" showTeam={current?.role === "RM"} />
      <CertificationsManager initialCertifications={certifications} />
    </PageContainer>
  );
};

export default CertificationsPage;
