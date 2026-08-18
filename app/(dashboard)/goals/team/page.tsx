import { requirePageRole } from "@/lib/rbac";
import { serverFetch } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { PageContainer, PageHeader } from "@/components/page-header";
import { PersonalTeamNav } from "@/app/_components/PersonalTeamNav";
import TeamGoalsManager, { type TeamGoal, type GoalCatalogEntry } from "./_components/TeamGoalsManager";
import type { TeamAssignment } from "@/app/(dashboard)/projects/team/_components/TeamProjectsManager";

interface Report {
  id: string;
  username: string;
}

const TeamGoalsPage = async () => {
  const current = await requirePageRole("RM");

  const [reportsRes, goalsRes, assignmentsRes, catalogRes, manager] = await Promise.all([
    serverFetch("/api/team"),
    serverFetch("/api/team/goals"),
    serverFetch("/api/team/projects"),
    serverFetch("/api/team/goals/catalog"),
    prisma.user.findUnique({ where: { id: current.userId }, select: { username: true } }),
  ]);
  const reports: Report[] = reportsRes.ok ? (await reportsRes.json()).reports : [];
  const goals: TeamGoal[] = goalsRes.ok ? (await goalsRes.json()).goals : [];
  const assignments: TeamAssignment[] = assignmentsRes.ok ? (await assignmentsRes.json()).assignments : [];
  const catalog: GoalCatalogEntry[] = catalogRes.ok ? (await catalogRes.json()).catalog : [];

  return (
    <PageContainer className="max-w-6xl">
      <PageHeader title="Team goals" description="Assign departmental goals and track progress across your team." />
      <PersonalTeamNav basePath="/goals" showTeam />
      <TeamGoalsManager
        reports={reports}
        initialGoals={goals}
        assignments={assignments}
        initialCatalog={catalog}
        teamName={manager?.username ?? "Team"}
      />
    </PageContainer>
  );
};

export default TeamGoalsPage;
