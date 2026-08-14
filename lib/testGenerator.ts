import "server-only";
import { generateJSON } from "@/lib/ai";
import type { ExpertiseLevel } from "@/app/generated/prisma/enums";

const QUESTIONS_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          correctAnswer: { type: "string" },
          explanation: { type: "string" },
        },
        required: ["question", "options", "correctAnswer", "explanation"],
        additionalProperties: false,
      },
    },
  },
  required: ["questions"],
  additionalProperties: false,
} as const;

export interface GeneratedQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

const EXPERTISE_LABEL: Record<ExpertiseLevel, string> = {
  NEW: "new to it (little to no hands-on experience)",
  INTERMEDIATE: "intermediate (comfortable with day-to-day use, still learning advanced topics)",
  EXPERT: "expert (deep, advanced, production-level knowledge)",
};

export async function generateTestQuestions(params: {
  skill: string;
  yearsOfExperience: number;
  expertiseLevel: ExpertiseLevel;
  questionCount: number;
}): Promise<GeneratedQuestion[]> {
  const { skill, yearsOfExperience, expertiseLevel, questionCount } = params;

  const text = await generateJSON({
    prompt: `Generate exactly ${questionCount} multiple-choice questions to test someone's knowledge of "${skill}". They have ${yearsOfExperience} year(s) of experience and describe their expertise as ${EXPERTISE_LABEL[expertiseLevel]}. Calibrate difficulty to that level. Each question needs exactly 4 answer options, one correct answer that matches one of the options exactly (verbatim), and a short explanation of why that answer is correct.`,
    schema: QUESTIONS_SCHEMA,
    maxTokens: 8000,
    effort: "medium",
  });

  const parsed = JSON.parse(text) as { questions: GeneratedQuestion[] };
  return parsed.questions;
}
