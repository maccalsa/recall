<script lang="ts">
  interface Props {
    ondismiss: () => void;
  }

  let { ondismiss }: Props = $props();
</script>

<div class="flex h-full flex-col items-center justify-center gap-6 p-8">
  <h1 class="text-2xl font-bold text-(--color-accent)">Welcome to Recall</h1>
  <p
    class="max-w-md text-center text-sm leading-relaxed text-(--color-text-dim)"
  >
    Instant cheat sheets for the tools you use every day. Two hotkey modes get
    you answers without leaving your current context.
  </p>

  <div class="flex w-full max-w-sm flex-col gap-3">
    <div class="flex items-start gap-3 rounded-lg bg-(--color-surface-dim) p-3">
      <kbd
        class="shrink-0 rounded bg-(--color-surface-bright) px-2 py-0.5 font-mono text-xs text-(--color-accent)"
        >Ctrl+Shift+R</kbd
      >
      <div>
        <p class="text-sm font-medium text-(--color-text)">
          Context-aware toggle
        </p>
        <p class="text-xs text-(--color-text-dim)">
          Detects your focused app and shows its cheat sheet. Falls back to
          search if no mapping exists.
        </p>
      </div>
    </div>

    <div class="flex items-start gap-3 rounded-lg bg-(--color-surface-dim) p-3">
      <kbd
        class="shrink-0 rounded bg-(--color-surface-bright) px-2 py-0.5 font-mono text-xs text-(--color-accent)"
        >Escape</kbd
      >
      <div>
        <p class="text-sm font-medium text-(--color-text)">Dismiss</p>
        <p class="text-xs text-(--color-text-dim)">
          Hides the overlay instantly and returns focus to your previous app.
        </p>
      </div>
    </div>
  </div>

  <div class="mt-2 flex flex-col items-center gap-2">
    <p class="text-xs text-(--color-text-dim)">
      Cheat sheets live in
      <code
        class="rounded bg-(--color-surface-bright) px-1.5 py-0.5 font-mono text-xs"
        >~/.config/recall/cheats/</code
      >
    </p>
    <p class="text-xs text-(--color-text-dim)">
      24 curated sheets have been installed for you.
    </p>
  </div>

  <button
    class="mt-2 rounded-lg bg-(--color-accent) px-6 py-2 text-sm font-medium text-(--color-surface) transition-colors hover:opacity-90"
    onclick={ondismiss}
  >
    Get Started
  </button>
</div>
