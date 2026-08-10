import type {
  CustomWebhookConfig,
  MessagingProvider,
  MessagingProviderType,
  SendMessageParams,
  SendResult,
} from "../types";

/**
 * Normalize a phone number to Fonnte-style format: digits only, no '+'.
 * Handles common Indonesian formats:
 *   +628xxx  → 628xxx
 *   08xxx    → 628xxx  (replace leading 0 with country code 62)
 *   628xxx   → 628xxx  (pass-through)
 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

interface CustomWebhookApiResponse {
  status?: boolean | string;
  success?: boolean;
  id?: string;
  reason?: string;
  message?: string;
}

/**
 * Self-hosted WA gateway adapter (superadmin-configured base URL + API key
 * via /admin/messaging) — same wire format as Fonnte: form-encoded
 * {target, message[, device]}, Authorization header carrying the API key.
 * Point this at any gateway that speaks that dialect (e.g. a Baileys-backed
 * service you run yourself) — Baileys itself is never bundled in this repo,
 * only called over HTTP as an external service you operate and are
 * responsible for (see CLAUDE.md's stance on WhatsApp Web automation).
 */
export class CustomWebhookAdapter implements MessagingProvider {
  readonly name: MessagingProviderType = "custom_webhook";
  private readonly config: CustomWebhookConfig;

  constructor(config: CustomWebhookConfig) {
    this.config = config;
  }

  async send(params: SendMessageParams): Promise<SendResult> {
    const phone = normalizePhone(params.to);

    const form = new URLSearchParams({ target: phone, message: params.body });
    if (this.config.device) form.set("device", this.config.device);

    let response: Response;
    try {
      response = await fetch(this.config.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: this.config.apiKey,
        },
        body: form.toString(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      return { success: false, error: message };
    }

    const data = (await response.json().catch(() => ({}))) as CustomWebhookApiResponse;
    const ok = data.status === true || (data.status as unknown) === "true" || data.success === true;

    if (!response.ok || !ok) {
      return {
        success: false,
        error: data.reason ?? data.message ?? `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      ...(data.id !== undefined ? { providerId: String(data.id) } : {}),
    };
  }
}
