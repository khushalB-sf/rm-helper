import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { serverFetch } from "@/lib/api";
import { PageContainer, PageHeader } from "@/components/page-header";
import TestRunner from "./_components/TestRunner";

interface TestDetail {
  id: string;
  skill: string;
  yearsOfExperience: number;
  expertiseLevel: string;
  questionCount: number;
  score: number | null;
  completedAt: string | null;
  questions: {
    id: string;
    question: string;
    options: string[];
    userAnswer: string | null;
    isCorrect: boolean | null;
    correctAnswer?: string;
    explanation?: string;
  }[];
}

const TestPage = async (props: PageProps<"/tests/[testId]">) => {
  const { testId } = await props.params;
  const session = await getSession();
  if (!session?.userId) redirect("/login");

  const res = await serverFetch(`/api/tests/${testId}`);
  if (!res.ok) redirect("/tests");
  const { test }: { test: TestDetail } = await res.json();

  const completed = test.completedAt !== null;

  return (
    <PageContainer>
      <PageHeader title={`${test.skill} test (${test.expertiseLevel.toLowerCase()}, ${test.yearsOfExperience}y)`} />
      <TestRunner
        testId={test.id}
        completed={completed}
        score={test.score}
        questionCount={test.questionCount}
        questions={test.questions.map((q) => ({
          id: q.id,
          question: q.question,
          options: q.options,
          userAnswer: q.userAnswer,
          isCorrect: q.isCorrect,
          correctAnswer: q.correctAnswer ?? null,
          explanation: q.explanation ?? null,
        }))}
      />
    </PageContainer>
  );
};

export default TestPage;
