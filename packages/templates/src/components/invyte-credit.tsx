"use client";

/**
 * InvyteCredit — inline bottom section shown in every invitation template.
 * Introduces Invyte + DevLab.tgk to guests who scroll to the end.
 * Distinct from the fixed <PoweredByDevLab /> badge — this is a full section.
 *
 * Color strategy: uses fixed Invyte brand green (not user's primaryColor) so
 * the credit is always readable regardless of the invitation's color palette.
 */

interface InvyteCreditProps {
  /** Pass true for templates with dark backgrounds (islamic-elegant, royal-java, etc.) */
  dark?: boolean;
}

// Fixed Invyte brand colors — independent of user's invitation color palette.
const BRAND_GREEN_LIGHT = "#2D6A4F"; // 7.5:1 contrast on white
const BRAND_GREEN_DARK = "#7EC8A0"; // 5.2:1 contrast on dark templates

export function InvyteCredit({ dark = false }: InvyteCreditProps) {
  // Surface colors — warm neutrals that blend with wedding palettes
  // Light: warm ivory (not stark white) — harmonizes with cream/floral/burgundy
  // Dark: warm sepia overlay (not flat black) — harmonizes with navy/gold templates
  const bg = dark ? "rgba(28,20,16,0.72)" : "#FBF8F3";
  const invyteColor = dark ? BRAND_GREEN_DARK : BRAND_GREEN_LIGHT;
  const accentLine = invyteColor;

  // Text hierarchy
  const labelColor = dark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.50)";
  const bodyColor = dark ? "rgba(255,255,255,0.78)" : "rgba(0,0,0,0.68)";
  const linkColor = dark ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.78)";

  // Pill / badge
  const badgeBorder = dark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.10)";
  const badgeBg = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.025)";

  return (
    <div
      style={{
        position: "relative",
        background: bg,
        padding: "56px 24px 44px",
        textAlign: "center",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        boxShadow: dark
          ? "inset 0 1px 0 rgba(255,255,255,0.06)"
          : "0 -8px 32px rgba(70,50,30,0.06), inset 0 1px 0 rgba(255,255,255,0.6)",
        backdropFilter: dark ? "blur(8px)" : "none",
        WebkitBackdropFilter: dark ? "blur(8px)" : "none",
        overflow: "hidden",
      }}
    >
      {/* Top center gradient accent line — brand mark */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 140,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${accentLine}, transparent)`,
          opacity: 0.7,
        }}
      />

      {/* Faint radial brand glow behind content */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -40,
          left: "50%",
          transform: "translateX(-50%)",
          width: 320,
          height: 320,
          background: `radial-gradient(circle, ${invyteColor}1A 0%, transparent 65%)`,
          pointerEvents: "none",
        }}
      />

      {/* Content layer */}
      <div style={{ position: "relative" }}>
        {/* Eyebrow label */}
        <p
          style={{
            fontSize: 10,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: labelColor,
            margin: "0 0 14px",
            fontWeight: 600,
          }}
        >
          Dibuat menggunakan
        </p>

        {/* Invyte name — script display */}
        <p
          style={{
            fontFamily: "'Great Vibes', cursive",
            fontSize: 56,
            color: invyteColor,
            lineHeight: 1,
            margin: "0 0 12px",
            letterSpacing: "0.01em",
          }}
        >
          Invyte
        </p>

        {/* Ornamental leaf divider */}
        <div
          aria-hidden="true"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <svg width="68" height="14" viewBox="0 0 68 14" fill="none">
            <line
              x1="0"
              y1="7"
              x2="24"
              y2="7"
              stroke={accentLine}
              strokeWidth="0.75"
              opacity="0.4"
            />
            <path
              d="M34 2 C36 4, 36 10, 34 12 C32 10, 32 4, 34 2 Z"
              fill={accentLine}
              opacity="0.75"
            />
            <circle cx="34" cy="7" r="0.8" fill={accentLine} opacity="0.95" />
            <line
              x1="44"
              y1="7"
              x2="68"
              y2="7"
              stroke={accentLine}
              strokeWidth="0.75"
              opacity="0.4"
            />
          </svg>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: 13,
            color: bodyColor,
            maxWidth: 320,
            margin: "0 auto 26px",
            lineHeight: 1.7,
          }}
        >
          Platform undangan pernikahan digital open-source untuk Indonesia.
        </p>

        {/* Primary CTA — viral discovery */}
        <a
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "10px 20px",
            borderRadius: 999,
            border: `1px solid ${invyteColor}55`,
            background: dark ? `${invyteColor}1F` : `${invyteColor}0F`,
            color: invyteColor,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.01em",
            textDecoration: "none",
            transition: "all 200ms ease",
            marginBottom: 32,
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.background = dark ? `${invyteColor}33` : `${invyteColor}1F`;
            el.style.transform = "translateY(-1px)";
            el.style.boxShadow = `0 4px 12px ${invyteColor}33`;
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.background = dark ? `${invyteColor}1F` : `${invyteColor}0F`;
            el.style.transform = "translateY(0)";
            el.style.boxShadow = "none";
          }}
          aria-label="Buat undangan digital Anda dengan Invyte"
        >
          Buat undangan Anda
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </a>

        {/* DevLab attribution — pill badge */}
        <div>
          <a
            href="https://instagram.com/devlab.tgk/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 14px 7px 8px",
              borderRadius: 999,
              border: `1px solid ${badgeBorder}`,
              background: badgeBg,
              color: linkColor,
              fontSize: 11,
              textDecoration: "none",
              transition: "all 200ms ease",
              fontWeight: 500,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.transform = "translateY(-1px)";
              el.style.borderColor = dark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.18)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.transform = "translateY(0)";
              el.style.borderColor = badgeBorder;
            }}
            aria-label="Dikembangkan oleh DevLab.tgk — Instagram"
          >
            {/* DL gradient icon */}
            <span
              aria-hidden="true"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 20,
                height: 20,
                borderRadius: 6,
                background: "linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)",
                fontSize: 9,
                fontWeight: 800,
                color: "white",
                letterSpacing: "-0.5px",
                flexShrink: 0,
                boxShadow: "0 1px 3px rgba(37,99,235,0.35)",
              }}
            >
              DL
            </span>
            <span style={{ opacity: 0.65, fontWeight: 500 }}>Dikembangkan oleh</span>
            <strong style={{ fontWeight: 700, letterSpacing: "-0.005em" }}>DevLab.tgk</strong>
          </a>
        </div>
      </div>
    </div>
  );
}
