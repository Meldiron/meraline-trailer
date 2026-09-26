import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile } from "remotion";
import { TransitionLayer } from "./components/TransitionLayer";
import { sec } from "./lib/anim";
import { SceneSpec, place } from "./lib/timeline";
import { music, scenes } from "./scenes";
import { ClipScene } from "./scenes/ClipScene";
import { EndCard } from "./scenes/EndCard";
import { Hook } from "./scenes/Hook";
import { KeysScene } from "./scenes/KeysScene";
import { Mascot } from "./scenes/Mascot";
import { Montage } from "./scenes/Montage";
import { SelectText } from "./scenes/SelectText";
import { Slam } from "./scenes/Slam";
import { Statement } from "./scenes/Statement";

export const timeline = place(scenes);

/** One scene, drawn from its entry in scenes.ts. */
export const SceneView: React.FC<{ spec: SceneSpec }> = ({ spec }) => {
  const frames = sec(spec.duration);
  switch (spec.type) {
    case "hook":
      return <Hook line={spec.line} keys={spec.keys} frames={frames} />;
    case "clip":
      return (
        <ClipScene
          clip={spec.clip}
          from={spec.from}
          cuts={spec.cuts}
          frames={frames}
          title={spec.title}
          subtitle={spec.subtitle}
          captionIn={spec.captionIn}
          captionOut={spec.captionOut}
          captionUntil={spec.captionUntil}
          keys={spec.keys}
          camera={spec.camera}
          layout={spec.layout}
          scale={spec.scale}
          tilt={spec.tilt}
          nudge={spec.nudge}
          spots={spec.spots}
          grayscale={spec.grayscale}
        />
      );
    case "montage":
      return <Montage title={spec.title} subtitle={spec.subtitle} frames={frames} />;
    case "statement":
      return <Statement title={spec.title} subtitle={spec.subtitle} tone={spec.tone} frames={frames} />;
    case "slam":
      return <Slam lines={spec.lines} subtitle={spec.subtitle} tone={spec.tone} keys={spec.keys} frames={frames} />;
    case "select":
      return <SelectText sentence={spec.sentence} title={spec.title} subtitle={spec.subtitle} keys={spec.keys} frames={frames} />;
    case "keys":
      return <KeysScene keys={spec.keys} title={spec.title} subtitle={spec.subtitle} frames={frames} />;
    case "mascot":
      return <Mascot title={spec.title} subtitle={spec.subtitle} keys={spec.keys} frames={frames} />;
    case "end":
      return <EndCard title={spec.title} tagline={spec.tagline} url={spec.url} note={spec.note} frames={frames} />;
  }
};

export const Promo: React.FC = () => {
  const { placed, total } = timeline;
  return (
    <AbsoluteFill style={{ background: "#0E0A24" }}>
      {placed.map((p, i) => (
        <Sequence key={p.spec.id} from={p.start} durationInFrames={p.frames} name={p.spec.id}>
          <TransitionLayer
            arrive={i > 0 ? p.spec.transition ?? "dissolve" : undefined}
            leave={placed[i + 1] ? placed[i + 1].spec.transition ?? "dissolve" : undefined}
            frames={p.frames}
          >
            <SceneView spec={p.spec} />
          </TransitionLayer>
        </Sequence>
      ))}
      {music && (
        <Audio
          src={staticFile(music)}
          volume={(f) =>
            interpolate(f, [0, sec(0.6), total - sec(2.2), total - 1], [0, 0.85, 0.85, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          }
        />
      )}
    </AbsoluteFill>
  );
};
