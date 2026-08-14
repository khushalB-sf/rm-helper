import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { generateTestQuestions } from "@/lib/testGenerator";
import { ExpertiseLevel } from "@/app/generated/prisma/enums";
import { aiErrorMessage } from "@/lib/ai";

const QUESTION_COUNTS = [5, 10, 15];

export async function GET() {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const tests = await prisma.test.findMany({
    where: { userId: session.userId as string },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      skill: true,
      yearsOfExperience: true,
      expertiseLevel: true,
      questionCount: true,
      score: true,
      createdAt: true,
      completedAt: true,
    },
  });

  return NextResponse.json({ tests });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const body = await request.json();
  const skill = String(body.skill ?? "").trim();
  const yearsOfExperience = Number(body.yearsOfExperience);
  const expertiseLevel = body.expertiseLevel;
  const questionCount = Number(body.questionCount);
  const goalId = typeof body.goalId === "string" && body.goalId ? body.goalId : null;

  const errors: Record<string, string> = {};
  if (!skill) errors.skill = "Select a skill.";
  if (!Number.isInteger(yearsOfExperience) || yearsOfExperience < 0 || yearsOfExperience > 60) {
    errors.yearsOfExperience = "Enter a valid number of years.";
  }
  if (!Object.values(ExpertiseLevel).includes(expertiseLevel)) errors.expertiseLevel = "Select an expertise level.";
  if (!QUESTION_COUNTS.includes(questionCount)) errors.questionCount = "Select a valid question count.";
  if (Object.keys(errors).length > 0) return NextResponse.json({ errors }, { status: 400 });

  if (goalId) {
    const goal = await prisma.goal.findUnique({ where: { id: goalId }, select: { ownerId: true } });
    if (!goal || goal.ownerId !== session.userId) {
      return NextResponse.json({ message: "Goal not found." }, { status: 404 });
    }
  }

  let questions;
  try {
    questions = await generateTestQuestions({ skill, yearsOfExperience, expertiseLevel, questionCount });
  } catch (error) {
    return NextResponse.json({ message: aiErrorMessage(error) }, { status: 502 });
  }
  if (questions.length === 0) {
    return NextResponse.json({ message: "Couldn't generate questions. Try again." }, { status: 502 });
  }

  const test = await prisma.test.create({
    data: {
      userId: session.userId as string,
      skill,
      yearsOfExperience,
      expertiseLevel,
      questionCount: questions.length,
      goalId,
      questions: {
        create: questions.map((q) => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        })),
      },
    },
    include: { questions: { select: { id: true, question: true, options: true } } },
  });

  return NextResponse.json({ test });
}
