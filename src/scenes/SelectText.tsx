import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BEAT, FONT, FPS } from "../config";
import { NightFrame, Sparkle, Twinkles } from "../components/Backdrop";
import { Caption } from "../components/Caption";
import { LAST_BOTTOM, MSG, MessagesWindow, NORA, PANE, SelectableText, WINDOW, charsBefore, measure, wrap } from "../components/Messages";
import { PressKeys } from "../components/PressKeys";
import { easeInOut, easeOut, progress, sec } from "../lib/anim";

/** Where the Messages window sits in the frame before the camera moves. */
const WIN = { x: 340, y: 150 };
/**
 * Where the next scene's panel opens (the top middle) and later shows the selection as a card: the text
 * flies up there and goes in with a glint of Meraline's sparkle as the scenes dissolve.
 */
const HANDOFF = { x: 960, y: 330 };

export const SELECT_SUBTITLE = "Highlight text in any app, or just copy it. Meraline picks it up.";

/**
 * Selecting text in another app, as everyone has done it: a Messages conversation, a new message from
 * Nora arrives (the dots, then the bubble), the camera eases in, and a text cursor drags across it while
 * a real macOS selection follows, one highlight per line. Then ⌥ Space is played on the beat, and the
 * selected text lifts out of the bubble as a card and glides up to where Meraline's panel will show it
 * in the next scene, while the window falls back into the dark.
 */
