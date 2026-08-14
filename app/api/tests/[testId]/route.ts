import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(_request: Request, { params }: RouteContext<"/api/tests/[testId]">) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const { testId } = await params;
  const test = await prisma.test.findUnique({ where: { id: testId }, include: { questions: true } });
  if (!test || test.userId !== session.userId) {
    return NextResponse.json({ message: "Test not found." }, { status: 404 });
  }

  const completed = test.completedAt !== null;
  return NextResponse.json({
    test: {
      id: test.id,
      skill: test.skill,
      yearsOfExperience: test.yearsOfExperience,
      expertiseLevel: test.expertiseLevel,
      questionCount: test.questionCount,
      score: test.score,
      completedAt: test.completedAt,
      questions: test.questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        userAnswer: q.userAnswer,
        isCorrect: q.isCorrect,
        correctAnswer: completed ? q.correctAnswer : undefined,
        explanation: completed ? q.explanation : undefined,
      })),
    },
  });
}
