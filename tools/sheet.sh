#!/bin/bash
# tools/sheet.sh <clip> <t1> <t2> ... → qc/sheet-<clip>.jpg (frames from the rendered clips/<clip>.mp4, tiled)
id=$1; shift; d=$(mktemp -d); i=0
for t in "$@"; do ffmpeg -loglevel error -y -ss $t -i clips/$id.mp4 -frames:v 1 -vf "scale=640:360,drawtext=text='$id @ $t':x=w-tw-10:y=10:fontcolor=white:box=1:boxcolor=black@0.6" $d/$(printf %02d $i).jpg 2>/dev/null || ffmpeg -loglevel error -y -ss $t -i clips/$id.mp4 -frames:v 1 -vf scale=640:360 $d/$(printf %02d $i).jpg; i=$((i+1)); done
n=$i; cols=$(( n < 3 ? n : 3 )); rows=$(( (n + cols - 1) / cols ))
ffmpeg -loglevel error -y -i $d/%02d.jpg -vf "tile=${cols}x${rows}" -frames:v 1 qc/sheet-$id.jpg && echo qc/sheet-$id.jpg; rm -rf $d
