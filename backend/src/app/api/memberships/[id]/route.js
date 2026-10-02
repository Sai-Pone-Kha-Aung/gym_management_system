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
      ? { $or: [{ _id: new ObjectId(id) }, { _id: id }] }
      : { _id: id };
    const membership = await db
      .collection("memberships")
      .aggregate([
        { $match: filter },
        {
          $lookup: {
            from: "membership-plans",
            let: { planId: "$plan_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ["$_id", "$$planId"] },
                      {
                        $and: [
                          { $eq: [{ $type: "$$planId" }, "string"] },
                          { $eq: [{ $toString: "$_id" }, "$$planId"] },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            as: "plan",
          },
        },
        { $unwind: { path: "$plan", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "members",
            let: { memberId: "$member_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ["$_id", "$$memberId"] },
                      {
                        $and: [
                          { $eq: [{ $type: "$$memberId" }, "string"] },
                          { $eq: [{ $toString: "$_id" }, "$$memberId"] },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            as: "member",
          },
        },
        { $unwind: { path: "$member", preserveNullAndEmptyArrays: true } },
      ])
      .toArray();

    if (!membership.length) {
      return NextResponse.json(
        { message: "Membership not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ membership: membership[0] }, { status: 200 });
  } catch (error) {
    console.log(error.message);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
};

export const PUT = async (request, { params }) => {
  const auth = authorize(request, ["ADMIN", "STAFF"]);
  if (!auth.authorized) return auth.errorResponse;

  const { id } = await params;

  try {
    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);
    let data = await request.json();

    // If the body was received as a string, parse it to an object
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

    // Never allow updating immutable MongoDB _id
    delete data._id;

    // Automatically touch updatedAt
    data.updatedAt = new Date();

    const filter = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { _id: id }] }
      : { _id: id };

    const updateMembership = await db
      .collection("memberships")
      .updateOne(filter, { $set: data });

    if (!updateMembership.matchedCount) {
      return NextResponse.json(
        { message: "Membership not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Membership updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.log(error.message);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
};

export const DELETE = async (request, { params }) => {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const mode =
    searchParams.get("mode") ||
    (searchParams.get("hard") === "true" ? "hard" : "soft");

  const requiredRoles = mode === "hard" ? ["ADMIN"] : ["ADMIN", "STAFF"];
  const auth = authorize(request, requiredRoles);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    const filter = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { _id: id }] }
      : { _id: id };

    const membership = await db.collection("memberships").findOne(filter);

    if (!membership) {
      return NextResponse.json(
        { message: "Membership not found" },
        { status: 404 },
      );
    }

    const memberFilter = ObjectId.isValid(membership.member_id)
      ? {
          $or: [
            { _id: new ObjectId(membership.member_id) },
            { _id: membership.member_id },
          ],
        }
      : { _id: membership.member_id };

    switch (mode) {
      case "hard": {
        const result = await db.collection("memberships").deleteOne(filter);

        if (!result.deletedCount) {
          return NextResponse.json(
            { message: "Membership not found" },
            { status: 404 },
          );
        }

        await db.collection("members").updateOne(memberFilter, {
          $set: {
            membership_type: "UNASSIGNED",
            membership_status: "INACTIVE",
            updatedAt: new Date(),
          },
        });

        return NextResponse.json(
          {
            message: "Membership permanently deleted",
          },
          { status: 200 },
        );
      }

      case "soft": {
        await db.collection("memberships").updateOne(filter, {
          $set: {
            isDeleted: true,
            status: "INACTIVE",
            deletedAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Update membership with "UNASSIGNED" status
        await db.collection("members").updateOne(memberFilter, {
          $set: {
            membership_type: "UNASSIGNED",
            membership_status: "INACTIVE",
            updatedAt: new Date(),
          },
        });

        return NextResponse.json(
          { message: "Membership soft deleted successfully" },
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
