import React from "react";

/**
 * A Messages-style conversation window, drawn (dark appearance, as on macOS 26): a floating glass
 * sidebar of conversations, a header with the contact, grey bubbles coming in and blue going out, the
 * iMessage field. The people are made up and their avatars are illustrations, not photos.
 */

/** Text metrics of the bubbles, in pixels of the window. */
export const MSG = {
  font: 24,
  lineHeight: 31,
  padX: 17,
  padY: 9,
  radius: 21,
  maxText: 520,
  family: '-apple-system, "SF Pro Text", BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif',
};

const TEXT = "#FFFFFF";
const SECONDARY = "rgba(235, 235, 245, 0.55)";
const INCOMING = "#3A3A3C";
const OUTGOING = "#0A84FF";
/** The text selection of a focused window in dark appearance, blue accent. */
export const SELECTION = "#2F66B8";

// ─── Measuring ──────────────────────────────────────────────────────────────────────────────────────

let context: CanvasRenderingContext2D | null = null;
const widths = new Map<string, number>();

/** The width of a run of bubble text, measured the way the browser will draw it. */
export function measure(text: string, size = MSG.font): number {
  const key = `${size}|${text}`;
  const known = widths.get(key);
  if (known !== undefined) return known;
  if (!context) context = document.createElement("canvas").getContext("2d");
  if (!context) return text.length * size * 0.5;
  context.font = `400 ${size}px ${MSG.family}`;
  const w = context.measureText(text).width;
  widths.set(key, w);
  return w;
}

/** Breaks text into lines no wider than `max`, word by word, as a bubble would. */
export function wrap(text: string, max = MSG.maxText): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next) > max) {
      lines.push(line + " ");
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** How many characters of `line` lie left of `x`: where a text cursor dropped at `x` would land. */
export function charsBefore(line: string, x: number): number {
  if (x <= 0) return 0;
  for (let i = 1; i <= line.length; i++) {
    const w = measure(line.slice(0, i));
    const prev = measure(line.slice(0, i - 1));
    if ((w + prev) / 2 > x) return i - 1;
  }
  return line.length;
}

// ─── People ─────────────────────────────────────────────────────────────────────────────────────────

export type Person = {
  name: string;
  initials: string;
  /** Background gradient, top left to bottom right. */
  bg: [string, string];
  /** An illustrated portrait; without these the avatar is the grey monogram. */
  skin?: string;
  hair?: string;
  hairStyle?: "bob" | "short" | "bun" | "curly" | "waves";
  shirt?: string;
};

export const NORA: Person = {
  name: "Nora Kessler",
  initials: "NK",
  bg: ["#FFC29A", "#F2798A"],
  skin: "#F3CBA8",
  hair: "#3A2722",
  hairStyle: "bob",
  shirt: "#2D6E73",
};

const PEOPLE: Person[] = [
  { name: "Design Crew", initials: "DC", bg: ["#A7ADBA", "#7E8490"] },
  { name: "Theo Marsh", initials: "TM", bg: ["#9CC7FF", "#5F7FF0"], skin: "#C68C63", hair: "#1E1815", hairStyle: "short", shirt: "#F2C94C" },
  { name: "Ava Chen", initials: "AC", bg: ["#AEEBD2", "#4DBB8C"], skin: "#F4D2B8", hair: "#16110F", hairStyle: "bun", shirt: "#E7668F" },
  { name: "Sam Ortiz", initials: "SO", bg: ["#A7ADBA", "#7E8490"] },
  { name: "Priya Nair", initials: "PN", bg: ["#FFD57A", "#F46B5E"], skin: "#A8715A", hair: "#1A110E", hairStyle: "curly", shirt: "#5A86EE" },
];

/** A round avatar: an illustrated bust on a gradient, or initials on grey like a contact without a photo. */
export const Avatar: React.FC<{ person: Person; size: number; style?: React.CSSProperties }> = ({ person, size, style }) => {
  const gid = `av-${person.initials}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ flex: "none", display: "block", ...style }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={person.bg[0]} />
          <stop offset="100%" stopColor={person.bg[1]} />
        </linearGradient>
        <clipPath id={`${gid}-c`}>
          <circle cx="50" cy="50" r="50" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${gid}-c)`}>
        <rect width="100" height="100" fill={`url(#${gid})`} />
        {person.skin ? (
          <Portrait person={person} />
        ) : (
          <text
            x="50"
            y="51"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily={MSG.family}
            fontWeight={600}
            fontSize="38"
            fill="#FFFFFF"
            letterSpacing="1"
          >
            {person.initials}
          </text>
        )}
      </g>
    </svg>
  );
};

