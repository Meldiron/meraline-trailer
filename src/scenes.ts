// ─────────────────────────────────────────────────────────────────────────────────────────────────
// THE EDIT FILE. The film is this list, played top to bottom, each scene dissolving into the next.
//
//   • Reorder, delete, or duplicate entries to change the cut.
//   • Durations are in beats of the music, b(4) being four beats (0.52 s each at 116 BPM), so every
//     scene starts on a beat. Times inside a scene are in seconds. The music changes section where
//     ask, incognito, games, and end start, so those four start on bars (every four beats, counting
//     that each scene overlaps the one before by a beat); the comment after each duration says where
//     the scene starts.
//   • `transition` is how a scene arrives: dissolve, zoom, whip-left, whip-up, flash, or iris.
//   • Clip scenes have a `layout`: side (caption left), stack (caption on top), center (panel big,
//     caption below), mirror (panel left, caption right), follow (caption above the panel, the camera
//     following the answer down), or desktop (a recording made over a desktop, edge to edge); `scale`
//     sizes the panel, `tilt` swings it up into place.
//   • Clip scenes play a recording from public/clips (made by `npm run record`). `from` says where in
//     the recording the scene starts: a number of seconds, or a marker the recorder wrote when
//     something happened, such as { marker: "open", offset: -0.6 } for "0.6 s before the panel
//     opened". Markers survive re-recording a scene, so the edit stays in sync. A cut's `at` and `to`
//     and every other moment must fall in a stretch the scene plays.
//   • `keys` flashes keycaps; `camera` moves in and out ({ zoom: 1.15, x: 0.66, y: 0.42 } pushes in
//     toward that point of the frame, 0–1 each way) and follows a growing answer ({ lift: 300 } moves
//     the world up 300 pixels); `spots` rings a spot of the recording.
//
// Preview with `npm run studio`, render with `npm run render`.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

import { BEAT, SCREEN, WIDTH } from "./config";
import type { SceneSpec } from "./lib/timeline";
import { PARTY_PLAYLIST } from "./stills/MessyDesktop";

/** A number of beats, in seconds. */
const b = (beats: number) => beats * BEAT;

/** A point of the recorded screen, in points, as pixels of a full-frame recording. */
const onScreen = (p: { x: number; y: number }) => ({ x: (p.x * WIDTH) / SCREEN.width, y: ((p.y - SCREEN.region.y) * WIDTH) / SCREEN.width });

/** The message Nora sends in Messages: the sentence selected on screen, and the text the recording offers. */
const NORAS_MESSAGE =
  "Hi! Could we move Thursday's design review to the afternoon? The prototype needs one more pass before we show it.";

