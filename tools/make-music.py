#!/usr/bin/env python3
"""
Builds public/music.m4a, the film's soundtrack, from GarageBand's Apple Loops (Apple's license lets you use
them royalty-free in the soundtrack of your own video).

The song is built on one family of loops, "Boogie Right" from the Disco Funk pack: 116 BPM, E minor, with a
slap bass, a funk guitar, beats, two synth leads that trade phrases, and a vocal synth. One family means every
part is written to the same chords, so nothing clashes. Over it, a wah-wah lead guitar from the same pack
("Lyrical Wah Guitar", an E minor pentatonic line recorded at 120 BPM and stretched to 116) answers the leads.
The loops are listed in PARTS; any other loop in E minor from the pack can take a part's place.

The arrangement follows the film: this script reads src/scenes.ts and src/config.ts, finds where the scenes
named in SECTIONS start, and changes section on the nearest bar:

    intro      guitar and hi-hats, a noise riser that ends on the drop
    drop       beat, bass, and the two leads, as the camera flies into the Mac (the "ask" scene); the wah
               guitar comes in eight bars later
    breakdown  drums, leads, and wah guitar out, bass and vocal synth, for the incognito moment
    return     everything back, the wah guitar on top, for the games and the montage
    outro      vocal synth, the lead, and the wah guitar, for the end card, carrying on past the
               film's end (the film fades the music out on its last seconds)

Re-run it after changing scenes.ts and the music re-fits the cut:

    python3 tools/make-music.py

Loops are decoded with afconvert, which drops the AAC padding ffmpeg leaves in; with the padding, every
repeat ran a little long and the parts drifted apart ("laggy"). A loop recorded at another tempo is stretched
to the film's with ffmpeg's atempo, which keeps its pitch. Every bar is then copied to its exact sample, so
the parts stay locked together for the whole film.
"""
import functools
import json
import math
import os
import re
import subprocess
import tempfile
import wave

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOOPS = "/Library/Audio/Apple Loops/Apple/09 Disco Funk"
RATE = 48000

# The loops each part plays, one after another, over and over. Any loop in E minor fits the chords; one
# recorded at another tempo is stretched to the film's (its length in beats is in the loop's metadata).
PARTS = {
    "guitar": ["Boogie Right Funk Guitar 02"],
    "hats": ["Boogie Right Hi-Hat Topper"],
    "drums": ["Boogie Right Beat 01"] * 3 + ["Boogie Right Beat 02"],  # a fill every eight bars
    "bass": ["Boogie Right Slap Bass 02"],
    "lead": ["Boogie Right Synth Lead 01", "Boogie Right Synth Lead 02"],
    "hook": ["Lyrical Wah Guitar"],  # the line on top that answers the leads
    "vox": ["Boogie Right Vox Synth"],
}

# Which scene starts each section. The breakdown runs from its scene to the return's.
SECTIONS = {"drop": "ask", "breakdown": "incognito", "return": "games", "outro": "end"}

# How loud each part is, 0 to 1.
LEVELS = {"drums": 0.9, "bass": 0.8, "lead": 0.72, "hook": 0.7, "guitar": 0.5, "hats": 0.55, "vox": 0.6, "riser": 0.75}

# A noise riser (no key, so it fits any song) that ends exactly on the drop and on the return.
RISER = "80s Synth FX Riser 01"

# Loudness of the finished track, in LUFS; -16 is usual for video on the web.
TARGET_LUFS = -16


def film_timeline():
    """Beats per minute, the film's length in beats, and where each scene starts, in beats."""
    config = open(os.path.join(ROOT, "src/config.ts")).read()
    bpm = float(re.search(r"export const BPM = ([\d.]+);", config).group(1))
    scenes = open(os.path.join(ROOT, "src/scenes.ts")).read()
    ids = re.findall(r'id: "([a-z0-9-]+)"', scenes)
    beats = [float(x) for x in re.findall(r"duration: b\(([\d.]+)\)", scenes)]
    assert len(ids) == len(beats), "every scene in scenes.ts needs a duration in beats, b(…)"
    starts, cursor = {}, 0.0
    for i, (sid, length) in enumerate(zip(ids, beats)):
        start = 0.0 if i == 0 else cursor - 1
        starts[sid] = start
        cursor = start + length
    return bpm, cursor, starts


def read_wav(path):
    with wave.open(path) as w:
        return w.readframes(w.getnframes())


def write_wav(path, frames):
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(bytes(frames))


@functools.cache
def beats_in(name):
    """A loop's length in beats, from the Apple Loops metadata at the end of its file."""
    data = open(os.path.join(LOOPS, name + ".caf"), "rb").read()
    return int(re.search(rb"beat count\0(\d+)\0", data).group(1))


def decode(name, folder):
    """A loop as 48 kHz stereo 16-bit frames, cut to its exact length (afconvert drops the AAC padding)."""
    path = os.path.join(folder, name.replace(" ", "-") + ".wav")
    if not os.path.exists(path):
        subprocess.run(["afconvert", "-f", "WAVE", "-d", f"LEI16@{RATE}", "-c", "2", os.path.join(LOOPS, name + ".caf"), path], check=True)
    return read_wav(path)


