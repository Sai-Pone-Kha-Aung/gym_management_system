import { NextResponse } from "next/server";
import { getClientPromise } from "@/lib/mongodb";
import { paginationQuery } from "@/lib/pagination";
import { authorize } from "@/lib/auth";

export const GET = async (request) => {
  const search = request.nextUrl.searchParams.get("search");
  const status = request.nextUrl.searchParams.get("status");
  const specialization = request.nextUrl.searchParams.get("specialization");

  try {
    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    const query = { isDeleted: { $ne: true } };
    if (status) query.status = status.toUpperCase();
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (specialization) {
      query.specialization = { $regex: specialization, $options: "i" };
    }

    const result = await paginationQuery(
      db.collection("trainers"),
      query,
      request,
      "trainers",
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
      specialization = [],
      experience,
      shift = [],
    } = data;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    const insertMember = await db.collection("trainers").insertOne({
      name,
      email,
      phone,
      address,
      gender,
      date_of_birth,
      specialization,
      experience,
      shift,
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ insertTrainer: insertMember }, { status: 201 });
  } catch (error) {
    console.log(error.message);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
};
