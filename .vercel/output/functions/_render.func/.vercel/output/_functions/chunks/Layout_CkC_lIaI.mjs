import { c as createComponent, r as renderTemplate, e as renderSlot, f as renderHead, a as renderComponent, b as addAttribute, d as createAstro } from './astro/server_d0T9HnRo.mjs';
import 'kleur/colors';
import { a as $$HeadHrefLangs } from './HeadHrefLangs_Der-WLk7.mjs';
import i18next from 'i18next';
/* empty css                            */

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  const { title } = Astro2.props;
  return renderTemplate(_a || (_a = __template(["<html", `> <head><meta charset="UTF-8"><meta name="description" content="Liam Sullivan's personal website, complete with photography, projects, and a blog!"><meta name="viewport" content="width=device-width"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta name="generator"`, "><title>", "</title>", "", "</head> <body> ", ' <script src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/1.8.0/flowbite.min.js"><\/script> </body> </html> '])), addAttribute(i18next.language, "lang"), addAttribute(Astro2.generator, "content"), title, renderComponent($$result, "HeadHrefLangs", $$HeadHrefLangs, {}), renderHead(), renderSlot($$result, $$slots["default"]));
}, "/Users/liambsulliva/Developer/personal-website-v2/src/layouts/Layout.astro", void 0);

export { $$Layout as $ };
