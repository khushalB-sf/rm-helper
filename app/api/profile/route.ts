import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/app/generated/prisma/client";
import { ExpertiseLevel } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { extractPdfText } from "@/lib/pdf";
import { extractCvData, type CvProject } from "@/lib/skills";
import { aiErrorMessage } from "@/lib/ai";
import { parseSkillEntries, replaceSkills, type SkillEntryInput } from "@/lib/userSkills";

async function getProfileResponse(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      yearsOfExperience: true,
      phone: true,
      organizations: true,
      projects: true,
      email: true,
      skillEntries: { select: { skill: true, expertiseLevel: true }, orderBy: { skill: "asc" } },
    },
  });
  if (!user) return null;

  const { skillEntries, ...rest } = user;
  return { ...rest, skills: skillEntries, projects: user.projects ?? [] };
}

export async function GET() {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const profile = await getProfileResponse(session.userId as string);
  if (!profile) return NextResponse.json({ message: "Not found." }, { status: 404 });

  return NextResponse.json(profile);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const contentType = request.headers.get("content-type") ?? "";
  let cvText: string;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("cv");
    if (!(file instanceof File) || file.type !== "application/pdf") {
      return NextResponse.json({ message: "Upload a PDF file." }, { status: 400 });
    }
    cvText = await extractPdfText(await file.arrayBuffer());
  } else {
    const body = await request.json();
    cvText = String(body.text ?? "").trim();
  }

  if (cvText.trim().length < 20) {
    return NextResponse.json({ message: "Couldn't find enough text to extract skills from." }, { status: 400 });
  }

  let cvData: Awaited<ReturnType<typeof extractCvData>>;
  try {
    cvData = await extractCvData(cvText.slice(0, 50_000));
  } catch (error) {
    return NextResponse.json({ message: aiErrorMessage(error) }, { status: 502 });
  }
  if (cvData.skills.length === 0) {
    return NextResponse.json({ message: "No skills could be identified. Try adding more detail." }, { status: 422 });
  }

  const userId = session.userId as string;
  const uniqueSkills = [...new Set(cvData.skills.map((s) => s.trim()).filter(Boolean))];

  await prisma.user.update({
    where: { id: userId },
    data: {
      yearsOfExperience: cvData.yearsOfExperience,
      phone: cvData.phone,
      organizations: cvData.organizations,
      projects: cvData.projects as unknown as Prisma.InputJsonValue,
    },
  });
  // A CV lists skill names, not a proficiency claim, so imported skills land at a neutral
  // default level rather than inventing one that was never in the source text.
  await replaceSkills(
    userId,
    uniqueSkills.map((skill) => ({ skill, expertiseLevel: ExpertiseLevel.INTERMEDIATE }))
  );

  const profile = await getProfileResponse(userId);
  return NextResponse.json(profile);
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const body = await request.json();
  const data: Prisma.UserUpdateInput = {};
  let skillsUpdate: SkillEntryInput[] | undefined;

  if ("phone" in body) {
    if (body.phone !== null && typeof body.phone !== "string") {
      return NextResponse.json({ message: "Invalid phone." }, { status: 400 });
    }
    data.phone = body.phone ? body.phone.trim() || null : null;
  }

  if ("yearsOfExperience" in body) {
    const value = body.yearsOfExperience;
    if (value !== null && (typeof value !== "number" || !Number.isFinite(value) || value < 0)) {
      return NextResponse.json({ message: "Invalid years of experience." }, { status: 400 });
    }
    data.yearsOfExperience = value;
  }

  if ("skills" in body) {
    const entries = parseSkillEntries(body.skills);
    if (entries === null) return NextResponse.json({ message: "Invalid skills." }, { status: 400 });
    skillsUpdate = entries;
  }

  if ("organizations" in body) {
    if (!Array.isArray(body.organizations) || !body.organizations.every((o: unknown) => typeof o === "string")) {
      return NextResponse.json({ message: "Invalid organizations." }, { status: 400 });
    }
    data.organizations = body.organizations.map((o: string) => o.trim()).filter(Boolean);
  }

  if ("projects" in body) {
    if (!Array.isArray(body.projects)) {
      return NextResponse.json({ message: "Invalid projects." }, { status: 400 });
    }
    const projects: CvProject[] = [];
    for (const project of body.projects) {
      if (!project || typeof project.name !== "string" || typeof project.description !== "string") {
        return NextResponse.json({ message: "Invalid projects." }, { status: 400 });
      }
      projects.push({
        name: project.name.trim(),
        description: project.description.trim(),
        period: typeof project.period === "string" && project.period.trim() ? project.period.trim() : null,
      });
    }
    data.projects = projects as unknown as Prisma.InputJsonValue;
  }

  if (Object.keys(data).length === 0 && skillsUpdate === undefined) {
    return NextResponse.json({ message: "No changes provided." }, { status: 400 });
  }

  const userId = session.userId as string;
  if (Object.keys(data).length > 0) {
    await prisma.user.update({ where: { id: userId }, data });
  }
  if (skillsUpdate !== undefined) {
    await replaceSkills(userId, skillsUpdate);
  }

  const profile = await getProfileResponse(userId);
  return NextResponse.json(profile);
}
