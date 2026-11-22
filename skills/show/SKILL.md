---
name: show
description: Display a file in the research-viewer side pane next to this session — chart, CSV/parquet table, HTML report, PDF, markdown. Use when the user types /show, says "show me / 显示 / 打开那张图 / 看那个表", or right after you produce or mention a chart, table or report the user should look at. Invoked as /show [path ...] [--popup] [close].
---

# /show — put it in the side pane

The viewer is `research-viewer` (~/.local/bin), a herdr side pane that draws images sharply
(Kitty graphics), shows tables as previews, and snapshots HTML/PDF. It opens itself if closed.

## What to run

- `/show <path> [<path> ...]` → `research-viewer show <path> ...` (absolute paths; they land
  in the pane as one batch, newest last).
- `/show` with no path → show what the conversation is about: the chart / table / report you
  most recently produced or mentioned (several → pass them all, in the order discussed). If
  nothing was produced this session, just run `research-viewer open`.
- `/show close` → `research-viewer close`.
- `/show --popup` → `research-viewer close; research-viewer open --popup` (new charts also pop
  up in Quick Look, at most one per 20 s).

Run it with Bash. Do not Read the image yourself to "display" it — the pane is the display.
If the command prints "not inside herdr", tell the user to run `research-viewer watch` in any
terminal tab instead.

## Reply

One line confirming what is now on screen, then always append this hint block verbatim:

```
Ctrl+B i   open / close the viewer pane      (click the pane first for the keys below)
← →  item     [ ]  batch     h  history     f  full view (tables scroll/sort in VisiData)
o  open in Quick Look        l  latest      q  quit viewer    x  close pane
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