const Portrait: React.FC<{ person: Person }> = ({ person }) => {
  const { skin = "#F0C8A8", hair = "#2A1D18", shirt = "#555", hairStyle = "short" } = person;
  const behind =
    hairStyle === "bob" ? (
      <path d="M29 50 C27 30 36 20 50 20 C64 20 73 30 71 50 L72 66 C66 70 60 70 58 66 L42 66 C40 70 34 70 28 66 Z" fill={hair} />
    ) : hairStyle === "waves" ? (
      <path d="M28 48 C26 28 37 19 50 19 C63 19 74 28 72 48 L76 80 C66 84 58 80 56 74 L44 74 C42 80 34 84 24 80 Z" fill={hair} />
    ) : hairStyle === "bun" ? (
      <circle cx="50" cy="19" r="10" fill={hair} />
    ) : null;
  const front =
    hairStyle === "bob" ? (
      <path d="M31 48 C31 31 40 25 51 25 C62 25 70 32 69 46 C62 44 55 38 52 32 C48 39 40 45 31 48 Z" fill={hair} />
    ) : hairStyle === "curly" ? (
      <g fill={hair}>
        {[
          [34, 38, 8],
          [40, 29, 9],
          [50, 25, 10],
          [60, 29, 9],
          [66, 38, 8],
          [31, 47, 6],
          [69, 47, 6],
        ].map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} />
        ))}
      </g>
    ) : (
      <path d="M32 44 C31 30 40 23 50 23 C61 23 69 30 68 44 C64 37 57 33 50 33 C43 33 36 37 32 44 Z" fill={hair} />
    );
  return (
    <g>
      {behind}
      <path d="M12 104 C14 82 30 72 50 72 C70 72 86 82 88 104 Z" fill={shirt} />
      <path d="M43 60 H57 V74 C54 78 46 78 43 74 Z" fill={skin} />
      <path d="M43 66 C47 69 53 69 57 66 V72 C53 74 47 74 43 72 Z" fill="#000" opacity="0.08" />
      <ellipse cx="50" cy="47" rx="17.5" ry="20" fill={skin} />
      <ellipse cx="32.5" cy="49" rx="3" ry="4.5" fill={skin} />
      <ellipse cx="67.5" cy="49" rx="3" ry="4.5" fill={skin} />
      {front}
      <g fill="#2A1E1A">
        <ellipse cx="43.5" cy="49" rx="1.9" ry="2.3" />
        <ellipse cx="56.5" cy="49" rx="1.9" ry="2.3" />
      </g>
      <path d="M45.5 57 Q50 60.5 54.5 57" stroke="#9B4D43" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <ellipse cx="40" cy="55" rx="3.2" ry="1.8" fill="#FF8F8F" opacity="0.28" />
      <ellipse cx="60" cy="55" rx="3.2" ry="1.8" fill="#FF8F8F" opacity="0.28" />
    </g>
  );
};

// ─── Bubbles ────────────────────────────────────────────────────────────────────────────────────────

