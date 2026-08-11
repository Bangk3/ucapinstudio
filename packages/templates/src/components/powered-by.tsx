"use client";

/**
 * PoweredByDevLab — small static attribution line for all invitation
 * templates. Renders in normal document flow (footer position), not a
 * floating pill — doesn't obscure content while scrolling.
 */
export function PoweredByDevLab() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "16px 0",
      }}
    >
      <a
        href="/"
        aria-label="Dibuat dengan UcapinStudio — kunjungi platform kami"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          textDecoration: "none",
        }}
      >
        {/* UcapinStudio "US" icon — green gradient rounded square */}
        <span
          aria-hidden="true"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 18,
            height: 18,
            borderRadius: 5,
            background: "linear-gradient(135deg, #6b8f6e 0%, #4a6b4d 100%)",
            flexShrink: 0,
            fontSize: 7,
            fontWeight: 800,
            color: "white",
            letterSpacing: "-0.5px",
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
            userSelect: "none",
          }}
        >
          US
        </span>

        {/* Label */}
        <span
          style={{
            fontSize: 11,
            lineHeight: 1,
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ color: "rgba(0,0,0,0.45)", fontWeight: 400 }}>by </span>
          <span style={{ color: "rgba(0,0,0,0.72)", fontWeight: 600 }}>UcapinStudio</span>
        </span>
      </a>
    </div>
  );
}
