import { requirePageRole } from "@/lib/rbac";
import { serverFetch } from "@/lib/api";
import { PageContainer, PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { PersonalTeamNav } from "@/app/_components/PersonalTeamNav";

interface Report {
  id: string;
  username: string;
}

interface TeamSession {
  presenterId: string | null;
  conductedDate: string | null;
  title: string;
}

interface TeamAttendance {
  title: string;
  attendedDate: string;
  user: { id: string };
}

function ListCell({ items }: { items: React.ReactNode[] }) {
  if (items.length === 0) return <span className="text-muted-foreground">—</span>;
  return <div className="flex flex-col gap-1">{items}</div>;
}

const SessionsTeamPage = async () => {
  await requirePageRole("RM");

  const [reportsRes, teamSessionsRes, teamAttendanceRes] = await Promise.all([
    serverFetch("/api/team"),
    serverFetch("/api/team/sessions"),
    serverFetch("/api/team/sessions/attendance"),
  ]);
  const reports: Report[] = reportsRes.ok ? (await reportsRes.json()).reports : [];
  const teamSessions: TeamSession[] = teamSessionsRes.ok ? (await teamSessionsRes.json()).sessions : [];
  const teamAttendance: TeamAttendance[] = teamAttendanceRes.ok ? (await teamAttendanceRes.json()).attendance : [];

  const rows = reports.map((report) => {
    const deliveredItems = teamSessions
      .filter((s) => s.presenterId === report.id && s.conductedDate)
      .map((s, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span>{s.title}</span>
          <Badge variant="secondary" className="text-[10px]">
            {new Date(s.conductedDate!).toLocaleDateString()}
          </Badge>
        </span>
      ));

    const attendedItems = teamAttendance
      .filter((a) => a.user.id === report.id)
      .map((a, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span>{a.title}</span>
          <Badge variant="secondary" className="text-[10px]">
            {new Date(a.attendedDate).toLocaleDateString()}
          </Badge>
        </span>
      ));

    return { report, deliveredItems, attendedItems };
  });

  return (
    <PageContainer className="max-w-6xl">
      <PageHeader title="Sessions" description="Sessions delivered and attended, by team member." />
      <PersonalTeamNav basePath="/sessions" showTeam />

      {reports.length === 0 ? (
        <p className="text-sm text-muted-foreground">Add team members first.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-xs">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-1 font-medium">Team member</th>
                <th className="p-1 font-medium">Delivered</th>
                <th className="p-1 font-medium">Attended</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ report, deliveredItems, attendedItems }) => (
                <tr key={report.id} className="border-b align-top last:border-b-0">
                  <td className="p-1 font-medium">{report.username}</td>
                  <td className="p-1">
                    <ListCell items={deliveredItems} />
                  </td>
                  <td className="p-1">
                    <ListCell items={attendedItems} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
};

export default SessionsTeamPage;
