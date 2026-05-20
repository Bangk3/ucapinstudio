import { estimateCostUsd } from "../providers/anthropic";
import type {
  GenerateVariantsParams,
  GenerateVariantsResult,
  GenerationVariant,
  IAiProvider,
} from "../types";

const SYSTEM_PROMPT = `You are an expert wedding invitation designer for Indonesian couples.
Output ONLY a valid JSON array of exactly 3 design variants. No markdown, no code fences, no explanation.

CRITICAL JSON RULES (strict — invalid JSON breaks the system):
- Output raw JSON only, starting with [ and ending with ]
- NEVER use double-quote characters inside string values — use single quotes instead (apostrophe)
- All property names and string values must use straight double quotes only
- Do not use smart/curly quotes anywhere
- NO trailing commas — last property in object and last item in array MUST NOT have comma after
- NO line breaks inside string values — keep each string on one line
- NO comments (// or /* */) anywhere
- Every { needs matching } and every [ needs matching ]
- Properties separated by commas (no missing commas between fields)

Each variant object must have exactly these fields:
{
  "primaryColor": "#hex",
  "accentColor": "#hex",
  "fontHeading": "Font Name",
  "fontBody": "Font Name",
  "headline": "short phrase max 8 words",
  "tagline": "one sentence, no inner quotes",
  "story": "2-3 sentences in Indonesian, no inner quotes",
  "quote": "inspirational quote, no inner quotes",
  "quoteAuthor": "Author Name",
  "moodLabel": "Dua Kata",
  "timeline": [
    { "year": "2019", "title": "Pertama Bertemu", "description": "1 short Indonesian sentence", "emoji": "💝" },
    { "year": "2021", "title": "Resmi Berpacaran", "description": "1 short Indonesian sentence", "emoji": "💕" },
    { "year": "2024", "title": "Lamaran", "description": "1 short Indonesian sentence", "emoji": "💍" },
    { "year": "2026", "title": "Hari Bahagia", "description": "1 short Indonesian sentence", "emoji": "👰" }
  ]
}

Color rules:
- primaryColor must have WCAG AA contrast >= 4.5:1 against white (#ffffff)
- Use warm or nature-inspired palettes appropriate for weddings
- Variants must be visually distinct from each other

Font rules (only use fonts from this list):
headings: Playfair Display, Cormorant Garamond, Great Vibes, Dancing Script, Libre Baskerville, EB Garamond, Josefin Sans
body: Lato, Open Sans, Poppins, Raleway, Montserrat

Content rules:
- headline: short poetic phrase, max 8 words, no inner quotes
- tagline: one sentence about the couple, no inner quotes
- story: 2-3 sentences in Indonesian, personalized with names, no inner quotes
- quote: short inspirational quote about love or marriage, no inner quotes
- quoteAuthor: attribution for the quote
- moodLabel: 2-word mood label in Indonesian (e.g. Elegan Modern, Romantis Klasik)
- timeline: exactly 4 milestones in chronological order (meet → dating → propose → wedding)
  - year: 4-digit year as string, spaced ~1-3 years apart, ending around current year
  - title: short Indonesian noun phrase (2-4 words) e.g. "Pertama Bertemu", "Lamaran"
  - description: ONE short Indonesian sentence under 12 words, no inner quotes
  - emoji: single emoji character matching the milestone (e.g. 💝 💕 💍 👰 💐 🎓 ✨)
  - All 3 variants must have DIFFERENT timeline phrasing — do not repeat the same descriptions`;

/**
 * Robustly parse the model's JSON output into a GenerationVariant array.
 *
 * Handles common LLM output issues:
 * - Markdown code fences (```json ... ```)
 * - Smart/curly quotes (Unicode) replaced with straight quotes
 * - Unescaped double-quotes inside string values (e.g. value with "word" inside)
 * - Extra text before/after the JSON array
 */
