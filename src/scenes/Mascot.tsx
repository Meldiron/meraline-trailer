import React, { useId } from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BEAT, FONT } from "../config";
import { NightFrame, SPARKLE_PATH, Sparkle, Twinkles } from "../components/Backdrop";
import { Caption } from "../components/Caption";
import { PressKeys } from "../components/PressKeys";
import { blurOut, easeInOut, easeOut, progress, sec } from "../lib/anim";

/** The mascot's box on screen, and where the middle of the sparkle sits in it. */
const SIZE = 520;
const BOX = { left: 960 - SIZE / 2, top: 70 };
const UNITS = 824 / SIZE; // viewBox units per pixel
const CENTER = { x: 960, y: BOX.top + (520 - 100) / UNITS };
/** The middle of the sunglasses, in the icon's units. */
const GLASSES = { x: 512, y: 493 };

/**
 * Anonymous mode, as the mascot lives it. The pink sparkle floats in the sky; ⇧⌘N is played on the
 * beat, and the mascot looks up, eyes wide, as a pair of sunglasses spins in from the top right. They
 * slam onto its face on the next beat: it squashes and springs back, a flash and a burst of sparkles go
 * off, it turns into the graphite silhouette Meraline shows in anonymous mode (the lenses cut out, so
 * the sky shows through), and the colour drains out of the sky in a wave from where the glasses
 * landed. Then a cool little nod and a tilt, while the title lands and the keys make room for it.
 * Shapes are the app icon's own (sparkle.svg, face.svg) and the sunglasses of the app's
 * MascotInSunglasses.
 */
