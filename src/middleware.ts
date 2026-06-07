import type { MiddlewareHandler } from "astro";
import {
  clearDashboardChallengeCookie,
  createDashboardAuthChallenge,
  createDashboardAuthError,
  dashboardNoStoreHeaders,
  getDashboardChallengeCookie,
  requireDashboardApiRequest,
  verifyDashboardAuth,
} from "./lib/dashboardAuth";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/api/cloudinary/add-tag",
  "/api/cloudinary/delete",
  "/api/cloudinary/remove-tag",
  "/api/cloudinary/upload",
];

const PROTECTED_API_PREFIXES = [
  "/api/cloudinary/add-tag",
  "/api/cloudinary/delete",
  "/api/cloudinary/remove-tag",
  "/api/cloudinary/upload",
];

export const onRequest: MiddlewareHandler = async (context, next) => {
  const url = new URL(context.request.url);
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => url.pathname === p || url.pathname.startsWith(p + "/"),
  );
  if (!isProtected) return next();

  const isProtectedApi = PROTECTED_API_PREFIXES.some(
    (p) => url.pathname === p || url.pathname.startsWith(p + "/"),
  );

  if (isProtectedApi) {
    const apiFailure = await requireDashboardApiRequest(context.request);

    if (apiFailure) {
      return apiFailure;
    }

    const response = await next();
    Object.entries(dashboardNoStoreHeaders).forEach(([header, value]) => {
      response.headers.set(header, value);
    });

    return response;
  }

  if (!getDashboardChallengeCookie(context.request)) {
    return createDashboardAuthChallenge(context.request);
  }

  const authFailure = await verifyDashboardAuth(context.request);

  if (authFailure) {
    return authFailure.status === 401
      ? createDashboardAuthChallenge(context.request, authFailure.reason)
      : createDashboardAuthError(authFailure);
  }

  const response = await next();
  Object.entries(dashboardNoStoreHeaders).forEach(([header, value]) => {
    response.headers.set(header, value);
  });
  response.headers.append(
    "Set-Cookie",
    clearDashboardChallengeCookie(context.request),
  );

  return response;
};
