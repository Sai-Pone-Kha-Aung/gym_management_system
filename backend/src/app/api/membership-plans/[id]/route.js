import { NextResponse } from "next/server";
import { getClientPromise } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { authorize } from "@/lib/auth";

export const GET = async (request, { params }) => {
  const { id } = await params;

  try {
    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    const filter = ObjectId.isValid(id)
      ? { _id: new ObjectId(id) }
      : { _id: id };
    const membership_plan = await db
      .collection("membership-plans")
      .findOne(filter);

    if (!membership_plan) {
      return NextResponse.json(
        { message: "Membership plan not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ membership_plan }, { status: 200 });
  } catch (error) {
    console.log(error.message);
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
    const data = await request.json();

    const filter = ObjectId.isValid(id)
      ? { _id: new ObjectId(id) }
      : { _id: id };
    // Remove _id from data if present
    delete data._id;

    // Automatically touch updatedAt
    data.updatedAt = new Date();

    const updateMembershipPlan = await db
      .collection("membership-plans")
      .updateOne(filter, {
        $set: data,
      });

    if (!updateMembershipPlan.matchedCount) {
      return NextResponse.json(
        { message: "Membership plan not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Membership plan updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.log(error.message);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
};

export const DELETE = async (request, { params }) => {
  const auth = authorize(request, ["ADMIN"]);
  if (!auth.authorized) return auth.errorResponse;

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

    const plan = await db.collection("membership-plans").findOne(filter);

    if (!plan) {
      return NextResponse.json(
        { message: "Membership plan not found" },
        { status: 404 },
      );
    }

    switch (mode) {
      case "hard": {
        const result = await db
          .collection("membership-plans")
          .deleteOne(filter);

        if (!result.deletedCount) {
          return NextResponse.json(
            { message: "Membership Plan not found" },
            { status: 404 },
          );
        }

        return NextResponse.json(
          {
            message: "Membership plan permanently deleted",
          },
          { status: 200 },
        );
      }

      case "soft": {
        await db.collection("membership-plans").updateOne(filter, {
          $set: {
            isDeleted: true,
            status: "INACTIVE",
            deletedAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Update membership with "UNASSIGNED" status
        await db
          .collection("members")
          .updateMany(
            { membership_type: plan.plan_name },
            { $set: { membership_type: "UNASSIGNED", updatedAt: new Date() } },
          );

        return NextResponse.json(
          { message: "Membership plan soft deleted successfully" },
          { status: 200 },
        );
      }

      default:
        return NextResponse.json({ message: "Invalid mode" }, { status: 400 });
    }
  } catch (error) {
    console.log(error.message);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
};
