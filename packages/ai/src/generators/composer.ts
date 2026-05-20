import { estimateCostUsd } from "../providers/anthropic";
import type { IAiProvider } from "../types";

export interface GenerateComposerRecipeParams {
  groomName: string;
  brideName: string;
  style?: string;
  mood?: string;
  hasTimeline?: boolean;
  hasGallery?: boolean;
  primaryLanguage?: string;
}

export interface GenerateComposerRecipeResult {
  recipe: object; // ComposerRecipe — typed as object to avoid cross-package import
  inputTokens: number;
  outputTokens: number;
  model: string;
  costUsd: number;
}

const COMPOSER_SYSTEM_PROMPT = `You are an expert wedding invitation layout designer for Indonesian couples.
Output ONLY a single JSON object matching this exact schema. No markdown, no explanation.

Schema:
{
  "version": 1,
  "heroVariant": <1|2|3>,        // 1=centered full-screen, 2=split photo+text, 3=botanical minimal
  "galleryVariant": <1|2|3>,     // 1=masonry grid, 2=horizontal carousel, 3=polaroid cards
  "storyVariant": <1|2>,         // 1=prose paragraph, 2=timeline milestones
  "animationPreset": <"soft-fade"|"slide-up"|"spring"|"minimal"|"dramatic">,
  "dividerStyle": <"petal"|"geometric"|"wave"|"none">,
  "sections": [
    { "type": "hero", "enabled": true },
    { "type": "couple", "enabled": true },
    { "type": "countdown", "enabled": true },
    { "type": "events", "enabled": true },
    { "type": "story", "enabled": true },
    { "type": "gallery", "enabled": <true if hasGallery> },
    { "type": "amplop", "enabled": true },
    { "type": "rsvp", "enabled": true },
    { "type": "wishes", "enabled": true }
  ]
}

Rules:
- heroVariant 1: romantic/elegant/traditional styles
- heroVariant 2: modern/minimalist styles
- heroVariant 3: natural/botanical/garden styles
- galleryVariant 3 (polaroid): only for cheerful/playful moods
- animationPreset "dramatic": only for luxurious/mewah moods
- animationPreset "minimal": for minimalist styles
- dividerStyle "petal": for romantic/floral styles
- dividerStyle "geometric": for modern/minimalist
- dividerStyle "wave": for natural/tropical
- countdown section: keep enabled true unless mood is "tradisional kuno" (then false)
- Section order MUST be: hero → couple → countdown → events → story → gallery → amplop → rsvp → wishes
- Match all choices to the style and mood provided`;

export async function generateComposerRecipe(
  provider: IAiProvider,
  params: GenerateComposerRecipeParams,
): Promise<GenerateComposerRecipeResult> {
  const {
    groomName,
    brideName,
    style = "modern",
    mood = "romantic",
    hasTimeline = false,
    hasGallery = false,
    primaryLanguage = "id",
  } = params;

  const userPrompt = `Generate a layout recipe for a ${style} ${mood} wedding invitation.
Groom: ${groomName}
Bride: ${brideName}
Primary language: ${primaryLanguage}
Style: ${style}
Mood: ${mood}
Has timeline: ${hasTimeline}
Has gallery: ${hasGallery}

Pick the most fitting heroVariant, galleryVariant, storyVariant, animationPreset, dividerStyle, and sections for this style and mood.
If hasGallery is false, set gallery section enabled to false.
If hasTimeline is true and storyVariant is 2, include timeline milestones context in story.`;

  // Use 2048 tokens: thinking models (e.g. gemini-3-flash-preview) burn ~500 tokens
  // internally before emitting output; recipe JSON needs ~200 tokens output.
  const result = await provider.complete(COMPOSER_SYSTEM_PROMPT, userPrompt, 2048);

  let recipe: object;
  try {
    const clean = result.text
      .replace(/^```(?:json)?\n?/m, "")
      .replace(/\n?```$/m, "")
      .trim();
    recipe = JSON.parse(clean) as object;
  } catch (err) {
    throw new Error(
      `AI response parsing failed: ${err instanceof Error ? err.message : String(err)}\nRaw: ${result.text.slice(0, 300)}`,
    );
  }

  const costUsd = estimateCostUsd(result.inputTokens, result.outputTokens, provider.model);

  return {
    recipe,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    model: provider.model,
    costUsd,
  };
}
