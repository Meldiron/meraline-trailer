import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { BEAT, COLORS, FONT, FPS, HEIGHT, WIDTH } from "../config";
import { LightSky, NightFrame, Twinkles } from "../components/Backdrop";
import { PressKeys } from "../components/PressKeys";
import { MacBook, macbook } from "../components/MacBook";
import { blurIn, blurOut, easeInOut, easeOut, progress, sec } from "../lib/anim";

/**
 * The opening, on white: the mascot and a line typed in word by word, then the shortcut as big
 * keycaps that play the chord on a beat, and the press brings up a MacBook the camera flies into, where
 * the night sky of the rest of the film is waiting.
 */
export const Hook: React.FC<{ line: string; keys: string[]; frames: number }> = ({ line, keys, frames }) => {
  const frame = useCurrentFrame();
  const words = line.split(" ");
  // Timed back from the end, so the push into the screen lands on the music's drop whatever the length.
  const pushAt = frames - sec(1.9);
  // The chord lands on the last beat that leaves the MacBook time to rise before the push; the keys
  // arrive a beat before it, and the press is what brings the MacBook up.
  const beatFrames = BEAT * FPS;
  const pressAt = sec(BEAT * Math.floor((pushAt - sec(0.95)) / beatFrames));
  const t = {
    icon: sec(0.1),
    words: sec(0.45),
    wordStep: sec(0.2),
    lineOut: pressAt - sec(BEAT) - 8,
    keys: pressAt - sec(BEAT),
    press: pressAt,
    rise: pressAt + 5,
    riseFor: pushAt - pressAt - 5,
    push: pushAt,
  };
  const pushFor = frames - t.push;

  // The MacBook, resting in the lower middle once it has risen.
  const deviceWidth = 1120;
  const g = macbook(deviceWidth);
  const restLeft = (WIDTH - deviceWidth) / 2;
  const restTop = HEIGHT - g.height - 70;
  // A gentler ease than usual, so the MacBook is still settling when the camera starts to push.
  const rise = progress(frame, t.rise, t.riseFor, Easing.out(Easing.quad));
  const riseVelocity = Math.max(0, 1 - rise) * (frame >= t.rise ? 1 : 0);
  const push = progress(frame, t.push, pushFor, easeInOut);
  const fill = WIDTH / g.screen.width;
  const scale = Math.pow(fill, push);
  const screenCenter = { x: g.screen.x + g.screen.width / 2, y: g.screen.y + g.screen.height / 2 };
  const restCenter = { x: restLeft + screenCenter.x, y: restTop + screenCenter.y };
  const target = {
    x: interpolate(push, [0, 1], [restCenter.x, WIDTH / 2]),
    y: interpolate(push, [0, 1], [restCenter.y, HEIGHT / 2]),
  };
  const tx = target.x - restLeft - scale * screenCenter.x;
  const ty = target.y - restTop - scale * screenCenter.y + (1 - rise) * (HEIGHT - restTop + 40);
  const pushBlur = Math.sin(Math.PI * push) * 5;

  const keysLift = progress(frame, t.rise + sec(0.1), sec(0.7), easeOut);

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <LightSky />

      {frame < t.lineOut + sec(0.6) && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 26,
          }}
        >
          <Img
            src={staticFile("icon.png")}
            style={{
              width: 92,
              height: 92,
              ...(frame >= t.lineOut ? blurOut(frame, t.lineOut) : blurIn(frame, t.icon, sec(0.6), 0, 18)),
            }}
          />
          <div style={{ fontSize: 64, fontWeight: 600, letterSpacing: "-0.02em", color: COLORS.ink }}>
            {words.map((w, i) => (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  whiteSpace: "pre",
                  ...(frame >= t.lineOut + i * 2 ? blurOut(frame, t.lineOut + i * 2) : blurIn(frame, t.words + i * t.wordStep, sec(0.42), 10, 16)),
                }}
              >
                {w}
                {i < words.length - 1 ? " " : ""}
              </span>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `translateY(${-keysLift * 330}px) scale(${1 - keysLift * 0.35})`,
          opacity: 1 - progress(frame, t.rise + sec(0.35), sec(0.45)),
          filter: `blur(${progress(frame, t.rise + sec(0.3), sec(0.5)) * 10}px)`,
        }}
      >
        <PressKeys keys={keys} at={t.keys} pressAt={t.press} size={150} tone="light" gap={30} ringScale={2.2} />
      </div>

      {frame >= t.rise && (
        <div
          style={{
            position: "absolute",
            left: restLeft,
            top: restTop,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            filter: `blur(${riseVelocity * 6 + pushBlur}px)`,
          }}
        >
          <MacBook width={deviceWidth} screenRounding={1 - push}>
            <div style={{ width: WIDTH, height: HEIGHT, transform: `scale(${g.screen.width / WIDTH})`, transformOrigin: "0 0" }}>
              <NightFrame />
              <Twinkles />
            </div>
          </MacBook>
        </div>
      )}
    </AbsoluteFill>
  );
};
