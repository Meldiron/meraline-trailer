#!/bin/zsh
# Makes the copies to share from the 4K master (npm run render:final):
#
#   out/meraline-trailer-1080p60.mp4   under 50 MB: Discord with Nitro Basic or a server at boost level 2
#   out/meraline-trailer-small.mp4     under 10 MB, 1080p at 30 fps: a file anyone can post on Discord
#
# The master itself is the one for YouTube. Each copy is encoded in two passes to a bitrate worked out from
# the film's length, so it fits its limit whatever the cut's length.
set -euo pipefail
cd "${0:A:h}/.."

master=out/meraline-trailer-4k60.mp4
[[ -f $master ]] || { echo "Render the master first: npm run render:final" >&2; exit 1; }
seconds=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $master)
passes=$(mktemp -d)
trap 'rm -rf $passes' EXIT

# encode <file> <megabytes> <width:height> <fps> <audio kbps>
encode() {
  local out=$1 megabytes=$2 size=$3 fps=$4 audio=$5
  local video=$(awk -v mb=$megabytes -v s=$seconds -v a=$audio 'BEGIN { printf "%d", mb * 8000 / s - a }')
  local picture=(-vf "scale=${size}:flags=lanczos,fps=${fps}" -c:v libx264 -preset slow -b:v ${video}k -pix_fmt yuv420p
                 -color_primaries bt709 -color_trc bt709 -colorspace bt709 -passlogfile $passes/$out:t)
  ffmpeg -v error -y -i $master $picture -pass 1 -an -f mp4 /dev/null
  ffmpeg -v error -y -i $master $picture -pass 2 -c:a aac -b:a ${audio}k -movflags +faststart $out
  printf "%s: %.1f MB, %d kb/s video\n" $out $(( $(stat -f %z $out) / 1e6 )) $video
}

encode out/meraline-trailer-1080p60.mp4 48 1920:1080 60 192
# At 10 MB, 1080p beats 720p (SSIM 0.9973 against 0.9951 on this film): its text stays sharper, and
# twice the bitrate at 720p gained almost nothing (0.9959).
encode out/meraline-trailer-small.mp4 9.5 1920:1080 30 96
