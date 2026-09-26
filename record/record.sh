#!/bin/zsh
# Records the film's clips from a throwaway copy of Meraline (record/build-app.sh) in front of the film's
# own night sky, one clip per scene, into public/clips/<scene>.mp4, and writes when things happened in
# each (the markers scenes.ts refers to) and where the panel was into src/clips.json.
#
#   npm run record                      every scene, once the Mac has been idle for 20 seconds
#   npm run record -- --now ask games   only these scenes, straight away
#
# The scenes play in one session of the app, in this order, each starting where the last left off:
#   ask        the panel opens, a question is typed in full and answered
#   actions    ⌘K opens the actions for that answer, and a search narrows them
#   select     the panel opens empty with text selected in Messages on offer; the selection button adds
#              it and a reply is typed and answered
#   screen     over a messy desktop, the screenshot button attaches the screen and the model is asked
#              where a folder is
#   recent     the panel opens lower on the screen, so the list has room above it, and the clock opens
#              the last five chats; one is picked and comes back
#   anonymous  ⇧⌘N turns anonymous mode on, a question is typed and sent, and the answer starts
#   agent      a click on Agent switches mode; the agent uses two MCP servers and asks to write a file
#   games      the controller unfolds the games and four of them start one after another
#
# It takes over the pointer and the screen for a few minutes: keep your hands off the Mac. Keys are
# posted to Meraline alone, never to the app in front. Only the backdrop and Meraline are recorded, so
# the menu bar, the Dock, notifications, and other apps never appear. Your clipboard and the panel
# position Meraline saves are put back afterwards.
#
# The LLM scenes ask a real provider: MERALINE_SHOT_LLM (default openRouter) with the key in your
# Keychain and the model you set for it. The agent is scripts/lib/screenshots/demo-agent.sh from the
# Meraline repo, which answers from a script, so no clip shows your own servers or files. The app is the
# promo build (see build-app.sh): meraline://offer puts text on offer as the shortcut does, and the
# screenshot button attaches public/backdrop-desktop.png, the film's desktop, instead of the real screen.

set -uo pipefail
zmodload zsh/datetime

here=${0:A:h}
root=${here:h}
repo=${MERALINE_REPO:-$root/../Meraline}
build=$root/.build
tools=$build/tools
app=$build/DerivedData/Build/Products/Debug/Meraline.app
binary=$app/Contents/MacOS/Meraline
clips=$root/public/clips
json=$root/src/clips.json
night_image=$root/public/backdrop-night.png
desktop_image=$root/public/backdrop-desktop.png
llm=${MERALINE_SHOT_LLM:-openRouter}
model=${MERALINE_SHOT_MODEL:-$(defaults read com.meldiron.meraline "$llm.model" 2>/dev/null || true)}
suite=com.meldiron.meraline.promo
region=(0 66 1512 850.5)
# Where the panel's window sits: its top-left corner, in points from the screen's top-left. The recent
# chats list opens above the panel, so that scene puts the panel lower.
panel_x=404
panel_top=250
recent_top=340

