import { NextResponse } from "next/server";
import { getClientPromise } from "@/lib/mongodb";
import bcrypt from "bcrypt";
import crypto from "crypto";

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

    const { email, newPassword, confirmPassword } = body || {};

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    const user = await db.collection("users").findOne({
      email: normalizedEmail,
      isDeleted: { $ne: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "No account found with this email" },
        { status: 404 },
      );
    }

    // Direct password reset if newPassword is provided
    if (newPassword) {
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
        { message: "Password updated successfully" },
        { status: 200 },
      );
    }

    // Otherwise, generate a reset token valid for 1 hour
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          resetToken,
          resetTokenExpiry,
          updatedAt: new Date(),
        },
      },
    );

    return NextResponse.json(
      {
        message: "Password reset token generated successfully",
        resetToken,
        expiresAt: resetTokenExpiry,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Forgot Password Error:", error.message);
    return NextResponse.json(
      { message: "Failed to process forgot password request" },
      { status: 500 },
    );
  }
};
