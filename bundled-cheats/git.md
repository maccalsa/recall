---
title: Git
tags: [git, version-control, scm]
---

## Setup

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
git config --global init.defaultBranch main
git clone <url>                    # clone repo
git init                           # new repo in current dir
git remote -v                      # list remotes
git remote add origin <url>
```

## Branching

```bash
git branch                         # local branches
git branch -a                      # all branches
git switch <branch>                # checkout branch (Git 2.23+)
git checkout -b <new-branch>       # create and switch
git branch -d <branch>             # delete merged branch
git branch -D <branch>             # force delete
git merge <branch>                 # merge into current
```

## Staging & Commits

```bash
git status
git add <file>                     # stage file
git add -p                         # interactive patch staging
git add -A                         # stage all (tracked + new)
git commit -m "message"
git commit --amend                 # amend last commit
git commit --amend --no-edit       # amend, keep message
```

## Merging & Rebasing

```bash
git merge <branch>
git merge --no-ff <branch>         # always create merge commit
git rebase <upstream>              # replay commits on top
git rebase -i HEAD~n               # interactive rebase last n
git rebase --continue
git rebase --abort
```

## Stashing

```bash
git stash
git stash push -m "note"
git stash list
git stash pop                      # apply and remove
git stash apply                    # apply, keep stash
git stash drop stash@{0}
git stash branch <name>            # new branch from stash
```

## Remote

```bash
git fetch origin
git pull                           # fetch + merge
git pull --rebase
git push origin <branch>
git push -u origin <branch>        # set upstream
git push --delete origin <branch>   # delete remote branch
```

## Undo & Reset

```bash
git checkout -- <file>           # discard working changes (file)
git restore <file>               # same (modern)
git reset --soft HEAD~1            # undo commit, keep staged
git reset --mixed HEAD~1           # undo commit, unstage
git reset --hard HEAD~1            # discard commit + changes (dangerous)
git revert <commit>                # new commit that undoes commit
```

## Log & Diff

```bash
git log --oneline --graph --all
git log -p                         # patch per commit
git log -S "string"                # commits touching string
git diff                           # unstaged
git diff --staged                  # staged vs last commit
git blame <file>
```

## Tags

```bash
git tag                            # list tags
git tag v1.0.0                     # lightweight
git tag -a v1.0.0 -m "release"     # annotated
git push origin v1.0.0
git push origin --tags             # push all tags
```