now=0
[[ ${1:-} == --now ]] && { now=1; shift; }
all=(ask actions select screen recent anonymous agent games)
if (( $# )); then wanted=("$@"); else wanted=($all); fi
wants() { (( ${wanted[(Ie)$1]} )); }

[[ -x $binary ]] || { echo "No app at $app. Run record/build-app.sh first." >&2; exit 1; }
LC_ALL=C grep -qas MERALINE_PROMO_SCREENSHOT $app/Contents/MacOS/Meraline.debug.dylib $binary \
  || { echo "$app isn't the promo build. Run record/build-app.sh again." >&2; exit 1; }
[[ -f $night_image ]] || { echo "No $night_image. Run npm run backdrop first." >&2; exit 1; }
if [[ ! -f $desktop_image ]]; then
  echo "==> Rendering the desktop"
  (cd $root && npx remotion still src/index.ts DesktopStill $desktop_image > /dev/null) || exit 1
fi
for t in backdrop recorder input windows; do
  [[ -x $tools/$t && $tools/$t -nt $here/$t.swift ]] || swiftc -O -o $tools/$t $here/$t.swift || exit 1
done
mkdir -p $clips

read -r screen_w screen_h <<< "$($tools/windows screen)"
demo=/tmp/meraline-demo
work=$(mktemp -d)
pid="" backdrop="" logger="" recorder=""
# The panel's place is read from Meraline's own preferences, which the installed copy shares; it is set
# for the recording and put back after.
saved_position=$(defaults read com.meldiron.meraline panelTopLeft 2>/dev/null | tr -d '() \n"' || true)
position() { echo "<array><real>$1</real><real>$2</real></array>"; }
place_panel() { defaults write com.meldiron.meraline panelTopLeft "$(position $panel_x $(( screen_h - $1 )))"; }
$tools/input clipboard save $work/clipboard.plist

cleanup() {
  for p in $recorder $pid $backdrop $logger; do kill $p 2>/dev/null || true; done
  defaults delete $suite >/dev/null 2>&1 || true
  if [[ -n $saved_position ]]; then
    local xy=(${(s:,:)saved_position})
    defaults write com.meldiron.meraline panelTopLeft "$(position ${xy[1]} ${xy[2]})"
  else defaults delete com.meldiron.meraline panelTopLeft >/dev/null 2>&1 || true; fi
  $tools/input clipboard restore $work/clipboard.plist
  [[ -n $pid ]] && rm -rf "${TMPDIR%/}/Meraline/Workspaces/$pid"
  rm -rf $work $demo
}
trap 'cleanup; exit 130' INT TERM

idle_seconds() { ioreg -c IOHIDSystem | awk '/HIDIdleTime/ {print int($NF/1000000000); exit}'; }
if (( ! now )); then
  echo "==> Waiting until the Mac has been idle for 20 seconds"
  until (( $(idle_seconds) >= 20 )); do sleep 1; done
fi
caffeinate -d -w $$ &

# Shows an image across the screen behind Meraline. The new one goes up before the old one comes down, so
# the real desktop never shows in between.
show_backdrop() {  # image
  local old=$backdrop
  $tools/backdrop $1 > /dev/null &
  backdrop=$!
  sleep 0.8
  [[ -n $old ]] && kill $old 2>/dev/null
  sleep 0.3
}

# ── The app ──────────────────────────────────────────────────────────────────────────────────────
mkdir -p $demo
cp $repo/scripts/lib/screenshots/demo-agent.sh $demo/claude
chmod +x $demo/claude

defaults delete $suite >/dev/null 2>&1 || true
for kv in "isPinned -bool true" "placement -string lastPosition" "mode -string llm" "provider -string $llm" \
          "provider.llm -string $llm" "provider.agent -string claudeCode" "claudeCode.enabled -bool true" \
          "claudeCode.baseURL -string $demo/claude"; do
  eval "defaults write $suite $kv"
done
[[ -n $model ]] && defaults write $suite "$llm.model" -string "$model"
# The default prompt, plus two lines for the film: a fenced code block shows its language as a word
# before the code, which reads like a typo on screen, so commands come as inline code; and the film's
# style has no em dashes anywhere on screen, answers included.
defaults write $suite systemPrompt -string "You answer quick questions asked from a small floating window. Lead with the answer. \
Keep it brief: a sentence or a short paragraph, or up to five bullets when a list is clearer. \
Use Markdown bold, italics, inline code, and links only when they help. \
Skip headings, preambles, and offers of further help. Put commands in inline code, never in a code block. \
Never use em dashes."

place_panel $panel_top
show_backdrop $night_image
sleep 0.5

MERALINE_DEFAULTS_SUITE=$suite MERALINE_PROMO_SCREENSHOT=$desktop_image \
  $binary -hasLaunchedBefore YES -hasChosenShortcut YES -SUEnableAutomaticChecks NO \
  -selectionHintDismissed YES -whatsNew.announcedVersion "" > /dev/null 2>&1 &
pid=$!
logfile=$work/app.log
/usr/bin/log stream --process $pid --info --style compact > $logfile 2>/dev/null &
logger=$!
sleep 2.5

# ── Helpers ──────────────────────────────────────────────────────────────────────────────────────
marker=0
since() { sed -n "$(( marker + 1 )),\$p" $logfile; }
remember() { marker=$(wc -l < $logfile); }
wait_for() {  # pattern seconds
  for _ in $(seq $(( $2 * 4 ))); do
    since | grep -q -E "$1" && return 0
    sleep 0.25
  done
  echo "    timed out waiting for: $1" >&2
  return 1
}
url() { remember; open -a "$app" "$1"; }
encode() { python3 -c 'import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1]))' "$1"; }
key() { remember; $tools/input key $pid "$1"; }
type_in() { $tools/input type $pid "$1" ${2:-28}; }
# The pointer waits below the recorded region, and glides in from there to click.
park() { $tools/input glide $(( screen_w - 260 )) $(( screen_h - 30 )) ${1:-0.01}; }
panel() { $tools/windows $pid panel; }
click_panel() {  # x y (points from the panel window's top-left) [glide seconds]
  local wx wy ww wh
  $tools/input activate $pid
  read -r wx wy ww wh <<< "$(panel)"
  # With the panel away, the click would land on whatever is under the backdrop.
  [[ -n $wx ]] || { echo "    no panel to click" >&2; return 1; }
  remember
  $tools/input click $(( wx + $1 )) $(( wy + $2 )) ${3:-0.75}
}
# Closes the panel from whatever it shows: stops, starts a new chat (the open one moves to Recent Chats),
# then closes.
put_away() { key escape; sleep 0.4; key escape; sleep 0.4; key escape; sleep 0.6; }

recdir=$work/rec
marks=$work/marks
scene=""
record() {  # scene
  scene=$1
  echo "==> $scene"
  rm -rf $recdir && mkdir -p $recdir && : > $marks
  $tools/recorder $clips/$scene.mp4 $region "$backdrop,$pid" $recdir > $recdir/log 2>&1 &
  recorder=$!
  for _ in {1..100}; do [[ -f $recdir/started ]] && break; sleep 0.05; done
  [[ -f $recdir/started ]] || { cat $recdir/log >&2; return 1; }
  sleep 0.4
}
mark() { echo "$1 $EPOCHREALTIME" >> $marks; }
finish() {  # [seconds to keep recording]
  sleep ${1:-1}
  local wx wy ww wh
  read -r wx wy ww wh <<< "$(panel)"
  touch $recdir/stop
  wait $recorder
  recorder=""
  python3 - "$json" "$scene" "$recdir/started" "$marks" "$clips/$scene.mp4" "${wx:-$panel_x}" "${wy:-$panel_top}" <<'PY'
import json, subprocess, sys
path, scene, started, marks, movie, px, py = sys.argv[1:]
t0 = float(open(started).read())
markers = {}
for line in open(marks):
    name, t = line.split()
    markers[name] = round(float(t) - t0, 3)
duration = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", movie],
                                capture_output=True, text=True).stdout.strip() or 0)
data = json.load(open(path))
data[scene] = {"duration": round(duration, 3), "panel": {"x": int(px), "y": int(py)}, "markers": markers}
json.dump(data, open(path, "w"), indent=2)
print(f"    {scene}: {duration:.1f} s, panel at {px},{py}, markers {markers}")
PY
}

