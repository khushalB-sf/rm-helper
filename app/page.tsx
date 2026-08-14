import Link from "next/link";
import { ClipboardList, Sparkles, UserRound } from "lucide-react";
import { getSession } from "@/lib/session";
import { serverFetch } from "@/lib/api";
import { computeTestAnalytics } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsSection } from "./_components/AnalyticsSection";

const QUICK_LINKS = [
  { href: "/tests/new", label: "Start a new test", description: "Get an AI-generated test for a skill on your profile.", icon: Sparkles },
  { href: "/tests/personal", label: "Your tests", description: "Review past results and pick up where you left off.", icon: ClipboardList },
  { href: "/profile", label: "Your profile", description: "Update your skills, experience, and projects from your CV.", icon: UserRound },
];

export default async function Home() {
  const session = await getSession();

  if (!session?.userId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight">SimTest</h1>
          <p className="max-w-md text-muted-foreground">
            Turn your CV into a personalized skill test. Upload your resume, and we&apos;ll generate questions
            calibrated to your experience.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/register">Get started</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </div>
    );
  }

  const [meRes, testsRes] = await Promise.all([serverFetch("/api/auth/me"), serverFetch("/api/tests")]);
  const user = meRes.ok ? await meRes.json() : null;
  const rawTests: { skill: string; score: number | null; questionCount: number; completedAt: string | null; createdAt: string }[] =
    testsRes.ok ? (await testsRes.json()).tests : [];
  const analytics = computeTestAnalytics(
    rawTests.map((t) => ({ ...t, createdAt: new Date(t.createdAt), completedAt: t.completedAt ? new Date(t.completedAt) : null }))
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back{user ? `, ${user.username}` : ""}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Here&apos;s what you can do next.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {QUICK_LINKS.map(({ href, label, description, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <Icon className="mb-2 size-5 text-primary" />
                <CardTitle>{label}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <AnalyticsSection analytics={analytics} />
    </div>
  );
}