/** A message bubble, with the iMessage tail on the last of a run. */
export const Bubble: React.FC<{
  from: "me" | "them";
  tail?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ from, tail = false, children, style }) => {
  const color = from === "me" ? OUTGOING : INCOMING;
  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
        padding: `${MSG.padY}px ${MSG.padX}px`,
        borderRadius: MSG.radius,
        background: color,
        color: TEXT,
        fontFamily: MSG.family,
        fontSize: MSG.font,
        lineHeight: `${MSG.lineHeight}px`,
        letterSpacing: "-0.005em",
        ...style,
      }}
    >
      {tail && (
        <svg
          width={28}
          height={22}
          viewBox="0 0 28 22"
          style={{
            position: "absolute",
            bottom: 0,
            [from === "me" ? "right" : "left"]: -7,
            transform: from === "me" ? "scaleX(-1)" : undefined,
          }}
        >
          <path d="M7 0 H28 V22 H13 C9 22 4 22.4 0 21.6 C4.6 19.4 7 15 7 8 Z" fill={color} />
        </svg>
      )}
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
};

/**
 * Bubble text, line by line, with a macOS text selection from its start to `end`: every line before the
 * last is highlighted to the right edge of the text, the last up to the selection's end, so the
 * highlight is one continuous shape and no two rectangles overlap.
 */
export const SelectableText: React.FC<{
  lines: string[];
  end?: { line: number; chars: number } | null;
  color?: string;
}> = ({ lines, end, color = SELECTION }) => (
  <div style={{ whiteSpace: "pre", fontFamily: MSG.family, fontSize: MSG.font, lineHeight: `${MSG.lineHeight}px` }}>
    {lines.map((line, i) => {
      const full = end ? i < end.line : false;
      const chars = end && i === end.line ? end.chars : 0;
      const shown = line.replace(/ $/, "");
      return (
        <div key={i} style={{ position: "relative", height: MSG.lineHeight }}>
          {full && <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: MSG.lineHeight, background: color }} />}
          <span style={{ position: "relative", display: "inline-block", verticalAlign: "top", height: MSG.lineHeight, background: chars > 0 ? color : undefined }}>
            {shown.slice(0, chars)}
          </span>
          <span style={{ position: "relative", display: "inline-block", verticalAlign: "top", height: MSG.lineHeight }}>{shown.slice(chars)}</span>
        </div>
      );
    })}
  </div>
);