def fitted(name, folder, bpm):
    """A loop at the film's tempo, its beats long to the sample. One recorded at another tempo is stretched with
    atempo three copies long and the middle copy kept, so it still loops without a seam; the copy is counted
    from the end, because atempo shortens the very start by a few milliseconds and would pull it off the beat."""
    frames = decode(name, folder)
    have, want = len(frames) // 4, round(beats_in(name) * 60 / bpm * RATE)
    if abs(have - want) <= want // 1000:
        return frames
    path = os.path.join(folder, f"{name.replace(' ', '-')}-{bpm:g}bpm.wav")
    if not os.path.exists(path):
        with tempfile.TemporaryDirectory() as work:
            three, stretched = os.path.join(work, "three.wav"), os.path.join(work, "stretched.wav")
            write_wav(three, frames * 3)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", three, "-af", f"atempo={have / want:.6f}", "-c:a", "pcm_s16le", stretched], check=True)
            out = read_wav(stretched)
            end = len(out) // 4 - want
            write_wav(path, out[(end - want) * 4 : end * 4])
    return read_wav(path)


def main():
    bpm, film_beats, starts = film_timeline()
    bar_seconds = 4 * 60 / bpm
    bar_frames = bar_seconds * RATE
    bar_of = lambda scene: int(round(starts[scene] / 4))
    drop, brk, back, outro = (bar_of(SECTIONS[k]) for k in ("drop", "breakdown", "return", "outro"))
    # A few bars past the film's end, so the music can never stop before the picture does; the film fades
    # it out over its own last seconds (src/Promo.tsx).
    total_bars = int(math.ceil(film_beats / 4)) + 3
    print(f"{bpm:g} BPM, {total_bars} bars: drop at bar {drop}, breakdown {brk}-{back}, outro at {outro}")

    def play(part, bar, since):
        """Which of the part's loops plays at `bar`, and which of its bars, taking turns from `since`."""
        names = PARTS[part]
        lengths = [beats_in(name) // 4 for name in names]
        at = (bar - since) % sum(lengths)
        for name, length in zip(names, lengths):
            if at < length:
                return name, at
            at -= length

    def verse(bar):
        return drop <= bar < brk or back <= bar < outro

    patterns = {
        "guitar": lambda b: play("guitar", b, 0) if b < drop or verse(b) else None,
        "hats": lambda b: play("hats", b, 0) if b < drop or back - 2 <= b < back else None,
        "drums": lambda b: play("drums", b, drop if b < brk else back) if verse(b) else None,
        "bass": lambda b: play("bass", b, drop) if drop <= b < outro else None,
        "lead": lambda b: (
            play("lead", b, drop if b < brk else back) if verse(b)
            else play("lead", b, outro) if outro <= b else None
        ),
        "hook": lambda b: (
            play("hook", b, drop) if drop + 8 <= b < brk
            else play("hook", b, back) if back <= b < outro
            else play("hook", b, outro) if outro <= b else None
        ),
        "vox": lambda b: play("vox", b, brk) if brk <= b < back or outro <= b else None,
    }

    cache = os.path.join(ROOT, ".build", "loops")
    os.makedirs(cache, exist_ok=True)
    work = tempfile.mkdtemp()
    silence = b"\0\0\0\0"
    loaded = {}
    inputs, filters = [], []
    for track, pattern in patterns.items():
        out = bytearray()
        for bar in range(total_bars):
            start, end = round(bar * bar_frames), round((bar + 1) * bar_frames)
            n = end - start
            played = pattern(bar)
            if played is None:
                out += silence * n
                continue
            name, inner = played
            if name not in loaded:
                loaded[name] = fitted(name, cache, bpm)
            data = loaded[name]
            offset = round(inner * bar_frames) * 4
            piece = data[offset : offset + n * 4]
            out += piece + silence * (n - len(piece) // 4)
        path = os.path.join(work, f"{track}.wav")
        write_wav(path, out)
        filters.append(f"[{len(inputs) // 2}]volume={LEVELS[track]}[{track}]")
        inputs += ["-i", path]

    # The riser, placed by the sample so it ends exactly on the drop and on the return.
    riser = decode(RISER, cache)
    riser_frames = len(riser) // 4
    out = bytearray(silence * round(total_bars * bar_frames))
    for bar in (drop, back):
        end = round(bar * bar_frames)
        start = max(0, end - riser_frames)
        out[start * 4 : end * 4] = riser[(riser_frames - (end - start)) * 4 :]
    path = os.path.join(work, "riser.wav")
    write_wav(path, out)
    filters.append(f"[{len(inputs) // 2}]volume={LEVELS['riser']}[riser]")
    inputs += ["-i", path]
    tracks = list(patterns) + ["riser"]

    length = film_beats * 60 / bpm
    file_length = total_bars * bar_seconds
    mix = ";".join(filters) + ";" + "".join(f"[{t}]" for t in tracks) + f"amix=inputs={len(tracks)}:normalize=0,atrim=0:{file_length:.3f}"
    premix = os.path.join(work, "premix.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", mix, premix], check=True)

    # Bring it to the target loudness, keep peaks under -1 dB, and fade out over the last two seconds.
    measured = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", premix, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
    lufs = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", measured)[-1])
    gain = 10 ** ((TARGET_LUFS - lufs) / 20)
    target = os.path.join(ROOT, "public", "music.m4a")
    subprocess.run([
        "ffmpeg", "-v", "error", "-y", "-i", premix,
        "-af", f"volume={gain:.4f},alimiter=limit=0.89:level=false,afade=t=out:st={file_length - 1.5:.3f}:d=1.5",
        "-c:a", "aac", "-b:a", "192k", target,
    ], check=True)
    print(f"Wrote public/music.m4a: {file_length:.1f} s for a {length:.1f} s film, mixed at {lufs:.1f} LUFS, gained {20 * math.log10(gain):+.1f} dB")
    json.dump({"bpm": bpm, "bars": {"drop": drop, "breakdown": brk, "return": back, "outro": outro}},
              open(os.path.join(ROOT, ".build", "music-sections.json"), "w"))


if __name__ == "__main__":
    main()
