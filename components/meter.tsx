interface MeterProps {
  value: number;
  label: string;
  tone?: "good" | "warning" | "critical" | "neutral";
}

const TONE_COLOR: Record<NonNullable<MeterProps["tone"]>, string> = {
  good: "#0ca30c",
  warning: "#fab219",
  critical: "#d03b3b",
  neutral: "var(--foreground)",
};

export function Meter({ value, label, tone = "neutral" }: MeterProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-sm font-medium tabular-nums">{Math.round(clamped)}%</p>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-[width]"
          style={{ width: `${clamped}%`, backgroundColor: TONE_COLOR[tone] }}
        />
      </div>
    </div>
  );
}
