import "server-only";
import { ExpertiseLevel } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const EXPERTISE_LEVELS = new Set<string>(Object.values(ExpertiseLevel));

export interface SkillEntryInput {
  skill: string;
  expertiseLevel: ExpertiseLevel;
}

/** Validates the shape sent by a skills editor form. Returns null if anything is malformed. */
export function parseSkillEntries(raw: unknown): SkillEntryInput[] | null {
  if (!Array.isArray(raw)) return null;

  const entries: SkillEntryInput[] = [];
  const seen = new Set<string>();
  for (const entry of raw) {
    const skill = typeof (entry as { skill?: unknown })?.skill === "string" ? (entry as { skill: string }).skill.trim() : "";
    const expertiseLevel = (entry as { expertiseLevel?: unknown })?.expertiseLevel;
    if (!skill || typeof expertiseLevel !== "string" || !EXPERTISE_LEVELS.has(expertiseLevel)) return null;
    if (seen.has(skill)) continue;
    seen.add(skill);
    entries.push({ skill, expertiseLevel: expertiseLevel as ExpertiseLevel });
  }
  return entries;
}

/** Full-replace of a user's skill rows — the list is small, so diffing isn't worth the code. */
export async function replaceSkills(userId: string, entries: SkillEntryInput[]) {
  await prisma.$transaction([
    prisma.userSkill.deleteMany({ where: { userId } }),
    prisma.userSkill.createMany({ data: entries.map((entry) => ({ userId, ...entry })) }),
  ]);
}
