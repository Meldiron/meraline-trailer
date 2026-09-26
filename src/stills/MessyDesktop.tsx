import React from "react";
import { AbsoluteFill } from "remotion";

/**
 * A very messy Mac desktop, for the screen-awareness clip: a dusk landscape wallpaper under some fifty
 * folders, screenshots, photos, and documents, one of which is "Party Playlist". It is drawn in the
 * screen's points at 2x (3024×1964 for a 1512×982-point screen): the recorder shows it behind Meraline as
 * the backdrop, and the promo build's screenshot button attaches the same picture, so what the model sees
 * is exactly what the viewer sees. No brand anywhere: no menu bar, no Dock, generic names.
 *
 * Render: npx remotion still src/index.ts DesktopStill public/backdrop-desktop.png
 */
export const DESKTOP_SCALE = 2;

type Kind = "folder" | "pdf" | "docx" | "xlsx" | "txt" | "zip" | "dmg" | "shot" | "photo" | "png" | "audio" | "movie";

/** One icon: its middle and the top of its picture, in screen points, and its name as the Finder wraps it. */
type Item = { x: number; y: number; kind: Kind; name: string; seed?: number };

/**
 * The icons are laid out below in points of a screen whose top 66 and bottom 66 points the film crops away
 * (see SCREEN.region), squeezed into the part it keeps.
 */
const down = (y: number) => Math.round(72 + (y - 38) * 0.93);

/** Where the target folder is, in screen points (the middle of its picture), for the film to point at. */
export const PARTY_PLAYLIST = { x: 1250, y: down(560) + 32 };

/** A column of icons the Finder lined up, top down, a row apart; null leaves a row empty. */
function column(x: number, ...rows: ([Kind, string] | null)[]): Item[] {
  return rows.flatMap((row, i) => (row ? [{ x, y: 38 + i * 108, kind: row[0], name: row[1], seed: 20 + i }] : []));
}

const ITEMS: Item[] = [
  // The right edge, where the Finder puts new things, one column and most of another.
  ...column(1452, ["folder", "Projects"], ["pdf", "final_FINAL_v3.pdf"], ["folder", "Untitled folder 4"],
    ["shot", "Screenshot 2026-09-12 at 14.03.11"], ["zip", "Archive (2).zip"], ["folder", "Taxes 2025"],
    ["docx", "Meeting notes (1).docx"], ["dmg", "Installer-2.4.1.dmg"]),
  ...column(1342, ["shot", "Screenshot 2026-09-18 at 09.41.52"], ["folder", "Untitled folder"], ["png", "logo-export@2x.png"],
    ["xlsx", "budget-2026 copy.xlsx"], ["folder", "Old Desktop"], null, ["txt", "todo.txt"], ["folder", "Receipts"]),
  // Dragged out of the columns and left there.
  { x: 1236, y: 84, kind: "pdf", name: "invoice_0823.pdf" },
  { x: 1226, y: 250, kind: "folder", name: "Untitled folder 2" },
  { x: 1228, y: 392, kind: "photo", name: "IMG_4398.HEIC", seed: 6 },
  { x: 1250, y: 560, kind: "folder", name: "Party Playlist" },
  { x: 1226, y: 700, kind: "movie", name: "Screen Recording 2026-09-02 at 18.22.07.mov", seed: 7 },
  { x: 1236, y: 846, kind: "zip", name: "photos-export.zip" },
  { x: 1128, y: 596, kind: "shot", name: "Screenshot 2026-09-24 at 17.30.02", seed: 5 },
  // Across the top, above where the window opens.
  { x: 520, y: 58, kind: "shot", name: "Screenshot 2026-09-20 at 22.15.40", seed: 8 },
  { x: 640, y: 142, kind: "folder", name: "stuff" },
  { x: 762, y: 48, kind: "pdf", name: "boarding-pass.pdf" },
  { x: 896, y: 124, kind: "png", name: "Untitled.png", seed: 9 },
  { x: 1024, y: 52, kind: "folder", name: "New Folder (3)" },
  { x: 1128, y: 158, kind: "docx", name: "CV_2026_final.docx" },
  // Behind the window.
  { x: 560, y: 380, kind: "folder", name: "Untitled folder 3" },
  { x: 720, y: 300, kind: "shot", name: "Screenshot 2026-09-21 at 10.12.44", seed: 10 },
  { x: 850, y: 430, kind: "pdf", name: "contract_v7.pdf" },
  { x: 990, y: 330, kind: "photo", name: "IMG_4377.HEIC", seed: 11 },
  { x: 640, y: 520, kind: "zip", name: "backup-old.zip" },
  // The left side, where things pile up.
  { x: 70, y: 56, kind: "folder", name: "Downloads copy" },
  { x: 184, y: 86, kind: "photo", name: "IMG_3981.HEIC", seed: 12 },
  { x: 300, y: 38, kind: "txt", name: "notes.txt" },
  { x: 76, y: 196, kind: "pdf", name: "Lease agreement signed.pdf" },
  { x: 222, y: 224, kind: "folder", name: "Wedding" },
  { x: 334, y: 170, kind: "shot", name: "Screenshot 2026-08-30 at 11.02.19", seed: 13 },
  { x: 108, y: 340, kind: "zip", name: "fonts.zip" },
  { x: 262, y: 372, kind: "png", name: "IMG_0042.png", seed: 14 },
  { x: 86, y: 482, kind: "folder", name: "Untitled folder 5" },
  { x: 244, y: 516, kind: "xlsx", name: "Q3 numbers.xlsx" },
  { x: 120, y: 622, kind: "dmg", name: "Setup.dmg" },
  { x: 300, y: 652, kind: "photo", name: "IMG_4402.HEIC", seed: 15 },
  { x: 70, y: 762, kind: "folder", name: "misc" },
  { x: 204, y: 796, kind: "pdf", name: "manual (1).pdf" },
  { x: 336, y: 834, kind: "shot", name: "Screenshot 2026-09-25 at 08.57.33", seed: 16 },
  // Below the window.
  { x: 472, y: 706, kind: "folder", name: "Photos to sort" },
  { x: 604, y: 790, kind: "audio", name: "voice memo 12.m4a" },
  { x: 724, y: 690, kind: "png", name: "mockup-v2.png", seed: 17 },
  { x: 862, y: 818, kind: "folder", name: "Untitled folder 6" },
  { x: 990, y: 704, kind: "pdf", name: "tickets.pdf" },
  { x: 1104, y: 840, kind: "docx", name: "letter draft.docx" },
];

