# Meraline product video

A 96-second film of Meraline in the spirit of the promo on getdroppy.app: a typed hook, a MacBook the camera
flies into, then feature beats that change layout and transition every time, cut to the beat of the music,
and an end card. Every shot of the app is a recording of the real Meraline, so re-recording after a
release keeps the film true.

The film is composed in [Remotion](https://remotion.dev) (React for video). Recordings are made by a script
that drives a throwaway copy of Meraline in front of the film's own background.

```sh
npm install                  # once
npm run studio               # preview in the browser, scrub the timeline, see each scene on its own
npm run render               # out/meraline-promo.mp4, 1920×1080, 60 fps
npm run render:draft         # a quick half-size render to check the cut
npm run render:final         # out/meraline-trailer-4k60.mp4, 3840×2160, 60 fps, the one for YouTube
npm run share                # from it, a 1080p60 copy under 50 MB and a 1080p30 copy under 10 MB, for Discord
```

The recordings are made at twice the screen's points, so the 4K render shows the app as sharp as it was.

The recordings (`public/clips/`) and the soundtrack (`public/music.m4a`) aren't in the repository: make them
with `npm run record` (see [Recording](#recording)) and `python3 tools/make-music.py` before the first render.

## Editing

**Everything you'd change lives in `src/scenes.ts`.** The film is that list, top to bottom.

- **Timing is musical.** Durations are in beats, `b(8)` being eight beats (about 0.52 s each at 116 BPM), and
  neighbouring scenes overlap by one beat while one turns into the next, so every scene starts on a beat.
  Keep durations in whole beats and the cuts stay on the music; `ask`, `incognito`, `games`, and `end` start on
  bars (every four beats), where the music changes section.
- **Change words:** `title`, `subtitle`, `lines`, `sentence`. **Cut a scene:** delete it. **Reorder:** move it.
- **How a scene arrives:** `transition` is `dissolve` (default), `zoom` (the old scene rushes past the
  camera), `whip-left` or `whip-up` (a fast pan with motion blur), `flash` (white, on the beat), or `iris`
  (a circle opening from the middle).
- **Where the app goes** in a clip scene: `layout` is `side` (caption left), `stack` (caption on top, app
  below), `center` (app big, caption underneath), `mirror` (app left, caption right), `follow` (caption and
  bar start centred together, then the camera follows the answer as it grows), or `desktop` (the recording
  full frame with its own backdrop, for the messy-desktop scene). `scale` sizes the
  app, `nudge: { y: 40 }` moves it, `tilt: true` swings it up into place.
- **Which part of a recording plays:** `from` is seconds into the clip, or a marker the recorder wrote, such
  as `{ marker: "open", offset: -0.4 }`. `cuts: [{ at: …, to: … }]` skips a wait (the model thinking) with a
  quick dissolve. Each clip's markers are in `src/clips.json`.
- **Keycaps and camera:** `keys: [{ at: …, keys: ["⌘", "K"] }]`; `camera: [{ at: …, zoom: 1.2, x: 0.4, y: 0.6 }]`
  pushes toward a point of the frame (0–1 each way) between keyframes.
- **Music:** `music` names a file in `public/`. `python3 tools/make-music.py` rebuilds the default track (the
  "Boogie Right" loops, with a wah lead guitar in place of the brass; the loops are in `PARTS` at the top of
  the script) and fits it to the cut, always a few bars longer than the film, which fades it out itself: it reads `scenes.ts`, drops the beat as the `ask` scene starts, breaks down for
  `incognito`, comes back for `games`, and ends with the `end` card (`SECTIONS` at the top of the script).
  Run it after changing durations. It is 116 BPM, which `BPM` in `src/config.ts` must match.

In the Studio each scene is also its own composition (`scene-ask`, `scene-incognito`…), the quickest way to
tune one beat.

### Scene types

| Type | What it draws |
| --- | --- |
| `hook` | the mascot and a typed line, the shortcut as keycaps, a MacBook the camera flies into |
| `clip` | a recording of the real app, in one of the six layouts, with its caption |
| `slam` | big lines landing one per beat, like a trailer's title cards |
| `select` | a sentence on a glass note, selected word by word by a dragging text cursor, then the shortcut |
| `keys` | a shortcut as giant keycaps that press down on the beat |
| `mascot` | the app icon's mascot; sunglasses drop on and it turns into the anonymous-mode silhouette |
| `montage` | every provider flying in as a glass pill |
| `statement` | a line on its own |
| `end` | the camera pulls out of the MacBook, the screen becomes the app icon, the link |

### The cut

| Scene | Type | Layout, transition in |
| --- | --- | --- |
| hook | hook | the typed line, ⌥ Space pressed on the beat, the push into the Mac |
| ask | clip | stack; the music drops as it starts |
| select-text | select | a Messages conversation, the text selected, ⌥ Space; zoom |
| select | clip | center; the selection button adds the card, a reply is typed |
| screen | clip | desktop; a messy desktop, the screenshot button, "Where is my party playlist folder?"; whip-up |
| agent-title | slam | whip-left |
| agent | clip | follow; zoom |
| keys | keys | ⌘ K pressed; flash |
| actions | clip | center; zoom |
| recent | clip | stack; whip-up |
| incognito | mascot | the sky drains to grey, the music breaks down; iris |
| anonymous | clip | center, grey; the question typed and sent |
| games | clip | stack; three games, the music comes back; whip-left |
| providers | montage | zoom |
| private | slam | dissolve |
| end | end | dissolve |

## Recording

```sh
record/build-app.sh v1.4.0          # a Debug build of a released tag, exported from ../Meraline
npm run backdrop                    # public/backdrop-night.png, the sky shown behind the app while recording
npm run record                      # every clip, once the Mac has been idle for 20 seconds
npm run record -- --now agent       # one clip, straight away
```

`record/record.sh` takes over the screen for about three minutes: keep your hands off the Mac. It:

- launches Meraline with a settings suite of its own (your settings aren't touched; your clipboard and the
  panel position Meraline saves are put back afterwards),
- shows the film's night sky behind it, so the panel's glass looks exactly as it will in the video,
- records only the backdrop and Meraline with ScreenCaptureKit (`record/recorder.swift`), so the menu bar,
  the Dock, notifications, and other apps never appear,
- types and clicks with `record/input.swift`: the pointer glides like a hand, and keys go to Meraline's
  process alone, so nothing can land in another app,
- writes each clip to `public/clips/<scene>.mp4` and its markers to `src/clips.json`.

`record/build-app.sh` applies `record/patches/promo-routes.patch` to the exported source, never to the Meraline
repo. It adds a `meraline://offer?selection=…&app=Messages` route, which offers selected text the way the
shortcut does, so the selection button can be clicked for real, and makes the screenshot button attach the
picture named by `MERALINE_PROMO_SCREENSHOT` instead of capturing the screen, so the real menu bar and Dock can
never end up in a clip. For the `screen` scene the backdrop is the `DesktopStill` composition, a messy desktop,
and the same picture is what the screenshot button attaches.

The LLM scenes ask a real provider (OpenRouter with the key in your Keychain, or `MERALINE_SHOT_LLM`), so
answers differ from take to take. The agent is the scripted stand-in from
`../Meraline/scripts/lib/screenshots/demo-agent.sh`, so no clip shows your own MCP servers or files.

Needs Screen Recording and Accessibility access for the terminal it runs in, Xcode, XcodeGen, and ffmpeg.

## Files

| Path | What it is |
| --- | --- |
| `src/scenes.ts` | the edit: scenes, captions, timings, keycaps, camera |
| `src/clips.json` | written by the recorder: each clip's length and markers |
| `src/scenes/` | how each kind of scene is drawn: `Hook`, `ClipScene`, `Slam`, `SelectText`, `KeysScene`, `Mascot`, `Montage`, `Statement`, `EndCard` |
| `src/components/` | the night sky and sparkles, the word-by-word caption, keycaps, the MacBook, the transitions (`TransitionLayer`) |
| `src/config.ts` | size, frame rate, tempo, colours, fonts, the recorded region of the screen, where the panel is in the recordings |
| `record/` | the recorder, the input driver, the backdrop, the app build |
| `tools/render-icons.swift` | the provider icons for the montage, drawn like Meraline's Settings |
| `tools/share-copies.sh` | the smaller copies for Discord, encoded in two passes to fit 50 MB and 10 MB |
| `tools/make-music.py` | the soundtrack, arranged to the cut from GarageBand's royalty-free Apple Loops (Disco Funk, "Boogie Right") |
