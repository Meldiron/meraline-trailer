import clips from "../clips.json";
import { OVERLAP } from "../config";
import { sec } from "./anim";

/** A moment in a clip: seconds from its start, or a marker the recorder wrote plus an offset. */
export type Moment = number | { marker: string; offset?: number };

/**
 * A camera position: how far in (`zoom`, around the point `x`, `y` of the frame, 0–1 each way, which stays
 * put), and how far the world has moved up to follow a panel growing down the frame (`lift`, pixels).
 */
export type CameraKey = { at: Moment; zoom?: number; x?: number; y?: number; lift?: number };

/** A ring drawn around a spot of the recording, in pixels of the full-frame recording, while it matters. */
export type Spot = { at: Moment; x: number; y: number; r?: number; hold?: number };

export type KeyCue = { at: Moment; keys: string[]; hold?: number };

export type Tone = "night" | "light";

/** Skips part of a recording: at `at` the scene jumps ahead to `to`, with a quick dissolve. */
export type Cut = { at: Moment; to: Moment };

/**
 * How a scene arrives over the one before it (and so how that one leaves):
 *   dissolve   a plain crossfade
 *   zoom       the old scene rushes past the camera, the new one settles in from behind
 *   whip-left, whip-up   a fast pan with motion blur, the new scene sliding in from the right or below
 *   flash      a white flash on the beat
 *   iris       a circle opening from the middle
 */
export type Transition = "dissolve" | "zoom" | "whip-left" | "whip-up" | "flash" | "iris";

/**
 * Where a clip scene puts the app and its caption:
 *   side    the whole recording, caption on the left (the camera can push in)
 *   stack   caption on top, the panel floating below it
 *   center  the panel big in the middle, caption underneath
 *   mirror  the panel on the left, caption on the right
 *   follow  caption on top and the panel under it in one world, which the camera's `lift` scrolls up
 *           as the answer grows, so the two never meet
 *   desktop the whole recording edge to edge, for a clip recorded over a desktop rather than the sky,
 *           caption in the lower left over a shade
 */
export type Layout = "side" | "stack" | "center" | "mirror" | "follow" | "desktop";

export type SceneSpec =
  | {
      id: string;
      type: "hook";
      transition?: Transition;
      duration: number;
      /** The line typed in, word by word, before the shortcut. */
      line: string;
      keys: string[];
    }
  | {
      id: string;
      type: "clip";
      transition?: Transition;
      layout?: Layout;
      /** How big the floating panel is (floating layouts). */
      scale?: number;
      /** The panel tilts up into place as the scene starts. */
      tilt?: boolean;
      /** Moves the panel from where its layout puts it, in pixels. */
      nudge?: { x?: number; y?: number };
      /** The recording in public/clips, without extension (see record/scenes). */
      clip: string;
      /** Where in the recording the scene starts. */
      from: Moment;
      /** Waits to skip, such as the model thinking. */
      cuts?: Cut[];
      duration: number;
      title: string;
      subtitle?: string;
      /** When the caption comes in and goes, in seconds from the scene's start and before its end. */
      captionIn?: number;
      captionOut?: number;
      /** A moment in the recording the caption leaves at instead, such as before the camera moves on. */
      captionUntil?: Moment;
      keys?: KeyCue[];
      camera?: CameraKey[];
      /** Rings around spots of the recording, such as the folder an answer points to. */
      spots?: Spot[];
      /** Drains the colour, for the incognito chapter. */
      grayscale?: boolean;
    }
  | { id: string; type: "montage"; transition?: Transition; duration: number; title: string; subtitle?: string }
  | { id: string; type: "statement"; transition?: Transition; duration: number; title: string; subtitle?: string; tone?: Tone }
  | {
      id: string;
      type: "slam";
      transition?: Transition;
      duration: number;
      /** Each line lands on the next beat, big and centred. */
      lines: string[];
      subtitle?: string;
      tone?: Tone;
      keys?: string[];
    }
  | {
      id: string;
      type: "select";
      transition?: Transition;
      duration: number;
      /** A sentence the pointer selects, word by word, before the shortcut is pressed. */
      sentence: string;
      title: string;
      subtitle?: string;
      keys: string[];
    }
  | { id: string; type: "keys"; transition?: Transition; duration: number; keys: string[]; title: string; subtitle?: string }
  | { id: string; type: "mascot"; transition?: Transition; duration: number; title: string; subtitle?: string; keys?: string[] }
  | { id: string; type: "end"; transition?: Transition; duration: number; title: string; tagline: string; url: string; note?: string };

/** A recording: its length, where its panel's window was (points from the screen's top-left), its markers. */
type ClipInfo = { duration: number; panel?: { x: number; y: number }; markers: Record<string, number> };
const recorded = clips as Record<string, ClipInfo>;

export function clipInfo(name: string): ClipInfo | undefined {
  return recorded[name];
}

/** A moment as seconds from the clip's start. */
export function resolve(clip: string, moment: Moment): number {
  if (typeof moment === "number") return moment;
  const at = recorded[clip]?.markers[moment.marker];
  return (at ?? 0) + (moment.offset ?? 0);
}

/** A stretch of a recording as it plays in a scene: where it starts in the clip and in the scene, in seconds. */
export type Segment = { clipStart: number; sceneStart: number };

/** The stretches a clip scene plays, one after each cut. */
export function segments(clip: string, from: Moment, cuts: Cut[] = []): Segment[] {
  const list: Segment[] = [{ clipStart: resolve(clip, from), sceneStart: 0 }];
  for (const cut of [...cuts].sort((a, b) => resolve(clip, a.at) - resolve(clip, b.at))) {
    const last = list[list.length - 1];
    list.push({ clipStart: resolve(clip, cut.to), sceneStart: last.sceneStart + resolve(clip, cut.at) - last.clipStart });
  }
  return list;
}

/**
 * A moment inside a scene as frames from the scene's start. A number is already scene time; a marker
 * is found in the recording and placed in whichever stretch of it the scene is playing then.
 */
export function sceneFrame(clip: string, parts: Segment[], moment: Moment): number {
  if (typeof moment === "number") return sec(moment);
  const at = resolve(clip, moment);
  const part = [...parts].reverse().find((p) => at >= p.clipStart) ?? parts[0];
  return sec(part.sceneStart + at - part.clipStart);
}

export type Placed = { spec: SceneSpec; start: number; frames: number };

/** Lays the scenes end to end, each overlapping the one before by OVERLAP while they dissolve. */
export function place(scenes: SceneSpec[]): { placed: Placed[]; total: number } {
  let cursor = 0;
  const placed = scenes.map((spec, i) => {
    const frames = sec(spec.duration);
    const start = i === 0 ? 0 : cursor - sec(OVERLAP);
    cursor = start + frames;
    return { spec, start, frames };
  });
  return { placed, total: cursor };
}