export const scenes: SceneSpec[] = [
  {
    id: "hook",
    type: "hook",
    duration: b(13), // starts on beat 0
    line: "Just one quick question…",
    keys: ["⌥", "Space"],
  },
  {
    id: "ask",
    type: "clip",
    clip: "ask",
    layout: "stack",
    from: { marker: "open", offset: -0.4 },
    // The whole question is typed; only the model's thinking is skipped.
    cuts: [{ at: { marker: "send", offset: 0.9 }, to: { marker: "done", offset: -0.95 } }],
    duration: b(15), // beat 12, a bar: the beat drops
    title: "Ask anything.",
    subtitle: "Press ⌥ Space in any app. The answer streams in right where you are.",
    keys: [{ at: { marker: "open", offset: -0.2 }, keys: ["⌥", "Space"] }],
  },
  {
    id: "select-text",
    type: "select",
    transition: "zoom",
    duration: b(10), // beat 26
    title: "Select anything.",
    subtitle: "Highlight text in any app. Meraline picks it up.",
    sentence: NORAS_MESSAGE,
    keys: ["⌥", "Space"],
  },
  {
    id: "select",
    type: "clip",
    clip: "select",
    layout: "center",
    // The panel is open with Nora's message on offer; the first button above it adds it.
    from: { marker: "click", offset: -0.5 },
    cuts: [{ at: { marker: "send", offset: 0.85 }, to: { marker: "done", offset: -0.7 } }],
    duration: b(18), // beat 35
    title: "Then ask about it.",
    subtitle: "One click brings the selection along. No copying, no pasting.",
    // The bare panel sits a little lower, clear of the top, and rises as the answer comes in.
    camera: [
      { at: { marker: "click", offset: 0 }, lift: -140 },
      { at: { marker: "send", offset: 0.1 }, lift: -140 },
      { at: { marker: "done", offset: -0.3 }, lift: 0 },
    ],
  },
  {
    id: "screen",
    type: "clip",
    clip: "screen",
    transition: "whip-up",
    layout: "desktop",
    // Over a messy desktop, the third button adds a screenshot, and the model finds the folder in it.
    from: { marker: "shot", offset: -0.9 },
    cuts: [{ at: { marker: "send", offset: 0.8 }, to: { marker: "done", offset: -0.25 } }],
    duration: b(20), // beat 52
    title: "It sees your screen.",
    subtitle: "One click adds a screenshot. Ask about anything on it.",
    camera: [
      { at: { marker: "shot", offset: 1.2 }, zoom: 1, x: 0.64, y: 0.42 },
      { at: { marker: "send", offset: 0.6 }, zoom: 1.1, x: 0.64, y: 0.42 },
      { at: { marker: "done", offset: 0.25 }, zoom: 1.2, x: 0.64, y: 0.42 },
    ],
    spots: [{ at: { marker: "done", offset: 0.4 }, ...onScreen(PARTY_PLAYLIST), r: 80, hold: 1.8 }],
  },
  {
    id: "agent-title",
    type: "slam",
    transition: "whip-left",
    duration: b(6), // beat 71
    lines: ["Or put", "an agent", "on it."],
  },
  {
    id: "agent",
    type: "clip",
    clip: "agent",
    transition: "zoom",
    layout: "follow",
    tilt: true,
    from: { marker: "mode", offset: -0.3 },
    cuts: [
      // The click on Agent, then the whole instruction typed out.
      { at: { marker: "mode", offset: 1.85 }, to: { marker: "mode", offset: 2.8 } },
      // Past its first thought, to the MCP servers it asks.
      { at: { marker: "send", offset: 0.45 }, to: { marker: "send", offset: 1.25 } },
      // From its question to the pointer on its way to Allow.
      { at: { marker: "ask", offset: 0.6 }, to: { marker: "allow", offset: 0.3 } },
    ],
    duration: b(22), // beat 76
    title: "Claude Code, Codex, OpenCode.",
    subtitle: "Your MCP servers come along. Nothing gets written until you say so.",
    captionUntil: { marker: "ask", offset: -1.0 },
    camera: [
      { at: { marker: "ask", offset: -0.85 }, lift: 0 },
      { at: { marker: "ask", offset: 0.25 }, lift: 390, zoom: 1, x: 0.5, y: 0.62 },
      { at: { marker: "done", offset: 0.5 }, zoom: 1.08 },
    ],
  },
  {
    id: "keys",
    type: "keys",
    transition: "flash",
    duration: b(9), // beat 97
    keys: ["⌘", "K"],
    title: "One keystroke away.",
    subtitle: "Copy, ask again, or start over. Every action lives behind ⌘K.",
  },
  {
    id: "actions",
    type: "clip",
    clip: "actions",
    transition: "zoom",
    layout: "center",
    from: { marker: "menu", offset: -0.4 },
    duration: b(8), // beat 105
    title: "Type to find it.",
    subtitle: "Arrow keys and Return, just like Spotlight.",
  },
  {
    id: "recent",
    type: "clip",
    clip: "recent",
    transition: "whip-up",
    layout: "stack",
    scale: 1.12,
    // The list opens above the panel, so the panel sits low enough for it to clear the caption.
    nudge: { y: 242 },
    from: { marker: "click", offset: -0.3 },
    duration: b(13), // beat 112
    title: "Your last five chats.",
    subtitle: "Search them and pick up where you left off. Quit, and they're gone.",
  },
  {
    id: "incognito",
    type: "mascot",
    transition: "iris",
    duration: b(9), // beat 124, a bar: the music breaks down
    title: "Go incognito.",
    subtitle: "This chat never lands in Recent Chats.",
    keys: ["⇧", "⌘", "N"],
  },
  {
    id: "anonymous",
    type: "clip",
    clip: "anonymous",
    layout: "center",
    scale: 1.8,
    grayscale: true,
    // The question typed in full and sent; the scene moves on a second into the wait.
    from: { marker: "toggle", offset: 0.7 },
    duration: b(9), // beat 132
    title: "Ask anything, secretly.",
  },
  {
    id: "games",
    type: "clip",
    clip: "games",
    transition: "whip-left",
    layout: "stack",
    scale: 1.28,
    from: { marker: "controller", offset: 0 },
    // Odd One Out, Rhyme Duel, and Letter Auction, each once the model has made its move. (The
    // recording also plays Fix the Typo, third; its sentence came back without a typo, so it's skipped.)
    cuts: [
      { at: { marker: "game1", offset: 0.88 }, to: { marker: "moved1", offset: -0.2 } },
      { at: { marker: "game2", offset: 0.8 }, to: { marker: "moved2", offset: -0.2 } },
      { at: { marker: "game3", offset: 0.15 }, to: { marker: "moved4", offset: -0.2 } },
    ],
    duration: b(21), // beat 140, a bar: the music comes back
    title: "Waiting? Play.",
    subtitle: "Eight quick word games against the model, right in the panel.",
  },
  {
    id: "providers",
    type: "montage",
    transition: "zoom",
    duration: b(10), // beat 160
    title: "Works with the AI you already use.",
    subtitle: "Apple Intelligence, your own API keys, local models, or the coding agents you're signed in to.",
  },
  {
    id: "private",
    type: "slam",
    duration: b(8), // beat 169
    lines: ["Nothing saved.", "Ever."],
    subtitle: "Chats live in memory. Keys stay in your Keychain.",
  },
  {
    id: "end",
    type: "end",
    duration: b(9), // beat 176, a bar: the outro
    title: "Meraline",
    tagline: "Ask AI anything, right where you are. Then let it go.",
    url: "github.com/Meldiron/meraline",
    note: "Free and open source for macOS 26",
  },
];

/** The soundtrack in public/, or null for none. tools/make-music.py rebuilds it to fit this cut. */
export const music: string | null = "music.m4a";
