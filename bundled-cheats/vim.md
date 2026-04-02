---
title: Vim
tags: [vim, editor, neovim, nvim]
---

## Modes

| Action | Command |
|--------|---------|
| Normal (default) | `Esc` |
| Insert before cursor | `i` |
| Insert at line start | `I` |
| Append after cursor | `a` |
| Append at line end | `A` |
| New line below / above | `o` / `O` |
| Replace mode | `R` |
| Visual line | `V` |
| Visual block | `Ctrl+v` |

## Navigation

```text
h j k l          left down up right
w b e            word forward / back / end of word
0 ^ $            start / first non-blank / end of line
gg G             first / last line
:n               go to line n
%                matching bracket
Ctrl+u Ctrl+d    half page up / down
Ctrl+b Ctrl+f    page back / forward
```

## Editing

```text
x                delete char under cursor
dd               delete line
D                delete to end of line
cc               change whole line
cw               change word
.                repeat last change
u                undo
Ctrl+r           redo
>> <<            indent / unindent line
```

## Search & Replace

```text
/pattern         search forward
?pattern         search backward
n N              next / previous match
:%s/old/new/g    replace all in file
:%s/old/new/gc   replace with confirm
```

## Copy/Paste

```text
yy               yank line
yw               yank word
p P              paste after / before cursor
"+y              yank to system clipboard (if compiled)
"+p              paste from clipboard
```

## Files & Buffers

```text
:w               save
:w filename      save as
:q :q! :wq       quit / discard / save and quit
:e path          open file
:bn :bp          next / previous buffer
:ls              list buffers
```

## Windows & Tabs

```text
:sp :vsp         split horizontal / vertical
Ctrl+w w         cycle windows
Ctrl+w hjkl      move to window
:tabe file       new tab
gt gT            next / previous tab
```

## Macros

```text
qa               record macro in register a
q                stop recording
@a               play macro a
@@               repeat last macro
```

## Visual Mode

```text
v                character-wise visual
V                line-wise
Ctrl+v           block
d y              delete / yank selection
> <              indent selection
```
