#!/bin/sh
# research-viewer installer. Safe to re-run.
#   sh install.sh          from a git clone: deps + CLI + Claude Code /show skill + herdr plugin link + Ctrl+B i
#   sh install.sh --from-herdr   run by `herdr plugin install` as the build step (plugin is registered by herdr)
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
say() { printf '\033[1m[research-viewer]\033[0m %s\n' "$*"; }

[ "$(uname)" = "Darwin" ] || { say "macOS only for now (uses Quick Look)."; exit 1; }
command -v uv >/dev/null || { say "needs uv: https://docs.astral.sh/uv/  (curl -LsSf https://astral.sh/uv/install.sh | sh)"; exit 1; }
command -v herdr >/dev/null || say "herdr not found — the CLI still works in any Kitty-graphics terminal; the side pane needs herdr."

for pkg in chafa fswatch; do
  if ! command -v "$pkg" >/dev/null; then
    if command -v brew >/dev/null; then say "installing $pkg"; brew install "$pkg" >/dev/null; else say "please install $pkg"; exit 1; fi
  fi
done
command -v vd >/dev/null || { say "installing VisiData (full table view)"; uv tool install visidata --with pyarrow >/dev/null; }

mkdir -p "$HOME/.local/bin"
ln -sf "$ROOT/bin/research-viewer" "$HOME/.local/bin/research-viewer"
say "CLI: ~/.local/bin/research-viewer -> $ROOT/bin/research-viewer"

if [ -d "$HOME/.claude" ]; then
  mkdir -p "$HOME/.claude/skills/show"
  cp "$ROOT/skills/show/SKILL.md" "$HOME/.claude/skills/show/SKILL.md"
  say "Claude Code skill: /show"
fi

CFG="$HOME/.config/herdr/config.toml"
if command -v herdr >/dev/null; then
  if [ "$1" != "--from-herdr" ]; then
    herdr plugin link "$ROOT" >/dev/null && say "herdr plugin linked"
  fi
  mkdir -p "$(dirname "$CFG")"; touch "$CFG"
  if ! grep -q 'research.viewer.toggle' "$CFG"; then
    if grep -q 'key = "prefix+i"' "$CFG"; then
      say "prefix+i is already bound in $CFG — bind research.viewer.toggle yourself (see README)"
    else
      cat >> "$CFG" <<'TOML'

# research-viewer: prefix+i toggles the chart/table side pane
[[keys.command]]
key = "prefix+i"
type = "plugin_action"
command = "research.viewer.toggle"
description = "toggle research viewer"
TOML
      say "keybinding: Ctrl+B i (herdr prefix + i)"
    fi
  fi
  herdr server reload-config >/dev/null 2>&1 || true
fi
say "done. Try: research-viewer open   (or Ctrl+B i inside herdr)"
