import React from "react";
import { AbsoluteFill, Img, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT } from "../config";
import { NightFrame, Twinkles } from "../components/Backdrop";
import { Caption } from "../components/Caption";
import { blurOut, sec } from "../lib/anim";

/** The providers, in rows, with their icons from public/providers (see tools/render-icons.swift). */
const ROWS: { icon: string; name: string }[][] = [
  [
    { icon: "apple", name: "Apple Intelligence" },
    { icon: "anthropic", name: "Anthropic" },
    { icon: "openAI", name: "OpenAI" },
    { icon: "gemini", name: "Google Gemini" },
  ],
  [
    { icon: "openRouter", name: "OpenRouter" },
    { icon: "ollama", name: "Ollama" },
    { icon: "custom", name: "LM Studio" },
  ],
  [
    { icon: "claudeCode", name: "Claude Code" },
    { icon: "codex", name: "Codex" },
    { icon: "opencode", name: "OpenCode" },
  ],
];

/**
 * "And so many other Live Activities", Meraline's way: every provider flies in from the edges as a
 * glass pill and settles into a wall, which drifts toward the camera while the caption reads.
 */
export const Montage: React.FC<{ title: string; subtitle?: string; frames: number }> = ({ title, subtitle, frames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exit = frames - sec(0.5);
  const drift = 1 + (frame / frames) * 0.05;
  let index = 0;

  return (
    <AbsoluteFill style={{ fontFamily: FONT, overflow: "hidden" }}>
      <NightFrame />
      <Twinkles />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
          paddingBottom: 220,
          transform: `scale(${drift})`,
          ...(frame >= exit ? blurOut(frame, exit, sec(0.4), 0, 16) : {}),
        }}
      >
        {ROWS.map((row, r) => (
          <div key={r} style={{ display: "flex", gap: 30 }}>
            {row.map((p) => {
              const i = index++;
              const arrive = spring({ frame: frame - sec(0.15) - i * 4, fps, config: { damping: 16, stiffness: 120, mass: 0.8 } });
              const angle = (i * 137.5 * Math.PI) / 180;
              const distance = 620 + (i % 3) * 140;
              return (
                <div
                  key={p.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 22,
                    padding: "16px 42px 16px 16px",
                    borderRadius: 999,
                    background: "linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.07))",
                    border: "1.5px solid rgba(255,255,255,0.22)",
                    boxShadow: "0 18px 50px rgba(8, 2, 40, 0.45), inset 0 1px 0 rgba(255,255,255,0.25)",
                    backdropFilter: "blur(22px)",
                    transform: `translate(${Math.cos(angle) * distance * (1 - arrive)}px, ${Math.sin(angle) * distance * (1 - arrive)}px) scale(${0.55 + arrive * 0.45})`,
                    opacity: Math.min(1, arrive * 1.6),
                    filter: `blur(${(1 - Math.min(1, arrive)) * 16}px)`,
                  }}
                >
                  <Img src={staticFile(`providers/${p.icon}.png`)} style={{ width: 74, height: 74 }} />
                  <span style={{ fontSize: 40, fontWeight: 600, color: "#FFFFFF", letterSpacing: "-0.01em" }}>{p.name}</span>
                </div>
              );
            })}
          </div>
        ))}
      </AbsoluteFill>
      <Caption
        title={title}
        subtitle={subtitle}
        enterAt={sec(0.9)}
        exitAt={exit}
        align="center"
        size={66}
        style={{ left: 0, right: 0, top: 790 }}
      />
    </AbsoluteFill>
  );
};
