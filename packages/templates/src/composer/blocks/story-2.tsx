"use client";

import { AnimateIn } from "../../components/animate-in";
import { LoveTimeline } from "../../components/love-timeline";
import type { InvitationContent } from "../../types";

interface StoryTimelineProps {
  story?: string;
  quote?: string;
  quoteAuthor?: string;
  timeline?: InvitationContent["timeline"];
  primaryColor: string;
}

export function StoryTimeline({
  story,
  quote,
  quoteAuthor,
  timeline,
  primaryColor,
}: StoryTimelineProps) {
  if (!story && !timeline?.length) return null;

  return (
    <div className="w-full max-w-2xl mx-auto px-6 py-10 space-y-8">
      {/* Section heading */}
      <AnimateIn direction="up" delay={0}>
        <p
          className="text-[10px] uppercase tracking-[0.3em] text-center font-semibold"
          style={{ color: primaryColor, opacity: 0.7 }}
        >
          Perjalanan Cinta
        </p>
      </AnimateIn>

      {/* Story paragraph */}
      {story && (
        <AnimateIn direction="up" delay={0.1}>
          <p className="text-sm leading-relaxed text-gray-600 text-center">{story}</p>
        </AnimateIn>
      )}

      {/* Quote */}
      {quote && (
        <AnimateIn direction="up" delay={0.15}>
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

      {/* Timeline */}
      {timeline && timeline.length > 0 && (
        <AnimateIn direction="up" delay={0.2}>
          <LoveTimeline items={timeline} primaryColor={primaryColor} />
        </AnimateIn>
      )}
    </div>
  );
}
