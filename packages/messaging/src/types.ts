export type MessageStatus = "pending" | "sent" | "delivered" | "read" | "failed";
export type MessageChannel = "whatsapp" | "sms" | "email";
export type MessagingProviderType =
  | "whatsapp_cloud"
  | "fonnte"
  | "wablas"
  | "custom_webhook"
  | "smtp";

export interface SendMessageParams {
  to: string; // phone (E.164) or email
  body: string; // message text (plain text or HTML for email)
  channel: MessageChannel;
  templateVars?: Record<string, string>;
}

export interface SendResult {
  success: boolean;
  providerId?: string; // provider's message ID for tracking
  error?: string;
}

export interface MessagingProvider {
  name: MessagingProviderType;
  send(params: SendMessageParams): Promise<SendResult>;
  parseWebhook?(payload: unknown): WebhookEvent | null;
}

export interface WebhookEvent {
  providerId: string;
  status: MessageStatus;
  timestamp: Date;
}

export interface WhatsAppCloudConfig {
  phoneNumberId: string;
  accessToken: string;
}

export interface FonnteConfig {
  apiKey: string;
  deviceToken: string;
}

/**
 * Generic self-hosted WA gateway (e.g. a Baileys-backed service you run
 * yourself) — same request shape as Fonnte (Authorization header, form body
 * {target, message}) but against a configurable base URL instead of a fixed
 * provider domain.
 */
export interface CustomWebhookConfig {
  baseUrl: string; // full endpoint to POST to, e.g. https://waservice.example.com/send
  apiKey: string;
  device?: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}
