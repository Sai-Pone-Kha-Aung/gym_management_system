import { NextResponse } from "next/server";
import { getClientPromise } from "@/lib/mongodb";
import { paginationQuery, escapeRegex } from "@/lib/pagination";
import { authorize } from "@/lib/auth";

export const GET = async (request) => {
  const search = request.nextUrl.searchParams.get("search");
  const status = request.nextUrl.searchParams.get("status");

  try {
    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    const query = { isDeleted: { $ne: true } };
    if (status) query.status = status.toUpperCase();
    if (search) {
      const sanitized = escapeRegex(search);
      query.$or = [
        { plan_name: { $regex: sanitized, $options: "i" } },
        { description: { $regex: sanitized, $options: "i" } },
      ];
    }

    const result = await paginationQuery(
      db.collection("membership-plans"),
      query,
      request,
      "membership_plans",
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.log(error.message);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
};

export const POST = async (request) => {
  const auth = authorize(request, ["ADMIN"]);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const data = await request.json();

    const { plan_name, duration_in_days, price, description } = data;

    if (!plan_name || !duration_in_days || !price) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    const insertMember = await db.collection("membership-plans").insertOne({
      plan_name,
      duration_in_days,
      price,
      description,
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ insertMembershipPlan: insertMember }, { status: 201 });
  } catch (error) {
    console.log(error.message);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
};