/** The text cursor (I-beam), black with a white outline, its hot spot in the middle. */
export const IBeam: React.FC<{ x: number; y: number; height?: number; opacity?: number }> = ({ x, y, height = 38, opacity = 1 }) => {
  const w = height * 0.42;
  const d = "M3 2 Q9 2 9 7 L9 41 Q9 46 3 46 M15 2 Q9 2 9 7 M9 41 Q9 46 15 46 M5 24 L13 24";
  return (
    <svg
      width={w}
      height={height}
      viewBox="0 0 18 48"
      style={{ position: "absolute", left: x - w / 2, top: y - height / 2, opacity, overflow: "visible", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}
    >
      <path d={d} stroke="#FFFFFF" strokeWidth={4.2} fill="none" strokeLinecap="round" />
      <path d={d} stroke="#111111" strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </svg>
  );
};

/** The three bouncing dots of someone typing. */
const Typing: React.FC<{ frame: number }> = ({ frame }) => (
  <Bubble from="them" tail style={{ padding: "0 20px", height: MSG.lineHeight + MSG.padY * 2, display: "flex", alignItems: "center" }}>
    <div style={{ display: "flex", gap: 7, height: MSG.lineHeight + MSG.padY * 2, alignItems: "center" }}>
      {[0, 1, 2].map((i) => {
        const wave = (Math.sin(frame / 5 - i * 1.1) + 1) / 2;
        return <div key={i} style={{ width: 11, height: 11, borderRadius: 6, background: `rgba(235,235,245,${0.35 + wave * 0.45})`, transform: `translateY(${-wave * 3}px)` }} />;
      })}
    </div>
  </Bubble>
);

// ─── The window ─────────────────────────────────────────────────────────────────────────────────────

export const WINDOW = { width: 1240, height: 610, sidebar: 330, inset: 8 };
/** Where the conversation column starts, and the text box of the newest incoming message, in the window. */
export const PANE = { left: WINDOW.inset * 2 + WINDOW.sidebar, pad: 26 };
export const INPUT_TOP = WINDOW.height - 66;
/** The bottom of the newest message. */
export const LAST_BOTTOM = INPUT_TOP - 16;

type Row = { person: Person; preview: string; time: string };

const ROWS: Row[] = [
  { person: PEOPLE[0], preview: "Theo: Pushed the new icons to Figma", time: "9:12 AM" },
  { person: PEOPLE[1], preview: "Tacos at 7?", time: "8:30 AM" },
  { person: PEOPLE[2], preview: "Thanks for the notes!", time: "Yesterday" },
  { person: PEOPLE[3], preview: "See you at the offsite", time: "Monday" },
  { person: PEOPLE[4], preview: "Haha, perfect", time: "Sunday" },
];

/**
 * The window itself. The scene drives it: `typing` (0 to 1) brings in the dots, `arrived` (0 to 1) the
 * newest message, `scroll` lifts the older ones as new ones come in, and `selection`/`pointer` draw the
 * drag across the newest message's text (in its text box's own pixels).
 */
export const MessagesWindow: React.FC<{
  frame: number;
  contact: Person;
  /** The newest incoming message, already broken into lines. */
  lines: string[];
  typing: number;
  arrived: number;
  scroll: number;
  selection?: { line: number; chars: number } | null;
  pointer?: { x: number; y: number; opacity: number } | null;
}> = ({ frame, contact, lines, typing, arrived, scroll, selection, pointer }) => {
  const lastHeight = lines.length * MSG.lineHeight + MSG.padY * 2;
  const bubbleLeft = PANE.left + PANE.pad;
  const right = WINDOW.width - PANE.pad;
  // The conversation, stacked up from the newest message.
  const lastTop = LAST_BOTTOM - lastHeight;
  const oneLine = MSG.lineHeight + MSG.padY * 2;
  const stampToday = lastTop - 14 - 18;
  const inLove = stampToday - 16 - oneLine;
  const read = inLove - 10 - 16;
  const out2 = read - 4 - oneLine;
  const out1 = out2 - 4 - oneLine;
  const inAsk = out1 - 12 - oneLine;
  const stampYesterday = inAsk - 14 - 18;
  const newest = arrived > 0.5;
  const pop = Math.min(1, Math.max(0, arrived));

  return (
    <div
      style={{
        position: "relative",
        width: WINDOW.width,
        height: WINDOW.height,
        borderRadius: 26,
        overflow: "hidden",
        background: "linear-gradient(180deg, #232326 0%, #1C1C1E 100%)",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.13), 0 0 0 1.5px rgba(0,0,0,0.6), 0 50px 120px rgba(4, 2, 22, 0.65), 0 18px 40px rgba(4, 2, 22, 0.4)",
        fontFamily: MSG.family,
        color: TEXT,
      }}
    >
      {/* The conversation, under the header and above the field. */}
      <div style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, transform: `translateY(${scroll}px)` }}>
        <Stamp y={stampYesterday} bold="Yesterday" rest="6:02 PM" />
        <Row y={inAsk} left={bubbleLeft}>
          <Bubble from="them" tail>
            Do you have the latest onboarding files?
          </Bubble>
        </Row>
        <Row y={out1} right={right}>
          <Bubble from="me">Just sent over the new flow.</Bubble>
        </Row>
        <Row y={out2} right={right}>
          <Bubble from="me" tail>
            Curious what you think!
          </Bubble>
        </Row>
        <div style={{ position: "absolute", top: read, right: WINDOW.width - right + 4, fontSize: 14, lineHeight: "16px", color: SECONDARY, whiteSpace: "nowrap" }}>
          <span style={{ fontWeight: 600 }}>Read</span> Yesterday
        </div>
        <Row y={inLove} left={bubbleLeft}>
          <Bubble from="them" tail>
            Love the illustrations. Notes tomorrow!
          </Bubble>
        </Row>
        <div style={{ opacity: Math.min(1, typing * 2) }}>
          <Stamp y={stampToday} bold="Today" rest="9:41 AM" />
        </div>
      </div>

      {/* The newest message, and the dots before it. */}
      {typing > 0 && arrived < 1 && (
        <Row y={LAST_BOTTOM - oneLine} left={bubbleLeft}>
          <div
            style={{
              transformOrigin: "0% 100%",
              transform: `scale(${(0.6 + 0.4 * typing) * (1 - pop * 0.4)})`,
              opacity: Math.min(1, typing * 1.5) * (1 - Math.min(1, pop * 2.5)),
            }}
          >
            <Typing frame={frame} />
          </div>
        </Row>
      )}
      {arrived > 0 && (
        <Row y={lastTop} left={bubbleLeft}>
          <div style={{ transformOrigin: "0% 100%", transform: `scale(${0.55 + 0.45 * arrived})`, opacity: Math.min(1, arrived * 2) }}>
            <Bubble from="them" tail>
              <SelectableText lines={lines} end={selection} />
              {pointer && pointer.opacity > 0 && <IBeam x={pointer.x} y={pointer.y} opacity={pointer.opacity} />}
            </Bubble>
          </div>
        </Row>
      )}

      {/* Header: the contact, in the glass bar over the conversation. */}
      <div
        style={{
          position: "absolute",
          left: PANE.left,
          right: 0,
          top: 0,
          height: 118,
          background: "linear-gradient(180deg, rgba(34,34,37,0.98) 80%, rgba(34,34,37,0))",
        }}
      >
        <div style={{ position: "absolute", left: 0, right: 0, top: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
          <Avatar person={contact} size={46} />
          <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", gap: 4 }}>
            {contact.name}
            <svg width={7} height={11} viewBox="0 0 7 11">
              <path d="M1.5 1.5 L5.5 5.5 L1.5 9.5" stroke={SECONDARY} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            right: 22,
            top: 22,
            height: 40,
            padding: "0 16px",
            borderRadius: 20,
            display: "flex",
            alignItems: "center",
            gap: 20,
            background: "rgba(255,255,255,0.07)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
          }}
        >
          <svg width={26} height={18} viewBox="0 0 26 18">
            <rect x="1" y="2" width="16" height="14" rx="4" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" fill="none" />
            <path d="M18 7 L24 3.5 V14.5 L18 11 Z" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" fill="none" strokeLinejoin="round" />
          </svg>
          <svg width={20} height={20} viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="8.5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.6" fill="none" />
            <circle cx="10" cy="6" r="1.2" fill="rgba(255,255,255,0.7)" />
            <path d="M10 9 V14.5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* The field. */}
      <div style={{ position: "absolute", left: PANE.left + 20, right: 22, top: INPUT_TOP + 10, height: 42, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 19, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={16} height={16} viewBox="0 0 16 16">
            <path d="M8 2 V14 M2 8 H14" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div
          style={{
            flex: 1,
            height: 40,
            borderRadius: 20,
            boxShadow: "inset 0 0 0 1.2px rgba(255,255,255,0.16)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px 0 18px",
            fontSize: 18,
            color: "rgba(235,235,245,0.34)",
          }}
        >
          iMessage
          <svg width={20} height={18} viewBox="0 0 20 18">
            {[3, 7, 11, 15, 19].map((x, i) => (
              <path key={i} d={`M${x - 1} ${9 - [3, 6, 8, 5, 2][i]} V${9 + [3, 6, 8, 5, 2][i]}`} stroke="rgba(235,235,245,0.4)" strokeWidth="2" strokeLinecap="round" />
            ))}
          </svg>
        </div>
      </div>

      {/* The sidebar, floating glass. */}
      <div
        style={{
          position: "absolute",
          left: WINDOW.inset,
          top: WINDOW.inset,
          bottom: WINDOW.inset,
          width: WINDOW.sidebar,
          borderRadius: 20,
          background: "linear-gradient(180deg, rgba(58,58,64,0.72), rgba(44,44,50,0.72))",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08), 0 8px 24px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", left: 18, top: 18, display: "flex", gap: 9 }}>
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c, boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.25)" }} />
          ))}
        </div>
        <svg width={22} height={22} viewBox="0 0 22 22" style={{ position: "absolute", right: 18, top: 14 }}>
          <path d="M9 3 H5 A2.5 2.5 0 0 0 2.5 5.5 V17 A2.5 2.5 0 0 0 5 19.5 H16.5 A2.5 2.5 0 0 0 19 17 V13" stroke="rgba(255,255,255,0.65)" strokeWidth="1.7" fill="none" strokeLinecap="round" />
          <path d="M17.5 2.5 L20 5 L11.5 13.5 L8.5 14 L9 11 Z" stroke="rgba(255,255,255,0.65)" strokeWidth="1.7" fill="none" strokeLinejoin="round" />
        </svg>
        <div
          style={{
            position: "absolute",
            left: 12,
            right: 12,
            top: 52,
            height: 34,
            borderRadius: 10,
            background: "rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 11px",
            fontSize: 16,
            color: "rgba(235,235,245,0.42)",
          }}
        >
          <svg width={15} height={15} viewBox="0 0 15 15">
            <circle cx="6.3" cy="6.3" r="4.8" stroke="rgba(235,235,245,0.5)" strokeWidth="1.6" fill="none" />
            <path d="M10 10 L13.5 13.5" stroke="rgba(235,235,245,0.5)" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Search
        </div>
        <div style={{ position: "absolute", left: 8, right: 8, top: 98 }}>
          <ConversationRow
            row={{
              person: contact,
              preview: newest ? lines.join("").trim() : "Love the illustrations. Notes tomorrow!",
              time: newest ? "9:41 AM" : "Yesterday",
            }}
            selected
          />
          {ROWS.map((row) => (
            <ConversationRow key={row.person.name} row={row} />
          ))}
        </div>
      </div>
    </div>
  );
};

