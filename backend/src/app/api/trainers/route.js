import { NextResponse } from "next/server";
import { getClientPromise } from "@/lib/mongodb";
import { paginationQuery, escapeRegex } from "@/lib/pagination";
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
      const sanitized = escapeRegex(search);
      query.$or = [
        { name: { $regex: sanitized, $options: "i" } },
        { email: { $regex: sanitized, $options: "i" } },
        { phone: { $regex: sanitized, $options: "i" } },
        { specialization: { $regex: sanitized, $options: "i" } },
      ];
    }
    if (specialization) {
      query.specialization = { $regex: escapeRegex(specialization), $options: "i" };
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
      date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
      specialization: Array.isArray(specialization)
        ? specialization
        : typeof specialization === "string"
        ? specialization
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      experience: parseInt(experience, 10) || 0,
      shift: Array.isArray(shift)
        ? shift
        : typeof shift === "string"
        ? shift
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
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
