import React from "react";
import { useCurrentFrame } from "remotion";
import { SCREEN, WIDTH } from "../config";

/**
 * Meraline's world: a violet night sky with a lavender glow high on the right and a pink one low on the
 * left, where the mascot's sparkles twinkle. It is drawn in the screen's own points, so the full-screen
 * still behind the app while recording (BackdropStill) and the background in the video are the same
 * picture: `scale` is pixels per point, `offsetY` how far down the screen the frame starts.
 */
export const NightSky: React.FC<{ scale: number; offsetY?: number }> = ({ scale, offsetY = 0 }) => {
  const w = SCREEN.width * scale;
  const h = SCREEN.height * scale;
  return (
    <div style={{ position: "absolute", left: 0, top: -offsetY * scale, width: w, height: h, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, #0E0A24 0%, #181046 36%, #2A1664 70%, #3B1C72 100%)",
        }}
      />
      <Glow x={0.8} y={0.1} rx={0.62} ry={0.55} color="rgba(142, 108, 240, 0.50)" />
      <Glow x={0.14} y={1.02} rx={0.75} ry={0.5} color="rgba(244, 143, 198, 0.42)" />
      <Glow x={0.98} y={0.96} rx={0.4} ry={0.32} color="rgba(244, 143, 198, 0.22)" />
      <Glow x={0.42} y={0.42} rx={0.5} ry={0.4} color="rgba(96, 70, 200, 0.18)" />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(6, 4, 18, 0.55) 100%)",
        }}
      />
    </div>
  );
};

/** The light chapters: nearly white, with the same two glows, faint. */
export const LightSky: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #FCFBFF 0%, #F1ECFB 100%)" }} />
    <FrameGlow x={0.86} y={0.08} rx={0.55} ry={0.5} color="rgba(142, 108, 240, 0.16)" />
    <FrameGlow x={0.1} y={1.05} rx={0.7} ry={0.45} color="rgba(244, 143, 198, 0.18)" />
  </div>
);

/**
 * How much colour to take out of the sky: `true` or 1 for fully grey (anonymous mode's graphite night),
 * a number in between for part of the way, as a CSS filter.
 */
export type Grayscale = boolean | number;

const grayFilter = (grayscale: Grayscale | undefined) => {
  const amount = grayscale === true ? 1 : grayscale === false || grayscale === undefined ? 0 : Math.min(1, Math.max(0, grayscale));
  return amount > 0 ? `grayscale(${amount}) brightness(${1 - 0.06 * amount}) contrast(${1 + 0.08 * amount})` : undefined;
};

/** The night sky as it sits behind the recorded region, filling the frame. `grayscale` drains its colour. */
export const NightFrame: React.FC<{ grayscale?: Grayscale }> = ({ grayscale }) => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden", filter: grayFilter(grayscale) }}>
    <NightSky scale={WIDTH / SCREEN.width} offsetY={SCREEN.region.y} />
  </div>
);

const Glow: React.FC<{ x: number; y: number; rx: number; ry: number; color: string }> = ({ x, y, rx, ry, color }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: `radial-gradient(${rx * 100}% ${ry * 100}% at ${x * 100}% ${y * 100}%, ${color} 0%, transparent 70%)`,
    }}
  />
);

const FrameGlow = Glow;

/** The mascot's sparkle, a four-point star with curved sides (the app icon's own path). */
export const SPARKLE_PATH =
  "M512 140 C546 140 560 360 628 424 C694 488 884 486 884 520 C884 554 694 552 628 616 C560 680 546 900 512 900 C478 900 464 680 396 616 C330 552 140 554 140 520 C140 486 330 488 396 424 C464 360 478 140 512 140 Z";

export const Sparkle: React.FC<{ size: number; color?: string; style?: React.CSSProperties }> = ({
  size,
  color = "#FFFFFF",
  style,
}) => (
  <svg width={size} height={size} viewBox="120 120 784 784" style={style}>
    <path d={SPARKLE_PATH} fill={color} />
  </svg>
);

/**
 * Sparkles that twinkle over the night sky. Their places keep clear of where the panel sits in the
 * recordings (the right half of the frame), so they never cross the app.
 */
const TWINKLES: { x: number; y: number; size: number; phase: number }[] = [
  { x: 96, y: 118, size: 22, phase: 0.1 },
  { x: 330, y: 64, size: 12, phase: 0.55 },
  { x: 612, y: 150, size: 16, phase: 0.8 },
  { x: 780, y: 58, size: 10, phase: 0.3 },
  { x: 170, y: 330, size: 10, phase: 0.95 },
  { x: 700, y: 360, size: 13, phase: 0.2 },
  { x: 58, y: 560, size: 14, phase: 0.65 },
  { x: 520, y: 520, size: 9, phase: 0.4 },
  { x: 250, y: 800, size: 18, phase: 0.85 },
  { x: 640, y: 930, size: 12, phase: 0.05 },
  { x: 90, y: 1000, size: 10, phase: 0.5 },
  { x: 1890, y: 1050, size: 12, phase: 0.7 },
  { x: 1000, y: 60, size: 11, phase: 0.35 },
  { x: 900, y: 1040, size: 9, phase: 0.9 },
];

/** `grayscale` gives them a neutral white glow instead of the pink one, for the grey night. */
export const Twinkles: React.FC<{ opacity?: number; grayscale?: Grayscale }> = ({ opacity = 1, grayscale }) => {
  const frame = useCurrentFrame();
  const grey = grayscale === true || (typeof grayscale === "number" && grayscale >= 0.5);
  return (
    <div style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none", filter: grayFilter(grayscale) }}>
      {TWINKLES.map((t, i) => {
        const wave = (Math.sin((frame / 60) * 1.6 + t.phase * Math.PI * 2) + 1) / 2;
        const scale = 0.55 + wave * 0.45;
        return (
          <Sparkle
            key={i}
            size={t.size * 2}
            style={{
              position: "absolute",
              left: t.x - t.size,
              top: t.y - t.size,
              opacity: 0.25 + wave * 0.6,
              transform: `scale(${scale}) rotate(${wave * 20}deg)`,
              filter: grey ? "drop-shadow(0 0 6px rgba(235, 235, 240, 0.75))" : "drop-shadow(0 0 6px rgba(255, 220, 245, 0.8))",
            }}
          />
        );
      })}
    </div>
  );
};

