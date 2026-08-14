const HOURS_PER_DAY = 8;

export function dayFraction(hoursPerDay: number): string {
  return String(Math.floor((hoursPerDay / HOURS_PER_DAY) * 10) / 10);
}

export function pctTone(pct: number): string {
  if (pct >= 90) return "#0ca30c";
  if (pct >= 40) return "#fab219";
  return "#d03b3b";
}

export function Pill({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      className="rounded-full px-1.5 py-0 text-[10px] font-medium whitespace-nowrap"
      style={{ backgroundColor: `${color}1a`, color }}
    >
      {children}
    </span>
  );
}
