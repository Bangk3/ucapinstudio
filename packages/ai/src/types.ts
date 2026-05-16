export interface GenerationVariant {
  primaryColor: string; // hex e.g. "#6b8f6e"
  accentColor: string; // hex
  fontHeading: string; // Google Font name e.g. "Playfair Display"
  fontBody: string; // Google Font name e.g. "Lato"
  headline: string; // short headline e.g. "Sebuah Kisah Cinta"
  tagline: string; // 1-sentence tagline
  story: string; // 2-3 sentence love story paragraph
  quote: string; // short inspirational quote
  quoteAuthor: string; // quote attribution
  moodLabel: string; // mood label e.g. "Romantis Modern"
}

export interface GenerateVariantsParams {
  groomName: string;
  brideName: string;
  style?: string; // e.g. "modern", "traditional", "islamic"
  mood?: string; // e.g. "romantic", "elegant", "minimalist"
  primaryLanguage?: "id" | "en";
}

export interface GenerateVariantsResult {
  variants: [GenerationVariant, GenerationVariant, GenerationVariant];
  inputTokens: number;
  outputTokens: number;
  model: string;
  costUsd: number;
}

export interface AiProviderConfig {
  apiKey: string;
  model?: string;
}
