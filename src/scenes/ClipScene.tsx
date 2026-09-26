import React from "react";
import { AbsoluteFill, Freeze, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT, PANEL, SCREEN, WIDTH } from "../config";
import { NightFrame, Twinkles } from "../components/Backdrop";
import { Caption } from "../components/Caption";
import { Keycaps } from "../components/Keycaps";
import { easeInOut, easeOut, sec } from "../lib/anim";
import { CameraKey, Cut, KeyCue, Layout, Moment, Segment, Spot, clipInfo, sceneFrame, segments } from "../lib/timeline";

type Props = {
  clip: string;
  from: Moment;
  cuts?: Cut[];
  frames: number;
  title: string;
  subtitle?: string;
  captionIn?: number;
  captionOut?: number;
  captionUntil?: Moment;
  keys?: KeyCue[];
  camera?: CameraKey[];
  layout?: Layout;
  scale?: number;
  tilt?: boolean;
  nudge?: { x?: number; y?: number };
  spots?: Spot[];
  grayscale?: boolean;
};

type Place = {
  /** Where the middle of the card and the top of the buttons above it go, in pixels of the frame. */
  anchor: { x: number; y: number };
  scale: number;
  caption: { style: React.CSSProperties; align: "left" | "center"; size: number };
  keys: React.CSSProperties;
};

/**
 * Where each layout puts the panel (the middle of its card, and the top of the buttons above it) and how
 * big, where the caption goes, and where keycaps show.
 */
const LAYOUTS: Record<Layout, Place> = {
  side: {
    anchor: { x: 1330, y: 150 },
    scale: 1.32,
    caption: { style: { left: 118, top: 400, width: 700 }, align: "left", size: 70 },
    keys: { left: 120, top: 770 },
  },
  stack: {
    anchor: { x: 960, y: 318 },
    scale: 1.32,
    caption: { style: { left: 0, right: 0, top: 88 }, align: "center", size: 74 },
    keys: { left: 0, right: 0, top: 960, justifyContent: "center" },
  },
  center: {
    anchor: { x: 960, y: 96 },
    scale: 1.45,
    caption: { style: { left: 0, right: 0, top: 890 }, align: "center", size: 60 },
    keys: { left: 80, top: 80 },
  },
  mirror: {
    anchor: { x: 700, y: 150 },
    scale: 1.14,
    caption: { style: { left: 1190, top: 380, width: 640 }, align: "left", size: 70 },
    keys: { left: 1192, top: 760 },
  },
  follow: {
    // The caption and the bare input start as one block in the middle of the frame; the answer then
    // grows below, and the camera's lift follows it.
    anchor: { x: 960, y: 529 },
    scale: 1.24,
    caption: { style: { left: 0, right: 0, top: 325 }, align: "center", size: 72 },
    keys: { left: 0, right: 0, top: 960, justifyContent: "center" },
  },
  desktop: {
    anchor: { x: PANEL.cx, y: PANEL.top },
    scale: 1,
    caption: { style: { left: 96, bottom: 92, width: 760 }, align: "left", size: 66 },
    keys: { left: 96, top: 80 },
  },
};

/** Pixels of the frame per point of the recorded screen. */
const PT = WIDTH / SCREEN.width;
/** Where the panel's window was when PANEL was measured, in points; a recording made elsewhere is moved to match. */
const MEASURED_AT = { x: 404, y: 250 };

/**
 * A scene played from a recording of the real app, laid out one of six ways (see Layout), with its
 * caption, keycaps when a shortcut is pressed, rings around what matters, and a camera that can push in
 * and follow a growing answer. The panel was recorded in the middle of the screen with plenty of sky
 * around it, so the whole recording moves and scales like a camera would, and only its outer edges fade
 * into the sky drawn behind it; a desktop recording plays edge to edge instead.
 */
