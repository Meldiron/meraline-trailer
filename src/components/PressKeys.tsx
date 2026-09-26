import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT } from "../config";
import { blurOut, sec } from "../lib/anim";

/** Keys a shortcut holds while the last one is tapped. They go down first and come up with it. */
const MODIFIERS = ["⌃", "⌥", "⇧", "⌘", "fn"];

/**
 * How far a key is pressed, 0 (resting) to 1 (bottomed out), around a press that bottoms out on
 * `pressAt`. A modifier goes down `lead` frames earlier and is held, the way a hand plays a shortcut;
 * every key comes back up together with a small spring, overshooting a touch above rest.
 */
export function keyDepth(frame: number, pressAt: number, fps: number, lead = 0): number {
  const downAt = pressAt - lead;
  const travel = 3;
  if (frame < downAt - travel) return 0;
  if (frame < downAt) return Easing.in(Easing.quad)((frame - (downAt - travel)) / travel);
  const upAt = pressAt + 5;
  if (frame < upAt) return 1;
  const s = spring({ frame: frame - upAt, fps, config: { damping: 10, stiffness: 320, mass: 0.5 } });
  return Math.max(-0.3, 1 - s);
}

/** How many frames before the chord each key goes down: modifiers first, in the order they're held. */
export function leads(keys: string[]): number[] {
  const mods = keys.filter((k) => MODIFIERS.includes(k)).length;
  let m = 0;
  return keys.map((k) => (MODIFIERS.includes(k) ? 4 + (mods - 1 - m++) * 3 : 0));
}

