<script lang="ts">
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import { listen } from "@tauri-apps/api/event";
  import { invoke } from "@tauri-apps/api/core";
  import type MiniSearch from "minisearch";
  import SheetView from "./lib/SheetView.svelte";
  import PaletteView from "./lib/PaletteView.svelte";
  import WelcomeView from "./lib/WelcomeView.svelte";
  import SettingsView from "./lib/SettingsView.svelte";
  import {
    loadAndIndex,
    upsertInIndex,
    removeFromIndex,
    type CheatDoc,
  } from "./lib/search";
  import { recordAccess, invalidateConfigCache } from "./lib/history";

  const isTauri = "__TAURI_INTERNALS__" in window;

  type View =
    | "loading"
    | "welcome"
    | "palette"
    | "sheet"
    | "settings"
    | "error";

  let view: View = $state("loading");
  let errorMsg = $state("");
  let index: MiniSearch<CheatDoc> | null = $state(null);
  let docs: CheatDoc[] = $state([]);
  let activeFile = $state("");
  let activeMarkdown = $state("");
  let paletteQuery = $state("");
  let lastViewedFile = $state("");

  let docSearchActive = $state(false);
  let docSearchQuery = $state("");
  let sheetEl: HTMLElement | undefined = $state();
  let matchMarks: HTMLElement[] = $state([]);
  let currentMatchIdx = $state(-1);

  interface ContextPayload {
    window_class: string | null;
    mapped_cheat: string | null;
    is_double_press: boolean;
  }

  interface CheatChangedPayload {
    kind: "upsert" | "delete";
    filename: string;
  }

  interface ConfigChangedPayload {
    file: string;
  }

  async function init() {
    if (!isTauri) {
      errorMsg = "Not running in Tauri — cannot load cheat files.";
      view = "error";
      return;
    }
    try {
      const firstRun = await invoke<boolean>("is_first_run");
      const result = await loadAndIndex();
      index = result.index;
      docs = result.docs;
      view = firstRun ? "welcome" : "palette";
    } catch (e) {
      errorMsg = String(e);
      view = "error";
    }

    listen<ContextPayload>("recall://context", (event) => {
      handleContext(event.payload);
    });

    listen<CheatChangedPayload>("recall://cheat-changed", (event) => {
      handleCheatChanged(event.payload);
    });

    listen<ConfigChangedPayload>("recall://config-changed", (event) => {
      handleConfigChanged(event.payload);
    });

    listen("recall://open-settings", () => {
      view = "settings";
    });

    listen("recall://open-palette", () => {
      paletteQuery = "";
      view = "palette";
    });
  }

  init();

  async function handleContext(ctx: ContextPayload) {
    if (view === "loading" || view === "error" || view === "welcome") return;

    if (ctx.is_double_press && lastViewedFile) {
      openSheet(lastViewedFile);
      return;
    }

    if (ctx.mapped_cheat) {
      openSheet(ctx.mapped_cheat);
      return;
    }

    paletteQuery = ctx.window_class ?? "";
    view = "palette";
  }

  async function handleCheatChanged(payload: CheatChangedPayload) {
    if (!index) return;

    if (payload.kind === "upsert") {
      docs = await upsertInIndex(index, docs, payload.filename);
      if (view === "sheet" && activeFile === payload.filename) {
        const raw = await invoke<string>("read_cheat_file", {
          filename: payload.filename,
        });
        activeMarkdown = raw;
      }
    } else if (payload.kind === "delete") {
      docs = removeFromIndex(index, docs, payload.filename);
      if (view === "sheet" && activeFile === payload.filename) {
        backToPalette();
      }
    }
  }

  function handleConfigChanged(payload: ConfigChangedPayload) {
    if (payload.file === "config.json") {
      invalidateConfigCache();
    }
  }

  async function openSheet(filename: string) {
    try {
      const raw = await invoke<string>("read_cheat_file", { filename });
      activeFile = filename;
      activeMarkdown = raw;
      lastViewedFile = filename;
      view = "sheet";
      docSearchActive = false;
      docSearchQuery = "";
      recordAccess(filename);
    } catch (e) {
      errorMsg = String(e);
      view = "error";
    }
  }

  function backToPalette() {
    view = "palette";
    activeFile = "";
    activeMarkdown = "";
    paletteQuery = "";
    docSearchActive = false;
    docSearchQuery = "";
  }

  function toggleDocSearch() {
    if (view !== "sheet") return;
    docSearchActive = !docSearchActive;
    if (!docSearchActive) {
      docSearchQuery = "";
      clearHighlights();
    }
  }

  function clearHighlights() {
    if (!sheetEl) return;
    sheetEl.querySelectorAll("mark.doc-search-hit").forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(
          document.createTextNode(mark.textContent ?? ""),
          mark,
        );
        parent.normalize();
      }
    });
    matchMarks = [];
    currentMatchIdx = -1;
  }

  function highlightMatches(query: string) {
    clearHighlights();
    if (!sheetEl || !query.trim()) return;

    const walker = document.createTreeWalker(
      sheetEl,
      NodeFilter.SHOW_TEXT,
      null,
    );
    const nodes: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (
        node.parentElement?.closest(".copy-btn, .doc-search-bar, script, style")
      )
        continue;
      nodes.push(node as Text);
    }

    const lowerQuery = query.toLowerCase();
    const marks: HTMLElement[] = [];

    for (const textNode of nodes) {
      const text = textNode.textContent ?? "";
      const idx = text.toLowerCase().indexOf(lowerQuery);
      if (idx === -1) continue;

      const before = text.slice(0, idx);
      const match = text.slice(idx, idx + query.length);
      const after = text.slice(idx + query.length);

      const mark = document.createElement("mark");
      mark.className = "doc-search-hit";
      mark.textContent = match;

      const parent = textNode.parentNode!;
      if (before)
        parent.insertBefore(document.createTextNode(before), textNode);
      parent.insertBefore(mark, textNode);
      if (after) parent.insertBefore(document.createTextNode(after), textNode);
      parent.removeChild(textNode);

      marks.push(mark);
    }

    matchMarks = marks;
    if (marks.length > 0) {
      currentMatchIdx = 0;
      setActiveMatch(0);
    }
  }

  function setActiveMatch(idx: number) {
    for (const m of matchMarks) m.classList.remove("active");
    if (idx >= 0 && idx < matchMarks.length) {
      matchMarks[idx].classList.add("active");
      matchMarks[idx].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function nextMatch() {
    if (matchMarks.length === 0) return;
    currentMatchIdx = (currentMatchIdx + 1) % matchMarks.length;
    setActiveMatch(currentMatchIdx);
  }

  function prevMatch() {
    if (matchMarks.length === 0) return;
    currentMatchIdx =
      (currentMatchIdx - 1 + matchMarks.length) % matchMarks.length;
    setActiveMatch(currentMatchIdx);
  }

  let debounceTimer: number | null = null;

  $effect(() => {
    const q = docSearchQuery;
    const active = docSearchActive;
    if (debounceTimer) clearTimeout(debounceTimer);
    if (!active) return;
    debounceTimer = window.setTimeout(() => {
      highlightMatches(q);
    }, 150);
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  });

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      if (view === "settings") {
        invalidateConfigCache();
        view = "palette";
        return;
      }
      if (docSearchActive) {
        toggleDocSearch();
        return;
      }
      if (isTauri) getCurrentWindow().hide();
      return;
    }

    if (
      (event.key === "k" && (event.metaKey || event.ctrlKey)) ||
      (event.key === "Tab" && view === "sheet" && !docSearchActive)
    ) {
      event.preventDefault();
      toggleDocSearch();
      return;
    }

    if (event.key === "Backspace" && view === "sheet" && !docSearchActive) {
      backToPalette();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<main class="flex h-full flex-col rounded-xl bg-(--color-surface) shadow-2xl">
  {#if view === "loading"}
    <div class="flex flex-1 items-center justify-center">
      <span class="text-sm text-(--color-text-dim)">Loading…</span>
    </div>
  {:else if view === "welcome"}
    <WelcomeView ondismiss={() => (view = "palette")} />
  {:else if view === "error"}
    <div class="flex flex-1 flex-col items-center justify-center gap-3 p-8">
      <h1 class="text-xl font-bold text-(--color-accent)">Recall</h1>
      <p class="max-w-sm text-center text-sm text-(--color-text-dim)">
        {errorMsg}
      </p>
      <p class="text-xs text-(--color-text-dim)">
        Place markdown files in <code
          class="rounded bg-(--color-surface-bright) px-1.5 py-0.5 font-mono text-xs"
          >~/.config/recall/cheats/</code
        >
      </p>
    </div>
  {:else if view === "settings"}
    <SettingsView
      onclose={() => {
        invalidateConfigCache();
        view = "palette";
      }}
    />
  {:else if view === "palette" && index}
    <PaletteView
      {index}
      {docs}
      onselect={openSheet}
      initialQuery={paletteQuery}
    />
  {:else if view === "sheet"}
    <div class="flex items-center border-b border-(--color-border) px-3 py-1.5">
      <button
        class="mr-2 rounded px-1.5 py-0.5 text-xs text-(--color-text-dim) hover:bg-(--color-surface-bright) hover:text-(--color-text)"
        onclick={backToPalette}
        title="Back to palette (Backspace)"
      >
        ← Back
      </button>
      <span class="truncate text-xs font-medium text-(--color-text-dim)"
        >{activeFile}</span
      >
      <button
        class="ml-auto rounded px-1.5 py-0.5 text-xs text-(--color-text-dim) hover:bg-(--color-surface-bright) hover:text-(--color-text)"
        onclick={toggleDocSearch}
        title="Search in document (Ctrl+K)"
      >
        {docSearchActive ? "✕ Close" : "⌕ Find"}
      </button>
    </div>

    {#if docSearchActive}
      <!-- svelte-ignore a11y_autofocus -->
      <div
        class="doc-search-bar flex items-center gap-2 border-b border-(--color-border) px-3 py-1.5"
      >
        <input
          type="text"
          bind:value={docSearchQuery}
          placeholder="Find in document…"
          spellcheck="false"
          class="min-w-0 flex-1 rounded bg-(--color-surface-dim) px-2.5 py-1 text-xs text-(--color-text) outline-none ring-1 ring-(--color-border) placeholder:text-(--color-text-dim) focus:ring-(--color-accent)"
          autofocus
          onkeydown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (e.shiftKey) prevMatch();
              else nextMatch();
            }
          }}
        />
        {#if matchMarks.length > 0}
          <span
            class="shrink-0 text-[11px] tabular-nums text-(--color-text-dim)"
          >
            {currentMatchIdx + 1}/{matchMarks.length}
          </span>
          <button
            class="rounded p-0.5 text-(--color-text-dim) hover:bg-(--color-surface-bright) hover:text-(--color-text)"
            onclick={prevMatch}
            title="Previous match (Shift+Enter)"
            aria-label="Previous match"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M4 10l4-4 4 4" />
            </svg>
          </button>
          <button
            class="rounded p-0.5 text-(--color-text-dim) hover:bg-(--color-surface-bright) hover:text-(--color-text)"
            onclick={nextMatch}
            title="Next match (Enter)"
            aria-label="Next match"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M4 6l4 4 4-4" />
            </svg>
          </button>
        {:else if docSearchQuery.trim()}
          <span class="shrink-0 text-[11px] text-(--color-text-dim)"
            >No matches</span
          >
        {/if}
      </div>
    {/if}

    <div class="flex-1 overflow-y-auto scroll-smooth" bind:this={sheetEl}>
      <SheetView markdown={activeMarkdown} />
    </div>
  {/if}
</main>
