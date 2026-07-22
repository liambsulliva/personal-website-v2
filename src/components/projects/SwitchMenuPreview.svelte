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
</script>

<div class="preview {class_}">
  <iframe {src} {title} loading="eager" allow="fullscreen"></iframe>
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
</style>
