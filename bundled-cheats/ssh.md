---
title: SSH
tags: [ssh, remote, security]
---

## Connection

```bash
ssh user@host
ssh -p 2222 user@host           # custom port
ssh user@host "command"         # remote command, exit
ssh -v user@host                # verbose (debug)
```

## Key Management

```bash
ssh-keygen -t ed25519 -C "you@email" -f ~/.ssh/id_ed25519
ssh-keygen -t rsa -b 4092 -f ~/.ssh/id_rsa
ssh-copy-id user@host           # install pubkey on server
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
```

## Config File

`~/.ssh/config` example:

```sshconfig
Host myserver
    HostName 203.0.113.10
    User deploy
    IdentityFile ~/.ssh/id_ed25519
    Port 22
    ServerAliveInterval 60
```

Then: `ssh myserver`

## Tunneling & Port Forwarding

```bash
# Local: remote service appears on local port
ssh -L 8080:localhost:80 user@remote

# Remote: expose local port on remote machine
ssh -R 9000:localhost:3000 user@remote

# SOCKS proxy on local 1080
ssh -D 1080 user@remote

# Background tunnel
ssh -fNL 8080:localhost:80 user@remote
```

## SCP & File Transfer

```bash
scp file user@host:/remote/path
scp -r dir user@host:/remote/path
scp user@host:/remote/file ./
rsync -avz -e ssh ./local/ user@host:/remote/
```

## Agent

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
ssh-add -l                      # list keys
ssh-add -D                      # remove all keys
```

On macOS, Keychain often integrates with `ssh-add --apple-use-keychain`.
