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

    const { name, email, password, role } = body || {};

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Missing required fields: name, email, and password are required" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters long" },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    const existingUser = await db.collection("users").findOne({ email: normalizedEmail });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email is already registered" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const assignedRole = role === "ADMIN" ? "ADMIN" : "STAFF";

    const insertResult = await db.collection("users").insertOne({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: assignedRole,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(
      {
        message: "Account registered successfully",
        user: {
          id: insertResult.insertedId,
          name: name.trim(),
          email: normalizedEmail,
          role: assignedRole,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Register Error:", error.message);
    return NextResponse.json(
      { message: "Failed to register account" },
      { status: 500 },
    );
  }
};
