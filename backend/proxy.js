import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

const allowedOrigins = ["http://localhost:5173", "http://localhost:3000"];

const publicRoutes = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];

export default function proxy(request) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get("origin");

  const isAllowedOrigin = origin && allowedOrigins.includes(origin);

  //   CORS Preflight (OPTIONS)

  if (request.method === "OPTIONS") {
    const preflightHeaders = {
      ...(isAllowedOrigin && { "Access-Control-Allow-Origin": origin }),
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    };
    return NextResponse.json({ status: 200 }, { headers: preflightHeaders });
  }

  // 2. Allow Public Routes without JWT

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );
  if (isPublicRoute) {
    const response = NextResponse.next();
    if (isAllowedOrigin) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
    }
    return response;
  }

  // 3. Verify JWT token for protected routes

  const authUser = getUserFromRequest(request);

  if (!authUser) {
    return NextResponse.json(
      { error: "Unauthorized: Missing or invalid token" },
      {
        status: 401,
        headers: {
          ...(isAllowedOrigin && { "Access-Control-Allow-Origin": origin }),
          "Access-Control-Allow-Credentials": "true",
        },
      },
    );
  }

  //   4. Pass User info into downstream request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", authUser.id);
  requestHeaders.set("x-user-email", authUser.email);
  requestHeaders.set("x-user-role", authUser.role);

  //   5. Forward the request
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
