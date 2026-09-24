import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "gym-default-secret-jwt-key-2026";

/**
 * Sign a new JWT token.
 * @param {object} payload - Data to embed in the token (e.g. { id, email, role })
 * @param {string} expiresIn - Expiration time (default: '7d')
 * @returns {string} Signed JWT token
 */
export function signToken(payload, expiresIn = "7d") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verify a JWT token.
 * @param {string} token
 * @returns {object|null} Decoded payload or null if invalid/expired
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Extract and verify user payload from NextRequest.
 * Supports Bearer header: Authorization: Bearer <token>
 * or HTTP cookie: token=<token>
 * @param {Request} request
 * @returns {object|null} Decoded user or null
 */
export function getUserFromRequest(request) {
  try {
    let token = null;

    // 1. Check Authorization header
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    // 2. Check Cookie if header is not present
    if (!token && request.cookies) {
      const cookie = request.cookies.get("token");
      if (cookie) {
        token = typeof cookie === "string" ? cookie : cookie.value;
      }
    }

    if (!token) return null;

    return verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * Validate authenticated user role from request headers forwareded by middleware.
 * @param {Request} request
 * @param {string[]} allowedRoles
 * @return {{authorized: boolean, errorResponse?: NextResponse, user?: {id: string, email:string, role:string}}}
 */

export function authorize(request, allowedRoles = ["ADMIN", "STAFF"]) {
  let userId = request.headers.get("x-user-id");
  let userEmail = request.headers.get("x-user-email");
  let userRole = request.headers.get("x-user-role");

  // Fallback to token extraction if headers are not present
  if (!userId || !userRole) {
    const authUser = getUserFromRequest(request);
    if (authUser) {
      userId = authUser.id;
      userEmail = authUser.email;
      userRole = authUser.role;
    }
  }

  if (!userId || !userRole) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { message: "Unauthorized: Missing authentication" },
        { status: 401 },
      ),
    };
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { message: "Forbidden: Insufficient permissions" },
        { status: 403 },
      ),
    };
  }

  return {
    authorized: true,
    user: { id: userId, email: userEmail, role: userRole },
  };
}
