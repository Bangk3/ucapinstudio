import type {
  FonnteConfig,
  MessagingProvider,
  MessagingProviderType,
  SendMessageParams,
  SendResult,
} from "../types.js";

interface FonnteApiResponse {
  status: boolean;
  id?: string;
  reason?: string;
}

export class FonnteAdapter implements MessagingProvider {
  readonly name: MessagingProviderType = "fonnte";
  private readonly config: FonnteConfig;

  constructor(config: FonnteConfig) {
    this.config = config;
  }

  async send(params: SendMessageParams): Promise<SendResult> {
    let response: Response;
    try {
      response = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.config.apiKey,
        },
        body: JSON.stringify({
          target: params.to,
          message: params.body,
          device: this.config.deviceToken,
        }),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      return { success: false, error: message };
    }

    const data = (await response.json()) as FonnteApiResponse;

    if (!response.ok || !data.status) {
      return {
        success: false,
        error: data.reason ?? `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      ...(data.id !== undefined ? { providerId: String(data.id) } : {}),
    };
  }
}