export const Mascot: React.FC<{ title: string; subtitle?: string; keys?: string[]; frames: number }> = ({ title, subtitle, keys, frames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const id = "m" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const beat = (n: number) => sec(BEAT * n);
  const t = {
    keys: beat(1),
    press: beat(2),
    launch: beat(2) + 1,
    land: beat(3),
    nod: beat(3) + 14,
    title: beat(3.4),
    subtitle: beat(4),
    keysMove: beat(2) + 12,
    sheen: beat(5.5),
    exit: frames - beat(0.9),
  };
  // Without the shortcut, the glasses still fly in on the same beat.
  const landed = frame >= t.land;
  const since = frame - t.land;

  // The sunglasses' flight: a spinning arc from off the top right, speeding up into the face.
  const flight = (f: number) => {
    const p = interpolate(f, [t.launch, t.land], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const q = Math.pow(p, 1.35);
    const start = { x: 1250, y: -1150 };
    const control = { x: 260, y: -760 };
    const x = (1 - q) * (1 - q) * start.x + 2 * (1 - q) * q * control.x;
    const y = (1 - q) * (1 - q) * start.y + 2 * (1 - q) * q * control.y;
    const rot = -560 * (1 - Easing.out(Easing.cubic)(Math.min(1, p / 0.88)));
    const scale = 1.65 - 0.65 * Easing.out(Easing.quad)(p);
    return { x, y, rot, scale, p };
  };
  const glassesAt = (f: number) => {
    const g = flight(f);
    return `translate(${g.x} ${g.y}) rotate(${g.rot} ${GLASSES.x} ${GLASSES.y}) translate(${GLASSES.x} ${GLASSES.y}) scale(${g.scale}) translate(${-GLASSES.x} ${-GLASSES.y})`;
  };

  // The mascot: it pops in with the iris, bobs, looks up and braces for the glasses, squashes on the
  // hit and springs back, then nods and tilts its head.
  const enter = spring({ frame: frame - 2, fps, config: { damping: 12, stiffness: 120, mass: 0.8 } });
  const look = landed ? 0 : progress(frame, t.press + 2, sec(0.3), easeOut);
  const brace = landed ? 0 : progress(frame, t.land - 9, 9, Easing.in(Easing.quad));
  const hit = landed ? 1 - spring({ frame: since, fps, config: { damping: 6, stiffness: 240, mass: 0.7 } }) : 0;
  const squashY = 1 - 0.06 * brace - 0.2 * hit;
  const squashX = 1 + 0.04 * brace + 0.13 * hit;
  const lean = look * 6 * (1 - brace * 0.5);
  const tilt = spring({ frame: frame - t.nod - 6, fps, config: { damping: 11, stiffness: 110, mass: 0.9 } }) * -8;
  const nod = Math.sin(Math.PI * progress(frame, t.nod, 16, easeInOut)) * 18;
  const sway = landed ? Math.sin((frame - t.nod) / 30) * 1.6 * progress(frame, t.nod + 20, sec(0.8)) : 0;
  const bob = landed ? Math.sin(frame / 26) * 5 : Math.sin(frame / 18) * 6 - look * 10;
  const shake = landed ? Math.exp(-since / 5) : 0;
  const shakeX = Math.sin(since * 2.3) * 7 * shake;
  const shakeY = Math.cos(since * 2.9) * 5 * shake;
  const incognito = interpolate(frame, [t.land, t.land + 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const flash = landed ? interpolate(since, [0, 2, 16], [0.2, 1, 0], { extrapolateRight: "clamp" }) : 0;
  const surprise = landed ? 0 : progress(frame, t.press + 1, 7, easeOut);

  // The colour draining away: a wave from the mascot, with a faint bright front.
  const wave = landed ? progress(since, 0, sec(1.15), Easing.bezier(0.3, 0.6, 0.35, 1)) : 0;
  const radius = wave * 2300;
  const feather = 150 + wave * 180;
  const drain = `radial-gradient(circle at ${CENTER.x}px ${CENTER.y}px, #000 0px, #000 ${Math.max(0, radius - feather)}px, transparent ${radius + feather}px)`;

  // The shortcut: under the mascot while it's played, then, while the glasses fly, down to the bottom to
  // make room for the title.
  const move = progress(frame, t.keysMove, sec(0.6), easeInOut);
  const leaving = frame >= t.exit ? blurOut(frame, t.exit, sec(0.35), 0, 16) : undefined;
  const mascotExit = leaving ?? {};

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      {wave < 1 && (
        <>
          <NightFrame />
          <Twinkles />
        </>
      )}
      {landed && (
        <AbsoluteFill style={{ maskImage: drain, WebkitMaskImage: drain }}>
          <NightFrame grayscale />
          <Twinkles grayscale />
        </AbsoluteFill>
      )}
      {landed && wave < 1 && (
        <div
          style={{
            position: "absolute",
            left: CENTER.x - radius,
            top: CENTER.y - radius,
            width: radius * 2,
            height: radius * 2,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.55)",
            boxShadow: "0 0 40px rgba(255,255,255,0.35), inset 0 0 40px rgba(255,255,255,0.25)",
            opacity: Math.pow(1 - wave, 1.5) * 0.8,
            filter: "blur(1.5px)",
          }}
        />
      )}

      {keys && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: interpolate(move, [0, 1], [668, 918]),
            display: "flex",
            justifyContent: "center",
            transform: `scale(${1 - move * 0.22})`,
          }}
        >
          <PressKeys keys={keys} at={t.keys} pressAt={t.press} size={80} ringScale={2.6} exitAt={t.exit} />
        </div>
      )}

      <div
        style={{
          position: "absolute",
          left: BOX.left,
          top: BOX.top,
          width: SIZE,
          height: SIZE,
          transformOrigin: "50% 51%",
          transform: `translate(${shakeX}px, ${bob + nod + shakeY}px) rotate(${lean + tilt + sway}deg) scale(${0.6 + 0.4 * enter})`,
          opacity: Math.min(1, enter * 2),
          ...mascotExit,
        }}
      >
        <svg
          width={SIZE}
          height={SIZE}
          viewBox="100 100 824 824"
          style={{ overflow: "visible", transformOrigin: "50% 80%", transform: `scale(${squashX}, ${squashY})` }}
        >
          <defs>
            <linearGradient id={`${id}pink`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#F89BCD" />
              <stop offset="100%" stopColor="#8E6CF0" />
            </linearGradient>
            <linearGradient id={`${id}graphite`} x1="0.2" y1="0" x2="0.8" y2="1">
              <stop offset="0%" stopColor="#F1F0F5" />
              <stop offset="55%" stopColor="#BAB8C6" />
              <stop offset="100%" stopColor="#8D8B9C" />
            </linearGradient>
            <linearGradient id={`${id}band`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
            <mask id={`${id}holes`}>
              <rect x="-2000" y="-2000" width="5000" height="5000" fill="#fff" />
              <Glasses fill="#000" />
            </mask>
            <clipPath id={`${id}body`}>
              <path d={SPARKLE_PATH} />
            </clipPath>
            <filter id={`${id}glow`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="30" />
            </filter>
          </defs>

          {/* The glow behind: pink while it's itself, a cool white once it's incognito. */}
          <path d={SPARKLE_PATH} fill="#F48FC6" opacity={0.38 * (1 - incognito)} filter={`url(#${id}glow)`} />
          <path d={SPARKLE_PATH} fill="#FFFFFF" opacity={0.14 * incognito + 0.5 * flash} filter={`url(#${id}glow)`} />

          <g opacity={1 - incognito}>
            <path d={SPARKLE_PATH} fill={`url(#${id}pink)`} />
            <Face look={look} surprise={surprise} />
          </g>
          <g opacity={incognito} mask={`url(#${id}holes)`}>
            <path d={SPARKLE_PATH} fill={`url(#${id}graphite)`} />
            {/* A glint that sweeps across the metal now and then. */}
            <g clipPath={`url(#${id}body)`}>
              <rect
                x={interpolate(frame, [t.sheen, t.sheen + sec(0.7)], [-420, 1240], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut })}
                y={0}
                width={260}
                height={1100}
                fill={`url(#${id}band)`}
                transform="rotate(18 512 520)"
                opacity={frame > t.sheen && frame < t.sheen + sec(0.75) ? 0.7 : 0}
              />
            </g>
            {/* The flash of the landing, on the metal. */}
            <path d={SPARKLE_PATH} fill="#FFFFFF" opacity={flash * 0.85} />
          </g>

          {/* The sunglasses in flight, with a short trail, until they land and become the cut-out. */}
          {frame >= t.launch && frame < t.land + 5 && (
            <g opacity={1 - incognito}>
              {!landed &&
                [3, 2, 1].map((back) => (
                  <g key={back} transform={glassesAt(frame - back * 1.2)} opacity={0.13 * (4 - back)}>
                    <Glasses fill="#141019" />
                  </g>
                ))}
              <g transform={glassesAt(frame)}>
                <Glasses fill="#141019" shine />
              </g>
            </g>
          )}
        </svg>
      </div>

      {landed && <Burst since={since} />}

      <Caption
        title={title}
        subtitle={subtitle}
        enterAt={t.title}
        subtitleAt={t.subtitle}
        exitAt={t.exit}
        align="center"
        size={86}
        style={{ left: 0, right: 0, top: 640 }}
      />
    </AbsoluteFill>
  );
};

/** Sparkles thrown out from the mascot by the landing, spinning and fading as they go. */
const Burst: React.FC<{ since: number }> = ({ since }) => {
  const count = 10;
  const p = progress(since, 0, sec(0.62), Easing.out(Easing.cubic));
  if (p >= 1) return null;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + (i % 2 ? 0.2 : -0.1) - Math.PI / 2;
        const reach = (i % 3 === 0 ? 420 : i % 3 === 1 ? 340 : 290) * p + 70;
        const size = i % 2 ? 26 : 40;
        const fade = interpolate(p, [0, 0.12, 0.55, 1], [0, 1, 0.9, 0]);
        return (
          <Sparkle
            key={i}
            size={size}
            style={{
              position: "absolute",
              left: CENTER.x + Math.cos(angle) * reach - size / 2,
              top: CENTER.y + Math.sin(angle) * reach * 0.9 - size / 2,
              opacity: fade,
              transform: `scale(${0.4 + 0.8 * Math.sin(Math.PI * Math.min(1, p * 1.2))}) rotate(${p * 120}deg)`,
              filter: "drop-shadow(0 0 8px rgba(255, 255, 255, 0.9))",
            }}
          />
        );
      })}
    </>
  );
};

