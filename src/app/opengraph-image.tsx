import { ImageResponse } from "next/og";
import { site } from "@/content/site";

export const alt = `${site.name} · ${site.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* The share card: paper, ink and one block of indigo with the adire rings. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#f4f0e7", color: "#17150f" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72 }}>
          <div style={{ fontSize: 22, letterSpacing: 4, textTransform: "uppercase", color: "#6c6658" }}>
            {`${site.role} · ${site.location}`}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 84, lineHeight: 1, letterSpacing: -2 }}>I build software</div>
            <div style={{ fontSize: 84, lineHeight: 1, letterSpacing: -2, display: "flex" }}>
              <span>that has to be&nbsp;</span>
              <span style={{ color: "#243174", fontStyle: "italic" }}>right.</span>
            </div>
          </div>
          <div style={{ fontSize: 34 }}>{site.name}</div>
        </div>
        <div style={{ width: 360, background: "#243174", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="240" height="240" viewBox="0 0 100 100">
            <g fill="none" stroke="#f4f0e7" strokeWidth="4">
              <circle cx="50" cy="50" r="40" />
              <circle cx="50" cy="50" r="27" />
            </g>
            <circle cx="50" cy="50" r="12" fill="#f4f0e7" />
          </svg>
        </div>
      </div>
    ),
    size,
  );
}
