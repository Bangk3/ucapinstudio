"use client";

import { AnimateIn } from "../../components/animate-in";

interface StoryProseProps {
  story?: string;
  quote?: string;
  quoteAuthor?: string;
  primaryColor: string;
}

export function StoryProse({ story, quote, quoteAuthor, primaryColor }: StoryProseProps) {
  if (!story && !quote) return null;

  return (
    <div className="w-full max-w-xl mx-auto px-6 py-10 space-y-6">
      {/* Section heading */}
      <AnimateIn direction="up" delay={0}>
        <p
          className="text-[10px] uppercase tracking-[0.3em] text-center font-semibold"
          style={{ color: primaryColor, opacity: 0.7 }}
        >
          Kisah Kami
        </p>
      </AnimateIn>

      {/* Story paragraph */}
      {story && (
        <AnimateIn direction="left" delay={0.1}>
          <p className="text-sm leading-relaxed text-gray-600 text-center">{story}</p>
        </AnimateIn>
      )}

      {/* Quote blockquote */}
      {quote && (
        <AnimateIn direction="up" delay={0.2}>
          <blockquote
            className="pl-4 py-1 text-sm italic text-gray-500 leading-relaxed border-l-2"
            style={{ borderColor: primaryColor }}
          >
            &ldquo;{quote}&rdquo;
            {quoteAuthor && (
              <footer className="mt-1 text-xs not-italic text-gray-400">— {quoteAuthor}</footer>
            )}
          </blockquote>
        </AnimateIn>
      )}
    </div>
  );
}
