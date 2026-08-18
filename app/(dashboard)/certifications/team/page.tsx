import { requirePageRole } from "@/lib/rbac";
import { serverFetch } from "@/lib/api";
import { PageContainer, PageHeader } from "@/components/page-header";
import { PersonalTeamNav } from "@/app/_components/PersonalTeamNav";
import TeamCertificationsManager, {
  type TeamCertification,
  type CertificationCatalogEntry,
} from "./_components/TeamCertificationsManager";

interface Report {
  id: string;
  username: string;
}

const TeamCertificationsPage = async () => {
  await requirePageRole("RM");

  const [reportsRes, certificationsRes, catalogRes] = await Promise.all([
    serverFetch("/api/team"),
    serverFetch("/api/team/certifications"),
    serverFetch("/api/team/certifications/catalog"),
  ]);
  const reports: Report[] = reportsRes.ok ? (await reportsRes.json()).reports : [];
  const certifications: TeamCertification[] = certificationsRes.ok ? (await certificationsRes.json()).certifications : [];
  const catalog: CertificationCatalogEntry[] = catalogRes.ok ? (await catalogRes.json()).catalog : [];

  return (
    <PageContainer className="max-w-6xl">
      <PageHeader title="Team certifications" description="Assign certifications to your team and track outcomes." />
      <PersonalTeamNav basePath="/certifications" showTeam />
      <TeamCertificationsManager reports={reports} initialCertifications={certifications} initialCatalog={catalog} />
    </PageContainer>
  );
};

export default TeamCertificationsPage;