function parseVariantsJson(raw: string): GenerationVariant[] {
  // 1. Strip markdown code fences
  let text = raw
    .replace(/^```(?:json)?\s*/im, "")
    .replace(/\s*```\s*$/im, "")
    .trim();

  // 2. Extract the JSON array — find first [ … last ]
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }

  // 3. Replace Unicode smart/curly quotes with straight ASCII quotes
  text = text
    .replace(/[“”„‟«»]/g, '"') // curly double quotes
    .replace(/[‘’ʼ‹›]/g, "'"); // curly single quotes

  // 4. Multi-strategy repair pipeline — try each successively cleaner version.
  //    Each strategy returns a parsed array on success, or throws to fall through.
  const strategies: Array<(s: string) => string> = [
    (s) => s, // raw
    stripTrailingCommas,
    fixUnescapedQuotes,
    (s) => fixUnescapedQuotes(stripTrailingCommas(s)),
    (s) => escapeNewlinesInStrings(fixUnescapedQuotes(stripTrailingCommas(s))),
  ];

  let lastErr: unknown = null;
  for (const repair of strategies) {
    try {
      const repaired = repair(text);
      const parsed = JSON.parse(repaired) as GenerationVariant[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Not an array");
      }
      return parsed;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Unknown parse error");
}

/**
 * Remove trailing commas before `}` or `]`. Common LLM failure mode.
 * E.g. `{ "a": 1, }` → `{ "a": 1 }`
 */
function stripTrailingCommas(input: string): string {
  return input.replace(/,(\s*[}\]])/g, "$1");
}

/**
 * Escape literal newlines/tabs/carriage returns that appear inside JSON strings.
 * LLMs sometimes emit multi-line string values which is invalid JSON.
 */
function escapeNewlinesInStrings(input: string): string {
  const out: string[] = [];
  let inString = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i] as string;
    const prev = i > 0 ? input[i - 1] : "";
    if (ch === '"' && prev !== "\\") {
      inString = !inString;
      out.push(ch);
      continue;
    }
    if (inString) {
      if (ch === "\n") {
        out.push("\\n");
        continue;
      }
      if (ch === "\r") {
        out.push("\\r");
        continue;
      }
      if (ch === "\t") {
        out.push("\\t");
        continue;
      }
    }
    out.push(ch);
  }
  return out.join("");
}

/**
 * Walk the JSON string char-by-char. When inside a JSON string value,
 * any bare " (not preceded by \) that appears mid-value gets escaped.
 * This handles the common Llama issue of writing "text with "quoted" word".
 */
function fixUnescapedQuotes(input: string): string {
  const out: string[] = [];
  let inString = false;
  let isValue = false; // true when the current string is a value (not a key)
  let _expectColon = false;
  let colonSeen = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const prev = i > 0 ? input[i - 1] : "";

    if (ch === '"' && prev !== "\\") {
      if (!inString) {
        // Opening quote
        inString = true;
        isValue = colonSeen;
        out.push(ch);
      } else {
        // Potential closing quote — peek ahead to decide if this ends the string
        // A closing quote is followed by: whitespace, ':', ',', '}', ']'
        let j = i + 1;
        while (
          j < input.length &&
          (input[j] === " " || input[j] === "\t" || input[j] === "\n" || input[j] === "\r")
        )
          j++;
        const next = input[j] ?? "";
        if (":,}]".includes(next)) {
          // Genuine closing quote
          inString = false;
          if (isValue) {
            colonSeen = false;
          }
          if (!isValue) {
            _expectColon = true;
            colonSeen = false;
          }
          out.push(ch);
        } else {
          // Mid-string unescaped quote — escape it
          out.push('\\"');
        }
      }
    } else {
      if (!inString && ch === ":") {
        colonSeen = true;
        _expectColon = false;
      }
      if (!inString && (ch === "," || ch === "{")) {
        colonSeen = false;
      }
      if (ch !== undefined) out.push(ch);
    }
  }
  return out.join("");
}

export async function generateVariants(
  provider: IAiProvider,
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

  // 4096 tokens: timeline adds ~250 tokens per variant × 3 = ~750 tokens extra.
  // 2048 was tight (often truncated mid-JSON). 4096 leaves headroom for
  // thinking-models (gemini) that burn internal tokens before emitting output.
  const result = await provider.complete(SYSTEM_PROMPT, userPrompt, 4096);

  let variants: GenerationVariant[];
  try {
    variants = parseVariantsJson(result.text);
  } catch (err) {
    throw new Error(
      `AI response parsing failed: ${err instanceof Error ? err.message : String(err)}\nRaw: ${result.text.slice(0, 300)}`,
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