/**
 * The icon's face: closed, smiling eyes, blush, and a small smile (face.svg). `look` turns it up
 * toward the incoming glasses; `surprise` opens the eyes wide and rounds the mouth into an "o".
 */
const Face: React.FC<{ look?: number; surprise?: number }> = ({ look = 0, surprise = 0 }) => (
  <g transform={`translate(${look * 12} ${-look * 20}) translate(512 548) scale(1.35) translate(-512 -548)`}>
    <ellipse cx="444" cy="566" rx="26" ry="15" fill="#FF7FB5" opacity="0.6" />
    <ellipse cx="580" cy="566" rx="26" ry="15" fill="#FF7FB5" opacity="0.6" />
    <g fill="none" stroke="#5B3A86" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" opacity={1 - surprise}>
      <path d="M438 520 Q460 544 482 520" />
      <path d="M542 520 Q564 544 586 520" />
      <path d="M438 520 L425 508" />
      <path d="M586 520 L599 508" />
      <path d="M492 578 Q512 596 532 578" />
    </g>
    <g opacity={surprise}>
      <ellipse cx="461" cy="522" rx="15" ry="19" fill="#5B3A86" />
      <ellipse cx="564" cy="522" rx="15" ry="19" fill="#5B3A86" />
      <circle cx="466" cy="513" r="5.5" fill="#FFFFFF" />
      <circle cx="569" cy="513" r="5.5" fill="#FFFFFF" />
      <ellipse cx="512" cy="584" rx="10" ry="12" fill="#5B3A86" />
    </g>
  </g>
);

