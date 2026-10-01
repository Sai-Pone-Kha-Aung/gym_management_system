import { NextResponse } from "next/server";
import { getClientPromise } from "@/lib/mongodb";
import { paginationQuery } from "@/lib/pagination";
import { authorize } from "@/lib/auth";

export const GET = async (request) => {
  const status = request.nextUrl.searchParams.get("status");
  const search = request.nextUrl.searchParams.get("search");

  try {
    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    const query = {
      isDeleted: { $ne: true },
    };

    if (status) query.status = status.toUpperCase();
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const result = await paginationQuery(
      db.collection("members"),
      query,
      request,
      "members",
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.log(error.message);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
};

export const POST = async (request) => {
  const auth = authorize(request, ["ADMIN", "STAFF"]);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const data = await request.json();

    const {
      name,
      email,
      phone,
      address,
      gender,
      date_of_birth,
      membership_type,
    } = data;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    const insertMember = await db.collection("members").insertOne({
      name,
      email,
      phone,
      address,
      gender,
      date_of_birth,
      membership_type: membership_type || "UNASSIGNED",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ insertMember }, { status: 201 });
  } catch (error) {
    console.log(error.message);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
};
