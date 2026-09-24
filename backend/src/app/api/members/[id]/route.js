import { NextResponse } from "next/server";
import { getClientPromise } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { authorize } from "@/lib/auth";

export const GET = async (request, { params }) => {
  const { id } = await params;
  try {
    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    const members = await db
      .collection("members")
      .aggregate([
        {
          $match: {
            $or: [
              { _id: ObjectId.isValid(id) ? new ObjectId(id) : id },
              { _id: id },
            ],
          },
        },
        {
          $lookup: {
            from: "memberships",
            let: { memberId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ["$member_id", { $toString: "$$memberId" }] },
                      { $eq: ["$member_id", "$$memberId"] },
                      { $eq: ["$memberId", { $toString: "$$memberId" }] },
                      { $eq: ["$memberId", "$$memberId"] },
                    ],
                  },
                },
              },
              { $sort: { createdAt: -1 } },
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
              {
                $unwind: {
                  path: "$plan",
                  preserveNullAndEmptyArrays: true,
                },
              },
            ],
            as: "memberships",
          },
        },
        {
          $addFields: {
            membership: { $arrayElemAt: ["$memberships", 0] },
          },
        },
        {
          $project: {
            memberships: 0,
          },
        },
      ])
      .toArray();

    if (!members.length) {
      return NextResponse.json(
        { message: "Member not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ member: members[0] }, { status: 200 });
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

    const updateMember = await db
      .collection("members")
      .updateOne(filter, { $set: data });

    if (!updateMember.matchedCount) {
      return NextResponse.json(
        { message: "Member not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Member updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.log(error.message);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
};
export const DELETE = async (request, { params }) => {
  const { id } = await params;

  // 1. Check if the user passed hard=true in query
  const searchParams = request.nextUrl.searchParams;
  const mode =
    searchParams.get("mode") ||
    (searchParams.get("hard") === "true" ? "hard" : "soft");

  try {
    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    // 2. Check objectID or string id
    const filter = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { _id: id }] }
      : { _id: id };

    const memberIdQuery = ObjectId.isValid(id)
      ? { $in: [id, new ObjectId(id)] }
      : id;

    switch (mode) {
      case "hard":
        const result = await db.collection("members").deleteOne(filter);

        if (!result.deletedCount) {
          return NextResponse.json(
            { message: "Member not found" },
            { status: 404 },
          );
        }

        // 2. Cascade delete memberships belonging to this member
        await db.collection("memberships").deleteMany({
          $or: [{ member_id: memberIdQuery }, { memberId: memberIdQuery }],
        });
        // 3. Cascade delete training sessions belonging to this member
        await db.collection("training-sessions").deleteMany({
          $or: [{ memberId: memberIdQuery }, { member_id: memberIdQuery }],
        });

        return NextResponse.json(
          { message: "Member deleted successfully" },
          { status: 200 },
        );

      case "soft": {
        const result = await db.collection("members").updateOne(filter, {
          $set: {
            status: "INACTIVE",
            isDeleted: true,
            updatedAt: new Date(),
            deletedAt: new Date(),
          },
        });

        if (!result.matchedCount) {
          return NextResponse.json(
            { message: "Member not found" },
            { status: 404 },
          );
        }

        // 2. Cancel active memberships
        await db
          .collection("memberships")
          .updateMany(
            { member_id: memberIdQuery, status: "ACTIVE" },
            { $set: { status: "CANCELLED", updatedAt: new Date() } },
          );

        await db.collection("training-sessions").updateMany(
          {
            $or: [{ memberId: memberIdQuery }, { member_id: memberIdQuery }],
            status: { $in: ["SCHEDULED", "ACTIVE"] },
          },
          { $set: { status: "CANCELLED", updatedAt: new Date() } },
        );

        return NextResponse.json(
          { message: "Member de-activated successfully" },
          { status: 200 },
        );
      }
    }
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
};