/** A line of the conversation: from `left` for incoming messages, up to `right` for outgoing ones. */
const Row: React.FC<{ y: number; left?: number; right?: number; children: React.ReactNode }> = ({ y, left, right, children }) => (
  <div
    style={{
      position: "absolute",
      top: y,
      left: right !== undefined ? 0 : left ?? 0,
      right: right !== undefined ? WINDOW.width - right : undefined,
      display: "flex",
      justifyContent: right !== undefined ? "flex-end" : "flex-start",
    }}
  >
    {children}
  </div>
);

const Stamp: React.FC<{ y: number; bold: string; rest: string }> = ({ y, bold, rest }) => (
  <div style={{ position: "absolute", top: y, left: PANE.left, right: 0, textAlign: "center", fontSize: 14, color: SECONDARY, lineHeight: "18px" }}>
    <span style={{ fontWeight: 600 }}>{bold}</span> {rest}
  </div>
);

const ConversationRow: React.FC<{ row: Row; selected?: boolean }> = ({ row, selected = false }) => (
  <div
    style={{
      height: 76,
      borderRadius: 12,
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "0 12px",
      background: selected ? "#0A84FF" : undefined,
    }}
  >
    <Avatar person={row.person} size={50} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: "#FFFFFF" }}>{row.person.name}</span>
        <span style={{ fontSize: 13, color: selected ? "rgba(255,255,255,0.8)" : SECONDARY }}>{row.time}</span>
      </div>
      <div
        style={{
          fontSize: 14,
          lineHeight: "18px",
          marginTop: 2,
          color: selected ? "rgba(255,255,255,0.82)" : SECONDARY,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {row.preview}
      </div>
    </div>
  </div>
);
