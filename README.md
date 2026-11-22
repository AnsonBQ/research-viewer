# research-viewer

See your coding agent's charts, tables and reports **in a side pane next to the chat**, instead of
hunting for files in Finder.

Built for research work with Claude Code (or any terminal agent) running inside
[herdr](https://herdr.dev), on a terminal that can draw images, such as
[Ghostty](https://ghostty.org).

```
┌──────────────────────────────┬────────────────────────────┐
│ agent chat (Claude Code …)   │ research-viewer            │
│                              │  equity_curve.png [3/7]    │
│ > backtest done, see         │  ┌──────────────────────┐  │
│   http://rv.localhost/…png   │  │   (the chart, sharp) │  │
│   (Ctrl+click → right pane)  │  └──────────────────────┘  │
│                              │  ←/→ item  [ ] batch  h …  │
└──────────────────────────────┴────────────────────────────┘
```

## What it does

- **New charts appear by themselves.** When the agent saves a PNG into a watched folder, the pane
  shows it within about 2 seconds. Screenshots you paste into the chat are ignored.
- **Any format.**
  - Images are drawn at full terminal resolution.
  - CSV and parquet show as a table preview. Press `f` to open the whole table in VisiData,
    where you can scroll, sort and filter.
  - HTML, PDF and SVG show as a snapshot. Press `o` to open the live version.
- **History.** Every item is kept and grouped into batches. Closing the pane does not lose it.
- **Ctrl+click links.** Ctrl+click an `http://rv.localhost/<absolute path>` link anywhere in herdr
  and the file opens in the pane.
- **`/show` for Claude Code.** `/show <path>` puts a file on screen. `/show` with no argument shows
  whatever the conversation was just about.

---

## 1. Requirements

| Dependency | Needed for | Required? | Install |
|---|---|---|---|
| **macOS** | Quick Look snapshots of HTML/PDF/SVG | yes | — |
| **A Kitty-graphics terminal**: Ghostty, kitty or WezTerm | drawing images in the terminal | yes | `brew install --cask ghostty` |
| **herdr** ≥ 0.9 | the side pane, `Ctrl+B i`, Ctrl+click links | yes, for the pane | `curl -fsSL https://herdr.dev/install.sh \| sh` or `brew install herdr` |
| **Homebrew** | installing chafa and fswatch | recommended | see [brew.sh](https://brew.sh) |
| **uv** | runs the viewer (Python 3.11+ and polars are fetched automatically) | yes | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| **chafa** | draws images using the Kitty graphics protocol | yes | `brew install chafa` |
| **fswatch** | notices new files instantly (macOS file events, no polling) | yes | `brew install fswatch` |
| **VisiData** (+ pyarrow) | `f` = full scrollable, sortable table view | optional | `uv tool install visidata --with pyarrow` |
| **Claude Code** | the `/show` skill | optional | [claude.com/claude-code](https://claude.com/claude-code) |

Terminal.app and iTerm2 do **not** speak the Kitty graphics protocol, so images will not draw
there. The tables, history and Quick Look features still work.

## 2. Install

### Step 1: base tools (skip any you already have)

```sh
# Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# a terminal that can draw images
brew install --cask ghostty

# herdr (terminal workspace for coding agents)
curl -fsSL https://herdr.dev/install.sh | sh

# uv (Python runner)
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Open **Ghostty**, then start **herdr** inside it:

```sh
herdr
```

### Step 2: research-viewer

**Option A, through herdr (one line):**

```sh
herdr plugin install AnsonBQ/research-viewer
```

**Option B, from a clone.** Use this if you want to edit the code; edits take effect immediately:

```sh
git clone https://github.com/AnsonBQ/research-viewer ~/src/research-viewer
sh ~/src/research-viewer/install.sh
```

Either way the installer:

1. installs `chafa` and `fswatch` with Homebrew, and VisiData with uv, if any are missing;
2. puts the `research-viewer` command in `~/.local/bin`. Make sure that folder is on your `PATH`;
3. installs the `/show` skill into `~/.claude/skills/show`, if Claude Code is present;
4. binds **Ctrl+B i** in herdr to open and close the pane, unless that key is already taken;
5. reloads herdr's config.

### Step 3: verify

```sh
research-viewer doctor
```

```
 ✓ macOS                  darwin
 ✓ chafa                  Chafa version 1.18.3
 ✓ fswatch                fswatch 1.22.0
 ✓ VisiData (f key)       saul.pw/VisiData v3.5
 ✓ Quick Look             qlmanage
 ✓ herdr >= 0.9           herdr 0.9.0
 ✓ graphics terminal      ghostty
 ✓ inside herdr           w1:p1
 ✓ herdr plugin           research.viewer
 ✓ Ctrl+B i binding       ~/.config/herdr/config.toml
 ✓ /show skill            ~/.claude/skills/show/SKILL.md
 ✓ watched folders        ~/my-project, /private/tmp/claude-501

all required checks passed
```

Every failed line prints the exact command that fixes it.

### Step 4: tell it where your outputs go

By default the viewer watches the folder you opened it from. To watch specific folders, list
them, one per line:

```sh
mkdir -p ~/.config/research-viewer
cat > ~/.config/research-viewer/roots <<'EOF'
~/my-project/results
~/my-project/reports
EOF
```

`$RESEARCH_VIEWER_ROOTS` (folders separated by colons) overrides the file. Claude Code
scratchpads are always watched. Paths containing `.git`, `.venv`, `data` or `cache` are skipped,
so data dumps do not flood the pane.

---

## 3. Use

| Action | How |
|---|---|
| open / close the pane | **Ctrl+B i** (herdr prefix, then `i`), or `research-viewer toggle` |
| show a file | `research-viewer show FILE…`; Ctrl+click an `http://rv.localhost/<path>` link; `/show <path>` in Claude Code |
| pop new charts up in Quick Look too | `research-viewer open --popup` (at most one window per 20 s) |
| check the setup | `research-viewer doctor` |

Keys inside the pane (click the pane first):

| Key | Does |
|---|---|
| `←` / `p`, `→` / `n` | older / newer item |
| `[` / `]` | previous / next batch |
| `h` | history list: type a number and press Enter to jump; Esc goes back |
| `l` | latest item |
| `f` | full view: tables in VisiData (`q` to come back), images and HTML in Quick Look |
| `o` | open the current item in Quick Look |
| `q` | quit the viewer (the pane stays open) |
| `x` | close the pane |

### Making links clickable from your agent

herdr only turns `http(s)` text into links, so a plain file path is not clickable. Write the path
as:

```
http://rv.localhost/Users/me/project/results/equity_curve.png
```

Ctrl+click opens it in the pane. No browser opens; the plugin intercepts the click. The `/show`
skill tells Claude Code to add these links whenever it mentions a file.

### Keybinding

If **Ctrl+B i** was already taken, the installer leaves your config alone. Add a free key
yourself in `~/.config/herdr/config.toml`:

```toml
[[keys.command]]
key = "prefix+i"            # pick any free key
type = "plugin_action"
command = "research.viewer.toggle"
description = "toggle research viewer"
```

Then run `herdr server reload-config`.

---

## 4. Troubleshooting

| Symptom | Fix |
|---|---|
| Pane shows blocks, gibberish or nothing where the image should be | Your terminal cannot draw images. Use Ghostty, kitty or WezTerm and start `herdr` inside it. |
| `command not found: research-viewer` | Add `~/.local/bin` to `PATH`, or re-run the installer. |
| Pane says "no history yet — waiting" | Nothing has been shown yet. It switches as soon as a chart lands in a watched folder, or run `research-viewer show FILE`. |
| A new chart did not appear | Its folder is not watched, or its path contains `data`, `cache`, `.git` or `.venv`. Check `research-viewer doctor` → watched folders. |
| Ctrl+click does nothing | Use the `http://rv.localhost/…` form, and keep herdr's `ui.mouse_capture` on (the default). Clicks are logged in `~/.cache/research-viewer/action.log`. |
| `f` on a table does nothing | Install VisiData: `uv tool install visidata --with pyarrow`. |

To update, run `herdr plugin uninstall research.viewer && herdr plugin install AnsonBQ/research-viewer`.
From a clone, run `git pull`.

Files the viewer keeps: history and state in `~/.cache/research-viewer/`, watched folders in
`~/.config/research-viewer/roots`.

MIT licensed.
