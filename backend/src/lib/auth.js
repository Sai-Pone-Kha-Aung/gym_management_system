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
 * Validate authenticated user role strictly from cryptographic JWT token.
 * Prevents client-side header spoofing of x-user-role.
 * @param {Request} request
 * @param {string[]} allowedRoles
 * @return {{authorized: boolean, errorResponse?: NextResponse, user?: {id: string, email:string, role:string}}}
 */
export function authorize(request, allowedRoles = ["ADMIN", "STAFF"]) {
  const authUser = getUserFromRequest(request);

  if (!authUser || !authUser.id || !authUser.role) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { message: "Unauthorized: Missing or invalid authentication token" },
        { status: 401 },
      ),
    };
  }

  const role = String(authUser.role).toUpperCase();

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
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
    user: { id: authUser.id, email: authUser.email, role },
  };
}
