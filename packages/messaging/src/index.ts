export * from "./types.js";
export { WhatsAppCloudAdapter } from "./adapters/whatsapp-cloud.js";
export { FonnteAdapter } from "./adapters/fonnte.js";
export { SmtpAdapter } from "./adapters/smtp.js";

import { FonnteAdapter } from "./adapters/fonnte.js";
import { SmtpAdapter } from "./adapters/smtp.js";
import { WhatsAppCloudAdapter } from "./adapters/whatsapp-cloud.js";
import type {
  FonnteConfig,
  MessagingProvider,
  MessagingProviderType,
  SmtpConfig,
  WhatsAppCloudConfig,
} from "./types.js";

export function createProvider(type: MessagingProviderType, config: unknown): MessagingProvider {
  switch (type) {
    case "whatsapp_cloud":
      return new WhatsAppCloudAdapter(config as WhatsAppCloudConfig);
    case "fonnte":
      return new FonnteAdapter(config as FonnteConfig);
    case "wablas":
      // Wablas is not yet implemented; fall through with a stub
      throw new Error("Wablas adapter not yet implemented");
    case "smtp":
      return new SmtpAdapter(config as SmtpConfig);
    default: {
      const _exhaustive: never = type;
      throw new Error(`Unknown provider type: ${String(_exhaustive)}`);
    }
  }
}
