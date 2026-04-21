# Slack — keyboard reference

Structured shortcuts for the **desktop app** (Linux uses **Ctrl** where macOS uses **Cmd**). Web may differ slightly; open the in-app list with **Ctrl + /** (Linux) or **Cmd + /** (macOS).

**Related:** [Daily working plan](daily-working-plan.md) · [Appendix](appendix.md)

---

## Table of contents

- [Find “what needs me”](#find-what-needs-me)
- [Navigation & views](#navigation--views)
- [Search](#search)
- [Compose & threads](#compose--threads)
- [Saved, reminders, pins](#saved-reminders-pins)
- [Sidebar & UI](#sidebar--ui)
- [“Lost message” debug order](#lost-message-debug-order)

---

## Find “what needs me”

These three views answer most “where did that go?” problems:

| Goal | Shortcut (Linux) | Shortcut (macOS) | What it shows |
|------|------------------|------------------|---------------|
| **Direct asks to you** | Ctrl + Shift + **M** | Cmd + Shift + M | Mentions, thread replies aimed at you, reactions — closest to an inbox |
| **Replies in threads you’re in** | Ctrl + Shift + **T** | Cmd + Shift + T | Threads you participate in; many “questions” live here |
| **Unread sweep** | Ctrl + Shift + **A** | Cmd + Shift + A | Cycle / list unreads — good for scanning without living in every channel |

**Group / channel context:** there is no separate “group-only” inbox. You use **Mentions** (if you were @mentioned), **Threads** (if the ask was in a thread you joined), **All Unreads** (scan), and **Search** (see below). If nobody @mentioned you and you weren’t in the thread, Slack does not guarantee you’ll see it — that’s a process issue, not a shortcut.

---

## Navigation & views

| Action | Linux | macOS | Notes |
|--------|-------|-------|-------|
| Quick switcher (jump to person/channel) | Ctrl + **K** | Cmd + K | Type to open any conversation |
| Jump to search (then type query) | Often **Ctrl + K** or search field | Cmd + K | Depends on layout; use **Ctrl + F** for search-in-conversation |
| Search in current conversation | Ctrl + **F** | Cmd + F | |
| Back / forward in history | Alt + ← / → | Cmd + [ / ] | Like a browser |
| Command / shortcut list | Ctrl + **/** | Cmd + / | |

---

## Search

Use **global search** (quick switcher or search bar) with operators:

| Need | Example |
|------|---------|
| From one person | `from:@username` |
| Mentions of you | `mentions:me` |
| Combine | `from:@john mentions:me` |
| Informal “asks” | search for `?` or keywords like `question` |

**Notification keywords** (Preferences → Notifications): you can add keywords (e.g. your name, `?`, “quick one”) so matching messages surface in notification workflows — complements search, does not replace Mentions.

---

## Compose & threads

| Action | Linux | macOS |
|--------|-------|-------|
| Edit last message | ↑ | ↑ |
| New line in message (don’t send) | Shift + Enter | Shift + Enter |
| Reply in thread | Ctrl + Shift + Enter | Cmd + Shift + Enter |

**Thread pane:** open from the thread indicator on the message; keeps channel main timeline cleaner.

---

## Saved, reminders, pins

| Action | How |
|--------|-----|
| **Save for later** | Hover message → Save (bookmark), or message menu |
| **Open Saved** | Sidebar → **Saved** (shortcut varies by version; check Ctrl + / ) |
| **Reminder** | `/remind me in 1h` or message menu → Remind me |
| **Pin** | Message **…** → Pin to channel (team-visible; use sparingly) |

---

## Sidebar & UI

| Action | Linux | macOS |
|--------|-------|-------|
| Expand/collapse sidebar | Ctrl + Shift + **D** | Cmd + Shift + D |
| Star channel/DM | Right-click conversation → Star | Same |

Starred items stay high in the sidebar — useful for manager, active projects.

---

## “Lost message” debug order

1. **Mentions** — Ctrl + Shift + M  
2. **Threads** — Ctrl + Shift + T  
3. **DMs** — check list; easy to miss new threads  
4. **Search** — `from:@person`, `mentions:me`, or keywords  

If it wasn’t a mention and wasn’t in a thread you follow, treat it as **not guaranteed** by Slack; use team norms (see [Daily working plan](daily-working-plan.md) and [Appendix](appendix.md)).

---

## Mental map (one line)

| Slack UI | Treat as |
|----------|----------|
| Mentions | Inbox for “someone wants *you*” |
| Threads | Active discussions you’re in |
| Saved | Your backlog / to-do |
| All Unreads | Background sweep |
| Channels | Noise until something pulls you in (mention / thread / save) |
