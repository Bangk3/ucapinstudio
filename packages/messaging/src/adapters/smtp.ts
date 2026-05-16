import nodemailer, { type Transporter } from "nodemailer";
import type {
  MessagingProvider,
  MessagingProviderType,
  SendMessageParams,
  SendResult,
  SmtpConfig,
} from "../types.js";

export class SmtpAdapter implements MessagingProvider {
  readonly name: MessagingProviderType = "smtp";
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(config: SmtpConfig) {
    this.from = config.from;
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password,
      },
    });
  }

  async send(params: SendMessageParams): Promise<SendResult> {
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: params.to,
        subject: "Undangan Digital",
        html: params.body,
      });

      const providerId = typeof info.messageId === "string" ? info.messageId : undefined;

      return {
        success: true,
        ...(providerId !== undefined ? { providerId } : {}),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "SMTP error";
      return { success: false, error: message };
    }
  }
}
