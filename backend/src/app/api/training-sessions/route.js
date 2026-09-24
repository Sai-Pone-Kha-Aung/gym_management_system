import { NextResponse } from "next/server";
import { getClientPromise } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { paginationQuery } from "@/lib/pagination";
import { TRAINING_SESSION_STATUS } from "@/constants";
import { authorize } from "@/lib/auth";

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}
function normalizeDate(d) {
  if (!d) return "";
  if (d instanceof Date) return d.toISOString().split("T")[0];
  if (typeof d === "string") return d.split("T")[0];
  return String(d);
}

export const GET = async (request) => {
  const trainerId =
    request.nextUrl.searchParams.get("trainerId") ||
    request.nextUrl.searchParams.get("trainer_id");
  const memberId =
    request.nextUrl.searchParams.get("memberId") ||
    request.nextUrl.searchParams.get("member_id");
  const status = request.nextUrl.searchParams.get("status");
  const date = request.nextUrl.searchParams.get("date");

  try {
    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    const query = { isDeleted: { $ne: true } };
    if (status) query.status = status.toUpperCase();
    if (date) query.date = { $regex: normalizeDate(date) };
    if (trainerId) {
      const tQuery = ObjectId.isValid(trainerId)
        ? { $in: [trainerId, new ObjectId(trainerId)] }
        : trainerId;
      query.$or = [{ trainerId: tQuery }, { trainer_id: tQuery }];
    }
    if (memberId) {
      const mQuery = ObjectId.isValid(memberId)
        ? { $in: [memberId, new ObjectId(memberId)] }
        : memberId;
      query[query.$or ? "$and" : "$or"] = [
        ...(query.$or ? [{ $or: query.$or }] : []),
        { $or: [{ memberId: mQuery }, { member_id: mQuery }] },
      ];
      if (query.$and) delete query.$or;
    }

    const result = await paginationQuery(
      db.collection("training-sessions"),
      query,
      request,
      "training_sessions",
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
    const memberId = data.memberId || data.member_id;
    const trainerId = data.trainerId || data.trainer_id;
    const date = data.date;
    const startTime = data.startTime || data.start_time;
    const duration = data.duration;
    const status = data.status;

    if (!memberId || !trainerId || !date || !startTime || !duration) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    const validStatuses = Object.values(TRAINING_SESSION_STATUS);
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          message: `Invalid status. Allowed values: ${validStatuses.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    // =========================================================================
    // Business Logic 1: Active Membership Validation
    // Member must have an active, unexpired membership to book a session
    // =========================================================================
    const memberQuery = ObjectId.isValid(memberId)
      ? { $in: [memberId, new ObjectId(memberId)] }
      : memberId;

    const activeMembership = await db.collection("memberships").findOne({
      $or: [{ member_id: memberQuery }, { memberId: memberQuery }],
      $and: [
        {
          $or: [
            { status: "ACTIVE" },
            { payment_status: "PAID" },
            { status: { $exists: false }, payment_status: { $exists: false } },
          ],
        },
        {
          $or: [
            { end_date: { $gte: new Date() } },
            { endDate: { $gte: new Date() } },
            { end_date: { $exists: false } },
            { endDate: { $exists: false } },
          ],
        },
      ],
    });

    if (!activeMembership) {
      return NextResponse.json(
        {
          message:
            "Member does not have an active membership. Booking forbidden.",
        },
        { status: 403 },
      );
    }

    // =========================================================================
    // Business Logic 2: Trainer Schedule Conflict Prevention
    // Check if trainer already has an overlapping session on the same date
    // =========================================================================
    const trainerQuery = ObjectId.isValid(trainerId)
      ? { $in: [trainerId, new ObjectId(trainerId)] }
      : trainerId;

    const existingSessions = await db
      .collection("training-sessions")
      .find({
        $or: [{ trainerId: trainerQuery }, { trainer_id: trainerQuery }],
        status: { $in: ["SCHEDULED", TRAINING_SESSION_STATUS.SCHEDULED] },
      })
      .toArray();

    const sessionDateStr = normalizeDate(date);
    const newStart = timeToMinutes(startTime);
    const newEnd = newStart + Number(duration);

    const conflictingSession = existingSessions.find((existing) => {
      if (normalizeDate(existing.date) !== sessionDateStr) return false;

      const existingStart = timeToMinutes(existing.startTime);
      const existingEnd = existingStart + Number(existing.duration || 60);

      // Overlap condition: startA < endB && startB < endA
      return newStart < existingEnd && existingStart < newEnd;
    });

    if (conflictingSession) {
      return NextResponse.json(
        {
          message: `Trainer schedule conflict: Trainer already has a session on ${sessionDateStr} starting at ${conflictingSession.startTime} (${conflictingSession.duration} mins).`,
        },
        { status: 409 },
      );
    }

    // =========================================================================
    // Insert New Training Session
    // =========================================================================
    const insertTrainingSession = await db
      .collection("training-sessions")
      .insertOne({
        memberId,
        trainerId,
        date,
        startTime,
        duration: Number(duration),
        status: status || TRAINING_SESSION_STATUS.SCHEDULED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    return NextResponse.json({ insertTrainingSession }, { status: 201 });
  } catch (error) {
    console.log(error.message);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
};
