import { requirePageRole } from "@/lib/rbac";
import { serverFetch } from "@/lib/api";
import { PageContainer, PageHeader } from "@/components/page-header";
import { StatTile } from "@/components/stat-tile";
import { computeTestAnalytics } from "@/lib/analytics";
import { PersonalTeamNav } from "@/app/_components/PersonalTeamNav";
import { Pill, pctTone } from "@/components/team-pill";

interface RawTest {
  skill: string;
  score: number | null;
  questionCount: number;
  createdAt: string;
  completedAt: string | null;
  user: { id: string; username: string };
}

const TeamTestsPage = async () => {
  await requirePageRole("RM");

  const testsRes = await serverFetch("/api/team/tests");
  const rawTests: RawTest[] = testsRes.ok ? (await testsRes.json()).tests : [];

  const analytics = computeTestAnalytics(
    rawTests.map((t) => ({ ...t, createdAt: new Date(t.createdAt), completedAt: t.completedAt ? new Date(t.completedAt) : null }))
  );

  return (
    <PageContainer className="max-w-6xl">
      <PageHeader title="Team tests" description="Test history for each team member." />
      <PersonalTeamNav basePath="/tests" showTeam />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Tests taken" value={String(analytics.totalTests)} />
        <StatTile label="Completed" value={String(analytics.completedCount)} />
        <StatTile label="Pass rate" value={analytics.passRatePct !== null ? `${analytics.passRatePct}%` : "—"} />
        <StatTile label="Average score" value={analytics.avgScorePct !== null ? `${analytics.avgScorePct}%` : "—"} />
      </div>

      {rawTests.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tests taken yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-2 font-medium">Team member</th>
                <th className="p-2 font-medium">Skill</th>
                <th className="p-2 font-medium">Score</th>
              </tr>
            </thead>
            <tbody>
              {rawTests.map((t, i) => {
                const completed = t.score !== null;
                const pct = completed && t.questionCount > 0 ? Math.round((t.score! / t.questionCount) * 100) : 0;
                return (
                  <tr key={i} className="border-b last:border-b-0">
                    <td className="p-2 font-medium">{t.user.username}</td>
                    <td className="p-2">{t.skill}</td>
                    <td className="p-2">
                      <Pill color={completed ? pctTone(pct) : "#6b7280"}>
                        {completed ? `${t.score}/${t.questionCount}` : "In progress"}
                      </Pill>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
};

export default TeamTestsPage;
