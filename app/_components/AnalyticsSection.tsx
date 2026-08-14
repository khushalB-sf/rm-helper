import { CheckCircle2, AlertTriangle, XCircle, type LucideIcon } from "lucide-react";
import { StatTile } from "@/components/stat-tile";
import { Meter } from "@/components/meter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PASS_THRESHOLD_PCT, type TestAnalytics, type SkillBreakdown, type ScorePoint } from "@/lib/analytics";

const STATUS: Record<"good" | "warning" | "critical", { Icon: LucideIcon; color: string; label: string }> = {
  good: { Icon: CheckCircle2, color: "#0ca30c", label: "On track" },
  warning: { Icon: AlertTriangle, color: "#fab219", label: "Needs practice" },
  critical: { Icon: XCircle, color: "#d03b3b", label: "Struggling" },
};

function passRateStatus(pct: number) {
  if (pct >= 70) return STATUS.good;
  if (pct >= 40) return STATUS.warning;
  return STATUS.critical;
}

function SkillBarChart({ data }: { data: SkillBreakdown[] }) {
  const max = Math.max(...data.map((d) => d.count));

  return (
    <div className="flex flex-col gap-2.5">
      {data.map((d) => (
        <div key={d.skill} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-sm text-muted-foreground" title={d.skill}>
            {d.skill}
          </span>
          <div className="h-4 flex-1 bg-muted">
            <div
              className="h-4 rounded-r-[4px] bg-foreground/70"
              style={{ width: `${(d.count / max) * 100}%` }}
              title={`${d.skill}: ${d.count} test${d.count === 1 ? "" : "s"}`}
            />
          </div>
          <span className="w-6 shrink-0 text-right text-sm tabular-nums">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

function ScoreTrendChart({ points }: { points: ScorePoint[] }) {
  const W = 600;
  const H = 160;
  const padX = 12;
  const padY = 16;
  const stepX = (W - padX * 2) / (points.length - 1);

  const coords = points.map((p, i) => ({
    x: padX + i * stepX,
    y: padY + (1 - p.pct / 100) * (H - padY * 2),
    ...p,
  }));
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const last = coords[coords.length - 1];
  const labelY = last.y - 10 < 10 ? last.y + 14 : last.y - 10;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-40 w-full" role="img" aria-label="Score trend over time">
      <line x1={padX} y1={H - padY} x2={W - padX} y2={H - padY} className="stroke-border" strokeWidth={1} />
      <path
        d={path}
        fill="none"
        className="stroke-foreground/70"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {coords.map((c) => (
        <g key={c.date}>
          <circle cx={c.x} cy={c.y} r={12} fill="transparent">
            <title>{`${new Date(c.date).toLocaleDateString()}: ${c.pct}%`}</title>
          </circle>
          <circle cx={c.x} cy={c.y} r={4} className="fill-foreground/70 stroke-background" strokeWidth={2} />
        </g>
      ))}
      <text x={last.x} y={labelY} textAnchor="end" className="fill-foreground text-[10px] font-medium">
        {last.pct}%
      </text>
    </svg>
  );
}

export function AnalyticsSection({ analytics }: { analytics: TestAnalytics }) {
  const { totalTests, completedCount, inProgressCount, passedCount, passRatePct, avgScorePct, skillBreakdown, scoreTrend } =
    analytics;

  if (totalTests === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>Take your first test to start tracking your progress here.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const status = passRatePct !== null ? passRateStatus(passRatePct) : null;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold tracking-tight">Analytics</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Tests taken" value={String(totalTests)} />
        <StatTile
          label="Completed"
          value={String(completedCount)}
          caption={inProgressCount > 0 ? `${inProgressCount} in progress` : undefined}
        />
        <StatTile label="Average score" value={avgScorePct !== null ? `${avgScorePct}%` : "—"} />
        <StatTile label="Pass rate" value={passRatePct !== null ? `${passRatePct}%` : "—"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pass rate</CardTitle>
          <CardDescription>Share of completed tests scoring {PASS_THRESHOLD_PCT}% or higher.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {passRatePct !== null && status ? (
            <>
              <Meter
                value={passRatePct}
                label={`${passedCount} of ${completedCount} passed`}
                tone={passRatePct >= 70 ? "good" : passRatePct >= 40 ? "warning" : "critical"}
              />
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <status.Icon className="size-4" style={{ color: status.color }} />
                {status.label}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Complete a test to see your pass rate.</p>
          )}
        </CardContent>
      </Card>

      {skillBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tests by skill</CardTitle>
          </CardHeader>
          <CardContent>
            <SkillBarChart data={skillBreakdown} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Score trend</CardTitle>
          <CardDescription>Completed test scores over time.</CardDescription>
        </CardHeader>
        <CardContent>
          {scoreTrend.length >= 2 ? (
            <ScoreTrendChart points={scoreTrend} />
          ) : (
            <p className="text-sm text-muted-foreground">Complete at least two tests to see your score trend.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
