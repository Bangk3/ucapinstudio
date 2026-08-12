import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Matches the "US" mark used in the footer credit and template preview badge.
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 7,
        background: "linear-gradient(135deg, #6b8f6e 0%, #4a6b4d 100%)",
        color: "white",
        fontSize: 15,
        fontWeight: 800,
        letterSpacing: -0.5,
      }}
    >
      US
    </div>,
    { ...size },
  );
}
