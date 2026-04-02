<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";

  interface Props {
    onclose: () => void;
  }

  let { onclose }: Props = $props();

  interface AppConfig {
    pinned?: string[];
    hotkey?: string;
    theme?: "system" | "dark" | "light";
    cheatsDir?: string;
  }

  let config: AppConfig = $state({});
  let saving = $state(false);
  let saved = $state(false);

  $effect(() => {
    loadSettings();
  });

  async function loadSettings() {
    const json = await invoke<string>("read_config");
    config = JSON.parse(json) as AppConfig;
  }

  async function saveSettings() {
    saving = true;
    try {
      await invoke("write_config", { json: JSON.stringify(config) });
      saved = true;
      setTimeout(() => (saved = false), 2000);
    } finally {
      saving = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onclose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="flex h-full flex-col">
  <div class="flex items-center border-b border-(--color-border) px-4 py-2.5">
    <h2 class="text-sm font-semibold text-(--color-text)">Settings</h2>
    <button
      class="ml-auto rounded px-2 py-0.5 text-xs text-(--color-text-dim) hover:bg-(--color-surface-bright) hover:text-(--color-text)"
      onclick={onclose}
      title="Close (Escape)"
    >
      ✕
    </button>
  </div>

  <div class="flex-1 overflow-y-auto p-4">
    <div class="flex flex-col gap-5">
      <fieldset class="flex flex-col gap-1.5">
        <label
          for="hotkey"
          class="text-xs font-medium uppercase tracking-wider text-(--color-text-dim)"
          >Global Hotkey</label
        >
        <input
          id="hotkey"
          type="text"
          bind:value={config.hotkey}
          placeholder="CommandOrControl+Shift+R"
          spellcheck="false"
          class="w-full rounded-lg bg-(--color-surface-dim) px-3 py-2 text-sm text-(--color-text) outline-none ring-1 ring-(--color-border) placeholder:text-(--color-text-dim) focus:ring-(--color-accent)"
        />
        <p class="text-[11px] text-(--color-text-dim)">
          Uses Tauri shortcut format. Requires restart to apply.
        </p>
      </fieldset>

      <fieldset class="flex flex-col gap-1.5">
        <span
          class="text-xs font-medium uppercase tracking-wider text-(--color-text-dim)"
          >Theme</span
        >
        <div class="flex gap-2">
          {#each ["system", "dark", "light"] as opt}
            <button
              class="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              class:bg-accent={(config.theme ?? "system") === opt}
              class:text-surface={(config.theme ?? "system") === opt}
              class:bg-surface-dim={(config.theme ?? "system") !== opt}
              class:text-dim={(config.theme ?? "system") !== opt}
              onclick={() => {
                config.theme = opt as AppConfig["theme"];
              }}
            >
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          {/each}
        </div>
      </fieldset>

      <fieldset class="flex flex-col gap-1.5">
        <label
          for="cheatsDir"
          class="text-xs font-medium uppercase tracking-wider text-(--color-text-dim)"
          >Cheats Directory</label
        >
        <input
          id="cheatsDir"
          type="text"
          bind:value={config.cheatsDir}
          placeholder="~/.config/recall/cheats"
          spellcheck="false"
          class="w-full rounded-lg bg-(--color-surface-dim) px-3 py-2 font-mono text-xs text-(--color-text) outline-none ring-1 ring-(--color-border) placeholder:text-(--color-text-dim) focus:ring-(--color-accent)"
        />
        <p class="text-[11px] text-(--color-text-dim)">
          Path to your cheat sheet directory. Leave empty for default.
        </p>
      </fieldset>

      <fieldset class="flex flex-col gap-1.5">
        <label
          for="pinned"
          class="text-xs font-medium uppercase tracking-wider text-(--color-text-dim)"
          >Pinned Sheets</label
        >
        <input
          id="pinned"
          type="text"
          value={config.pinned?.join(", ") ?? ""}
          oninput={(e) => {
            const val = (e.target as HTMLInputElement).value;
            config.pinned = val
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
          }}
          placeholder="git.md, docker.md"
          spellcheck="false"
          class="w-full rounded-lg bg-(--color-surface-dim) px-3 py-2 text-sm text-(--color-text) outline-none ring-1 ring-(--color-border) placeholder:text-(--color-text-dim) focus:ring-(--color-accent)"
        />
        <p class="text-[11px] text-(--color-text-dim)">
          Comma-separated filenames. Pinned sheets appear first in the palette.
        </p>
      </fieldset>
    </div>
  </div>

  <div
    class="flex items-center justify-end gap-3 border-t border-(--color-border) px-4 py-3"
  >
    {#if saved}
      <span class="text-xs text-(--color-success)">Saved</span>
    {/if}
    <button
      class="rounded-lg bg-(--color-accent) px-4 py-1.5 text-xs font-medium text-(--color-surface) transition-colors hover:opacity-90 disabled:opacity-50"
      onclick={saveSettings}
      disabled={saving}
    >
      {saving ? "Saving…" : "Save"}
    </button>
  </div>
</div>

<style>
  .bg-accent {
    background-color: var(--color-accent);
  }
  .text-surface {
    color: var(--color-surface);
  }
  .bg-surface-dim {
    background-color: var(--color-surface-dim);
  }
  .text-dim {
    color: var(--color-text-dim);
  }
</style>
