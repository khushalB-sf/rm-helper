import "server-only";
import { generateJSON } from "@/lib/ai";

const CV_DATA_SCHEMA = {
  type: "object",
  properties: {
    skills: { type: "array", items: { type: "string" } },
    yearsOfExperience: { type: "number" },
    phone: { type: ["string", "null"] },
    organizations: { type: "array", items: { type: "string" } },
    projects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          period: { type: ["string", "null"] },
        },
        required: ["name", "description", "period"],
        additionalProperties: false,
      },
    },
  },
  required: ["skills", "yearsOfExperience", "phone", "organizations", "projects"],
  additionalProperties: false,
} as const;

export interface CvProject {
  name: string;
  description: string;
  period: string | null;
}

export interface CvData {
  skills: string[];
  yearsOfExperience: number;
  phone: string | null;
  organizations: string[];
  projects: CvProject[];
}

export async function extractCvData(cvText: string): Promise<CvData> {
  const text = await generateJSON({
    prompt: `Extract structured profile data from the CV/resume text below.
- skills: distinct technical skills, technologies, and programming languages (not soft skills or job titles).
- yearsOfExperience: total years of professional experience as a number (best estimate if not stated explicitly).
- phone: the person's contact phone number, or null if none is present.
- organizations: names of past/current employers, in the order they appear.
- projects: the 3 most recent projects (most recent first), each with a short name, a 1-2 sentence description, and the period worked on it (or null if unknown). Return fewer than 3 if that's all the CV mentions.

CV text:
${cvText}`,
    schema: CV_DATA_SCHEMA,
    maxTokens: 2048,
    effort: "low",
  });

  return JSON.parse(text) as CvData;
}
