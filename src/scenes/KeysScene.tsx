import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BEAT, FONT } from "../config";
import { NightFrame, Twinkles } from "../components/Backdrop";
import { Caption } from "../components/Caption";
import { PressKeys } from "../components/PressKeys";
import { blurOut, easeOut, progress, sec } from "../lib/anim";

/**
 * A shortcut, huge: the keycaps pop in as the scene arrives and play the chord on the second beat, with a
 * ring of light from the press. The caption lands with the press and then holds, so it can be read.
 */
export const KeysScene: React.FC<{ keys: string[]; title: string; subtitle?: string; frames: number }> = ({ keys, title, subtitle, frames }) => {
  const frame = useCurrentFrame();
  const beat = (n: number) => sec(BEAT * n);
  const popAt = beat(0.35);
  const pressAt = beat(2);
  const exit = frames - beat(0.9);
  // After the press the keys lift a touch and float, leaving the stage to the caption.
  const settle = progress(frame, pressAt + 6, sec(1.1), easeOut);
  const float = Math.sin((frame - pressAt) / 34) * 5 * settle;
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <NightFrame />
      <Twinkles />
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingBottom: 170,
          ...(frame >= exit ? blurOut(frame, exit, sec(0.35), 0, 14) : {}),
        }}
      >
        <div style={{ transform: `translateY(${-settle * 18 + float}px)` }}>
          <PressKeys keys={keys} at={popAt} pressAt={pressAt} size={210} gap={40} ringScale={2} />
        </div>
      </AbsoluteFill>
      <Caption
        title={title}
        subtitle={subtitle}
        enterAt={pressAt - 3}
        subtitleAt={pressAt + sec(0.32)}
        exitAt={exit}
        align="center"
        size={78}
        style={{ left: 0, right: 0, top: 720 }}
      />
    </AbsoluteFill>
  );
};