export const ClipScene: React.FC<Props> = ({
  clip,
  from,
  cuts,
  frames,
  title,
  subtitle,
  captionIn = 0.35,
  captionOut = 0.55,
  captionUntil,
  keys = [],
  camera = [],
  layout = "side",
  scale,
  tilt = false,
  nudge = {},
  spots = [],
  grayscale = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const info = clipInfo(clip);
  const parts = segments(clip, from, cuts);
  const video = info ? <Footage clip={clip} parts={parts} frames={frames} duration={info.duration} /> : <Missing clip={clip} />;
  const spec = LAYOUTS[layout];
  const fullFrame = layout === "desktop";
  // A recording whose panel sat elsewhere on the screen is moved so its panel lands where the layout wants.
  const shift = info?.panel ? { x: (info.panel.x - MEASURED_AT.x) * PT, y: (info.panel.y - MEASURED_AT.y) * PT } : { x: 0, y: 0 };
  const s = fullFrame ? 1 : scale ?? spec.scale;
  const tx = fullFrame ? 0 : spec.anchor.x + (nudge.x ?? 0) - (PANEL.cx + shift.x) * s;
  const ty = fullFrame ? 0 : spec.anchor.y + (nudge.y ?? 0) - (PANEL.top + shift.y) * s;
  const view = cameraAt(frame, clip, parts, camera);
  const rise = tilt ? spring({ frame, fps, config: { damping: 18, stiffness: 90, mass: 0.9 } }) : 1;
  const panelBox = {
    left: tx + (PANEL.left + shift.x) * s,
    right: tx + (PANEL.right + shift.x) * s,
    top: ty + (PANEL.top + shift.y) * s,
  };

  const caption = (
    <Caption
      title={title}
      subtitle={subtitle}
      enterAt={sec(captionIn)}
      exitAt={captionUntil !== undefined ? sceneFrame(clip, parts, captionUntil) : frames - sec(captionOut)}
      align={spec.caption.align}
      size={spec.caption.size}
      style={spec.caption.style}
    />
  );

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {!fullFrame && <NightFrame grayscale={grayscale} />}
      <AbsoluteFill
        style={{
          transform: `translateY(${-view.lift}px) scale(${view.zoom})`,
          transformOrigin: `${view.x * 100}% ${view.y * 100}%`,
        }}
      >
        <AbsoluteFill style={{ perspective: 1700, perspectiveOrigin: `${spec.anchor.x}px ${spec.anchor.y}px` }}>
          <AbsoluteFill
            style={{
              transformOrigin: `${spec.anchor.x}px ${spec.anchor.y + 200}px`,
              transform: `translateY(${(1 - rise) * 160}px) rotateX(${(1 - rise) * 32}deg)`,
              opacity: Math.min(1, rise * 1.8),
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 1920,
                height: 1080,
                transformOrigin: "0 0",
                transform: `translate(${tx}px, ${ty}px) scale(${s})`,
                // The grey night of the incognito chapter, as Backdrop draws it.
                filter: grayscale ? "grayscale(1) brightness(0.94) contrast(1.08)" : undefined,
                ...(fullFrame
                  ? {}
                  : { maskImage: EDGE_MASK, WebkitMaskImage: EDGE_MASK, maskComposite: "intersect", WebkitMaskComposite: "source-in" }),
              }}
            >
              {video}
              {spots.map((spot, i) => (
                <Ring key={i} spot={spot} at={sceneFrame(clip, parts, spot.at)} />
              ))}
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
        {!fullFrame && (
          // The sparkles keep out of the panel's column, so none ever lands on the app.
          <div
            style={{
              position: "absolute",
              inset: 0,
              clipPath: `path(evenodd, "M-400 -400 H2320 V1480 H-400 Z M${panelBox.left - 36} ${panelBox.top - 36} H${panelBox.right + 36} V2400 H${panelBox.left - 36} Z")`,
            }}
          >
            <Twinkles grayscale={grayscale} />
          </div>
        )}
        {layout === "follow" && caption}
      </AbsoluteFill>
      {layout === "center" && (
        <AbsoluteFill style={{ background: "linear-gradient(180deg, transparent 70%, rgba(10, 6, 30, 0.8) 86%)" }} />
      )}
      {fullFrame && (
        <DesktopShade
          frame={frame}
          enter={sec(captionIn)}
          exit={captionUntil !== undefined ? sceneFrame(clip, parts, captionUntil) : frames - sec(captionOut)}
        />
      )}
      {layout !== "follow" && caption}
      {keys.map((cue, i) => (
        <Keycaps
          key={i}
          keys={cue.keys}
          at={sceneFrame(clip, parts, cue.at)}
          hold={sec(cue.hold ?? 1.2)}
          size={58}
          style={{ display: "flex", ...spec.keys }}
        />
      ))}
    </AbsoluteFill>
  );
};

/** The recording's outer edges fade into the sky behind it, well clear of the panel in its middle. */
const EDGE_MASK = [
  "linear-gradient(90deg, transparent 0px, #000 190px, #000 1730px, transparent 1920px)",
  "linear-gradient(180deg, transparent 0px, #000 150px, #000 1000px, transparent 1080px)",
].join(", ");

/** Over a busy desktop, a shade in the lower left for the caption to read on, there only while it is. */
const DesktopShade: React.FC<{ frame: number; enter: number; exit: number }> = ({ frame, enter, exit }) => {
  const opacity = interpolate(frame, [enter - sec(0.2), enter + sec(0.4), exit, exit + sec(0.5)], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        opacity,
        background: [
          "radial-gradient(70% 62% at 0% 100%, rgba(10, 8, 30, 0.92) 0%, rgba(10, 8, 30, 0.84) 42%, rgba(10, 8, 30, 0.4) 70%, transparent 92%)",
          "linear-gradient(0deg, rgba(10, 8, 30, 0.45) 0%, transparent 30%)",
        ].join(", "),
      }}
    />
  );
};

