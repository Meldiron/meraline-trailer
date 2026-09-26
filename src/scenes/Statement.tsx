import React from "react";
import { AbsoluteFill } from "remotion";
import { LightSky, NightFrame, Twinkles } from "../components/Backdrop";
import { Caption } from "../components/Caption";
import { sec } from "../lib/anim";
import type { Tone } from "../lib/timeline";

/** A line on its own, in the middle of the sky. */
export const Statement: React.FC<{ title: string; subtitle?: string; tone?: Tone; frames: number }> = ({
  title,
  subtitle,
  tone = "night",
  frames,
}) => (
  <AbsoluteFill>
    {tone === "night" ? (
      <>
        <NightFrame />
        <Twinkles />
      </>
    ) : (
      <LightSky />
    )}
    <Caption
      title={title}
      subtitle={subtitle}
      tone={tone}
      align="center"
      size={104}
      enterAt={sec(0.3)}
      exitAt={frames - sec(0.55)}
      style={{ left: 0, right: 0, top: 400 }}
    />
  </AbsoluteFill>
);
