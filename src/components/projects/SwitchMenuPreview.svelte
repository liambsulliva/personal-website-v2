<script lang="ts">
  interface Props {
    class_?: string;
    src?: string;
    title?: string;
  }

  let {
    class_ = "",
    src = "/switch-menu/index.html",
    title = "Switch React Menu browser preview",
  }: Props = $props();

  const controls = [
    {
      keys: ["←", "→"],
      label: "Navigate",
    },
    {
      keys: ["Q", "E"],
      label: "Page (L / R)",
    },
    {
      keys: ["Enter", "Z"],
      label: "Select (A)",
    },
    {
      keys: ["X"],
      label: "Back (B)",
    },
  ] as const;
</script>

<div class="preview {class_}">
  <iframe {src} {title} loading="eager" allow="fullscreen"></iframe>

  <div class="hud" aria-label="Keyboard controls">

    <ul class="hud-controls">
      {#each controls as control (control.label)}
        <li class="hud-control">
          <span class="hud-keys">
            {#each control.keys as key (key)}
              <kbd>{key}</kbd>
            {/each}
          </span>
          <span class="hud-label">{control.label}</span>
        </li>
      {/each}
    </ul>
  </div>
</div>

<style>
  .preview {
    position: relative;
    margin: 5vmin auto 0;
    max-width: 75vw;
    width: min(75vw, 960px);
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border-radius: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: #000;
    z-index: 40;
  }

  iframe {
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
  }

  .hud {
    position: absolute;
    inset: auto 0 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 2.5rem 1rem 0.85rem;
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.92) 0%,
      rgba(0, 0, 0, 0.72) 55%,
      transparent 100%
    );
    pointer-events: none;
    user-select: none;
  }

  .hud-focus {
    margin: 0;
    font-size: 0.65rem;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.45);
    text-align: center;
  }

  .hud-controls {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem 1.25rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .hud-control {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.75rem;
    line-height: 1;
    color: rgba(255, 255, 255, 0.82);
  }

  .hud-keys {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.35rem;
    padding: 0.2rem 0.4rem;
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 0.3rem;
    background: rgba(255, 255, 255, 0.08);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.08),
      0 1px 2px rgba(0, 0, 0, 0.35);
    font-family: "Martian Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.65rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.95);
  }

  .hud-label {
    color: rgba(255, 255, 255, 0.62);
  }

  @media (max-width: 640px) {
    .hud {
      padding-inline: 0.65rem;
    }

    .hud-controls {
      gap: 0.45rem 0.75rem;
    }

    .hud-control {
      font-size: 0.68rem;
    }

    kbd {
      min-width: 1.2rem;
      padding: 0.15rem 0.3rem;
      font-size: 0.6rem;
    }
  }
</style>
