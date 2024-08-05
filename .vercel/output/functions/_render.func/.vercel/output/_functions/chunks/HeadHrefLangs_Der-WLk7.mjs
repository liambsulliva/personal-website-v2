import { c as createComponent, r as renderTemplate, a as renderComponent, d as createAstro, u as unescapeHTML, F as Fragment, m as maybeRenderHead, s as spreadAttributes, b as addAttribute } from './astro/server_d0T9HnRo.mjs';
import 'kleur/colors';
import i18next, { t } from 'i18next';
import '@proload/core';
import '@proload/plugin-tsm';
import { P, T } from './page-ssr_CbQQRdYf.mjs';
import localeEmoji from 'locale-emoji';
import ISO6991 from 'iso-639-1';
import 'clsx';

const interpolate = (i18nKey, referenceString, namespace = null) => {
  const localizedString = t(i18nKey, { ns: namespace });
  if (localizedString === i18nKey) {
    console.warn(`WARNING(astro-i18next): missing translation key ${i18nKey}.`);
    return referenceString;
  }
  const tagsRegex = /<([\w\d]+)([^>]*)>/gi;
  const referenceStringMatches = referenceString.match(tagsRegex);
  if (!referenceStringMatches) {
    console.warn(
      "WARNING(astro-i18next): default slot does not include any HTML tag to interpolate! You should use the `t` function directly."
    );
    return localizedString;
  }
  const referenceTags = [];
  referenceStringMatches.forEach((tagNode) => {
    const [, name, attributes] = tagsRegex.exec(tagNode);
    referenceTags.push({ name, attributes });
    tagsRegex.exec("");
  });
  let interpolatedString = localizedString;
  for (let index = 0; index < referenceTags.length; index++) {
    const referencedTag = referenceTags[index];
    interpolatedString = interpolatedString.replaceAll(
      `<${index}>`,
      `<${referencedTag.name}${referencedTag.attributes}>`
    );
    interpolatedString = interpolatedString.replaceAll(
      `</${index}>`,
      `</${referencedTag.name}>`
    );
  }
  return interpolatedString;
};
const createReferenceStringFromHTML = (html) => {
  const allowedTags = ["strong", "br", "em", "i", "b"];
  let forbiddenStrings = [];
  if (i18next.options) {
    forbiddenStrings = [
      "keySeparator",
      "nsSeparator",
      "pluralSeparator",
      "contextSeparator"
    ].map((key) => {
      return {
        key,
        str: i18next.options[key]
      };
    }).filter(function(val) {
      return typeof val !== "undefined";
    });
  }
  const tagsRegex = /<([\w\d]+)([^>]*)>/gi;
  const referenceStringMatches = html.match(tagsRegex);
  if (!referenceStringMatches) {
    console.warn(
      "WARNING(astro-i18next): default slot does not include any HTML tag to interpolate! You should use the `t` function directly."
    );
    return html;
  }
  const referenceTags = [];
  referenceStringMatches.forEach((tagNode) => {
    const [, name, attributes] = tagsRegex.exec(tagNode);
    referenceTags.push({ name, attributes });
    tagsRegex.exec("");
  });
  let sanitizedString = html.replace(/\s+/g, " ").trim();
  for (let index = 0; index < referenceTags.length; index++) {
    const referencedTag = referenceTags[index];
    if (allowedTags.includes(referencedTag.name) && referencedTag.attributes.trim().length === 0) {
      continue;
    }
    sanitizedString = sanitizedString.replaceAll(
      new RegExp(`<${referencedTag.name}[^>]*?\\s*\\/>`, "gi"),
      `<${index}/>`
    );
    sanitizedString = sanitizedString.replaceAll(
      `<${referencedTag.name}${referencedTag.attributes}>`,
      `<${index}>`
    );
    sanitizedString = sanitizedString.replaceAll(
      `</${referencedTag.name}>`,
      `</${index}>`
    );
  }
  for (let index = 0; index < forbiddenStrings.length; index++) {
    const { key, str } = forbiddenStrings[index];
    if (sanitizedString.includes(str)) {
      console.warn(
        `WARNING(astro-i18next): "${str}" was found in a <Trans> translation key, but it is also used as ${key}. Either explicitly set an i18nKey or change the value of ${key}.`
      );
    }
  }
  return sanitizedString;
};

const $$Astro$2 = createAstro();
const $$Trans = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$Trans;
  const { i18nKey, ns } = Astro2.props;
  const referenceString = await Astro2.slots.render("default");
  let key;
  if (typeof i18nKey === "string") {
    key = i18nKey;
  } else {
    key = createReferenceStringFromHTML(referenceString);
  }
  return renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate`${unescapeHTML(interpolate(key, referenceString, ns))}` })}`;
}, "/Users/liambsulliva/Developer/personal-website-v2/node_modules/astro-i18next/src/components/Trans.astro", void 0);

const $$Astro$1 = createAstro();
const $$LanguageSelector = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$LanguageSelector;
  const supportedLanguages = i18next.languages;
  const currentLanguage = i18next.language;
  const { pathname } = Astro2.url;
  const { showFlag = false, languageMapping, ...attributes } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<select onchange="location = this.value;"${spreadAttributes(attributes)}> ${supportedLanguages.map((supportedLanguage) => {
    let value = P(pathname, supportedLanguage);
    const flag = showFlag ? localeEmoji(supportedLanguage) + " " : "";
    let nativeName = "";
    if (languageMapping && languageMapping.hasOwnProperty(supportedLanguage)) {
      nativeName = languageMapping[supportedLanguage];
    } else {
      nativeName = ISO6991.getNativeName(supportedLanguage);
    }
    const label = flag + nativeName;
    return renderTemplate`<option${addAttribute(value, "value")}${addAttribute(supportedLanguage === currentLanguage, "selected")}> ${label} </option>`;
  })} </select>`;
}, "/Users/liambsulliva/Developer/personal-website-v2/node_modules/astro-i18next/src/components/LanguageSelector.astro", void 0);

const $$Astro = createAstro();
const $$HeadHrefLangs = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$HeadHrefLangs;
  const supportedLanguages = i18next.languages;
  const currentUrl = Astro2.url.href;
  return renderTemplate`${supportedLanguages.map((supportedLanguage) => renderTemplate`<link rel="alternate"${addAttribute(supportedLanguage, "hreflang")}${addAttribute(T(currentUrl, supportedLanguage), "href")}>`)}`;
}, "/Users/liambsulliva/Developer/personal-website-v2/node_modules/astro-i18next/src/components/HeadHrefLangs.astro", void 0);

export { $$Trans as $, $$HeadHrefLangs as a };
