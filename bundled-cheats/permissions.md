---
title: Linux Permissions
tags: [permissions, chmod, chown, linux, security]
---

## Understanding Permissions

```bash
ls -l file.txt
# -rwxr-xr-- 1 user group 1024 Apr 2 10:00 file.txt
```

| Position | Meaning |
|----------|---------|
| `r` | Read (files: contents; dirs: list names) |
| `w` | Write (files: modify; dirs: create/delete entries) |
| `x` | Execute (files: run; dirs: traverse / `cd`) |

Order: **owner**, **group**, **others**. Numeric: read=4, write=2, execute=1 (sum per triplet).

```bash
chmod 644 file    # rw-r--r--
chmod 755 script  # rwxr-xr-x
```

## chmod

```bash
chmod u+x file
chmod go-w file
chmod a+r file          # all
chmod -R g+X dir        # recursive; capital X = dirs only unless already executable
```

Symbolic vs numeric:

```bash
chmod u=rwx,g=rx,o= file
chmod 750 file
```

## chown

```bash
sudo chown user:group file
sudo chown -R user:group /path/to/dir
sudo chgrp group file
```

## Special Permissions (SUID/SGID/Sticky)

| Bit | Octal | Effect |
|-----|-------|--------|
| SUID | 4000 | Execute as file owner (`chmod u+s`) |
| SGID | 2000 | Execute as group; new files inherit group on dirs (`chmod g+s`) |
| Sticky | 1000 | Only owner deletes/renames in dir (e.g. `/tmp`) (`chmod +t`) |

```bash
chmod 4755 binary   # SUID
chmod 2750 dir      # SGID on directory
chmod 1777 /tmp     # sticky
```

## umask

Default permission mask (subtracted from full mode for new files/dirs).

```bash
umask
umask 022           # common: files 644, dirs 755
umask 077           # stricter private files
```

## ACLs

Extended permissions beyond owner/group/others.

```bash
getfacl file
setfacl -m u:alice:rwx file
setfacl -m d:g:devs:rx dir    # default ACL on directory
setfacl -x u:alice file
setfacl -b file               # remove all ACLs
```