/** A pink ring that lands around a spot of the recording, holds, and lets go. */
const Ring: React.FC<{ spot: Spot; at: number }> = ({ spot, at }) => {
  const frame = useCurrentFrame();
  const hold = sec(spot.hold ?? 1.6);
  if (frame < at || frame > at + hold + sec(0.4)) return null;
  const inP = interpolate(frame, [at, at + sec(0.45)], [0, 1], { extrapolateRight: "clamp", easing: easeOut });
  const outP = interpolate(frame, [at + hold, at + hold + sec(0.4)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulse = 1 + 0.03 * Math.sin(((frame - at) / 60) * Math.PI * 2 * 1.2);
  const r = spot.r ?? 78;
  return (
    <div
      style={{
        position: "absolute",
        left: spot.x - r,
        top: spot.y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: "50%",
        border: `4px solid ${COLORS.pink}`,
        boxShadow: `0 0 28px rgba(244, 143, 198, 0.75), inset 0 0 22px rgba(244, 143, 198, 0.35)`,
        opacity: inP * (1 - outP),
        transform: `scale(${(1.6 - 0.6 * inP) * pulse})`,
      }}
    />
  );
};

/** The recording, stretch by stretch around the cuts, holding its last frame if the scene outlasts it. */
const Footage: React.FC<{ clip: string; parts: Segment[]; frames: number; duration: number }> = ({ clip, parts, frames, duration }) => {
  const src = staticFile(`clips/${clip}.mp4`);
  return (
    <>
      {parts.map((part, i) => {
        const startFrame = sec(part.sceneStart);
        const next = parts[i + 1];
        const length = (next ? sec(next.sceneStart) + sec(CUT_DISSOLVE) : frames) - startFrame;
        const available = sec(duration - 0.05 - part.clipStart);
        return (
          <Sequence key={i} from={startFrame} durationInFrames={Math.max(1, length)} layout="none">
            <FadeIn enabled={i > 0}>
              {length <= available ? (
                <OffthreadVideo src={src} trimBefore={sec(Math.max(0, part.clipStart))} muted />
              ) : (
                <>
                  <Sequence durationInFrames={Math.max(1, available)} layout="none">
                    <OffthreadVideo src={src} trimBefore={sec(Math.max(0, part.clipStart))} muted />
                  </Sequence>
                  <Sequence from={Math.max(0, available)} layout="none">
                    <Freeze frame={0}>
                      <OffthreadVideo src={src} trimBefore={sec(duration - 0.1)} muted />
                    </Freeze>
                  </Sequence>
                </>
              )}
            </FadeIn>
          </Sequence>
        );
      })}
    </>
  );
};

/** How long a cut inside a clip takes to dissolve, in seconds. */
const CUT_DISSOLVE = 0.3;

const FadeIn: React.FC<{ enabled: boolean; children: React.ReactNode }> = ({ enabled, children }) => {
  const frame = useCurrentFrame();
  const opacity = enabled ? interpolate(frame, [0, sec(CUT_DISSOLVE)], [0, 1], { extrapolateRight: "clamp" }) : 1;
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

type View = { zoom: number; x: number; y: number; lift: number };

/**
 * The camera between keyframes, eased; before the first key it holds the first, after the last the last.
 * A key that leaves something out keeps it from the key before.
 */
function cameraAt(frame: number, clip: string, parts: Segment[], keys: CameraKey[]): View {
  let last: View = { zoom: 1, x: 0.5, y: 0.5, lift: 0 };
  if (keys.length === 0) return last;
  const points = [...keys]
    .map((k) => ({ frame: sceneFrame(clip, parts, k.at), key: k }))
    .sort((a, b) => a.frame - b.frame)
    .map(({ frame, key }) => {
      last = { zoom: key.zoom ?? last.zoom, x: key.x ?? last.x, y: key.y ?? last.y, lift: key.lift ?? last.lift };
      return { frame, ...last };
    });
  if (frame <= points[0].frame) return points[0];
  const end = points[points.length - 1];
  if (frame >= end.frame) return end;
  const i = points.findIndex((p) => p.frame > frame) - 1;
  const a = points[i];
  const b = points[i + 1];
  const t = interpolate(frame, [a.frame, b.frame], [0, 1], { easing: easeInOut });
  return {
    zoom: a.zoom + (b.zoom - a.zoom) * t,
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    lift: a.lift + (b.lift - a.lift) * t,
  };
}

/** Stands in for a clip that hasn't been recorded yet, so the film still renders. */
const Missing: React.FC<{ clip: string }> = ({ clip }) => (
  <AbsoluteFill>
    <NightFrame />
    <div
      style={{
        position: "absolute",
        left: 1046,
        top: 160,
        width: 813,
        height: 380,
        borderRadius: 34,
        border: "2px dashed rgba(255,255,255,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "rgba(255,255,255,0.7)",
        fontFamily: FONT,
        fontSize: 30,
        textAlign: "center",
        lineHeight: 1.5,
      }}
    >
      Clip “{clip}” isn’t recorded yet.
      <br />
      npm run record {clip}
    </div>
  </AbsoluteFill>
);
