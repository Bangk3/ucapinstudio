import { ImageResponse } from "next/og";

export const alt = "UcapinStudio — Digital Wedding Invitation Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(160deg, #fdf5f2 0%, #ffffff 100%)",
      }}
    >
      <div
        style={{
          fontSize: 96,
          fontStyle: "italic",
          color: "#c9738a",
          marginBottom: 8,
        }}
      >
        UcapinStudio
      </div>
      <div style={{ fontSize: 28, color: "#57534e", letterSpacing: 2 }}>
        UNDANGAN PERNIKAHAN DIGITAL UNTUK INDONESIA
      </div>
    </div>,
    { ...size },
  );
}
