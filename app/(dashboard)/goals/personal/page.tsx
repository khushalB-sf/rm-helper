import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getCurrentUserRole } from "@/lib/rbac";
import { serverFetch } from "@/lib/api";
import { PageContainer, PageHeader } from "@/components/page-header";
import { PersonalTeamNav } from "@/app/_components/PersonalTeamNav";
import GoalsManager, { type Goal } from "../_components/GoalsManager";

const GoalsPage = async () => {
  const session = await getSession();
  if (!session?.userId) redirect("/login");

  const [goalsRes, projectsRes, current] = await Promise.all([
    serverFetch("/api/goals"),
    serverFetch("/api/projects"),
    getCurrentUserRole(),
  ]);
  const goals: Goal[] = goalsRes.ok ? (await goalsRes.json()).goals : [];
  const assignments: { endDate: string | null }[] = projectsRes.ok ? (await projectsRes.json()).assignments : [];
  const isUnassigned = !assignments.some((a) => !a.endDate);

  return (
    <PageContainer className="max-w-6xl">
      <PageHeader title="Your goals" description="Departmental goals, bench work, and progress toward each." />
      <PersonalTeamNav basePath="/goals" showTeam={current?.role === "RM"} />
      <GoalsManager initialGoals={goals} isUnassigned={isUnassigned} />
    </PageContainer>
  );
};

export default GoalsPage;
