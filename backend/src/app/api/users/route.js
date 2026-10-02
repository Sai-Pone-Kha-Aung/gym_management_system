import { NextResponse } from "next/server";
import { getClientPromise } from "@/lib/mongodb";
import { paginationAggregate, escapeRegex } from "@/lib/pagination";
import bcrypt from "bcrypt";
import { authorize } from "@/lib/auth";

export const GET = async (request) => {
  const auth = authorize(request, ["ADMIN"]);
  if (!auth.authorized) return auth.errorResponse;

  const status = request.nextUrl.searchParams.get("status");
  const role = request.nextUrl.searchParams.get("role");
  const search = request.nextUrl.searchParams.get("search");

  try {
    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    const query = {
      isDeleted: { $ne: true },
    };

    if (status) query.status = status.toUpperCase();
    if (role) query.role = role.toUpperCase();
    if (search) {
      const sanitizedSearch = escapeRegex(search);
      query.$or = [
        { name: { $regex: sanitizedSearch, $options: "i" } },
        { email: { $regex: sanitizedSearch, $options: "i" } },
      ];
    }

    const pipeline = [
      { $match: query },
      {
        $project: {
          password: 0,
          resetToken: 0,
          resetTokenExpiry: 0,
        },
      },
      { $sort: { createdAt: -1 } },
    ];

    const result = await paginationAggregate(
      db.collection("users"),
      pipeline,
      request,
      "users",
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("GET /api/users Error:", error.message);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
};

export const POST = async (request) => {
  const auth = authorize(request, ["ADMIN"]);
  if (!auth.authorized) return auth.errorResponse;

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

    const { name, email, password, role = "STAFF", status = "ACTIVE" } = body || {};

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

    const existingUser = await db
      .collection("users")
      .findOne({ email: normalizedEmail, isDeleted: { $ne: true } });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email is already registered" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const assignedRole = role.toUpperCase() === "ADMIN" ? "ADMIN" : "STAFF";
    const assignedStatus = status.toUpperCase() === "INACTIVE" ? "INACTIVE" : "ACTIVE";

    const insertResult = await db.collection("users").insertOne({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: assignedRole,
      status: assignedStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: insertResult.insertedId,
          name: name.trim(),
          email: normalizedEmail,
          role: assignedRole,
          status: assignedStatus,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/users Error:", error.message);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
};
