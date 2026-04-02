---
title: Zsh
tags: [zsh, shell, terminal, oh-my-zsh]
---

## Globbing

```bash
ls **/*.ts              # recursive (setopt globstar)
ls *.(js|ts)            # alternation
ls *(.)                 # files only
ls *(/)                 # dirs only
ls **/*~node_modules/**  # exclude with extendedglob
setopt extendedglob globstar
```

## History

```bash
history
history 1 | grep foo
!!                      # previous command
!$                      # last arg of prev command
!^                      # first arg
fc -l -10               # list last 10
setopt histignorealldup sharehistory
```

## Aliases

```bash
alias ll='ls -la'
alias g=git
unalias ll
```

## Parameter Expansion

```bash
name="hello world"
echo ${name:0:5}        # substring
echo ${name#hello }     # trim shortest prefix
echo ${name##* }        # trim longest prefix
echo ${name% world}     # trim shortest suffix
echo ${foo:-default}
echo ${foo:=default}    # assign if unset
echo ${#name}           # length
array=(a b c)
echo ${array[2]}
echo ${array[@]}
```

## Array Operations

```bash
arr=(one two three)
arr+= four
echo $arr[1]
echo ${arr[@]}
echo ${#arr[@]}
for x in $arr; do echo $x; done
```

## Completion

```bash
autoload -Uz compinit && compinit
zstyle ':completion:*' matcher-list 'm:{a-zA-Z}={A-Za-z}'
```

Oh My Zsh: enable plugins in `~/.zshrc` (`plugins=(git docker)`).

## Key Bindings

```bash
bindkey -e              # emacs (default)
bindkey -v              # vi
bindkey '^R' history-incremental-search-backward
```

## Configuration Files

| File | Role |
|------|------|
| `/etc/zsh/zshenv` | Always; env for all zsh |
| `~/.zshenv` | Per-user env (non-interactive too) |
| `/etc/zsh/zprofile` | Login shells |
| `~/.zprofile` | Login (e.g. PATH for GUI) |
| `/etc/zsh/zshrc` | Interactive |
| `~/.zshrc` | Interactive aliases, options, prompts |
| `~/.zlogin` | After zshrc on login |
| `~/.zlogout` | On logout |

```bash
echo $ZDOTDIR          # defaults to HOME if unset
```
