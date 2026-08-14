import { requirePageRole } from "@/lib/rbac";
import { serverFetch } from "@/lib/api";
import { PageContainer, PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Pill, pctTone, dayFraction } from "@/components/team-pill";
import { TeamNav } from "../_components/TeamNav";

interface Report {
  id: string;
  username: string;
}

interface ProjectAssignment {
  hoursPerDay: number;
  endDate: string | null;
  project: { name: string };
  user: { id: string };
}

interface Goal {
  title: string;
  progressPct: number;
  owner: { id: string };
}

interface Certification {
  name: string;
  status: "APPLIED" | "PASSED" | "FAILED";
  user: { id: string };
}

interface InternalSession {
  title: string;
  presenterId: string | null;
  conductedDate: string | null;
}

interface Attendance {
  title: string;
  user: { id: string };
}

interface RawTest {
  skill: string;
  score: number | null;
  questionCount: number;
  completedAt: string | null;
  user: { id: string };
}

const CERT_TONE: Record<Certification["status"], string> = {
  PASSED: "#0ca30c",
  FAILED: "#d03b3b",
  APPLIED: "#6b7280",
};

const CERT_STATUS_LABEL: Record<Certification["status"], string> = {
  APPLIED: "Applied",
  PASSED: "Passed",
  FAILED: "Failed",
};

function ListCell({ items }: { items: React.ReactNode[] }) {
  if (items.length === 0) return <span className="text-muted-foreground">—</span>;
  return <div className="flex flex-col gap-1">{items}</div>;
}

const TeamOverviewPage = async () => {
  await requirePageRole("RM");

  const [reportsRes, projectsRes, goalsRes, certificationsRes, sessionsRes, attendanceRes, testsRes] = await Promise.all([
    serverFetch("/api/team"),
    serverFetch("/api/team/projects"),
    serverFetch("/api/team/goals"),
    serverFetch("/api/team/certifications"),
    serverFetch("/api/team/sessions"),
    serverFetch("/api/team/sessions/attendance"),
    serverFetch("/api/team/tests"),
  ]);

  const reports: Report[] = reportsRes.ok ? (await reportsRes.json()).reports : [];
  const assignments: ProjectAssignment[] = projectsRes.ok ? (await projectsRes.json()).assignments : [];
  const goals: Goal[] = goalsRes.ok ? (await goalsRes.json()).goals : [];
  const certifications: Certification[] = certificationsRes.ok ? (await certificationsRes.json()).certifications : [];
  const sessions: InternalSession[] = sessionsRes.ok ? (await sessionsRes.json()).sessions : [];
  const attendance: Attendance[] = attendanceRes.ok ? (await attendanceRes.json()).attendance : [];
  const rawTests: RawTest[] = testsRes.ok ? (await testsRes.json()).tests : [];

  const unassigned = reports.filter((report) => !assignments.some((a) => a.user.id === report.id && !a.endDate));

  const rows = reports.map((report) => {
    const projectItems = assignments
      .filter((a) => a.user.id === report.id)
      .map((a, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span>{a.project.name}</span>
          <Badge variant="secondary" className="text-[10px]">
            {dayFraction(a.hoursPerDay)}
          </Badge>
        </span>
      ));

    const goalItems = goals
      .filter((g) => g.owner.id === report.id)
      .map((g, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span>{g.title}</span>
          <Pill color={pctTone(g.progressPct)}>{g.progressPct}%</Pill>
        </span>
      ));

    const attendedItems = attendance.filter((a) => a.user.id === report.id).map((a, i) => <span key={i}>{a.title}</span>);

    const deliveredItems = sessions
      .filter((s) => s.presenterId === report.id && s.conductedDate)
      .map((s, i) => <span key={i}>{s.title}</span>);

    const certItems = certifications
      .filter((c) => c.user.id === report.id)
      .map((c, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span>{c.name}</span>
          <Pill color={CERT_TONE[c.status]}>{CERT_STATUS_LABEL[c.status]}</Pill>
        </span>
      ));

    const testItems = rawTests
      .filter((t) => t.user.id === report.id)
      .map((t, i) => {
        const completed = t.score !== null;
        const pct = completed && t.questionCount > 0 ? Math.round((t.score! / t.questionCount) * 100) : 0;
        return (
          <span key={i} className="flex items-center gap-1.5">
            <span>{t.skill}</span>
            <Pill color={completed ? pctTone(pct) : "#6b7280"}>
              {completed ? `${t.score}/${t.questionCount}` : "In progress"}
            </Pill>
          </span>
        );
      });

    return { report, projectItems, goalItems, attendedItems, deliveredItems, certItems, testItems };
  });

  return (
    <PageContainer className="max-w-6xl">
      <PageHeader title="Team overview" description="Every team member, side by side." />
      <TeamNav />

      {unassigned.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {unassigned.map((r) => (
            <Badge key={r.id} variant="outline" className="text-[10px]">
              {r.username} — unassigned
            </Badge>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-xs">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="p-1 font-medium">Team member</th>
              <th className="p-1 font-medium">Projects</th>
              <th className="p-1 font-medium">Goals</th>
              <th className="p-1 font-medium">Sessions attended</th>
              <th className="p-1 font-medium">Sessions delivered</th>
              <th className="p-1 font-medium">Certifications</th>
              <th className="p-1 font-medium">Tests</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ report, projectItems, goalItems, attendedItems, deliveredItems, certItems, testItems }) => (
              <tr key={report.id} className="border-b align-top last:border-b-0">
                <td className="p-1 font-medium">{report.username}</td>
                <td className="p-1">
                  <ListCell items={projectItems} />
                </td>
                <td className="p-1">
                  <ListCell items={goalItems} />
                </td>
                <td className="p-1">
                  <ListCell items={attendedItems} />
                </td>
                <td className="p-1">
                  <ListCell items={deliveredItems} />
                </td>
                <td className="p-1">
                  <ListCell items={certItems} />
                </td>
                <td className="p-1">
                  <ListCell items={testItems} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
};

export default TeamOverviewPage;
