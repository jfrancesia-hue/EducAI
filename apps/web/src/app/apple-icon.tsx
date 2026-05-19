import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "linear-gradient(145deg, #080d17 0%, #16233a 52%, #18b6a4 100%)",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <div
        style={{
          alignItems: "center",
          background: "rgba(255,255,255,0.96)",
          borderRadius: "40px",
          display: "flex",
          height: "112px",
          justifyContent: "center",
          width: "112px",
        }}
      >
        <div
          style={{
            color: "#080d17",
            display: "flex",
            fontSize: 72,
            fontWeight: 900,
            letterSpacing: "-0.08em",
            marginLeft: "-4px",
          }}
        >
          E
        </div>
      </div>
    </div>,
    size,
  );
}
