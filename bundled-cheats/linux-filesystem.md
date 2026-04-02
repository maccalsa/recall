---
title: Linux Filesystem
tags: [linux, filesystem, directories, files]
---

## Directory Structure

| Path | Purpose |
|------|---------|
| `/` | Root of the hierarchy |
| `/bin`, `/usr/bin` | Essential user commands |
| `/sbin`, `/usr/sbin` | System administration binaries |
| `/etc` | Host-specific configuration |
| `/home` | User home directories |
| `/var` | Variable data (logs, caches, mail spools) |
| `/tmp` | Temporary files (often cleared on reboot) |
| `/usr` | Read-only user programs and data |
| `/opt` | Optional third-party software |
| `/dev` | Device files |
| `/proc`, `/sys` | Virtual filesystems (kernel/process info) |

```bash
ls -la /etc
tree -L 2 /usr/local   # if tree is installed
```

## Navigation

```bash
cd /path/to/dir
cd ~              # home
cd -              # previous directory
pwd
pushd /other/dir  # stack; popd to return
```

## File Info

```bash
ls -lah
file ./script.sh
stat /path/to/file
readlink -f symlink   # canonical path
```

## Disk Usage

```bash
df -h
du -sh *
du -h --max-depth=1 .
ncdu                  # interactive (if installed)
```

## Links

```bash
ln target name              # hard link
ln -s target name           # symbolic link
```

## Mount & Unmount

```bash
lsblk
mount
mount /dev/sdX1 /mnt/data
umount /mnt/data
findmnt
```

## Find Files

```bash
find . -name '*.log'
find /var/log -mtime -7 -type f
find . -maxdepth 2 -type d
locate filename        # uses updatedb index
```