/** The light a press gives off: a quick glow that lingers a little longer than the key stays down. */
export function pressGlow(frame: number, pressAt: number): number {
  return interpolate(frame, [pressAt - 2, pressAt, pressAt + sec(0.55)], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
}

export type KeyTone = "night" | "light";

/**
 * One keycap with some depth: its side shows under the face, and pressing it sinks the face into it,
 * the shadow tightening and the key glowing in `accent`.
 */
export const Keycap: React.FC<{
  label: string;
  size: number;
  tone?: KeyTone;
  /** 0 resting, 1 bottomed out, below 0 a little above rest (the spring back). */
  depth?: number;
  /** 0 to 1, the glow of a press. */
  glow?: number;
  accent?: string;
  style?: React.CSSProperties;
}> = ({ label, size, tone = "night", depth = 0, glow = 0, accent = COLORS.pink, style }) => {
  const wide = label.length > 2;
  const edge = size * 0.07;
  const d = depth;
  const down = Math.max(0, d);
  const night = tone === "night";
  const [r, g, b] = rgb(accent);
  return (
    <div
      style={{
        minWidth: wide ? size * 2.1 : size,
        height: size,
        padding: wide ? `0 ${size * 0.4}px` : 0,
        boxSizing: "border-box",
        borderRadius: size * 0.23,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT,
        fontSize: wide ? size * 0.34 : size * 0.46,
        fontWeight: 600,
        letterSpacing: wide ? "0.01em" : undefined,
        color: night ? "#FFFFFF" : COLORS.ink,
        textShadow: glow > 0 ? `0 0 ${size * 0.2 * glow}px rgba(${r}, ${g}, ${b}, ${0.9 * glow})` : undefined,
        background: night
          ? `linear-gradient(180deg, rgba(255,255,255,${0.24 + 0.1 * glow}), rgba(255,255,255,${0.08 + 0.08 * glow}))`
          : `linear-gradient(180deg, #FFFFFF, ${down > 0.5 ? "#EFEBF8" : "#F4F1FA"})`,
        border: night ? `${Math.max(1.5, size * 0.009)}px solid rgba(255,255,255,${0.32 + 0.2 * glow})` : "1.5px solid rgba(27,24,48,0.10)",
        boxShadow: [
          // The key's side, shrinking as the face sinks into it.
          `0 ${edge * (1 - down)}px 0 ${night ? "rgba(14, 8, 44, 0.55)" : "#DDD7EC"}`,
          // Its shadow on the surface, tighter when pressed.
          `0 ${size * 0.13 * (1 - 0.6 * down) + edge}px ${size * 0.3 * (1 - 0.45 * down)}px ${night ? "rgba(8, 3, 36, 0.5)" : "rgba(80, 60, 140, 0.20)"}`,
          night ? "inset 0 2px 0 rgba(255,255,255,0.35)" : "inset 0 -2px 0 rgba(27,24,48,0.05)",
          `0 0 ${size * 0.5 * glow}px rgba(${r}, ${g}, ${b}, ${0.6 * glow})`,
        ].join(", "),
        backdropFilter: night ? "blur(20px)" : undefined,
        transform: `translateY(${edge * d}px)`,
        ...style,
      }}
    >
      {label}
    </div>
  );
};

/**
 * A shortcut as keycaps that pop in one after another from `at`, then play the chord on `pressAt`: the
 * modifiers go down first and the last key bottoms out on the frame, sending out a ring of light.
 * Place it with `style` (it is `position: relative` by default, so it sits in a flex layout).
 */
export const PressKeys: React.FC<{
  keys: string[];
  at: number;
  pressAt: number;
  size?: number;
  tone?: KeyTone;
  gap?: number;
  accent?: string;
  /** The ring of light from the press; false for none. */
  ring?: boolean;
  /** How far the ring travels, as a multiple of the row's width. */
  ringScale?: number;
  exitAt?: number;
  style?: React.CSSProperties;
}> = ({ keys, at, pressAt, size = 96, tone = "night", gap, accent = COLORS.pink, ring = true, ringScale = 1.9, exitAt, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at - 1) return null;
  const leaving = exitAt !== undefined && frame >= exitAt ? blurOut(frame, exitAt, sec(0.35), 6, 14) : undefined;
  if (leaving && Number(leaving.opacity) <= 0) return null;
  const lead = leads(keys);
  const glow = pressGlow(frame, pressAt);
  const space = gap ?? size * 0.2;
  const rowWidth = keys.reduce((w, k) => w + (k.length > 2 ? size * 2.1 : size), 0) + space * (keys.length - 1);
  const diameter = Math.max(rowWidth, size * 2) * ringScale;
  const [r, g, b] = rgb(accent);
  const wave = (delay: number) =>
    interpolate(frame, [pressAt + delay, pressAt + delay + sec(0.8)], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
  const w1 = wave(0);
  const w2 = wave(5);
  const pressed = frame >= pressAt;
  return (
    <div style={{ position: "relative", display: "flex", gap: space, alignItems: "center", fontFamily: FONT, ...style, ...leaving }}>
      {ring && pressed && (
        <>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: rowWidth * 1.3,
              height: size * 2.2,
              marginLeft: (-rowWidth * 1.3) / 2,
              marginTop: -size * 1.1,
              borderRadius: "50%",
              background: `radial-gradient(closest-side, rgba(${r}, ${g}, ${b}, ${tone === "night" ? 0.45 : 0.3}), transparent)`,
              opacity: glow,
              transform: `scale(${1 + 0.25 * (1 - glow)})`,
            }}
          />
          {[
            { p: w1, d: diameter, width: Math.max(2.5, size * 0.016), alpha: 0.9 },
            { p: w2, d: diameter * 0.72, width: Math.max(1.5, size * 0.009), alpha: 0.55 },
          ].map((ringSpec, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: ringSpec.d,
                height: ringSpec.d,
                marginLeft: -ringSpec.d / 2,
                marginTop: -ringSpec.d / 2,
                borderRadius: "50%",
                border: `${ringSpec.width}px solid rgba(${r}, ${g}, ${b}, ${ringSpec.alpha})`,
                boxShadow: `0 0 ${size * 0.12}px rgba(${r}, ${g}, ${b}, ${ringSpec.alpha * 0.6}), inset 0 0 ${size * 0.12}px rgba(${r}, ${g}, ${b}, ${ringSpec.alpha * 0.4})`,
                transform: `scale(${0.18 + ringSpec.p * 0.82})`,
                opacity: ringSpec.p > 0 ? Math.pow(1 - ringSpec.p, 1.4) : 0,
                pointerEvents: "none",
              }}
            />
          ))}
        </>
      )}
      {keys.map((key, i) => {
        const pop = spring({ frame: frame - at - i * 4, fps, config: { damping: 13, stiffness: 190, mass: 0.6 } });
        const depth = keyDepth(frame, pressAt, fps, lead[i]);
        return (
          <div
            key={i}
            style={{
              position: "relative",
              transform: `translateY(${(1 - pop) * size * 0.14}px) scale(${0.55 + pop * 0.45})`,
              opacity: Math.min(1, pop * 1.4),
              filter: pop < 0.98 ? `blur(${(1 - Math.min(1, pop)) * 8}px)` : undefined,
            }}
          >
            <Keycap label={key} size={size} tone={tone} depth={depth} glow={glow} accent={accent} />
          </div>
        );
      })}
    </div>
  );
};

/** A #RRGGBB colour as its three channels. */
function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
