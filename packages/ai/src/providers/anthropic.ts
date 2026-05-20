import Anthropic from "@anthropic-ai/sdk";
import type { AiProviderConfig } from "../types";

export class AnthropicProvider {
  private client: Anthropic;
  readonly model: string;

  constructor(config: AiProviderConfig) {
    this.client = new Anthropic({ apiKey: config.apiKey });
    this.model = config.model ?? "claude-haiku-4-5";
  }

  async complete(
    systemPrompt: string,
    userPrompt: string,
    maxTokens = 2048,
  ): Promise<{
    text: string;
    inputTokens: number;
    outputTokens: number;
  }> {
    const msg = await this.client.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: userPrompt }],
      system: systemPrompt,
    });
    const text = msg.content.find((c) => c.type === "text")?.text ?? "";
    return {
      text,
      inputTokens: msg.usage.input_tokens,
      outputTokens: msg.usage.output_tokens,
    };
  }
}

/**
 * Estimate cost in USD for a generation given token counts and model name.
 * Covers Claude (Haiku/Sonnet) and Gemini (Flash/Pro) pricing tiers.
 */
export function estimateCostUsd(inputTokens: number, outputTokens: number, model: string): number {
  const i = inputTokens / 1_000_000;
  const o = outputTokens / 1_000_000;
  // Claude
  if (model.includes("haiku")) return i * 0.8 + o * 4.0;
  if (model.includes("sonnet")) return i * 3.0 + o * 15.0;
  if (model.includes("opus")) return i * 15.0 + o * 75.0;
  // Gemini
  if (model.includes("gemini-3-flash")) return i * 0.1 + o * 0.4;
  if (model.includes("gemini-2.0-flash")) return i * 0.1 + o * 0.4;
  if (model.includes("gemini-1.5-flash")) return i * 0.075 + o * 0.3;
  if (model.includes("gemini-1.5-pro")) return i * 3.5 + o * 10.5;
  if (model.includes("gemini-2.5-pro")) return i * 1.25 + o * 10.0;
  // NVIDIA NIM (free-tier models — identified by NIM base URL or known free models)
  if (model.includes("glm")) return 0;
  if (model === "meta/llama-3.1-8b-instruct") return 0;
  // Fallback (treat as Haiku)
  return i * 0.8 + o * 4.0;
}
