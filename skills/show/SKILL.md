---
name: show
description: Display a file in the research-viewer side pane next to this session — chart, CSV/parquet table, HTML report, PDF, markdown. Use when the user types /show, says "show me / 显示 / 打开那张图 / 看那个表", or right after you produce or mention a chart, table or report the user should look at. Invoked as /show [path ...] [--popup] [close].
---

# /show — put it in the side pane

The viewer is `research-viewer` (~/.local/bin), a herdr side pane that draws images sharply
(Kitty graphics), shows tables as previews, renders markdown, snapshots HTML/PDF, and indexes
whole research folders by stage. It opens itself if closed.

## What to run

- `/show <path> [<path> ...]` → `research-viewer show <path> ...` (absolute paths; they land
  in the pane as one batch, newest last).
- `/show` with no path → show what the conversation is about: the chart / table / report you
  most recently produced or mentioned (several → pass them all, in the order discussed). If
  nothing was produced this session, just run `research-viewer open`.
- `/show <folder>` → `research-viewer show <folder>`: the folder index — every file of that research
  folder split into stages (Report / EDA / P3 / Optimisation / Robustness / P1 / Code / Data /
  Unassigned, or the stages in the folder's index.json). Use it when the user asks to see "everything"
  for a strategy or research folder.
- `/show close` → `research-viewer close`.
- `/show --popup` → `research-viewer close; research-viewer open --popup` (new charts also pop
  up in a Preview window, at most one per 20 s).

Run it with Bash. Do not Read the image yourself to "display" it — the pane is the display.
If the command prints "not inside herdr", tell the user to run `research-viewer watch` in any
terminal tab instead.

## Reply

One line confirming what is now on screen, then always append this hint block verbatim:

```
Ctrl+B i   open / close the viewer pane      (click the pane first for the keys below)
wheel ↑↓  scroll page   ← →  item   1-9 / Tab / click  tabs   [ ]  batch   h  history
i  folder index (stages)    f  full view in this pane    o  open outside    q quit   x close
```

## Notes

- Auto-display: new charts written under the watched folders (~/.config/research-viewer/roots,
  default = the folder the viewer was opened from) and Claude Code scratchpads appear on their
  own. Screenshots pasted into the chat are deliberately ignored.
- History survives closing the pane; reopening restores it and shows the last item.
- Clickable links: whenever you name a file the user may want to see, also write it as
  `http://rv.localhost/<absolute path>` on its own line — Ctrl+click on that opens it in the
  pane. Plain file paths are NOT clickable into the pane; herdr only treats http(s) text as
  links. Clicks are logged in ~/.cache/research-viewer/action.log.
