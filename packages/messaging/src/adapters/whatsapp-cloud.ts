import type {
  MessagingProvider,
  MessagingProviderType,
  SendMessageParams,
  SendResult,
  WebhookEvent,
  WhatsAppCloudConfig,
} from "../types";

interface WhatsAppApiResponse {
  messages?: Array<{ id: string }>;
  error?: { message: string };
}

interface WhatsAppStatusEntry {
  id: string;
  status: string;
  timestamp: string;
}

interface WhatsAppWebhookPayload {
  entry?: Array<{
    changes?: Array<{
      value?: {
        statuses?: WhatsAppStatusEntry[];
      };
    }>;
  }>;
}

export class WhatsAppCloudAdapter implements MessagingProvider {
  readonly name: MessagingProviderType = "whatsapp_cloud";
  private readonly config: WhatsAppCloudConfig;

  constructor(config: WhatsAppCloudConfig) {
    this.config = config;
  }

  async send(params: SendMessageParams): Promise<SendResult> {
    // Strip leading + for WhatsApp Cloud API
    const phone = params.to.startsWith("+") ? params.to.slice(1) : params.to;

    const url = `https://graph.facebook.com/v19.0/${this.config.phoneNumberId}/messages`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "text",
          text: { body: params.body },
        }),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      return { success: false, error: message };
    }

    const data = (await response.json()) as WhatsAppApiResponse;

    if (!response.ok || data.error) {
      return {
        success: false,
        error: data.error?.message ?? `HTTP ${response.status}`,
      };
    }

    const providerId = data.messages?.[0]?.id;
    return { success: true, ...(providerId !== undefined ? { providerId } : {}) };
  }

  parseWebhook(payload: unknown): WebhookEvent | null {
    const body = payload as WhatsAppWebhookPayload;
    const statusEntry = body?.entry?.[0]?.changes?.[0]?.value?.statuses?.[0];
    if (!statusEntry) return null;

    const statusMap: Record<string, WebhookEvent["status"]> = {
      sent: "sent",
      delivered: "delivered",
      read: "read",
      failed: "failed",
    };

    const status = statusMap[statusEntry.status] ?? "sent";
    const tsSeconds = Number(statusEntry.timestamp);

    return {
      providerId: statusEntry.id,
      status,
      timestamp: new Date(tsSeconds * 1000),
    };
  }
}
