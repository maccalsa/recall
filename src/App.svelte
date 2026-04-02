<script lang="ts">
  import { getCurrentWindow } from "@tauri-apps/api/window";

  const isTauri = "__TAURI_INTERNALS__" in window;

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && isTauri) {
      getCurrentWindow().hide();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<main
  class="flex h-full flex-col items-center justify-center rounded-xl bg-(--color-surface) p-8 shadow-2xl"
>
  <h1 class="mb-2 text-2xl font-bold text-(--color-accent)">Recall</h1>
  <p class="text-sm text-(--color-text-dim)">
    Press <kbd
      class="rounded bg-(--color-surface-bright) px-1.5 py-0.5 font-mono text-xs"
      >Escape</kbd
    > to dismiss
  </p>
</main>
