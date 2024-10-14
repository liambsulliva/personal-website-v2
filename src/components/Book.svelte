<script lang="ts">
  import { onMount } from "svelte";
  import FrontCover from "../images/Cover-Front.webp";
  import BackCover from "../images/Cover-Back.webp";

  export let class_ = "";
  let book: HTMLElement;

  let isHovering = false;
  export let isFlipped = false;
  export let page = 0;

  let tiltX = 9;
  let tiltY = -9;
  let rotateY = 0;
  let translateX = 0;
  let translateY = 0;
  let spineDisplay = "block";
  let paperBlockDisplay = "block";


  function handleMouseMove(event: MouseEvent) {
    if (!isHovering) return;
    const rect = book.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    tiltX = ((y - centerY) / centerY) * 10;
    tiltY = ((centerX - x) / centerX) * 10;
  }

  function handleMouseLeave() {
    isHovering = false;
    tiltX = 9;
    tiltY = -9;
  }

  function handleMouseEnter() {
    isHovering = true;
  }

  function handleArrowKey(event: KeyboardEvent) {
    if (event.key === "ArrowLeft" && page > 1) {
      page -= 1;
    } else if (event.key === "ArrowRight" && page < totalPages) {
      page += 1;
    }
  }

  onMount(() => {
    book.addEventListener("mousemove", handleMouseMove);
    book.addEventListener("mouseenter", handleMouseEnter);
    book.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("keydown", handleArrowKey);
    return () => {
      book.removeEventListener("mousemove", handleMouseMove);
      book.removeEventListener("mouseenter", handleMouseEnter);
      book.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("keydown", handleArrowKey);
    };
  });
</script>

<div
  bind:this={book}
  class="book {class_} {isFlipped ? 'flipped' : ''}"
  style="transform: rotateX({tiltX}deg) rotateY({tiltY + rotateY}deg) translateX({translateX}%) translateY({translateY}%)"
>
  <div class="front">
    <img
      src={FrontCover.src}
      alt="Front Cover"
      class="rounded-r w-full h-full object-cover"
    />
  </div>
  <div class="back">
    <img
      src={BackCover.src}
      alt="Back Cover"
      class="rounded-r w-full h-full object-cover"
    />
  </div>
  <div class="spine" style="display: {spineDisplay};"></div>
  <div class="paper-block" style="display: {paperBlockDisplay};"></div>
</div>

<style>
  .book {
    transform-style: preserve-3d;
    position: relative;
    margin: 5vmin;
    cursor: default;
    transition:
      transform 0.5s ease-out,
      width 0.5s ease-out,
      height 0.5s ease-out;
    max-width: 75vw;
    height: 42vmin;
    width: 60vmin;
    z-index: 40;
    margin: 2rem auto;
  }

  .front,
  .back,
  .spine,
  .paper-block,
  .page {
    position: absolute;
    top: 0;
    left: 0;
    transition:
      transform 0.5s ease,
      box-shadow 0.35s ease-in-out;
  }

  .page,
  .front,
  .back {
    transform-origin: left center;
  }

  .front,
  .back {
    width: 100%;
    height: 100%;
  }

  .spine {
    width: 65px;
    height: 100%;
    left: -7.5%;
    background: #252525;
    transform: rotateY(-90deg) translateX(-40%);
    transform-style: preserve-3d;
    border-radius: 5px 0 0 5px;
  }

  .spine::before,
  .spine::after {
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    background: #252525;
    display: none;
  }

  .front {
    z-index: 2;
    transform: translateZ(10px);
  }

  .back {
    z-index: 1;
    background: #624a2e;
    transform: translateZ(-55px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    border-radius: 0 5px 5px 0;
  }

  .paper-block {
    width: 95%;
    height: 98%;
    top: 1%;
    left: 2.5%;
    background: #f5f5f5;
    transform: translateZ(-54px);
    box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.1);
    border-radius: 0 5px 5px 0;
  }

  .page {
    width: 98%;
    height: 98%;
    top: 1%;
    left: 1%;
    background: #fdfdfd;
    transform: translateZ(0);
    border-radius: 0 5px 5px 0;
  }

  .page img {
    border-radius: 0 5px 5px 0;
  }

  @media screen and (max-width: 600px) {
    .spine {
      transform: rotateY(-90deg) translateX(-40%) translateZ(10px);
    }
  }
</style>
