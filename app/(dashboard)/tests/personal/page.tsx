import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getCurrentUserRole } from "@/lib/rbac";
import { serverFetch } from "@/lib/api";
import { PageContainer, PageHeader } from "@/components/page-header";
import { PersonalTeamNav } from "@/app/_components/PersonalTeamNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Test {
  id: string;
  skill: string;
  yearsOfExperience: number;
  expertiseLevel: string;
  questionCount: number;
  score: number | null;
  completedAt: string | null;
}

const TestsPage = async () => {
  const session = await getSession();
  if (!session?.userId) redirect("/login");

  const [res, current] = await Promise.all([serverFetch("/api/tests"), getCurrentUserRole()]);
  const tests: Test[] = res.ok ? (await res.json()).tests : [];

  return (
    <PageContainer className="max-w-6xl">
      <PageHeader
        title="Your tests"
        action={
          <Button asChild>
            <Link href="/tests/new">New test</Link>
          </Button>
        }
      />
      <PersonalTeamNav basePath="/tests" showTeam={current?.role === "RM"} />

      {tests.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tests yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tests.map((test) => (
            <li key={test.id}>
              <Link href={`/tests/${test.id}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center justify-between">
                    <span>
                      {test.skill} · {test.expertiseLevel.toLowerCase()} · {test.yearsOfExperience}y
                    </span>
                    <Badge variant={test.completedAt ? "secondary" : "outline"}>
                      {test.completedAt ? `${test.score}/${test.questionCount}` : "In progress"}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
};

export default TestsPage;
