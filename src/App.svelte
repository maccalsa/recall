<script lang="ts">
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import { invoke } from "@tauri-apps/api/core";
  import SheetView from "./lib/SheetView.svelte";

  const isTauri = "__TAURI_INTERNALS__" in window;

  let markdown = $state("");
  let error = $state("");
  let loading = $state(true);

  const HARDCODED_FILE = "git.md";

  async function loadCheatSheet() {
    try {
      markdown = await invoke<string>("read_cheat_file", {
        filename: HARDCODED_FILE,
      });
      error = "";
    } catch (e) {
      error = String(e);
      markdown = "";
    } finally {
      loading = false;
    }
  }

  if (isTauri) {
    loadCheatSheet();
  } else {
    loading = false;
    error = "Not running in Tauri — cannot load cheat files.";
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && isTauri) {
      getCurrentWindow().hide();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<main class="flex h-full flex-col rounded-xl bg-(--color-surface) shadow-2xl">
  {#if loading}
    <div class="flex flex-1 items-center justify-center">
      <span class="text-sm text-(--color-text-dim)">Loading…</span>
    </div>
  {:else if error}
    <div class="flex flex-1 flex-col items-center justify-center gap-3 p-8">
      <h1 class="text-xl font-bold text-(--color-accent)">Recall</h1>
      <p class="max-w-sm text-center text-sm text-(--color-text-dim)">
        {error}
      </p>
      <p class="text-xs text-(--color-text-dim)">
        Place markdown files in <code
          class="rounded bg-(--color-surface-bright) px-1.5 py-0.5 font-mono text-xs"
          >~/.config/recall/cheats/</code
        >
      </p>
    </div>
  {:else}
    <div class="flex-1 overflow-y-auto scroll-smooth">
      <SheetView {markdown} />
    </div>
  {/if}
</main>
