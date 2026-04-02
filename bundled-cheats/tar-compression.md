---
title: tar & Compression
tags: [tar, gzip, zip, compression, archive]
---

## tar Basics

```bash
tar -cf archive.tar dir/
tar -xf archive.tar
tar -xf archive.tar -C /target/dir
tar -tvf archive.tar         # list
tar -czf archive.tar.gz dir/ # gzip
tar -xzf archive.tar.gz
tar -cjf archive.tar.bz2 dir/
tar -xjf archive.tar.bz2
tar -cJf archive.tar.xz dir/
tar -xJf archive.tar.xz
```

Modern GNU tar often auto-detects compression on extract:

```bash
tar -xf archive.tar.gz
```

## gzip/gunzip

```bash
gzip file              # creates file.gz, removes original
gzip -k file           # keep original (GNU)
gunzip file.gz
gzip -dc file.gz       # to stdout
zcat file.gz
```

## bzip2

```bash
bzip2 file
bunzip2 file.bz2
bzcat file.bz2
```

## xz

```bash
xz file
unxz file.xz
xzcat file.xz
```

## zip/unzip

```bash
zip -r archive.zip dir/
unzip archive.zip
unzip -l archive.zip
unzip archive.zip -d /target
```

## Practical Examples

```bash
tar -czf backup-$(date +%F).tar.gz --exclude=node_modules project/
tar -cf - src/ | ssh host 'tar -xf - -C /remote/path'
pigz -p 4 bigfile        # parallel gzip if installed
7z x archive.7z          # if p7zip installed
```
