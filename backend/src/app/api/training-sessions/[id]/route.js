import { NextResponse } from "next/server";
import { getClientPromise } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { TRAINING_SESSION_STATUS } from "@/constants";
import { authorize } from "@/lib/auth";

// Helper to convert "HH:MM" string to minutes from midnight
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

// Helper to normalize dates to "YYYY-MM-DD" for comparison
function normalizeDate(d) {
  if (!d) return "";
  if (d instanceof Date) return d.toISOString().split("T")[0];
  if (typeof d === "string") return d.split("T")[0];
  return String(d);
}

export const GET = async (request, { params }) => {
  const { id } = await params;
  try {
    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    const filter = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { _id: id }] }
      : { _id: id };

    const sessions = await db
      .collection("training-sessions")
      .aggregate([
        { $match: filter },
        {
          $lookup: {
            from: "members",
            let: { mId: "$memberId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      {
                        $eq: ["$_id", "$$mId"],
                      },
                      {
                        $and: [
                          { $eq: [{ $type: "$$mId" }, "string"] },
                          { $eq: [{ $toString: "$_id" }, "$$mId"] },
                        ],
                      },
                    ],
                  },
                },
              },
              { $project: { name: 1, email: 1, phone: 1, status: 1 } },
            ],
            as: "member",
          },
        },
        { $unwind: { path: "$member", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "trainers",
            let: { mId: "$trainerId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      {
                        $eq: ["$_id", "$$mId"],
                      },
                      {
                        $and: [
                          { $eq: [{ $type: "$$mId" }, "string"] },
                          { $eq: [{ $toString: "$_id" }, "$$mId"] },
                        ],
                      },
                    ],
                  },
                },
              },
              { $project: { name: 1, email: 1, phone: 1, status: 1 } },
            ],
            as: "trainer",
          },
        },
        {
          $unwind: {
            path: "$trainer",
            preserveNullAndEmptyArrays: true,
          },
        },
      ])
      .toArray();

    if (!sessions.length) {
      return NextResponse.json(
        { message: "Session not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { message: "Session found", data: sessions[0] },
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        message: "Internal server error",
      },
      { status: 500 },
    );
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
    data.updatedAt = new Date();

    const filter = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { _id: id }] }
      : { _id: id };

    const existingSession = await db
      .collection("training-sessions")
      .findOne(filter);

    if (!existingSession) {
      return NextResponse.json(
        { message: "Session not found" },
        { status: 404 },
      );
    }

    if (data.date || data.startTime || data.duration) {
      const checkDate = data.date || existingSession.date;
      const checkStartTime = data.startTime || existingSession.startTime;
      const checkDuration = Number(
        data.duration || existingSession.duration || 60,
      );
      const trainerId = data.trainerId || existingSession.trainerId;

      const tQuery = ObjectId.isValid(trainerId)
        ? { $or: [{ _id: new ObjectId(trainerId) }, { _id: trainerId }] }
        : { _id: trainerId };

      const otherSessions = await db
        .collection("training-sessions")
        .find({
          _id: { $ne: existingSession._id },
          $or: [{ trainerId: tQuery }, { trainer_id: tQuery }],
          status: { $in: ["SCHEDULED", TRAINING_SESSION_STATUS.SCHEDULED] },
        })
        .toArray();

      const sessionDateStr = normalizeDate(checkDate);
      const newStart = timeToMinutes(checkStartTime);
      const newEnd = newStart + checkDuration;

      const conflict = otherSessions.find((s) => {
        if (normalizeDate(s.date) !== sessionDateStr) return false;
        const sStart = timeToMinutes(s.startTime);
        const sEnd = sStart + (Number(s.duration) || 60);

        return newStart < sEnd && newEnd > sStart;
      });

      if (conflict) {
        return NextResponse.json(
          {
            message: `Trainer schedule conflict: Trainer already has a session on ${sessionDateStr} starting at ${conflict.startTime} (${conflict.duration} mins).`,
          },
          { status: 409 },
        );
      }
    }

    await db.collection("training-sessions").updateOne(filter, { $set: data });

    return NextResponse.json(
      {
        message: "Training session updated successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        message: "Internal server error",
      },
      { status: 500 },
    );
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

    const session = await db.collection("training-sessions").findOne(filter);

    if (!session) {
      return NextResponse.json(
        { message: "Session not found" },
        { status: 404 },
      );
    }

    switch (mode) {
      case "hard": {
        await db.collection("training-sessions").deleteOne(filter);
        return NextResponse.json(
          {
            message: "Training session deleted successfully",
          },
          { status: 200 },
        );
      }
      case "soft": {
        await db.collection("training-sessions").updateOne(filter, {
          $set: {
            isDeleted: true,
            status: "CANCELLED",
            deletedAt: new Date(),
            updatedAt: new Date(),
          },
        });

        return NextResponse.json(
          {
            message: "Training session soft deleted successfully",
          },
          { status: 200 },
        );
      }
      default: {
        return NextResponse.json(
          {
            message: "Invalid deletion mode",
          },
          { status: 400 },
        );
      }
    }
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
};
