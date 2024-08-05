import { P } from './page-ssr_CbQQRdYf.mjs';
import { c as createComponent, r as renderTemplate, m as maybeRenderHead, a as renderComponent } from './astro/server_d0T9HnRo.mjs';
import 'kleur/colors';
import { $ as $$BlogButton } from './BlogButton_DC98Y4aa.mjs';
/* empty css                        */

const prerender = false;
const $$Blog = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<div class="title" data-astro-cid-5xhahiyj> <h2 data-astro-cid-5xhahiyj>Blog</h2> </div> <div class="posts" data-astro-cid-5xhahiyj> <div id="posts-container" class="flex-row rounded-lg shadow dark:bg-gray-800 dark:border-gray-700" data-astro-cid-5xhahiyj></div> </div> <div class="button" data-astro-cid-5xhahiyj> ${renderComponent($$result, "Button", $$BlogButton, { "label": "Berlin 2024", "href": P("/BlogPage/"), "data-astro-cid-5xhahiyj": true })} </div>  `;
}, "/Users/liambsulliva/Developer/personal-website-v2/src/pages/Blog.astro", void 0);

const $$file = "/Users/liambsulliva/Developer/personal-website-v2/src/pages/Blog.astro";
const $$url = "/Blog";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Blog,
	file: $$file,
	prerender,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

export { $$Blog as $, _page as _ };
