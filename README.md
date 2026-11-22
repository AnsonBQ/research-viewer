# research-viewer

See your coding agent's charts, tables and reports **in a side pane next to the chat**, instead of
hunting for files in Finder.

Built for quant research with Claude Code (or any terminal agent) inside
[herdr](https://herdr.dev) on [Ghostty](https://ghostty.org) or any terminal with the Kitty
graphics protocol.

- **New charts appear by themselves.** When the agent writes a PNG into a watched folder, the pane
  switches to it within ~2 s. Screenshots you paste into the chat are ignored.
- **Any format.** Images are drawn at full terminal resolution. CSV and parquet show as a
  table preview, and `f` opens the whole table in VisiData so you can scroll, sort and filter.
  HTML, PDF and SVG show as a snapshot, and `o` opens the live version in Quick Look.
- **History.** Every item is kept and grouped into batches. Closing the pane does not lose it.
- **Ctrl+click links.** Ctrl+click an `http://rv.localhost/<absolute path>` link anywhere in herdr
  and the file opens in the pane.
- **`/show` for Claude Code.** `/show <path>` puts a file on screen. `/show` with no argument shows
  whatever the conversation was just about.

## Install

Through herdr:

```sh
herdr plugin install AnsonBQ/research-viewer
```

Or from a clone:

```sh
git clone https://github.com/AnsonBQ/research-viewer && sh research-viewer/install.sh
```

The installer:
- installs `chafa`, `fswatch` (Homebrew) and VisiData (uv), if they are missing;
- links the CLI to `~/.local/bin/research-viewer`;
- installs the `/show` skill into `~/.claude/skills`;
- binds **Ctrl+B i** in herdr, unless that key is already taken.

Requirements: macOS, [uv](https://docs.astral.sh/uv/), herdr ≥ 0.9 for the side pane.

## Use

```
Ctrl+B i                         open / close the viewer pane
research-viewer open [--popup]   same, from a shell (--popup also pops new charts up in Quick Look)
research-viewer show FILE...     put files in the pane (opens it if needed)
research-viewer close
```

Keys inside the pane (click it first):

```
← →  item     [ ]  batch     h  history list (number + Enter)     l  latest
f    full view (VisiData for tables)     o  Quick Look     q  quit     x  close pane
```

## Which folders are watched

The viewer checks these in order and uses the first one that is set:
1. `$RESEARCH_VIEWER_ROOTS` (folders separated by colons);
2. `~/.config/research-viewer/roots` (one folder per line);
3. otherwise, the folder the pane was opened from.

Claude Code scratchpads (`/private/tmp/claude-<uid>/…/scratchpad`) are always watched. Paths
containing `.git`, `.venv`, `data` or `cache` are skipped, so data dumps do not flood the pane.

## Notes and limits

- Inside herdr, Ctrl+click works only on `http(s)` text. Plain file paths are not links, which is
  why the link form is `http://rv.localhost/<path>`. The click never opens a browser; the plugin
  intercepts it.
- Tables auto-show only when you ask for them (`show`, a click, or `/show`). Agents write parquet
  caches constantly, so showing them automatically would be noise.
- State and history are kept in `~/.cache/research-viewer/`.

MIT licensed.
