import { requirePageRole } from "@/lib/rbac";
import { serverFetch } from "@/lib/api";
import { PageContainer, PageHeader } from "@/components/page-header";
import type { SkillEntry } from "@/components/skill-rows-editor";
import { TeamNav } from "./_components/TeamNav";
import TeamRoster, { type TeamMember } from "./_components/TeamRoster";

const TeamPage = async () => {
  await requirePageRole("RM");

  const res = await serverFetch("/api/team");
  const reports: TeamMember[] = res.ok ? (await res.json()).reports : [];

  const skillsByMember: Record<string, SkillEntry[]> = {};
  await Promise.all(
    reports.map(async (report) => {
      const skillsRes = await serverFetch(`/api/team/${report.id}/skills`);
      skillsByMember[report.id] = skillsRes.ok ? (await skillsRes.json()).skills : [];
    })
  );

  return (
    <PageContainer className="max-w-6xl">
      <PageHeader title="Your team" description="Add team members and see who reports to you." />
      <TeamNav />
      <TeamRoster initialReports={reports} initialSkillsByMember={skillsByMember} />
    </PageContainer>
  );
};

export default TeamPage;