export const SelectText: React.FC<{ sentence: string; title: string; subtitle?: string; keys: string[]; frames: number }> = ({
  sentence,
  title,
  subtitle = SELECT_SUBTITLE,
  keys,
  frames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const beat = (n: number) => sec(BEAT * n);
  // The press lands two beats before the end whatever the length, so the hand-off fills the last beats.
  const beats = Math.max(8, Math.round(frames / (BEAT * FPS)));
  const t = {
    caption: beat(0.9),
    typing: beat(0.6),
    arrive: beat(1.45),
    push: beat(1.2),
    pushFor: beat(3),
    keys: beat(beats - 3),
    press: beat(beats - 2),
    captionOut: frames - beat(0.9),
  };
  const dragTo = t.keys - beat(0.3);
  const dragFrom = Math.max(t.arrive + beat(1.2), dragTo - beat(2.1));
  const pointerIn = dragFrom - 16;
  const lift = t.press + 2;
  const flightEnd = frames - 22;

  // The message, and its text box inside the window.
  const lines = wrap(sentence);
  const widths = lines.map((l) => measure(l.replace(/ $/, "")));
  const textWidth = Math.max(...widths);
  const textHeight = lines.length * MSG.lineHeight;
  const bubbleHeight = textHeight + MSG.padY * 2;
  const box = { x: PANE.left + PANE.pad + MSG.padX, y: LAST_BOTTOM - bubbleHeight + MSG.padY };

  // The conversation scrolls up as the dots, then the message, come in.
  const typing = spring({ frame: frame - t.typing, fps, config: { damping: 16, stiffness: 170, mass: 0.7 } });
  const arrived = spring({ frame: frame - t.arrive, fps, config: { damping: 13, stiffness: 190, mass: 0.7 } });
  const oneLine = MSG.lineHeight + MSG.padY * 2;
  const scroll = interpolate(typing, [0, 1], [bubbleHeight + 48, bubbleHeight - oneLine]) - (bubbleHeight - oneLine) * Math.min(1, arrived);

  // The camera: in from the whole window toward the message, keeping the bottom edge where it is.
  const push = progress(frame, t.push, t.pushFor, easeInOut);
  const zoom = 1 + 0.2 * push;
  const origin = { x: WIN.x + box.x + textWidth / 2, y: WIN.y + WINDOW.height };
  const toFrame = (x: number, y: number) => ({ x: origin.x + (WIN.x + x - origin.x) * zoom, y: origin.y + (WIN.y + y - origin.y) * zoom });

  // The drag: a text cursor glides in, then pulls diagonally from before "Hi!" to past the last word,
  // and the selection follows it the way macOS does, a line at a time.
  const start = { x: -4, y: MSG.lineHeight / 2 };
  const end = { x: widths[widths.length - 1] + 16, y: textHeight - MSG.lineHeight / 2 };
  const drag = progress(frame, dragFrom, dragTo - dragFrom, easeInOut);
  const approach = progress(frame, pointerIn, dragFrom - pointerIn, easeOut);
  let pointer = { x: start.x + (1 - approach) * 150, y: start.y + (1 - approach) * 110 };
  if (frame >= dragFrom) {
    pointer = {
      x: start.x + (end.x - start.x) * drag + Math.sin(Math.PI * drag) * 60,
      y: start.y + (end.y - start.y) * Easing.inOut(Easing.sin)(drag),
    };
  }
  let selection: { line: number; chars: number } | null = null;
  if (frame >= dragFrom) {
    const line = Math.min(lines.length - 1, Math.max(0, Math.floor(pointer.y / MSG.lineHeight)));
    selection = { line, chars: charsBefore(lines[line].replace(/ $/, ""), pointer.x) };
  }
  const pointerOpacity = frame < pointerIn ? 0 : Math.min(approach * 2, 1) * (1 - progress(frame, t.press - 4, 8));

  // The hand-off: the window falls back, and the selection lifts out and flies to the panel's card.
  const back = progress(frame, lift, sec(0.75), easeInOut);
  const pick = progress(frame, lift, 9, easeOut);
  const fly = progress(frame, lift + 5, flightEnd - lift - 5, Easing.bezier(0.45, 0, 0.2, 1));
  const from = toFrame(box.x, box.y);
  const endScale = 0.3;
  const cardPad = { x: 22, y: 16 };
  const to = {
    x: HANDOFF.x - ((textWidth + cardPad.x * 2) * endScale) / 2 + cardPad.x * endScale,
    y: HANDOFF.y - ((textHeight + cardPad.y * 2) * endScale) / 2 + cardPad.y * endScale,
  };
  // It keeps its size most of the way, then is drawn into the sparkle.
  const cardScale = interpolate(fly, [0, 0.62, 1], [zoom, 0.9, endScale], { easing: easeInOut }) * (1 + 0.05 * pick * (1 - fly));
  const cardX = interpolate(fly, [0, 1], [from.x, to.x]);
  const cardY = interpolate(fly, [0, 1], [from.y, to.y]) - Math.sin(Math.PI * fly) * 40 - pick * 8 * (1 - fly);
  const cardFade = 1 - progress(fly, 0.7, 0.3, Easing.in(Easing.quad));
  const glintAt = lift + 5 + Math.round((flightEnd - lift - 5) * 0.78);
  const glint = progress(frame, glintAt, sec(0.4), easeOut);

  // Where the keys go: beside the message, in the empty right half of the conversation.
  const bubbleRight = toFrame(box.x + textWidth + MSG.padX, 0).x;
  const bubbleMiddle = toFrame(0, box.y + textHeight / 2).y;

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <NightFrame />
      <Twinkles />

      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          transformOrigin: `${origin.x}px ${origin.y}px`,
          transform: `scale(${zoom * (1 - 0.05 * back)}) translateY(${back * 24}px)`,
          opacity: 1 - 0.7 * back,
          filter: back > 0 ? `blur(${back * 9}px)` : undefined,
        }}
      >
        <div style={{ position: "absolute", left: WIN.x, top: WIN.y }}>
          <MessagesWindow
            frame={frame}
            contact={NORA}
            lines={lines}
            typing={frame >= t.typing ? typing : 0}
            arrived={frame >= t.arrive ? arrived : 0}
            scroll={scroll}
            selection={selection}
            pointer={frame >= pointerIn ? { x: pointer.x, y: pointer.y, opacity: pointerOpacity } : null}
          />
        </div>
      </div>

      <PressKeys
        keys={keys}
        at={t.keys}
        pressAt={t.press}
        size={78}
        ringScale={2.2}
        exitAt={lift + 10}
        style={{ position: "absolute", left: bubbleRight + 70, top: bubbleMiddle - 39 }}
      />

      {frame >= lift && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transformOrigin: "0 0",
            transform: `translate(${cardX}px, ${cardY}px) scale(${cardScale})`,
            opacity: cardFade,
            filter: cardFade < 1 ? `blur(${(1 - cardFade) * 6}px)` : undefined,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: -cardPad.x,
              top: -cardPad.y,
              width: textWidth + cardPad.x * 2,
              height: textHeight + cardPad.y * 2,
              borderRadius: 22,
              background: `rgba(40, 36, 62, ${0.94 * pick})`,
              boxShadow: `0 0 0 1.5px rgba(255,255,255,${0.2 * pick}), 0 ${20 + 20 * pick}px ${50 + 30 * pick}px rgba(6, 2, 30, ${0.55 * pick}), 0 0 ${60 * fly}px rgba(244, 143, 198, ${0.3 * fly})`,
              backdropFilter: "blur(20px)",
            }}
          />
          <div style={{ position: "relative", color: "#FFFFFF" }}>
            <SelectableText
              lines={lines}
              end={{ line: lines.length - 1, chars: lines[lines.length - 1].length }}
              color={`rgba(47, 102, 184, ${1 - progress(fly, 0.1, 0.5, easeInOut)})`}
            />
          </div>
        </div>
      )}

      {frame >= glintAt && glint < 1 && (
        <div
          style={{
            position: "absolute",
            left: HANDOFF.x - 70,
            top: HANDOFF.y - 70,
            width: 140,
            height: 140,
            opacity: Math.sin(Math.PI * glint),
            transform: `scale(${0.3 + glint * 0.9}) rotate(${glint * 45}deg)`,
            filter: "drop-shadow(0 0 18px rgba(244, 143, 198, 0.9)) drop-shadow(0 0 40px rgba(142, 108, 240, 0.6))",
          }}
        >
          <Sparkle size={140} color="#FFE3F2" />
        </div>
      )}

      <Caption
        title={title}
        subtitle={subtitle}
        enterAt={t.caption}
        exitAt={t.captionOut}
        align="center"
        size={66}
        style={{ left: 0, right: 0, top: 812 }}
      />
    </AbsoluteFill>
  );
};