export const MessyDesktop: React.FC = () => (
  <AbsoluteFill style={{ background: "#1B2450", overflow: "hidden" }}>
    <Wallpaper />
    <div style={{ position: "absolute", inset: 0, transform: `scale(${DESKTOP_SCALE})`, transformOrigin: "0 0" }}>
      {ITEMS.map((item, i) => (
        <DesktopIcon key={i} item={item} />
      ))}
    </div>
  </AbsoluteFill>
);

/** A dusk landscape: a warm glow on the horizon, three ranges of hills, a lake. */
const Wallpaper: React.FC = () => (
  <svg width="100%" height="100%" viewBox="0 0 1512 982" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0 }}>
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1E2A63" />
        <stop offset="0.38" stopColor="#3F4A9A" />
        <stop offset="0.62" stopColor="#8A6FB8" />
        <stop offset="0.8" stopColor="#E0909A" />
        <stop offset="1" stopColor="#F4B488" />
      </linearGradient>
      <radialGradient id="sun" cx="0.62" cy="0.7" r="0.42">
        <stop offset="0" stopColor="rgba(255, 214, 170, 0.95)" />
        <stop offset="0.25" stopColor="rgba(255, 180, 150, 0.45)" />
        <stop offset="1" stopColor="rgba(255, 180, 150, 0)" />
      </radialGradient>
      <linearGradient id="far" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#7C68B0" />
        <stop offset="1" stopColor="#5A4E96" />
      </linearGradient>
      <linearGradient id="mid" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#4B3F86" />
        <stop offset="1" stopColor="#332C68" />
      </linearGradient>
      <linearGradient id="near" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2A2558" />
        <stop offset="1" stopColor="#171538" />
      </linearGradient>
      <linearGradient id="lake" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#E7A08F" />
        <stop offset="1" stopColor="#6C5A9E" />
      </linearGradient>
    </defs>
    <rect width="1512" height="982" fill="url(#sky)" />
    <rect width="1512" height="982" fill="url(#sun)" />
    <path d="M0 640 C140 590 250 560 390 590 C520 618 600 540 730 548 C860 556 940 620 1070 600 C1200 580 1330 520 1512 560 L1512 982 L0 982 Z" fill="url(#far)" opacity="0.9" />
    <path d="M0 716 C120 690 230 650 360 668 C520 690 610 740 760 722 C900 706 1010 660 1150 676 C1290 692 1400 730 1512 700 L1512 982 L0 982 Z" fill="url(#mid)" />
    <path d="M0 770 C180 760 330 800 520 792 C640 787 700 770 820 778 L820 982 L0 982 Z" fill="url(#near)" />
    <path d="M820 778 C900 772 1000 790 1120 786 C1260 781 1390 752 1512 760 L1512 982 L820 982 Z" fill="url(#near)" />
    <path d="M560 800 C700 790 880 792 1040 806 C980 830 760 836 600 824 Z" fill="url(#lake)" opacity="0.55" />
    <path d="M0 860 C240 830 520 880 760 864 C1000 848 1260 880 1512 850 L1512 982 L0 982 Z" fill="#110F2C" opacity="0.85" />
  </svg>
);

