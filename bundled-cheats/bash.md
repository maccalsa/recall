---
title: Bash
tags: [bash, shell, terminal, scripting]
---

## Navigation

```bash
cd /path/to/dir
cd -                    # previous directory
cd ~                    # home
pwd
ls -la
tree -L 2               # if installed
```

## File Operations

```bash
cp -r src dest
mv old new
rm -rf dir              # careful: no undo
mkdir -p a/b/c
find . -name "*.ts" -type f
chmod +x script.sh
chown user:group file
```

## Text Processing

```bash
grep -rn "pattern" .
grep -E "a|b" file      # extended regex
sed -i 's/old/new/g' file
awk '{print $1}' file
head -n 20 file
tail -f logfile
wc -l file
sort -u file | uniq
```

## Redirection & Pipes

```bash
cmd > file              # stdout overwrite
cmd >> file             # append
cmd 2> err.log          # stderr
cmd &> file             # stdout + stderr
cmd1 | cmd2
tee file                # stdout + file
```

## Variables

```bash
NAME=value              # no spaces around =
export VAR=hello
echo "$HOME ${PATH}"
array=(a b c)
echo "${array[1]}"
$(command)              # command substitution
${VAR:-default}
```

## Control Flow

```bash
if [[ -f file ]]; then echo ok; fi
for f in *.md; do echo "$f"; done
while read line; do echo "$line"; done < file
case $x in a) ;; b) ;; esac
```

## Job Control

```bash
command &               # background
jobs
fg %1
bg %1
Ctrl+Z                  # suspend
kill %1
nohup long-cmd &
```

## History

```bash
history
!!                      # previous command
!n                      # command number n
!$                      # last arg of prev command
Ctrl+R                  # reverse search
set -o history
```
