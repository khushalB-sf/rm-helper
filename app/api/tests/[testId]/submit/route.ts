import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { PASS_THRESHOLD_PCT } from "@/lib/analytics";

export async function POST(request: NextRequest, { params }: RouteContext<"/api/tests/[testId]/submit">) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const { testId } = await params;
  const test = await prisma.test.findUnique({ where: { id: testId }, include: { questions: true } });
  if (!test || test.userId !== session.userId) {
    return NextResponse.json({ message: "Test not found." }, { status: 404 });
  }
  if (test.completedAt) {
    return NextResponse.json({ message: "Test already submitted." }, { status: 409 });
  }

  const body = await request.json();
  const answers = new Map<string, string>(
    Array.isArray(body.answers) ? body.answers.map((a: { questionId: string; answer: string }) => [a.questionId, a.answer]) : [],
  );

  let score = 0;
  const questionUpdates = test.questions.map((question) => {
    const userAnswer = answers.get(question.id) ?? null;
    const isCorrect = userAnswer === question.correctAnswer;
    if (isCorrect) score += 1;
    return prisma.question.update({ where: { id: question.id }, data: { userAnswer, isCorrect } });
  });

  const scorePct = Math.round((score / test.questionCount) * 100);
  const passed = test.goalId !== null && scorePct >= PASS_THRESHOLD_PCT;

  await prisma.$transaction([
    ...questionUpdates,
    prisma.test.update({ where: { id: test.id }, data: { score, completedAt: new Date() } }),
    ...(passed
      ? [
          prisma.goal.update({ where: { id: test.goalId as string }, data: { progressPct: 100, status: "COMPLETED" } }),
          prisma.goalUpdate.create({
            data: { goalId: test.goalId as string, progressPct: 100, note: `Completed via test — scored ${score}/${test.questionCount}.` },
          }),
        ]
      : []),
  ]);

  const updatedQuestions = await prisma.question.findMany({ where: { testId: test.id } });

  return NextResponse.json({
    result: {
      score,
      questionCount: test.questionCount,
      questions: updatedQuestions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        userAnswer: q.userAnswer,
        isCorrect: q.isCorrect,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      })),
    },
  });
}
