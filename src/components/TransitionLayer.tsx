import React, { useId } from "react";
import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { HEIGHT, OVERLAP, WIDTH } from "../config";
import { sec } from "../lib/anim";
import type { Transition } from "../lib/timeline";

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = Easing.bezier(0.65, 0, 0.35, 1);
const settle = Easing.bezier(0.16, 1, 0.3, 1);

/**
 * Wraps a scene so it arrives with its own transition and leaves with the next scene's, over the beat
 * the two share. Later scenes draw on top, so the arriving scene covers the one leaving.
 */
export const TransitionLayer: React.FC<{
  arrive?: Transition;
  leave?: Transition;
  frames: number;
  children: React.ReactNode;
}> = ({ arrive, leave, frames, children }) => {
  const frame = useCurrentFrame();
  const overlap = sec(OVERLAP);
  const pIn = arrive ? clamp(frame / overlap) : 1;
  const pOut = leave ? clamp((frame - (frames - overlap)) / overlap) : 0;
  const id = "mb" + useId().replace(/[^a-zA-Z0-9]/g, "");

  let tx = 0;
  let ty = 0;
  let scale = 1;
  let opacity = 1;
  let blur = 0;
  let motion: [number, number] = [0, 0];
  let brightness = 1;
  let clip: string | undefined;
  let flash = 0;

  if (arrive && pIn < 1) {
    const e = ease(pIn);
    const s = settle(pIn);
    switch (arrive) {
      case "dissolve":
        opacity = e;
        break;
      case "zoom":
        opacity = clamp(pIn * 1.6);
        scale = 0.82 + 0.18 * s;
        blur = (1 - s) * 16;
        break;
      case "whip-left":
        tx = (1 - e) * WIDTH;
        motion = [Math.sin(Math.PI * pIn) * 46, 0];
        break;
      case "whip-up":
        ty = (1 - e) * HEIGHT;
        motion = [0, Math.sin(Math.PI * pIn) * 40];
        break;
      case "flash":
        opacity = pIn >= 0.5 ? 1 : 0;
        flash = Math.sin(Math.PI * pIn);
        break;
      case "iris":
        clip = `circle(${e * 1110}px at 50% 50%)`;
        break;
    }
  }

  if (leave && pOut > 0) {
    const e = ease(pOut);
    switch (leave) {
      case "dissolve":
        break;
      case "zoom":
        scale *= 1 + 0.45 * Easing.in(Easing.cubic)(pOut);
        blur += e * 18;
        opacity *= 1 - e;
        break;
      case "whip-left":
        tx -= e * WIDTH;
        motion = [Math.sin(Math.PI * pOut) * 46, 0];
        break;
      case "whip-up":
        ty -= e * HEIGHT;
        motion = [0, Math.sin(Math.PI * pOut) * 40];
        break;
      case "flash":
        brightness = 1 + e * 1.5;
        break;
      case "iris":
        scale *= 1 - 0.06 * e;
        brightness = 1 - 0.45 * e;
        break;
    }
  }

  const hasMotion = motion[0] > 0.3 || motion[1] > 0.3;
  const filters = [
    hasMotion ? `url(#${id})` : "",
    blur > 0.2 ? `blur(${blur}px)` : "",
    brightness !== 1 ? `brightness(${brightness})` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {hasMotion && (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={`${motion[0]} ${motion[1]}`} />
          </filter>
        </svg>
      )}
      <AbsoluteFill
        style={{
          transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
          opacity,
          filter: filters || undefined,
          clipPath: clip,
        }}
      >
        {children}
      </AbsoluteFill>
      {flash > 0.01 && <AbsoluteFill style={{ background: "#FFF8FD", opacity: flash }} />}
    </AbsoluteFill>
  );
};