/**
 * Two lenses, flat on top and round below, joined by a bridge: 51% of the sparkle's width and 19% of its
 * height, just above its middle, as in the app.
 */
const Glasses: React.FC<{ fill: string; shine?: boolean }> = ({ fill, shine = false }) => {
  const w = 379;
  const h = 144;
  const left = 512 - w / 2;
  const top = 421;
  const gap = w * 0.12;
  const lens = (w - gap) / 2;
  const rTop = h * 0.2;
  const rBottom = h * 0.5;
  const lensPath = (x: number) =>
    `M${x + rTop} ${top} H${x + lens - rTop} Q${x + lens} ${top} ${x + lens} ${top + rTop} V${top + h - rBottom} A${rBottom} ${rBottom} 0 0 1 ${x + lens - rBottom} ${top + h} H${x + rBottom} A${rBottom} ${rBottom} 0 0 1 ${x} ${top + h - rBottom} V${top + rTop} Q${x} ${top} ${x + rTop} ${top} Z`;
  return (
    <g>
      <path d={lensPath(left)} fill={fill} />
      <path d={lensPath(left + lens + gap)} fill={fill} />
      <rect x={left + lens - 0.5} y={top + h * 0.08} width={gap + 1} height={h * 0.2} fill={fill} />
      {shine && (
        <g fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="9" strokeLinecap="round">
          <path d={`M${left + 34} ${top + 30} L${left + 70} ${top + 30}`} />
          <path d={`M${left + lens + gap + 34} ${top + 30} L${left + lens + gap + 70} ${top + 30}`} />
        </g>
      )}
    </g>
  );
};