# ── Before the first scene: two chats for the recent-chats clock to show ───────────────────────────
park
url "meraline://ask?text=$(encode "Convert 350°F to Celsius")&send=1"
wait_for 'Answer (complete|failed)' 60
key escape
url "meraline://ask?text=$(encode "A shorter word for “nevertheless”")&send=1"
wait_for 'Answer (complete|failed)' 60
key escape; sleep 0.3; key escape; sleep 1

# ── Scenes ───────────────────────────────────────────────────────────────────────────────────────
if wants ask; then
  record ask
  mark open; url "meraline://new"
  sleep 0.9
  type_in "How do I undo my last git commit?" 40
  sleep 0.4
  mark send; key return
  wait_for 'Answer (complete|failed)' 60; mark done
  finish 1.6
fi

if wants actions; then
  record actions
  sleep 0.8
  mark menu; key cmd+k
  sleep 1.0
  type_in "cop" 120
  sleep 0.7
  key down; sleep 0.6
  key escape; mark closed
  finish 0.8
fi

put_away
selection="Hi! Could we move Thursday's design review to the afternoon? The prototype needs one more pass before we show it."
if wants select; then
  record select
  sleep 0.3
  mark open
  url "meraline://offer?app=Messages&selection=$(encode "$selection")"
  sleep 1.3
  mark click; click_panel 66 26 0.8
  park 0.6
  sleep 0.1
  type_in "Agree with the date, but suggest Friday 3pm as a better slot." 18
  sleep 0.4
  mark send; key return
  wait_for 'Answer (complete|failed)' 60; mark done
  finish 1.6
