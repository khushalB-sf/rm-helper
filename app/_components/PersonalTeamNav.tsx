"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function PersonalTeamNav({ basePath, showTeam }: { basePath: string; showTeam: boolean }) {
  const pathname = usePathname();
  const items = [
    { href: `${basePath}/personal`, label: "Personal" },
    ...(showTeam ? [{ href: `${basePath}/team`, label: "Team" }] : []),
  ];

  if (items.length < 2) return null;

  return (
    <nav className="mb-4 flex flex-wrap gap-1 border-b">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "-mb-px border-b-2 px-3 py-2 text-sm",
            pathname === item.href
              ? "border-foreground font-medium"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
