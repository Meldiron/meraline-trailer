// Settings shared by every scene. Colours follow Meraline's design: neutral glass, graphite, and pink
// only as an accent.

export const FPS = 60;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const FONT =
  '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif';
export const MONO = '"SF Mono", ui-monospace, Menlo, monospace';

export const COLORS = {
  pink: "#F48FC6",
  lavender: "#8E6CF0",
  ink: "#1B1830",
  inkSoft: "rgba(27, 24, 48, 0.62)",
  white: "#FFFFFF",
  whiteSoft: "rgba(255, 255, 255, 0.74)",
};

/**
 * The screen the clips are recorded on, in points, and the 16:9 part of it they cover. The recorder
 * captures only this region, and the backdrop still is drawn for the whole screen, so what the glass
 * sees while recording is exactly what the video shows around it.
 */
export const SCREEN = {
  width: 1512,
  height: 982,
  region: { x: 0, y: 66, width: 1512, height: 850.5 },
};

/** The soundtrack's tempo. Scenes are measured in beats, so every cut lands on the music. */
export const BPM = 116;
export const BEAT = 60 / BPM;

/** How long neighbouring scenes overlap while one turns into the next: one beat. */
export const OVERLAP = BEAT;

/**
 * Where the panel is in a recording, in pixels of the full 1920×1080 frame: the card's edges, its middle,
 * and the top of the buttons above it. Floating layouts cut the panel out of the recording around this box.
 */
export const PANEL = { left: 554, right: 1366, cx: 960, top: 246, cardTop: 300 };
