import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { anthropic } from "@/lib/anthropic";
import { generateWithOllama } from "@/lib/ollama";

const USE_OLLAMA = process.env.AI_PROVIDER === "ollama";

export async function generateJSON(params: {
  prompt: string;
  schema: Record<string, unknown>;
  maxTokens: number;
  effort?: "low" | "medium" | "high";
}): Promise<string> {
  if (USE_OLLAMA) return generateWithOllama(params.prompt, params.schema);

  const response = await anthropic.messages.create({
    model: "claude-opus-5",
    max_tokens: params.maxTokens,
    output_config: { effort: params.effort ?? "medium", format: { type: "json_schema", schema: params.schema } },
    messages: [{ role: "user", content: params.prompt }],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No text content in AI response.");
  return block.text;
}

export function aiErrorMessage(error: unknown): string {
  if (error instanceof Anthropic.APIError) return error.message;
  if (error instanceof Error) return error.message;
  return "Failed to reach the AI service.";
}
