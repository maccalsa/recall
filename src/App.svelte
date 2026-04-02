<script lang="ts">
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import { invoke } from "@tauri-apps/api/core";
  import type MiniSearch from "minisearch";
  import SheetView from "./lib/SheetView.svelte";
  import PaletteView from "./lib/PaletteView.svelte";
  import { loadAndIndex, type CheatDoc } from "./lib/search";
  import { recordAccess } from "./lib/history";

  const isTauri = "__TAURI_INTERNALS__" in window;

  type View = "loading" | "palette" | "sheet" | "error";

  let view: View = $state("loading");
  let errorMsg = $state("");
  let index: MiniSearch<CheatDoc> | null = $state(null);
  let docs: CheatDoc[] = $state([]);
  let activeFile = $state("");
  let activeMarkdown = $state("");

  let docSearchActive = $state(false);
  let docSearchQuery = $state("");
  let sheetEl: HTMLElement | undefined = $state();

  async function init() {
    if (!isTauri) {
      errorMsg = "Not running in Tauri — cannot load cheat files.";
      view = "error";
      return;
    }
    try {
      const result = await loadAndIndex();
      index = result.index;
      docs = result.docs;
      view = "palette";
    } catch (e) {
      errorMsg = String(e);
      view = "error";
    }
  }

  init();

  async function openSheet(filename: string) {
    try {
      const raw = await invoke<string>("read_cheat_file", { filename });
      activeFile = filename;
      activeMarkdown = raw;
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
    let firstMark: HTMLElement | null = null;

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

      if (!firstMark) firstMark = mark;
    }

    firstMark?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  $effect(() => {
    if (docSearchActive) {
      highlightMatches(docSearchQuery);
    }
  });

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
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
  {:else if view === "palette" && index}
    <PaletteView {index} {docs} onselect={openSheet} />
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
      <div class="doc-search-bar border-b border-(--color-border) px-3 py-1.5">
        <input
          type="text"
          bind:value={docSearchQuery}
          placeholder="Find in document…"
          spellcheck="false"
          class="w-full rounded bg-(--color-surface-dim) px-2.5 py-1 text-xs text-(--color-text) outline-none ring-1 ring-(--color-border) placeholder:text-(--color-text-dim) focus:ring-(--color-accent)"
          autofocus
        />
      </div>
    {/if}

    <div class="flex-1 overflow-y-auto scroll-smooth" bind:this={sheetEl}>
      <SheetView markdown={activeMarkdown} />
    </div>
  {/if}
</main>
