# Performance Testing on Linux

Techniques used to measure Recall's Phase 1 performance targets. These are general-purpose and work for any Linux desktop application.

---

## 1. Measuring Latency (nanosecond-precision wall clock)

### The technique

Bash's `date +%s%N` returns the current time in nanoseconds. Wrap any command between two readings and subtract.

```bash
for i in 1 2 3 4 5; do
  start=$(date +%s%N)
  ./target/debug/recall --toggle 2>/dev/null
  end=$(date +%s%N)
  echo "Toggle $i: $(( (end - start) / 1000000 ))ms"
done
```

```
Toggle 1: 19ms
Toggle 2: 17ms
Toggle 3: 23ms
Toggle 4: 20ms
Toggle 5: 24ms
```

### What this measures

The full round-trip: process spawn → connect to Unix socket → send message → window toggles. This is a *pessimistic* measurement — the global hotkey path skips the process spawn entirely and is faster.

### When to use this

- CLI tools: measure end-to-end execution time
- API calls: wrap `curl` to measure response latency
- Any operation where you want wall-clock timing without installing a profiler

### Gotcha

The first invocation is often slower (cold cache, shared library loading). Run multiple iterations and look at the median, not the first.

---

## 2. Finding Your Process

Before measuring memory, you need the PID.

```bash
pgrep -f "recall"
```

`pgrep -f` matches against the full command line, not just the process name. Useful when the binary name doesn't match what you'd expect (e.g., Tauri apps run as their binary name, not "tauri").

For more detail:

```bash
ps aux | grep "[r]ecall"
```

The `[r]ecall` trick (brackets around the first letter) prevents `grep` from matching its own process in the output.

---

## 3. Memory: RSS vs PSS vs Private — What Actually Matters

This is where most people get memory measurement wrong.

### The three numbers

| Metric | What it means | When to use it |
|---|---|---|
| **RSS** (Resident Set Size) | Total physical memory the process has in RAM, including shared libraries | Misleading for apps that link large shared libs (GTK, WebKit). Overstates actual usage. |
| **PSS** (Proportional Set Size) | RSS but shared pages are divided by the number of processes sharing them | Best single number for "how much memory is this app actually costing the system" |
| **Private Dirty** | Memory that is exclusively owned by this process and has been written to | The irreducible minimum — memory that would be freed if you killed this process |

### Quick check (RSS)

```bash
ps -p <PID> -o pid,rss,comm --no-headers
```

RSS is in kilobytes. Divide by 1024 for MB.

```bash
ps aux | grep "[r]ecall" | awk '{printf "PID=%s RSS=%.1fMB CMD=%s\n", $2, $6/1024, $11}'
```

### Accurate check (PSS + Private via smaps)

The kernel exposes detailed memory maps at `/proc/<PID>/smaps_rollup`:

```bash
cat /proc/<PID>/smaps_rollup | grep -E "^(Rss|Pss|Shared|Private)"
```

```
Rss:              202644 kB
Pss:               91731 kB
Pss_Dirty:         49956 kB
Pss_Anon:          48780 kB
Pss_File:          41775 kB
Pss_Shmem:          1176 kB
Shared_Clean:     133164 kB
Shared_Dirty:       2344 kB
Private_Clean:     18352 kB
Private_Dirty:     48784 kB
```

### How to read this

In the Recall example:

- **RSS is 198MB** — looks alarming, but 130MB of that is shared libraries (WebKitGTK, GTK, glib) that are already loaded by other desktop apps.
- **PSS is 90MB** — the proportional cost. This is what Recall is actually "costing" the system.
- **Private Dirty is 49MB** — memory unique to Recall. If you killed it, this is what you'd get back.

### Which number to report?

- **For user-facing claims** ("this app uses X MB"): use PSS.
- **For optimization work** ("how much can I save?"): use Private Dirty.
- **Never use RSS alone** for apps that link GTK/Qt/WebKit — it will always look worse than reality.

---

## 4. Breakdown: Where Is the Memory Going?

If you need to know *what* is consuming memory (which library, which allocation), read the full smaps:

```bash
cat /proc/<PID>/smaps | head -200
```

Or for a summary grouped by mapping:

```bash
cat /proc/<PID>/smaps | grep -E "^(Size|Rss|Pss)" | paste - - - | sort -k6 -rn | head -20
```

For a higher-level view, `smem` (if installed) gives a nice table:

```bash
smem -p -s pss -r | head -20
```

---

## 5. Tracking Memory Over Time

To watch memory grow (or not) over repeated operations:

```bash
PID=$(pgrep -f recall)
while true; do
  rss=$(awk '/VmRSS/{print $2}' /proc/$PID/status 2>/dev/null)
  echo "$(date +%H:%M:%S) RSS: ${rss}kB ($(( rss / 1024 ))MB)"
  sleep 2
done
```

This is useful for detecting memory leaks: toggle the window 100 times and watch whether RSS climbs.

```bash
PID=$(pgrep -f recall)
echo "Before: $(awk '/VmRSS/{print $2}' /proc/$PID/status)kB"

for i in $(seq 1 100); do
  ./target/debug/recall --toggle 2>/dev/null
  sleep 0.05
done

echo "After:  $(awk '/VmRSS/{print $2}' /proc/$PID/status)kB"
```

If "After" is significantly larger than "Before", you have a leak.

---

## 6. Debug vs Release Builds

All measurements above were taken on a **debug build** (`cargo build` / `cargo tauri dev`). Debug builds include:

- No compiler optimizations (`opt-level = 0`)
- Full debug symbols (larger binary, more memory)
- No dead code elimination
- No LTO (link-time optimization)

A release build (`cargo build --release` / `cargo tauri build`) will typically show:

- 30-60% smaller binary
- 20-40% less memory
- Significantly faster startup

Always measure release builds before making performance claims to users. Debug measurements are useful during development to catch regressions.

---

## 7. Quick Reference

```bash
# Latency (milliseconds)
start=$(date +%s%N); <command>; echo "$(( ($(date +%s%N) - start) / 1000000 ))ms"

# Find PID
pgrep -f <name>

# RSS (quick and dirty)
ps -p <PID> -o rss --no-headers | awk '{printf "%.1fMB\n", $1/1024}'

# PSS + Private (accurate)
cat /proc/<PID>/smaps_rollup | grep -E "^(Pss|Private)"

# Memory leak test
PID=<PID>; echo "Before: $(awk '/VmRSS/{print $2}' /proc/$PID/status)kB"
# ... exercise the app ...
echo "After: $(awk '/VmRSS/{print $2}' /proc/$PID/status)kB"

# Watch memory over time
watch -n 2 "awk '/VmRSS/{print \$2}' /proc/<PID>/status"
```
