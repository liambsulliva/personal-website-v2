import { P } from '../chunks/page-ssr_CbQQRdYf.mjs';
import { c as createComponent, r as renderTemplate, a as renderComponent, m as maybeRenderHead } from '../chunks/astro/server_d0T9HnRo.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_CkC_lIaI.mjs';
import { $ as $$BackButton } from '../chunks/BackButton_BFMTLV9E.mjs';
/* empty css                                    */
export { renderers } from '../renderers.mjs';

const prerender = false;
const $$BlogPage = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Blog", "data-astro-cid-hcgzambx": true }, { "default": ($$result2) => renderTemplate`${maybeRenderHead()}<div class="content" data-astro-cid-hcgzambx><div class="btn-container" data-astro-cid-hcgzambx>${renderComponent($$result2, "Button", $$BackButton, { "label": "Back", "href": P("/"), "data-astro-cid-hcgzambx": true })}</div><div id="posts-container" class="flex-row rounded-lg shadow dark:bg-gray-800 dark:border-gray-700" data-astro-cid-hcgzambx></div></div>` })}`;
}, "/Users/liambsulliva/Developer/personal-website-v2/src/pages/BlogPage.astro", void 0);

const $$file = "/Users/liambsulliva/Developer/personal-website-v2/src/pages/BlogPage.astro";
const $$url = "/BlogPage";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$BlogPage,
    file: $$file,
    prerender,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
