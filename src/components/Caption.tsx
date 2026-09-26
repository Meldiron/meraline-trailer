import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, FONT } from "../config";
import { blurIn, blurOut, sec } from "../lib/anim";

export type Tone = "night" | "light";

/**
 * A caption as the Droppy film does them: the title's words blur in one after another, the subtitle's
 * words follow a beat later (or at `subtitleAt`), and at `exitAt` everything blurs away, first word
 * first. Frames are relative to the scene.
 */
export const Caption: React.FC<{
  title: string;
  subtitle?: string;
  enterAt: number;
  /** When the subtitle starts, if not just after the title. */
  subtitleAt?: number;
  exitAt?: number;
  tone?: Tone;
  align?: "left" | "center";
  size?: number;
  style?: React.CSSProperties;
}> = ({ title, subtitle, enterAt, subtitleAt, exitAt, tone = "night", align = "left", size = 76, style }) => {
  const frame = useCurrentFrame();
  const titleWords = title.split(" ");
  const subtitleWords = subtitle ? subtitle.split(" ") : [];
  const wordStep = sec(0.075);
  const subtitleStart = subtitleAt ?? enterAt + titleWords.length * wordStep + sec(0.18);
  const color = tone === "night" ? COLORS.white : COLORS.ink;
  const soft = tone === "night" ? COLORS.whiteSoft : COLORS.inkSoft;

  const word = (text: string, index: number, start: number, step: number, exitStep: number) => {
    const exit = exitAt !== undefined ? exitAt + index * exitStep : undefined;
    const look = exit !== undefined && frame >= exit ? blurOut(frame, exit) : blurIn(frame, start + index * step);
    return (
      <span key={index} style={{ display: "inline-block", whiteSpace: "pre", ...look }}>
        {text}
        {" "}
      </span>
    );
  };

  return (
    <div
      style={{
        position: "absolute",
        fontFamily: FONT,
        textAlign: align,
        ...style,
      }}
    >
      <div
        style={{
          fontSize: size,
          fontWeight: 650,
          letterSpacing: "-0.025em",
          lineHeight: 1.08,
          color,
          textShadow: tone === "night" ? "0 2px 30px rgba(20, 8, 60, 0.35)" : undefined,
          textWrap: "balance",
        }}
      >
        {titleWords.map((w, i) => word(w, i, enterAt, wordStep, sec(0.03)))}
      </div>
      {subtitleWords.length > 0 && (
        <div
          style={{
            marginTop: size * 0.32,
            fontSize: size * 0.34,
            fontWeight: 500,
            letterSpacing: "-0.005em",
            lineHeight: 1.38,
            color: soft,
            textWrap: "balance",
            maxWidth: align === "center" ? 1100 : size * 8.4,
            marginLeft: align === "center" ? "auto" : undefined,
            marginRight: align === "center" ? "auto" : undefined,
          }}
        >
          {subtitleWords.map((w, i) => word(w, i, subtitleStart, sec(0.028), sec(0.012)))}
        </div>
      )}
    </div>
  );
};
