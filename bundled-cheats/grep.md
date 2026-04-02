---
title: grep & ripgrep
tags: [grep, ripgrep, rg, search, regex]
---

## Basic Search

```bash
grep pattern file
grep -i pattern file          # ignore case
grep -v pattern file          # invert (lines without match)
grep -n pattern file          # line numbers
grep -c pattern file          # count per file
grep -E 'pat1|pat2' file      # extended regex
grep -F 'literal*' file       # fixed strings (no regex)
```

## Regex Patterns

```bash
grep '^start' file
grep 'end$' file
grep '[0-9]\+' file          # GNU grep -E
grep -P '\d+' file          # Perl regex (-P) if supported
```

## Context

```bash
grep -C 3 pattern file       # 3 lines before and after
grep -A 2 pattern file       # after
grep -B 2 pattern file       # before
```

## File Filtering

```bash
grep pattern *.txt
grep -r pattern src/
grep -R pattern src/         # follow symlinks
grep -l pattern **/*.ts      # filenames only (with globstar in bash)
grep -L pattern *.log        # files without match
grep --include='*.c' -r pattern .
grep --exclude-dir=node_modules -r pattern .
```

## Recursive Search

```bash
grep -RIn pattern .
grep -RIl pattern .          # files with matches only
```

## ripgrep (rg)

Fast, respects `.gitignore` by default.

```bash
rg pattern
rg -i pattern
rg -t py pattern             # type filter
rg -g '*.md' pattern
rg -l pattern                # files only
rg -n pattern
rg -C 2 pattern
rg -uuu pattern              # all files (ignore gitignore)
rg --no-ignore pattern
```

## Useful Combos

```bash
grep -RIn --color=always pattern . | less -R
rg pattern && echo "found"
history | grep ssh
journalctl -u nginx | grep -i error
git grep pattern
```
