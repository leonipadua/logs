import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "#131416",
          padding: "80px",
        }}
      >
        <div
          style={{
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#8b8e96",
            marginBottom: 16,
          }}
        >
          Sabre
        </div>
        <div style={{ fontSize: 96, fontFamily: "Georgia, serif", color: "#f0efec" }}>
          Logs
        </div>
        <div style={{ fontSize: 28, color: "#c7c9ce", marginTop: 24, maxWidth: 800 }}>
          Acompanhamento de projeto em tempo real
        </div>
      </div>
    ),
    { ...size },
  );
}
