import { Easing, interpolate } from "remotion";
import { FPS } from "../config";

/** Seconds to frames. Every time in scenes.ts is in seconds. */
export const sec = (seconds: number) => Math.round(seconds * FPS);

/** A soft ease-out, close to Apple's default spring without overshoot. */
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

/** 0 → 1 over `duration` frames from `start`, eased. */
export function progress(frame: number, start: number, duration: number, easing = easeOut) {
  return interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });
}

/**
 * The blur-in every caption word, keycap, and card uses: from blurred, lower, and clear to sharp and
 * in place. Returns CSS for the element.
 */
export function blurIn(frame: number, start: number, duration = sec(0.5), distance = 14, blur = 14) {
  const p = progress(frame, start, duration);
  return {
    opacity: p,
    filter: `blur(${(1 - p) * blur}px)`,
    transform: `translateY(${(1 - p) * distance}px)`,
  };
}

/** The reverse of blurIn, for leaving: sharp to blurred and gone, drifting up a little. */
export function blurOut(frame: number, start: number, duration = sec(0.35), distance = 8, blur = 12) {
  const p = progress(frame, start, duration, Easing.in(Easing.quad));
  return {
    opacity: 1 - p,
    filter: `blur(${p * blur}px)`,
    transform: `translateY(${-p * distance}px)`,
  };
}

/** Combines an entrance and an exit into one style: the entrance until the exit starts. */
export function inOut(frame: number, enter: number, exit: number | undefined, enterDuration = sec(0.5)) {
  if (exit !== undefined && frame >= exit) return blurOut(frame, exit);
  return blurIn(frame, enter, enterDuration);
}
