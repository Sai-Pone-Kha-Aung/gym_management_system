import { NextResponse } from "next/server";
import { getClientPromise } from "@/lib/mongodb";
import bcrypt from "bcrypt";

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

    const { token, newPassword, confirmPassword } = body || {};

    if (!token || !newPassword) {
      return NextResponse.json(
        { message: "Reset token and new password are required" },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: "New password must be at least 6 characters long" },
        { status: 400 },
      );
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return NextResponse.json(
        { message: "New password and confirm password do not match" },
        { status: 400 },
      );
    }

    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    const user = await db.collection("users").findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
      isDeleted: { $ne: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid or expired reset token" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
        $unset: {
          resetToken: "",
          resetTokenExpiry: "",
        },
      },
    );

    return NextResponse.json(
      { message: "Password has been reset successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Reset Password Error:", error.message);
    return NextResponse.json(
      { message: "Failed to reset password" },
      { status: 500 },
    );
  }
};
