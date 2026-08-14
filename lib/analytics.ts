import "server-only";

export const PASS_THRESHOLD_PCT = 70;
const MAX_SKILL_SLICES = 6;

export interface TestRecord {
  skill: string;
  score: number | null;
  questionCount: number;
  completedAt: Date | null;
  createdAt: Date;
}

export interface SkillBreakdown {
  skill: string;
  count: number;
}

export interface ScorePoint {
  date: string;
  pct: number;
}

export interface TestAnalytics {
  totalTests: number;
  completedCount: number;
  inProgressCount: number;
  passedCount: number;
  passRatePct: number | null;
  avgScorePct: number | null;
  skillBreakdown: SkillBreakdown[];
  scoreTrend: ScorePoint[];
}

function scorePct(test: TestRecord): number {
  return Math.round(((test.score ?? 0) / test.questionCount) * 100);
}

export function computeTestAnalytics(tests: TestRecord[]): TestAnalytics {
  const completed = tests.filter((t) => t.completedAt !== null && t.score !== null);
  const passedCount = completed.filter((t) => scorePct(t) >= PASS_THRESHOLD_PCT).length;
  const avgScorePct = completed.length
    ? Math.round(completed.reduce((sum, t) => sum + scorePct(t), 0) / completed.length)
    : null;

  const skillCounts = new Map<string, number>();
  for (const t of tests) skillCounts.set(t.skill, (skillCounts.get(t.skill) ?? 0) + 1);
  const sortedSkills = [...skillCounts.entries()].sort((a, b) => b[1] - a[1]);
  const topSkills = sortedSkills.slice(0, MAX_SKILL_SLICES).map(([skill, count]) => ({ skill, count }));
  const otherCount = sortedSkills.slice(MAX_SKILL_SLICES).reduce((sum, [, count]) => sum + count, 0);
  const skillBreakdown = otherCount > 0 ? [...topSkills, { skill: "Other", count: otherCount }] : topSkills;

  const scoreTrend = [...completed]
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((t) => ({ date: t.createdAt.toISOString(), pct: scorePct(t) }));

  return {
    totalTests: tests.length,
    completedCount: completed.length,
    inProgressCount: tests.length - completed.length,
    passedCount,
    passRatePct: completed.length ? Math.round((passedCount / completed.length) * 100) : null,
    avgScorePct,
    skillBreakdown,
    scoreTrend,
  };
}
