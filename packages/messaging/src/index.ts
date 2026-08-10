import { CustomWebhookAdapter } from "./adapters/custom-webhook";
import { FonnteAdapter } from "./adapters/fonnte";
import { SmtpAdapter } from "./adapters/smtp";
import { WhatsAppCloudAdapter } from "./adapters/whatsapp-cloud";
import type {
  CustomWebhookConfig,
  FonnteConfig,
  MessagingProvider,
  MessagingProviderType,
  SmtpConfig,
  WhatsAppCloudConfig,
} from "./types";

export * from "./types";
export { CustomWebhookAdapter, FonnteAdapter, SmtpAdapter, WhatsAppCloudAdapter };

export function createProvider(type: MessagingProviderType, config: unknown): MessagingProvider {
  switch (type) {
    case "whatsapp_cloud":
      return new WhatsAppCloudAdapter(config as WhatsAppCloudConfig);
    case "fonnte":
      return new FonnteAdapter(config as FonnteConfig);
    case "wablas":
      throw new Error("Wablas adapter not yet implemented");
    case "custom_webhook":
      return new CustomWebhookAdapter(config as CustomWebhookConfig);
    case "smtp":
      return new SmtpAdapter(config as SmtpConfig);
    default: {
      const _exhaustive: never = type;
      throw new Error(`Unknown provider type: ${String(_exhaustive)}`);
    }
  }
}
