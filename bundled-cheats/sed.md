---
title: sed
tags: [sed, text, stream-editor, regex]
---

## Substitution

```bash
sed 's/old/new/' file
sed 's/old/new/g' file       # global per line
sed 's|/usr/local|/opt|g' file   # alternate delimiter
sed -n 's/foo/bar/p' file    # print only changed lines
```

## Delete

```bash
sed '5d' file                # delete line 5
sed '/pattern/d' file
sed '1,10d' file
```

## Insert & Append

```bash
sed '3i\inserted before line 3' file
sed '3a\appended after line 3' file
```

## Print

```bash
sed -n '1,5p' file           # lines 1–5
sed -n '/regex/p' file
```

## Multiple Commands

```bash
sed -e 's/a/b/' -e 's/c/d/' file
sed 's/foo/bar/; /^$/d' file
```

## In-place Editing

```bash
sed -i 's/old/new/g' file
sed -i.bak 's/old/new/g' file   # backup
# macOS BSD sed often needs: sed -i '' 's/old/new/g' file
```

## Address Ranges

```bash
sed -n '10,20p' file
sed '5,$s/foo/bar/'
sed '/start/,/stop/s/foo/bar/'
```

## Common Recipes

```bash
sed 's/^[[:space:]]*//' file           # trim leading spaces
sed '/^$/d' file                       # drop empty lines
tac file                               # reverse line order (GNU)
printf '%s\n' a b c | paste -sd, -    # join lines with commas
```
