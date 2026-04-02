<script lang="ts">
  import { initRenderer, type RenderResult } from "./markdown";

  interface Props {
    markdown: string;
  }

  let { markdown }: Props = $props();

  let result: RenderResult | null = $state(null);
  let copyFeedbackId: number | null = $state(null);

  const rendererPromise = initRenderer();

  $effect(() => {
    const raw = markdown;
    rendererPromise.then((render) => {
      result = render(raw);
    });
  });

  function handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const btn = target.closest<HTMLButtonElement>(".copy-btn");
    if (!btn) return;

    const wrapper = btn.closest(".code-block-wrapper");
    const code = wrapper?.querySelector("pre code");
    if (!code) return;

    navigator.clipboard.writeText(code.textContent ?? "").then(() => {
      btn.classList.add("copied");
      if (copyFeedbackId) clearTimeout(copyFeedbackId);
      copyFeedbackId = window.setTimeout(() => {
        btn.classList.remove("copied");
        copyFeedbackId = null;
      }, 1500);
    });
  }
</script>

{#if result}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <article class="sheet-content" onclick={handleClick} role="document">
    {@html result.html}
  </article>
{:else}
  <div class="flex h-full items-center justify-center">
    <span class="text-sm text-(--color-text-dim)">Loading…</span>
  </div>
{/if}
