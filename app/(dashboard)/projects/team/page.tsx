import { requirePageRole } from "@/lib/rbac";
import { serverFetch } from "@/lib/api";
import { PageContainer, PageHeader } from "@/components/page-header";
import { PersonalTeamNav } from "@/app/_components/PersonalTeamNav";
import TeamProjectsManager, { type TeamAssignment } from "./_components/TeamProjectsManager";

interface Report {
  id: string;
  username: string;
}

const TeamProjectsPage = async () => {
  await requirePageRole("RM");

  const [reportsRes, assignmentsRes] = await Promise.all([
    serverFetch("/api/team"),
    serverFetch("/api/team/projects"),
  ]);
  const reports: Report[] = reportsRes.ok ? (await reportsRes.json()).reports : [];
  const assignments: TeamAssignment[] = assignmentsRes.ok ? (await assignmentsRes.json()).assignments : [];

  return (
    <PageContainer className="max-w-6xl">
      <PageHeader title="Team projects" description="Assign projects to your team and see current allocation." />
      <PersonalTeamNav basePath="/projects" showTeam />
      <TeamProjectsManager reports={reports} initialAssignments={assignments} />
    </PageContainer>
  );
};

export default TeamProjectsPage;
