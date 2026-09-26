import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { BEAT, COLORS, FONT } from "../config";
import { LightSky, NightFrame, Twinkles } from "../components/Backdrop";
import { Keycaps } from "../components/Keycaps";
import { blurIn, blurOut, sec } from "../lib/anim";
import type { Tone } from "../lib/timeline";

/**
 * Big words on their own, one line on each beat: every line lands from a little too large and blurred,
 * the way a title card hits in a trailer, and the earlier lines stay put.
 */
export const Slam: React.FC<{ lines: string[]; subtitle?: string; tone?: Tone; keys?: string[]; frames: number }> = ({
  lines,
  subtitle,
  tone = "night",
  keys,
  frames,
}) => {
  const frame = useCurrentFrame();
  const exit = frames - sec(BEAT * 0.9);
  const size = lines.length > 2 ? 124 : 150;
  const color = tone === "night" ? COLORS.white : COLORS.ink;
  const landAt = (i: number) => sec(BEAT * (i + 1)) - 4;
  const afterLast = landAt(lines.length - 1) + sec(BEAT * 0.6);
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      {tone === "night" ? (
        <>
          <NightFrame />
          <Twinkles />
        </>
      ) : (
        <LightSky />
      )}
      <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingBottom: subtitle ? 90 : 0 }}>
        {lines.map((line, i) => {
          const p = interpolate(frame, [landAt(i), landAt(i) + sec(0.22)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });
          const leaving = frame >= exit ? blurOut(frame, exit + i * 2, sec(0.3), 20, 16) : undefined;
          return (
            <div
              key={i}
              style={{
                fontSize: size,
                fontWeight: 700,
                letterSpacing: "-0.035em",
                lineHeight: 1.02,
                color,
                opacity: p,
                transform: `scale(${1.32 - 0.32 * p})`,
                filter: `blur(${(1 - p) * 18}px)`,
                textShadow: tone === "night" ? "0 4px 40px rgba(20, 8, 60, 0.45)" : undefined,
                ...leaving,
              }}
            >
              {line}
            </div>
          );
        })}
      </AbsoluteFill>
      {subtitle && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 540 + (lines.length * size * 1.02) / 2 - 20,
            textAlign: "center",
            fontSize: 34,
            fontWeight: 500,
            color: tone === "night" ? COLORS.whiteSoft : COLORS.inkSoft,
            ...(frame >= exit ? blurOut(frame, exit) : blurIn(frame, afterLast)),
          }}
        >
          {subtitle}
        </div>
      )}
      {keys && (
        <Keycaps keys={keys} at={afterLast} hold={exit - afterLast} size={72} tone={tone} style={{ left: 0, right: 0, top: 880, justifyContent: "center" }} />
      )}
    </AbsoluteFill>
  );
};
