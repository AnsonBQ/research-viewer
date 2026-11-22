#!/bin/sh
# herdr action entrypoint: toggle the viewer pane, or show a Ctrl+clicked file in it.
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
RV="${HERDR_PLUGIN_ROOT:-$(dirname "$0")}/bin/research-viewer"
[ -x "$RV" ] || RV=research-viewer
LOG="$HOME/.cache/research-viewer/action.log"; mkdir -p "$(dirname "$LOG")"
echo "$(date '+%F %T') $1 pane=$HERDR_PANE_ID url=$HERDR_PLUGIN_CLICKED_URL" >> "$LOG"
case "$1" in
  toggle)
    "$RV" toggle ;;
  show)
    "$RV" show "$HERDR_PLUGIN_CLICKED_URL" ;;
esac >> "$LOG" 2>&1
