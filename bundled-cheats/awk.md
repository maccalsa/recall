---
title: awk
tags: [awk, text, processing]
---

## Basics

```bash
awk '{ print $0 }' file
awk '{ print }' file
awk 'NR==1 { print }' file
```

## Fields & Records

Default: **FS** = space/tab, **RS** = newline. Fields: `$1` … `$NF`, whole line `$0`.

```bash
awk '{ print $1, $NF }' file
awk -F: '{ print $1 }' /etc/passwd
awk -v OFS=',' '{ print $1, $2 }' file
```

## Patterns

```bash
awk '/error/ { print }' logfile
awk '$3 > 100 { print }' data.txt
awk 'NR>=10 && NR<=20' file
awk 'BEGIN { } { } END { }' file
```

## Built-in Variables

| Variable | Meaning |
|----------|---------|
| `NR` | Record number (overall) |
| `FNR` | Record number in current file |
| `NF` | Number of fields |
| `FS` | Input field separator |
| `OFS` | Output field separator |
| `ORS` | Output record separator |
| `RS` | Input record separator |

```bash
awk '{ sum += $1 } END { print sum }' nums.txt
```

## Functions

```bash
awk '{ print length($0), toupper($1), substr($2,1,3) }' file
awk '{ print int($1/10) }' file
```

## Arrays

```bash
awk '{ count[$1]++ } END { for (k in count) print k, count[k] }' file
```

## Practical Examples

```bash
awk -F: '$3 >= 1000 { print $1 }' /etc/passwd
ps aux | awk '{ mem[$1] += $4 } END { for (u in mem) print u, mem[u] }'
awk 'NR==FNR { a[$1]; next } $1 in a' file1 file2   # lines in both
awk -F, '{ print $2 }' data.csv
```