fi

put_away
if wants screen; then
  show_backdrop $desktop_image
  record screen
  sleep 0.6
  mark open; url "meraline://new"
  sleep 1.2
  mark shot; click_panel 150 26 0.8
  park 0.6
  wait_for 'Screenshot button added' 10
  sleep 0.2
  type_in "Where is my party playlist folder?" 34
  sleep 0.4
  mark send; key return
  wait_for 'Answer (complete|failed)' 90; mark done
  finish 3
  put_away
  show_backdrop $night_image
fi

if wants recent; then
  place_panel $recent_top
  url "meraline://new"; sleep 1.2
  record recent
  sleep 0.7
  mark click; click_panel 636 127 0.8
  park 0.5
  sleep 1.2
  # The list's search has the keyboard: the first scene's chat comes back.
  type_in "git" 110
  sleep 0.6
  mark pick; key return
  sleep 2.2
  finish 0.6
  put_away
  place_panel $panel_top
fi

url "meraline://new"; sleep 1
if wants anonymous; then
  record anonymous
  sleep 0.7
  mark toggle; key shift+cmd+n
  sleep 1.1
  type_in "Gift ideas for my sister's 30th" 36
  sleep 0.4
  mark send; key return
  wait_for 'Answer (complete|failed)' 60; mark done
  finish 0.5
  # A new chat (the anonymous one skips Recent Chats), and anonymous mode off; the panel stays open.
  key escape; sleep 0.3; key shift+cmd+n; sleep 0.5
fi

if wants agent; then
  record agent
  sleep 0.6
  mark mode; click_panel 160 127 0.8
  park 0.5
  sleep 0.8
  type_in "Put the menu bar issues in notes.md" 34
  sleep 0.4
  mark send; key return
  wait_for 'Agent asks for leave' 60; mark ask
  sleep 1.3
  $tools/input activate $pid
  read -r wx wy ww wh <<< "$(panel)"
  mark allow; $tools/input click $(( wx + 609 )) $(( wy + wh - 160 )) 0.8
  park 0.6
  wait_for 'Answer (complete|failed)' 20; mark done
  finish 1.5
fi

# Back to a new LLM chat.
url "meraline://new"; sleep 0.8
click_panel 92 127 0.01; park; sleep 0.3
put_away
url "meraline://new"; sleep 1

if wants games; then
  # The games in the unfolded tray, left to right, 26 points apart: Rhyme Duel 369, Add-a-Word 395,
  # Categories 420, Word Football 446, Odd One Out 472, Fix the Typo 498, Speed Definitions 524, Letter
  # Auction 551 (from the window's left; measured on a frame of the unfolded tray).
  record games
  sleep 0.6
  mark controller; click_panel 588 127 0.8
  sleep 0.9
  n=0
  for x in 472 369 498 551; do
    n=$(( n + 1 ))
    mark game$n; click_panel $x 127 0.55
    park 0.4
    wait_for ': the model (moved|.s move failed|.s reply sent|.s move stopped)' 60; mark moved$n
    sleep 1.8
  done
  finish 0.5
fi
cleanup
echo "==> Done. Clips in public/clips, markers in src/clips.json."
