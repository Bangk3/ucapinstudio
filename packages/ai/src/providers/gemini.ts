import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AiProviderConfig, IAiProvider } from "../types";

export class GeminiProvider implements IAiProvider {
  private client: GoogleGenerativeAI;
  readonly model: string;

  constructor(config: AiProviderConfig) {
    this.client = new GoogleGenerativeAI(config.apiKey);
    this.model = config.model ?? "gemini-3-flash-preview";
  }

  async complete(
    systemPrompt: string,
    userPrompt: string,
    maxTokens = 2048,
  ): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
    const genModel = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: systemPrompt,
    });

    const result = await genModel.generateContent({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: { maxOutputTokens: maxTokens },
    });

    const text = result.response.text();
    const usage = result.response.usageMetadata;

    // For thinking models (e.g. gemini-3-flash-preview), thoughtsTokenCount is billed
    // at output token rate — include it in outputTokens for accurate cost tracking.
    const thinkingTokens = (usage as { thoughtsTokenCount?: number })?.thoughtsTokenCount ?? 0;
    return {
      text,
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens: (usage?.candidatesTokenCount ?? 0) + thinkingTokens,
    };
  }
}
