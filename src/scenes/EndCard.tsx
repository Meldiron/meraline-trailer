import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { COLORS, FONT, HEIGHT, WIDTH } from "../config";
import { LightSky, NightFrame, Twinkles } from "../components/Backdrop";
import { Caption } from "../components/Caption";
import { MacBook, macbook } from "../components/MacBook";
import { blurIn, easeInOut, progress, sec } from "../lib/anim";

/**
 * The ending: the camera pulls out of the screen to the MacBook, the screen shrinks and rounds into the
 * app icon while the laptop fades away, and the name, tagline, and link come in under it.
 */
export const EndCard: React.FC<{ title: string; tagline: string; url: string; note?: string; frames: number }> = ({
  title,
  tagline,
  url,
  note,
}) => {
  const frame = useCurrentFrame();
  const deviceWidth = 1120;
  const g = macbook(deviceWidth);
  const restLeft = (WIDTH - deviceWidth) / 2;
  const restTop = HEIGHT - g.height - 70;
  const screenCenter = { x: g.screen.x + g.screen.width / 2, y: g.screen.y + g.screen.height / 2 };
  const fill = WIDTH / g.screen.width;

  const out = progress(frame, sec(0.15), sec(1.1), easeInOut);
  const morph = progress(frame, sec(1.4), sec(0.85), easeInOut);

  // The icon the screen becomes: its glass square is about 80% of the image.
  const icon = { size: 236, x: WIDTH / 2, y: 330 };
  const iconSquare = icon.size * 0.8;
  const iconScale = iconSquare / g.screen.width;

  const pullScale = Math.pow(fill, 1 - out);
  const scale = pullScale * Math.pow(iconScale, morph);
  const restCenter = { x: restLeft + screenCenter.x, y: restTop + screenCenter.y };
  const center = {
    x: interpolate(out, [0, 1], [WIDTH / 2, restCenter.x]) + (icon.x - restCenter.x) * morph,
    y: interpolate(out, [0, 1], [HEIGHT / 2, restCenter.y]) + (icon.y - restCenter.y) * morph,
  };
  const tx = center.x - restLeft - scale * screenCenter.x;
  const ty = center.y - restTop - scale * screenCenter.y;
  const blur = Math.sin(Math.PI * out) * 4 + Math.sin(Math.PI * morph) * 3;
  // The screen's corners, rounding from the laptop's to the icon's (about 22% of its side).
  const rounding = out < 1 ? out : 1 + morph * ((iconSquare * 0.225) / iconScale / (deviceWidth * 0.012) - 1);

  const iconIn = progress(frame, sec(1.9), sec(0.35));

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <LightSky />
      <div
        style={{
          position: "absolute",
          left: restLeft,
          top: restTop,
          transformOrigin: "0 0",
          transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
          filter: `blur(${blur}px)`,
          opacity: 1 - iconIn,
        }}
      >
        <MacBook width={deviceWidth} screenRounding={rounding} bodyOpacity={1 - progress(frame, sec(1.4), sec(0.45))}>
          <div style={{ width: WIDTH, height: HEIGHT, transform: `scale(${g.screen.width / WIDTH})`, transformOrigin: "0 0" }}>
            <NightFrame />
            <Twinkles />
          </div>
        </MacBook>
      </div>
      <Img
        src={staticFile("icon.png")}
        style={{
          position: "absolute",
          left: icon.x - icon.size / 2,
          top: icon.y - icon.size / 2,
          width: icon.size,
          height: icon.size,
          opacity: iconIn,
          transform: `scale(${0.96 + iconIn * 0.04})`,
        }}
      />
      <Caption title={title} subtitle={tagline} tone="light" align="center" size={96} enterAt={sec(2.15)} style={{ left: 0, right: 0, top: 478 }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 800,
          textAlign: "center",
          ...blurIn(frame, sec(2.9)),
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 600, color: COLORS.ink, letterSpacing: "-0.01em" }}>{url}</div>
        {note && <div style={{ marginTop: 12, fontSize: 24, fontWeight: 500, color: COLORS.inkSoft }}>{note}</div>}
      </div>
    </AbsoluteFill>
  );
};
