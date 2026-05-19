import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
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
          background: "rgba(255,255,255,0.94)",
          borderRadius: "112px",
          display: "flex",
          height: "320px",
          justifyContent: "center",
          width: "320px",
        }}
      >
        <div
          style={{
            color: "#080d17",
            display: "flex",
            fontSize: 172,
            fontWeight: 900,
            letterSpacing: "-0.08em",
            marginLeft: "-10px",
          }}
        >
          E
        </div>
      </div>
    </div>,
    size,
  );
}
