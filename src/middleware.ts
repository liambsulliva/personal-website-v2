import type { MiddlewareHandler } from "astro";
import {
  isSwitchMenuDocumentPath,
  isSwitchMenuEmbedRequest,
  switchMenuSecurityHeaders,
} from "./lib/switchMenuEmbed";

function guardSwitchMenuDocument(
  request: Request,
  pathname: string,
): Response | null {
  if (!isSwitchMenuDocumentPath(pathname)) return null;
  if (isSwitchMenuEmbedRequest(request)) return null;

  return Response.redirect(
    new URL("/projects/switch-react-menu/", request.url),
    302,
  );
}

export const onRequest: MiddlewareHandler = async (context, next) => {
  const url = new URL(context.request.url);

  const switchMenuGuard = guardSwitchMenuDocument(
    context.request,
    url.pathname,
  );
  if (switchMenuGuard) return switchMenuGuard;

  const response = await next();
  if (isSwitchMenuDocumentPath(url.pathname)) {
    Object.entries(switchMenuSecurityHeaders()).forEach(([header, value]) => {
      response.headers.set(header, value);
    });
  }
  return response;
};
