import Anthropic from "@anthropic-ai/sdk";
import type { AiProviderConfig } from "../types.js";

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

// Cost per token (Haiku pricing as of 2024)
// Input: $0.80/M tokens, Output: $4.00/M tokens
export function estimateCostUsd(inputTokens: number, outputTokens: number, model: string): number {
  if (model.includes("haiku")) {
    return (inputTokens / 1_000_000) * 0.8 + (outputTokens / 1_000_000) * 4.0;
  }
  if (model.includes("sonnet")) {
    return (inputTokens / 1_000_000) * 3.0 + (outputTokens / 1_000_000) * 15.0;
  }
  // Fallback
  return (inputTokens / 1_000_000) * 0.8 + (outputTokens / 1_000_000) * 4.0;
}
