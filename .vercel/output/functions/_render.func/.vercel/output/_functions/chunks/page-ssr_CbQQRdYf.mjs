/* empty css                              */
import i18next from 'i18next';
import fsBackend from 'i18next-fs-backend';
import module2 from 'module';
import path2 from 'path';
import * as url2 from 'url';
import '@proload/core';
import '@proload/plugin-tsm';

module2.createRequire(import.meta.url);
const __filename = url2.fileURLToPath(import.meta.url);
path2.dirname(__filename);
var g = { config: { defaultLocale: "cimode", locales: [], namespaces: "translation", defaultNamespace: "translation", load: ["server"], routes: {}, flatRoutes: {}, showDefaultLocale: false, trailingSlash: "ignore", resourcesBasePath: "/locales" } }, A = (e) => {
  let r = {};
  for (let n in e) n === "routes" && (r = y(e[n])), g.config[n] = e[n];
  g.config.flatRoutes = r;
}, y = (e, r = [], n = [], s = null) => {
  let o = s || {};
  for (let t in e) if (typeof e[t] == "object" && e[t] !== null) y(e[t], [...r, t], [...n, Object.prototype.hasOwnProperty.call(e[t], "index") ? e[t].index : t], o);
  else {
    let l = "/" + r.join("/"), i = "/" + n.join("/");
    t === "index" ? (o[l] = i, l += "/" + t, i += "/" + t, o[l] = i) : (l += "/" + t, i += "/" + e[t], o[l] = i);
  }
  return o;
};
var m = (e, r) => {
  if (e === "/") return e;
  switch (r) {
    case "always":
      return e.endsWith("/") ? e : e + "/";
    case "never":
      return e.replace(/\/$/, "");
    default:
      return e;
  }
}, P = (e = "/", r = null, n = "/") => {
  r || (r = i18next.language);
  let s = e.split("/").filter((f) => f !== ""), o = n.split("/").filter((f) => f !== "");
  JSON.stringify(s).startsWith(JSON.stringify(o).replace(/]+$/, "")) && s.splice(0, o.length), e = s.length === 0 ? "" : s.join("/"), n = o.length === 0 ? "/" : "/" + o.join("/") + "/";
  let { flatRoutes: t, showDefaultLocale: l, defaultLocale: i, locales: a, trailingSlash: c } = g.config;
  if (!a.includes(r)) return console.warn(`WARNING(astro-i18next): "${r}" locale is not supported, add it to the locales in your astro config.`), m(`${n}${e}`, c);
  if (s.length === 0) return m(l ? `${n}${r}` : r === i ? n : `${n}${r}`, c);
  if (r === i) {
    let f = Object.keys(t).find((d) => t[d] === "/" + e);
    typeof f < "u" && (s = f.split("/").filter((d) => d !== ""));
  }
  for (let f of a) if (s[0] === f) {
    s.shift();
    break;
  }
  (l || r !== i) && (s = [r, ...s]);
  let u = n + s.join("/");
  return Object.prototype.hasOwnProperty.call(t, u.replace(/\/$/, "")) ? m(t[u.replace(/\/$/, "")], c) : m(u, c);
}, T = (e, r = null, n = "/") => {
  let [s, , o, ...t] = e.split("/");
  return s + "//" + o + P(t.join("/"), r, n);
};
function fe(e) {
  A(e);
}

i18next.use(fsBackend).init({"supportedLngs": ["cimode","en","de",],"fallbackLng": ["cimode","en","de",],"ns": "translation","defaultNS": "translation","initImmediate": false,"backend": {"loadPath": "/Users/liambsulliva/Developer/personal-website-v2/public/locales/{{lng}}/{{ns}}.json",},"debug": true,});fe({"defaultLocale": "cimode","locales": ["cimode","en","de",],"namespaces": "translation","defaultNamespace": "translation","load": ["server",],"routes": {},"flatRoutes": {},"showDefaultLocale": false,"trailingSlash": "ignore","resourcesBasePath": "/locales","i18nextServer": {"debug": true,},});

export { P, T };
