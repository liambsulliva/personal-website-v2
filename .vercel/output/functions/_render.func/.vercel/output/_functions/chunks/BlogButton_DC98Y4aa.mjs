import { c as createComponent, r as renderTemplate, m as maybeRenderHead, b as addAttribute, d as createAstro } from './astro/server_d0T9HnRo.mjs';
import 'kleur/colors';
import 'clsx';
/* empty css                        */

const $$Astro = createAstro();
const $$BlogButton = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$BlogButton;
  const { label, href } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div id="container" data-astro-cid-y2sj6uaw> <button class="learn-more" data-astro-cid-y2sj6uaw> <a${addAttribute(href, "href")} data-astro-cid-y2sj6uaw> <span class="circle" aria-hidden="true" data-astro-cid-y2sj6uaw> <span class="icon arrow" data-astro-cid-y2sj6uaw></span> </span> <span class="button-text" data-astro-cid-y2sj6uaw>${label}</span> </a> </button> </div> `;
}, "/Users/liambsulliva/Developer/personal-website-v2/src/components/BlogButton.astro", void 0);

export { $$BlogButton as $ };
