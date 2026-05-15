"use client";
import { motion } from "framer-motion";

export interface TimelineItem {
  year: string;
  title: string;
  description?: string;
  emoji?: string;
}

export interface LoveTimelineProps {
  items: TimelineItem[];
  primaryColor?: string;
  className?: string;
}

export function LoveTimeline({
  items,
  primaryColor = "#6b8f6e",
  className = "",
}: LoveTimelineProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className={`relative ${className}`}>
      {/* Center line */}
      <div
        className="absolute left-4 top-0 bottom-0 w-0.5 md:left-1/2 md:-translate-x-px"
        style={{ backgroundColor: primaryColor, opacity: 0.3 }}
      />

      <div className="space-y-8">
        {items.map((item, index) => {
          const isRight = index % 2 === 1;
          return (
            <div
              key={`${item.year}-${index}`}
              className={`relative flex items-start gap-4 md:gap-0 ${isRight ? "md:flex-row-reverse" : "md:flex-row"}`}
            >
              {/* Dot on center line */}
              <motion.div
                className="relative z-10 shrink-0 ml-0.5 md:absolute md:left-1/2 md:-translate-x-1/2 md:top-3"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: index * 0.3,
                  ease: "easeInOut",
                }}
              >
                <div
                  className="h-4 w-4 rounded-full ring-2 ring-white ring-offset-1"
                  style={{ backgroundColor: primaryColor }}
                />
              </motion.div>

              {/* Card */}
              <motion.div
                className={`ml-6 flex-1 md:ml-0 md:w-[45%] ${isRight ? "md:mr-[55%]" : "md:ml-[55%]"}`}
                initial={{ opacity: 0, x: isRight ? 30 : -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
              >
                <div className="rounded-xl border bg-white/80 p-4 shadow-sm backdrop-blur-sm">
                  <div className="flex items-start gap-2 mb-1">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {item.year}
                    </span>
                    {item.emoji && (
                      <span aria-hidden="true" className="text-lg leading-none">
                        {item.emoji}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm mt-1">{item.title}</h3>
                  {item.description && (
                    <p className="mt-1 text-xs text-gray-600 leading-relaxed">{item.description}</p>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
