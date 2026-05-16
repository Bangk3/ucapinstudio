import { type AnthropicProvider, estimateCostUsd } from "../providers/anthropic.js";
import type {
  GenerateVariantsParams,
  GenerateVariantsResult,
  GenerationVariant,
} from "../types.js";

const SYSTEM_PROMPT = `You are an expert wedding invitation designer for Indonesian couples.
Output ONLY a JSON array of exactly 3 design variants. No markdown, no explanation.
Each variant must have: primaryColor (hex), accentColor (hex), fontHeading (Google Font name),
fontBody (Google Font name), headline (string), tagline (string), story (string, 2-3 sentences in Indonesian),
quote (string), quoteAuthor (string), moodLabel (string in Indonesian).

Color rules:
- primaryColor must have WCAG AA contrast ≥ 4.5:1 against white (#ffffff)
- Use warm or nature-inspired palettes appropriate for weddings
- Variants must be visually distinct from each other

Font rules (only use fonts from this list):
headings: Playfair Display, Cormorant Garamond, Great Vibes, Dancing Script, Libre Baskerville, EB Garamond, Josefin Sans
body: Lato, Open Sans, Poppins, Raleway, Montserrat

Content rules:
- headline: short poetic phrase (max 8 words)
- tagline: one sentence about the couple's story
- story: 2-3 sentences about love and celebration, personalized with names
- quote: inspirational quote about love or marriage
- quoteAuthor: attribution for the quote
- moodLabel: 2-word mood label in Indonesian (e.g. "Elegan Modern", "Romantis Klasik")`;

export async function generateVariants(
  provider: AnthropicProvider,
  params: GenerateVariantsParams,
): Promise<GenerateVariantsResult> {
  const { groomName, brideName, style = "modern", mood = "romantic" } = params;

  const userPrompt = `Generate 3 design variants for a ${style} ${mood} wedding invitation.
Groom: ${groomName}
Bride: ${brideName}
Primary language: ${params.primaryLanguage ?? "id"}
Style: ${style}
Mood: ${mood}

Create 3 distinctly different variants. Personalize the story and headline with their names.`;

  const result = await provider.complete(SYSTEM_PROMPT, userPrompt, 2048);

  let variants: GenerationVariant[];
  try {
    // Strip any markdown code fences if present
    const clean = result.text
      .replace(/^```(?:json)?\n?/m, "")
      .replace(/\n?```$/m, "")
      .trim();
    variants = JSON.parse(clean) as GenerationVariant[];
    if (!Array.isArray(variants) || variants.length !== 3) {
      throw new Error("Expected array of 3 variants");
    }
  } catch (err) {
    throw new Error(
      `AI response parsing failed: ${err instanceof Error ? err.message : String(err)}\nRaw: ${result.text.slice(0, 200)}`,
    );
  }

  const costUsd = estimateCostUsd(result.inputTokens, result.outputTokens, provider.model);

  return {
    variants: variants as [GenerationVariant, GenerationVariant, GenerationVariant],
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    model: provider.model,
    costUsd,
  };
}