const DesktopIcon: React.FC<{ item: Item }> = ({ item }) => (
  <div style={{ position: "absolute", left: item.x - 52, top: down(item.y), width: 104, display: "flex", flexDirection: "column", alignItems: "center" }}>
    <div style={{ width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.35))" }}>
      <Picture kind={item.kind} seed={item.seed ?? 0} />
    </div>
    <div
      style={{
        marginTop: 3,
        fontFamily: '"SF Pro Text", -apple-system, "Helvetica Neue", sans-serif',
        fontSize: 11.5,
        fontWeight: 500,
        lineHeight: 1.2,
        color: "#FFFFFF",
        textAlign: "center",
        textShadow: "0 1px 2px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.45)",
        whiteSpace: "nowrap",
      }}
    >
      {wrap(item.name).map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  </div>
);

/**
 * A name as the Finder sets it under an icon: on one line when it fits, else broken after a space, hyphen,
 * or underscore onto a second line, which loses its middle to an ellipsis when it is still too long.
 */
function wrap(name: string, width = 17): string[] {
  if (name.length <= width) return [name];
  let cut = -1;
  for (let i = Math.min(width, name.length - 1); i > 0; i--) {
    if (name[i] === " ") { cut = i; break; }
    if ((name[i - 1] === "-" || name[i - 1] === "_") && i <= width) { cut = i; break; }
  }
  const first = cut > 0 ? name.slice(0, cut).trimEnd() : name.slice(0, width);
  let rest = (cut > 0 ? name.slice(cut) : name.slice(width)).trimStart();
  if (rest.length > width) rest = `${rest.slice(0, 8)}…${rest.slice(-8)}`;
  return [first, rest];
}

const Picture: React.FC<{ kind: Kind; seed: number }> = ({ kind, seed }) => {
  switch (kind) {
    case "folder":
      return <Folder />;
    case "shot":
      return <Thumbnail seed={seed} screenshot />;
    case "photo":
    case "png":
      return <Thumbnail seed={seed} />;
    case "dmg":
      return <DiskImage />;
    default:
      return <Page kind={kind} />;
  }
};

/** The blue folder, drawn after the Finder's: a darker back with a tab, a lighter front. */
const Folder: React.FC = () => (
  <svg width="64" height="64" viewBox="0 0 64 64">
    <defs>
      <linearGradient id="folder-back" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#5EB6F6" />
        <stop offset="1" stopColor="#3C95E2" />
      </linearGradient>
      <linearGradient id="folder-front" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#92D4FF" />
        <stop offset="1" stopColor="#5BB2F3" />
      </linearGradient>
    </defs>
    <path d="M5 15 Q5 11 9 11 H23 Q25.5 11 27 13 L29.5 16 H55 Q59 16 59 20 V50 Q59 54 55 54 H9 Q5 54 5 50 Z" fill="url(#folder-back)" />
    <path d="M4 23 Q4 20 7 20 H57 Q60 20 60 23 V50 Q60 54 56 54 H8 Q4 54 4 50 Z" fill="url(#folder-front)" />
    <path d="M5 21.6 H59" stroke="rgba(255,255,255,0.55)" strokeWidth="0.8" />
  </svg>
);

const BADGES: Partial<Record<Kind, { label: string; color: string }>> = {
  pdf: { label: "PDF", color: "#E0443E" },
  docx: { label: "DOCX", color: "#2F6FDB" },
  xlsx: { label: "XLSX", color: "#1E9A55" },
  txt: { label: "TXT", color: "#8A8F99" },
  zip: { label: "ZIP", color: "#7A7F8A" },
  audio: { label: "M4A", color: "#D9468F" },
  movie: { label: "MOV", color: "#6B5BD6" },
};

/** A document: a white page with its corner folded, lines of text, and a band naming its type. */
const Page: React.FC<{ kind: Kind }> = ({ kind }) => {
  const badge = BADGES[kind] ?? { label: "FILE", color: "#8A8F99" };
  return (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <path d="M13 4 H40 L52 16 V60 H13 Z" fill="#FDFDFD" stroke="rgba(0,0,0,0.14)" strokeWidth="0.8" />
      <path d="M40 4 V16 H52" fill="#E6E8EC" stroke="rgba(0,0,0,0.14)" strokeWidth="0.8" />
      {kind === "zip" ? (
        [0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={i} x={i % 2 ? 30 : 33} y={8 + i * 4} width="3" height="2.4" fill="#7A7F8A" />)
      ) : kind === "audio" ? (
        <path d="M27 20 V34 A3.5 3.5 0 1 1 24 30.6 V16 L38 13 V31 A3.5 3.5 0 1 1 35 27.6 V17 Z" fill="#D9468F" />
      ) : kind === "movie" ? (
        <g>
          <rect x="19" y="14" width="27" height="20" rx="2" fill="#2B2B35" />
          <path d="M29 19 L37 24 L29 29 Z" fill="#FFFFFF" />
        </g>
      ) : (
        [0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x="18" y={20 + i * 4.2} width={i === 5 ? 18 : 29} height="1.6" rx="0.8" fill="#C9CDD4" />)
      )}
      <rect x="16" y="44" width="33" height="10" rx="2.5" fill={badge.color} />
      <text x="32.5" y="51.6" textAnchor="middle" fontSize="7" fontWeight="700" fill="#FFFFFF" fontFamily="-apple-system, Helvetica, sans-serif">
        {badge.label}
      </text>
    </svg>
  );
};

/** A mounted-disk-image look: a silver box with a slot. */
const DiskImage: React.FC = () => (
  <svg width="64" height="64" viewBox="0 0 64 64">
    <defs>
      <linearGradient id="dmg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#F4F5F7" />
        <stop offset="1" stopColor="#BFC4CC" />
      </linearGradient>
    </defs>
    <rect x="8" y="18" width="48" height="30" rx="5" fill="url(#dmg)" stroke="rgba(0,0,0,0.18)" strokeWidth="0.8" />
    <rect x="14" y="37" width="24" height="3" rx="1.5" fill="#6D7380" />
    <circle cx="48" cy="38.5" r="2.2" fill="#43C06A" />
  </svg>
);

const PALETTES = [
  ["#6CB7F0", "#F7D38A", "#3E7F5C"],
  ["#F29C7B", "#FFE0A8", "#5B4B8A"],
  ["#9AD0E6", "#FFFFFF", "#2F6F8F"],
  ["#F6C5D8", "#FFF1C9", "#8A5C9E"],
  ["#A8D8A0", "#FFF6D0", "#4F7F3A"],
  ["#7FA7E8", "#FFD6A0", "#3B3F7A"],
];

/**
 * A preview, as the Finder shows pictures: a photo (a sky, a sun, a hill) or, for a screenshot, a little
 * window full of blocks, each varied by its seed.
 */
const Thumbnail: React.FC<{ seed: number; screenshot?: boolean }> = ({ seed, screenshot = false }) => {
  const [sky, sun, land] = PALETTES[seed % PALETTES.length];
  const tall = !screenshot && seed % 3 === 0;
  const w = tall ? 40 : 60;
  const h = tall ? 56 : screenshot ? 39 : 44;
  const x = (64 - w) / 2;
  const y = (64 - h) / 2;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <rect x={x - 1.5} y={y - 1.5} width={w + 3} height={h + 3} rx="2" fill="#FFFFFF" />
      {screenshot ? (
        <g>
          <rect x={x} y={y} width={w} height={h} fill={seed % 2 ? "#E9ECF2" : "#2A2D3A"} />
          <rect x={x + 5} y={y + 5} width={w * 0.62} height={h * 0.7} rx="1.5" fill={seed % 2 ? "#FFFFFF" : "#3A3F52"} />
          <rect x={x + 5} y={y + 5} width={w * 0.62} height="3.5" fill={seed % 2 ? "#D5D9E2" : "#4B5168"} />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={x + 9} y={y + 12 + i * 5} width={w * (0.45 - i * 0.08)} height="1.8" fill={seed % 2 ? "#B8BECB" : "#6F7690"} />
          ))}
          <rect x={x + w * 0.7} y={y + 9} width={w * 0.24} height={h * 0.5} rx="1.5" fill={sky} opacity="0.9" />
        </g>
      ) : (
        <g>
          <rect x={x} y={y} width={w} height={h} fill={sky} />
          <circle cx={x + w * 0.68} cy={y + h * 0.35} r={Math.min(w, h) * 0.13} fill={sun} />
          <path d={`M${x} ${y + h * 0.72} Q${x + w * 0.3} ${y + h * 0.5} ${x + w * 0.55} ${y + h * 0.68} T${x + w} ${y + h * 0.62} V${y + h} H${x} Z`} fill={land} />
        </g>
      )}
    </svg>
  );
};
