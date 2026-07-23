import {
  ReactIcon,
  TypeScriptIcon,
  NextjsIcon,
  NodejsIcon,
  TailwindIcon,
  AstroIcon,
  SvelteIcon,
  MongoDBIcon,
  FigmaIcon,
  PhotoshopIcon,
  ExpressIcon,
  EJSIcon,
  OpenAIIcon,
  CSS3DIcon,
  ViteIcon,
  NXLogo,
  ESBuildIcon,
  DocusaurusIcon,
} from "./icons";

function normalizeToolName(toolName: string) {
  return toolName.toLowerCase().replace(/[.\s-]/g, "");
}

export function getToolIcon(toolName: string) {
  const normalizedName = normalizeToolName(toolName);
  const iconMap: Record<string, typeof ReactIcon> = {
    react: ReactIcon,
    typescript: TypeScriptIcon,
    nextjs: NextjsIcon,
    nodejs: NodejsIcon,
    tailwind: TailwindIcon,
    tailwindcss: TailwindIcon,
    astro: AstroIcon,
    svelte: SvelteIcon,
    mongodb: MongoDBIcon,
    figma: FigmaIcon,
    photoshop: PhotoshopIcon,
    express: ExpressIcon,
    ejs: EJSIcon,
    openaiapi: OpenAIIcon,
    openai: OpenAIIcon,
    css3d: CSS3DIcon,
    vite: ViteIcon,
    nx: NXLogo,
    nxjs: NXLogo,
    reacttela: ReactIcon,
    esbuild: ESBuildIcon,
    docusaurus: DocusaurusIcon,
  };
  return iconMap[normalizedName] || null;
}

export function getToolUrl(toolName: string) {
  const normalizedName = normalizeToolName(toolName);
  const urlMap: Record<string, string> = {
    react: "https://react.dev/",
    typescript: "https://www.typescriptlang.org/",
    nextjs: "https://nextjs.org/",
    nodejs: "https://nodejs.org/",
    tailwind: "https://tailwindcss.com/",
    tailwindcss: "https://tailwindcss.com/",
    astro: "https://astro.build/",
    svelte: "https://svelte.dev/",
    mongodb: "https://www.mongodb.com/",
    figma: "https://www.figma.com/",
    photoshop: "https://www.adobe.com/products/photoshop.html",
    express: "https://expressjs.com/",
    ejs: "https://ejs.co/",
    openaiapi: "https://openai.com/api/",
    openai: "https://openai.com/api/",
    css3d: "https://www.w3schools.com/css/css3_3dtransforms.asp",
    vite: "https://vitejs.dev/",
    nx: "https://nxjs.n8.io/",
    nxjs: "https://nxjs.n8.io/",
    reacttela: "https://github.com/TooTallNate/react-tela",
    esbuild: "https://esbuild.github.io/",
    docusaurus: "https://docusaurus.io/",
  };
  return urlMap[normalizedName];
}
