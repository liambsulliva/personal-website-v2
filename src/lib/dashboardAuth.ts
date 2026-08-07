import bcrypt from "bcryptjs";

const DASHBOARD_REALM = "Dashboard";
const DASHBOARD_REQUEST_HEADER = "x-dashboard-request";
const DASHBOARD_REQUEST_VALUE = "true";

type AuthFailure = {
  reason: string;
  status: 400 | 401 | 500;
};

export const dashboardNoStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Expires: "0",
  Pragma: "no-cache",
} as const;

const getAuthSecret = (name: "AUTH_USER_HASH" | "AUTH_PASSWORD_HASH") => {
  const runtimeValue = process.env[name];
  if (typeof runtimeValue === "string" && runtimeValue.length > 0) {
    return runtimeValue;
  }

  const buildValue =
    name === "AUTH_USER_HASH"
      ? import.meta.env.AUTH_USER_HASH
      : import.meta.env.AUTH_PASSWORD_HASH;

  return typeof buildValue === "string" && buildValue.length > 0
    ? buildValue
    : undefined;
};

export const createDashboardAuthChallenge = (
  message = "Authentication required",
) =>
  new Response(message, {
    status: 401,
    headers: {
      ...dashboardNoStoreHeaders,
      "WWW-Authenticate": `Basic realm="${DASHBOARD_REALM}", charset="UTF-8"`,
    },
  });

export const createDashboardAuthError = (failure: AuthFailure) =>
  new Response(failure.reason, {
    status: failure.status,
    headers:
      failure.status === 401
        ? {
            ...dashboardNoStoreHeaders,
            "WWW-Authenticate": `Basic realm="${DASHBOARD_REALM}", charset="UTF-8"`,
          }
        : dashboardNoStoreHeaders,
  });

const parseBasicAuth = (request: Request) => {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.toLowerCase().startsWith("basic ")) {
    return null;
  }

  try {
    const decoded = Buffer.from(authHeader.slice(6).trim(), "base64").toString(
      "utf8",
    );
    const separator = decoded.indexOf(":");

    if (separator === -1) {
      return null;
    }

    return {
      password: decoded.slice(separator + 1),
      username: decoded.slice(0, separator),
    };
  } catch {
    return null;
  }
};

export const verifyDashboardAuth = async (
  request: Request,
): Promise<AuthFailure | null> => {
  const credentials = parseBasicAuth(request);

  if (!credentials) {
    return { reason: "Authentication required", status: 401 };
  }

  const usernameHash = getAuthSecret("AUTH_USER_HASH");
  const passwordHash = getAuthSecret("AUTH_PASSWORD_HASH");

  if (!usernameHash || !passwordHash) {
    return { reason: "Server not configured", status: 500 };
  }

  const [usernameOk, passwordOk] = await Promise.all([
    bcrypt.compare(credentials.username, usernameHash),
    bcrypt.compare(credentials.password, passwordHash),
  ]);

  if (!usernameOk || !passwordOk) {
    return { reason: "Unauthorized", status: 401 };
  }

  return null;
};

export const hasDashboardRequestHeader = (request: Request) =>
  request.headers.get(DASHBOARD_REQUEST_HEADER) === DASHBOARD_REQUEST_VALUE;

export const isSameOriginDashboardRequest = (request: Request) => {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");

  if (origin) {
    return origin === requestUrl.origin;
  }

  const fetchSite = request.headers.get("sec-fetch-site");

  return fetchSite === "same-origin" || fetchSite === "same-site";
};

export const requireDashboardApiRequest = async (request: Request) => {
  const authFailure = await verifyDashboardAuth(request);

  if (authFailure) {
    return createDashboardAuthError(authFailure);
  }

  if (
    !hasDashboardRequestHeader(request) ||
    !isSameOriginDashboardRequest(request)
  ) {
    return new Response("Forbidden", {
      status: 403,
      headers: dashboardNoStoreHeaders,
    });
  }

  return null;
};
