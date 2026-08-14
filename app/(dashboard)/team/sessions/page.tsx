import { requirePageRole } from "@/lib/rbac";
import { serverFetch } from "@/lib/api";
import { PageContainer, PageHeader } from "@/components/page-header";
import { TeamNav } from "../_components/TeamNav";
import TeamSessionsManager, { type TeamInternalSession, type TeamAttendanceEntry } from "./_components/TeamSessionsManager";

interface Report {
  id: string;
  username: string;
}

const TeamSessionsPage = async () => {
  await requirePageRole("RM");

  const [reportsRes, sessionsRes, attendanceRes] = await Promise.all([
    serverFetch("/api/team"),
    serverFetch("/api/team/sessions"),
    serverFetch("/api/team/sessions/attendance"),
  ]);
  const reports: Report[] = reportsRes.ok ? (await reportsRes.json()).reports : [];
  const sessions: TeamInternalSession[] = sessionsRes.ok ? (await sessionsRes.json()).sessions : [];
  const attendance: TeamAttendanceEntry[] = attendanceRes.ok ? (await attendanceRes.json()).attendance : [];

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader title="Team sessions" description="Create and assign internal sessions for your team, and see organisational attendance." />
      <TeamNav />
      <TeamSessionsManager reports={reports} initialSessions={sessions} attendance={attendance} />
    </PageContainer>
  );
};

export default TeamSessionsPage;
