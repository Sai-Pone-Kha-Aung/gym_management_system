import { NextResponse } from "next/server";

export const POST = async () => {
  try {
    const response = NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 },
    );

    // Clear HTTP-only auth token cookie
    response.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error("Logout Error:", error.message);
    return NextResponse.json(
      { message: "Failed to logout" },
      { status: 500 },
    );
  }
};
