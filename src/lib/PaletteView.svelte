<script lang="ts">
  import type MiniSearch from "minisearch";
  import { search, type CheatDoc } from "./search";
  import { getRecentlyViewed, getPinnedFiles } from "./history";

  interface Props {
    index: MiniSearch<CheatDoc>;
    docs: CheatDoc[];
    onselect: (filename: string) => void;
    initialQuery?: string;
  }

  let { index, docs, onselect, initialQuery = "" }: Props = $props();

  let query = $state("");
  let selectedIdx = $state(0);
  let recentFiles: string[] = $state([]);
  let pinnedFiles: string[] = $state([]);
  let inputEl: HTMLInputElement | undefined = $state();

  $effect(() => {
    query = initialQuery;
  });

  $effect(() => {
    inputEl?.focus();
  });

  $effect(() => {
    getRecentlyViewed().then((r) => (recentFiles = r));
    getPinnedFiles().then((p) => (pinnedFiles = p));
  });

  interface DisplayItem {
    filename: string;
    title: string;
    kind: "pinned" | "result" | "recent";
  }

  const displayItems = $derived.by((): DisplayItem[] => {
    if (query.trim()) {
      const hits = search(index, query);
      const pinnedSet = new Set(pinnedFiles);
      const pinned: DisplayItem[] = [];
      const rest: DisplayItem[] = [];

      for (const hit of hits) {
        const item: DisplayItem = {
          filename: hit.filename,
          title: hit.title,
          kind: pinnedSet.has(hit.filename) ? "pinned" : "result",
        };
        if (pinnedSet.has(hit.filename)) {
          pinned.push(item);
        } else {
          rest.push(item);
        }
      }
      return [...pinned, ...rest];
    }

    const titleMap = new Map(docs.map((d) => [d.filename, d.title]));
    const shown = new Set<string>();
    const items: DisplayItem[] = [];

    for (const f of pinnedFiles) {
      if (titleMap.has(f)) {
        shown.add(f);
        items.push({
          filename: f,
          title: titleMap.get(f)!,
          kind: "pinned",
        });
      }
    }

    for (const f of recentFiles) {
      if (!shown.has(f) && titleMap.has(f)) {
        shown.add(f);
        items.push({
          filename: f,
          title: titleMap.get(f)!,
          kind: "recent",
        });
      }
    }

    return items;
  });

  $effect(() => {
    // Reset selection when results change
    void displayItems;
    selectedIdx = 0;
  });

  function handleKeydown(event: KeyboardEvent) {
    const len = displayItems.length;
    if (!len) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      selectedIdx = (selectedIdx + 1) % len;
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      selectedIdx = (selectedIdx - 1 + len) % len;
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = displayItems[selectedIdx];
      if (item) onselect(item.filename);
    }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="flex h-full flex-col" onkeydown={handleKeydown} role="search">
  <div class="border-b border-(--color-border) p-3">
    <input
      bind:this={inputEl}
      bind:value={query}
      type="text"
      placeholder="Search cheat sheets…"
      spellcheck="false"
      class="w-full rounded-lg bg-(--color-surface-dim) px-3 py-2 text-sm text-(--color-text) outline-none ring-1 ring-(--color-border) placeholder:text-(--color-text-dim) focus:ring-(--color-accent)"
    />
  </div>

  <div class="flex-1 overflow-y-auto p-1.5">
    {#if displayItems.length === 0}
      <div class="flex h-full items-center justify-center">
        <span class="text-xs text-(--color-text-dim)">
          {#if query.trim()}
            No results for "{query}"
          {:else}
            No cheat sheets found
          {/if}
        </span>
      </div>
    {:else}
      {#if !query.trim() && pinnedFiles.length > 0}
        <div
          class="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-(--color-text-dim)"
        >
          Pinned
        </div>
      {/if}
      <ul class="list-none p-0">
        {#each displayItems as item, i}
          {#if !query.trim() && item.kind === "recent" && i > 0 && displayItems[i - 1].kind === "pinned"}
            <div
              class="px-2.5 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-(--color-text-dim)"
            >
              Recently viewed
            </div>
          {/if}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <li
            class="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors"
            class:bg-surface-bright={i === selectedIdx}
            class:text-accent={i === selectedIdx}
            onclick={() => onselect(item.filename)}
            role="option"
            aria-selected={i === selectedIdx}
          >
            {#if item.kind === "pinned"}
              <span class="text-xs text-(--color-accent-dim)" title="Pinned"
                >📌</span
              >
            {:else if item.kind === "recent"}
              <span class="text-xs text-(--color-text-dim)" title="Recent"
                >🕐</span
              >
            {:else}
              <span class="w-4"></span>
            {/if}
            <span class="truncate">{item.title}</span>
            <span class="ml-auto text-[11px] text-(--color-text-dim)"
              >{item.filename}</span
            >
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
