import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT } from "../config";
import { blurOut, sec } from "../lib/anim";
import { keyDepth, leads, pressGlow } from "./PressKeys";

/**
 * Keys drawn as glass keycaps, for the moments a shortcut is pressed. `at` and `hold` are frames
 * relative to the scene. With `pressAt` the keys also play the chord, the way PressKeys does: the
 * modifiers go down first, the last key bottoms out on that frame, and they glow pink.
 */
export const Keycaps: React.FC<{
  keys: string[];
  at: number;
  hold?: number;
  size?: number;
  tone?: "night" | "light";
  pressAt?: number;
  style?: React.CSSProperties;
}> = ({ keys, at, hold = sec(1.3), size = 64, tone = "night", pressAt, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const leaving = frame >= at + hold ? blurOut(frame, at + hold) : undefined;
  if (leaving && Number(leaving.opacity) <= 0) return null;
  const lead = leads(keys);
  const glow = pressAt === undefined ? 0 : pressGlow(frame, pressAt);
  return (
    <div style={{ position: "absolute", display: "flex", gap: size * 0.18, fontFamily: FONT, ...leaving, ...style }}>
      {keys.map((key, i) => {
        const pop = spring({ frame: frame - at - i * 3, fps, config: { damping: 14, stiffness: 180, mass: 0.6 } });
        const wide = key.length > 2;
        const depth = pressAt === undefined ? 0 : keyDepth(frame, pressAt, fps, lead[i]);
        const pressShadow = glow > 0 ? `, 0 0 ${size * 0.5 * glow}px rgba(244, 143, 198, ${0.6 * glow})` : "";
        return (
          <div
            key={i}
            style={{
              minWidth: size,
              height: size,
              padding: wide ? `0 ${size * 0.36}px` : 0,
              borderRadius: size * 0.24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: wide ? size * 0.36 : size * 0.46,
              fontWeight: 600,
              color: tone === "night" ? "#FFFFFF" : "#1B1830",
              background:
                tone === "night"
                  ? "linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.08))"
                  : "linear-gradient(180deg, #FFFFFF, #F1EDF9)",
              border: tone === "night" ? "1.5px solid rgba(255,255,255,0.32)" : "1.5px solid rgba(27,24,48,0.12)",
              boxShadow:
                tone === "night"
                  ? "0 10px 30px rgba(10, 4, 40, 0.45), inset 0 1px 0 rgba(255,255,255,0.35)" + pressShadow
                  : "0 10px 30px rgba(80, 60, 140, 0.18), inset 0 -3px 0 rgba(27,24,48,0.06)" + pressShadow,
              backdropFilter: "blur(18px)",
              transform: `scale(${0.6 + pop * 0.4}) translateY(${(1 - pop) * 10 + depth * size * 0.08}px)`,
              opacity: Math.min(1, pop * 1.4),
            }}
          >
            {key}
          </div>
        );
      })}
    </div>
  );
};
