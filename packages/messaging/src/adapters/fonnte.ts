import type {
  FonnteConfig,
  MessagingProvider,
  MessagingProviderType,
  SendMessageParams,
  SendResult,
} from "../types";

/**
 * Normalize a phone number to Fonnte's expected format: digits only, no '+'.
 * Handles common Indonesian formats:
 *   +628xxx  → 628xxx
 *   08xxx    → 628xxx  (replace leading 0 with country code 62)
 *   628xxx   → 628xxx  (pass-through)
 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, ""); // strip all non-digits
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

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
    // Fonnte requires phone without '+' prefix.
    // Normalize: +628xxx → 628xxx, 08xxx → 628xxx, others pass-through.
    const phone = normalizePhone(params.to);

    // Use form-encoded — Fonnte's official format and most widely supported.
    const form = new URLSearchParams({
      target: phone,
      message: params.body,
    });
    // Only include device if configured — only needed for Fonnte Hub multi-device.
    if (this.config.deviceToken) {
      form.set("device", this.config.deviceToken);
    }

    let response: Response;
    try {
      response = await fetch("https://api.fonnte.com/send", {
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

    const data = (await response.json()) as FonnteApiResponse;

    // data.status can be boolean true/false OR string "true"/"false" depending on
    // Fonnte API version — coerce to boolean explicitly.
    const ok = data.status === true || (data.status as unknown) === "true";

    if (!response.ok || !ok) {
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
