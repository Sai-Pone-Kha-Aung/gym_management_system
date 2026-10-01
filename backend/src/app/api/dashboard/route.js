import { NextResponse } from "next/server";
import { getClientPromise } from "@/lib/mongodb";

function normalizeDate(d) {
  if (!d) return "";
  if (d instanceof Date) return d.toISOString().split("T")[0];
  if (typeof d === "string") return d.split("T")[0];
  return String(d);
}

export const GET = async (request) => {
  try {
    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    // Target date from query (validated as YYYY-MM-DD) or default to today's date
    const targetDateParam = request.nextUrl.searchParams.get("date");
    const isValidDate = targetDateParam && /^\d{4}-\d{2}-\d{2}$/.test(targetDateParam);
    const todayStr = isValidDate ? targetDateParam : normalizeDate(new Date());

    const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${todayStr}T23:59:59.999Z`);
    const now = new Date();

    // 1. Calculate KPIs concurrently
    const [
      totalMembers,
      activeMembers,
      totalTrainers,
      activeTrainers,
      activeMemberships,
      totalPlans,
    ] = await Promise.all([
      db.collection("members").countDocuments({ isDeleted: { $ne: true } }),
      db.collection("members").countDocuments({ isDeleted: { $ne: true }, status: "ACTIVE" }),
      db.collection("trainers").countDocuments({ isDeleted: { $ne: true } }),
      db.collection("trainers").countDocuments({ isDeleted: { $ne: true }, status: "ACTIVE" }),
      db.collection("memberships").countDocuments({
        isDeleted: { $ne: true },
        status: "ACTIVE",
        $or: [
          { end_date: { $gte: now } },
          { endDate: { $gte: now } },
          { end_date: { $exists: false } },
        ],
      }),
      db.collection("membership-plans").countDocuments({ isDeleted: { $ne: true }, status: "ACTIVE" }),
    ]);

    // 2. Query today's scheduled training sessions (Daily Agenda)
    const sessionDateMatch = {
      isDeleted: { $ne: true },
      $or: [
        { date: { $regex: `^${todayStr}` } },
        { date: { $gte: startOfDay, $lte: endOfDay } },
      ],
    };

    const todayAgenda = await db
      .collection("training-sessions")
      .aggregate([
        { $match: sessionDateMatch },
        {
          $lookup: {
            from: "members",
            let: { mId: "$memberId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ["$_id", "$$mId"] },
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
            let: { tId: "$trainerId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ["$_id", "$$tId"] },
                      {
                        $and: [
                          { $eq: [{ $type: "$$tId" }, "string"] },
                          { $eq: [{ $toString: "$_id" }, "$$tId"] },
                        ],
                      },
                    ],
                  },
                },
              },
              { $project: { name: 1, email: 1, phone: 1, specialization: 1, status: 1 } },
            ],
            as: "trainer",
          },
        },
        { $unwind: { path: "$trainer", preserveNullAndEmptyArrays: true } },
        { $sort: { startTime: 1 } },
      ])
      .toArray();

    return NextResponse.json(
      {
        kpis: {
          totalMembers,
          activeMembers,
          totalTrainers,
          activeTrainers,
          activeMemberships,
          totalPlans,
          todaySessionsCount: todayAgenda.length,
        },
        agendaDate: todayStr,
        todayAgenda,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/dashboard Error:", error.message);
    return NextResponse.json({ message: "Failed to load dashboard data" }, { status: 500 });
  }
};
