"use client";

/**
 * PoweredByDevLab — fixed attribution badge for all Invyte invitation templates.
 * Renders as a floating pill (bottom-left) linking to DevLab.tgk Instagram.
 * Standard "Powered by" pattern used by Webflow, Framer, etc.
 */
export function PoweredByDevLab() {
  return (
    <a
      href="https://instagram.com/devlab.tgk/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Dibuat oleh DevLab.tgk — kunjungi Instagram kami"
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        zIndex: 9999,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 10px 5px 6px",
        borderRadius: 20,
        background: "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.13), 0 0 0 1px rgba(0,0,0,0.06)",
        textDecoration: "none",
        transition: "transform 0.2s ease, opacity 0.2s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)";
        (e.currentTarget as HTMLAnchorElement).style.opacity = "0.85";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
      }}
    >
      {/* DevLab DL icon — blue gradient rounded square */}
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
          flexShrink: 0,
          fontSize: 8,
          fontWeight: 800,
          color: "white",
          letterSpacing: "-0.5px",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          userSelect: "none",
        }}
      >
        DL
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
        <span style={{ color: "rgba(0,0,0,0.72)", fontWeight: 600 }}>DevLab.tgk</span>
      </span>
    </a>
  );
}
