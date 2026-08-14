import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getCurrentUserRole } from "@/lib/rbac";
import { serverFetch } from "@/lib/api";
import { PageContainer, PageHeader } from "@/components/page-header";
import { PersonalTeamNav } from "@/app/_components/PersonalTeamNav";
import ProjectsManager, { type ProjectAssignment } from "../_components/ProjectsManager";

const ProjectsPage = async () => {
  const session = await getSession();
  if (!session?.userId) redirect("/login");

  const [res, current] = await Promise.all([serverFetch("/api/projects"), getCurrentUserRole()]);
  const assignments: ProjectAssignment[] = res.ok ? (await res.json()).assignments : [];

  return (
    <PageContainer className="max-w-6xl">
      <PageHeader title="Your projects" description="Add or update the projects you're on, your status, and any blockers." />
      <PersonalTeamNav basePath="/projects" showTeam={current?.role === "RM"} />
      <ProjectsManager initialAssignments={assignments} />
    </PageContainer>
  );
};

export default ProjectsPage;
