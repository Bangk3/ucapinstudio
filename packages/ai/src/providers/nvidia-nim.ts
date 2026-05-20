/**
 * NVIDIA NIM provider — OpenAI-compatible chat completion API.
 *
 * Base URL: https://integrate.api.nvidia.com/v1
 * Auth: Bearer <NVIDIA_NIM_API_KEY>
 * Default model: meta/llama-3.1-8b-instruct (fast, reliable JSON instruction-following)
 */
import type { AiProviderConfig, IAiProvider } from "../types";

const NIM_BASE_URL = "https://integrate.api.nvidia.com/v1";
const FETCH_TIMEOUT_MS = 45_000; // 45s — NIM free tier can be slow on cold start

interface OpenAiChatResponse {
  choices: Array<{
    message: { content: string };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
}

export class NvidiaNimProvider implements IAiProvider {
  private readonly apiKey: string;
  readonly model: string;

  constructor(config: AiProviderConfig) {
    this.apiKey = config.apiKey;
    // Strip "nvidia_nim/" LiteLLM-style prefix if present
    this.model = (config.model ?? "meta/llama-3.1-8b-instruct").replace(/^nvidia_nim\//i, "");
  }

  async complete(
    systemPrompt: string,
    userPrompt: string,
    maxTokens = 1024,
  ): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(`${NIM_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
        signal: controller.signal,
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        throw new Error(
          `NVIDIA NIM timeout after ${FETCH_TIMEOUT_MS / 1000}s — model may be cold-starting, retry`,
        );
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "<no body>");
      throw new Error(`NVIDIA NIM ${res.status}: ${body.slice(0, 300)}`);
    }

    const data = (await res.json()) as OpenAiChatResponse;
    const text = data.choices?.[0]?.message?.content ?? "";
    return {
      text,
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
    };
  }
}
