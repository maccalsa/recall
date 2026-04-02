---
title: tmux
tags: [tmux, terminal, multiplexer]
---

## Sessions

```text
tmux                    # new session
tmux new -s name        # named session
tmux ls                 # list sessions
tmux attach -t name     # attach
tmux kill-session -t name
Prefix + d              # detach (default Prefix: Ctrl+b)
```

## Windows

```text
Prefix + c              # new window
Prefix + n / p          # next / previous window
Prefix + 0-9            # window by index
Prefix + ,                # rename window
Prefix + &                # kill window
```

## Panes

```text
Prefix + %                # split vertical
Prefix + "                # split horizontal
Prefix + x                # kill pane
Prefix + z                # zoom / unzoom pane
Prefix + { }              # swap panes
```

## Navigation

```text
Prefix + arrow            # move between panes
Prefix + o                # cycle panes
Prefix + q                # show pane numbers
Prefix + ;                # last active pane
```

## Copy Mode

```text
Prefix + [                # enter copy mode (scroll)
q                         # quit copy mode
Space / Enter             # start selection / copy (vi mode)
Prefix + ]                # paste buffer
```

## Configuration

```text
~/.tmux.conf              # user config
tmux source-file ~/.tmux.conf   # reload
set -g prefix C-a         # example: change prefix
setw -g mode-keys vi      # vi keys in copy mode
```

Default prefix is **Ctrl+b** unless changed in config.
