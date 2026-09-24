import { NextResponse } from "next/server";
import { getClientPromise } from "@/lib/mongodb";
import bcrypt from "bcrypt";
import { signToken } from "@/lib/auth";

export const POST = async (request) => {
  try {
    let body = await request.json();
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        return NextResponse.json(
          { message: "Invalid JSON format" },
          { status: 400 },
        );
      }
    }

    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    const user = await db.collection("users").findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 },
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 },
      );
    }

    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role || "STAFF",
    };

    const token = signToken(tokenPayload, "7d");

    const response = NextResponse.json(
      {
        message: "Login successful",
        token,
        user: tokenPayload,
      },
      { status: 200 },
    );

    // Set secure HTTP-only cookie
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login Error:", error.message);
    return NextResponse.json(
      { message: "Failed to login" },
      { status: 500 },
    );
  }
};
