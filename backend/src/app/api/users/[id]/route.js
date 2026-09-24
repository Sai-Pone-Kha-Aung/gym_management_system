import { NextResponse } from "next/server";
import { getClientPromise } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import { authorize } from "@/lib/auth";

export const GET = async (request, { params }) => {
  const { id } = await params;

  try {
    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    const filter = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { _id: id }] }
      : { _id: id };

    const user = await db
      .collection("users")
      .findOne(filter, {
        projection: {
          password: 0,
          resetToken: 0,
          resetTokenExpiry: 0,
        },
      });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("GET /api/users/[id] Error:", error.message);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
};

export const PUT = async (request, { params }) => {
  const auth = authorize(request, ["ADMIN"]);
  if (!auth.authorized) return auth.errorResponse;

  const { id } = await params;

  try {
    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);
    let data = await request.json();

    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        return NextResponse.json(
          { message: "Invalid JSON format" },
          { status: 400 },
        );
      }
    }

    if (!data || typeof data !== "object") {
      return NextResponse.json(
        { message: "Update data must be a valid JSON object" },
        { status: 400 },
      );
    }

    delete data._id;

    const filter = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { _id: id }] }
      : { _id: id };

    // If updating email, check for conflicts with other users
    if (data.email) {
      const normalizedEmail = String(data.email).toLowerCase().trim();
      data.email = normalizedEmail;

      const emailConflict = await db.collection("users").findOne({
        email: normalizedEmail,
        _id: ObjectId.isValid(id)
          ? { $nin: [new ObjectId(id), id] }
          : { $ne: id },
        isDeleted: { $ne: true },
      });

      if (emailConflict) {
        return NextResponse.json(
          { message: "Email is already in use by another user" },
          { status: 409 },
        );
      }
    }

    // If updating password, hash it
    if (data.password) {
      if (data.password.length < 6) {
        return NextResponse.json(
          { message: "Password must be at least 6 characters long" },
          { status: 400 },
        );
      }
      data.password = await bcrypt.hash(data.password, 10);
    }

    if (data.role) {
      data.role = data.role.toUpperCase() === "ADMIN" ? "ADMIN" : "STAFF";
    }

    if (data.status) {
      data.status = data.status.toUpperCase() === "INACTIVE" ? "INACTIVE" : "ACTIVE";
    }

    data.updatedAt = new Date();

    const updateResult = await db
      .collection("users")
      .updateOne(filter, { $set: data });

    if (!updateResult.matchedCount) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "User updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("PUT /api/users/[id] Error:", error.message);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
};

export const DELETE = async (request, { params }) => {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const mode =
    searchParams.get("mode") ||
    (searchParams.get("hard") === "true" ? "hard" : "soft");

  try {
    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    const filter = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { _id: id }] }
      : { _id: id };

    const user = await db.collection("users").findOne(filter);

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 },
      );
    }

    switch (mode) {
      case "hard": {
        const result = await db.collection("users").deleteOne(filter);

        if (!result.deletedCount) {
          return NextResponse.json(
            { message: "User not found" },
            { status: 404 },
          );
        }

        return NextResponse.json(
          { message: "User permanently deleted" },
          { status: 200 },
        );
      }

      case "soft": {
        await db.collection("users").updateOne(filter, {
          $set: {
            status: "INACTIVE",
            isDeleted: true,
            deletedAt: new Date(),
            updatedAt: new Date(),
          },
        });

        return NextResponse.json(
          { message: "User soft deleted successfully" },
          { status: 200 },
        );
      }

      default:
        return NextResponse.json({ message: "Invalid mode" }, { status: 400 });
    }
  } catch (error) {
    console.error("DELETE /api/users/[id] Error:", error.message);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
};
