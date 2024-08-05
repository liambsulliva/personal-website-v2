import { c as createComponent, r as renderTemplate, m as maybeRenderHead, b as addAttribute, d as createAstro } from './astro/server_d0T9HnRo.mjs';
import 'kleur/colors';
import 'clsx';
import { t } from 'i18next';
/* empty css                            */

const $$Astro = createAstro();
const $$BackButton = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$BackButton;
  Astro2.props;
  return renderTemplate`${maybeRenderHead()}<a${addAttribute(`/${t("misc.lang")}`, "href")} class="button" data-astro-cid-7a7bzblm> <p data-astro-cid-7a7bzblm>${t("misc.backBtn")}</p> <svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24" data-astro-cid-7a7bzblm><path fill="white" d="M11.8 13H15q.425 0 .713-.288T16 12t-.288-.712T15 11h-3.2l.9-.9q.275-.275.275-.7t-.275-.7t-.7-.275t-.7.275l-2.6 2.6q-.3.3-.3.7t.3.7l2.6 2.6q.275.275.7.275t.7-.275t.275-.7t-.275-.7zm.2 9q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22" data-astro-cid-7a7bzblm></path></svg> </a> `;
}, "/Users/liambsulliva/Developer/personal-website-v2/src/components/BackButton.astro", void 0);

export { $$BackButton as $ };
