import { NextResponse } from "next/server";
import { getClientPromise } from "@/lib/mongodb";
import {
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  MEMBERSHIP_STATUS,
} from "@/constants/enum";
import { ObjectId } from "mongodb";

import { paginationAggregate, escapeRegex } from "@/lib/pagination";
import { authorize } from "@/lib/auth";

export const GET = async (request) => {
  const memberId =
    request.nextUrl.searchParams.get("member_id") ||
    request.nextUrl.searchParams.get("memberId");
  const planId =
    request.nextUrl.searchParams.get("plan_id") ||
    request.nextUrl.searchParams.get("planId");
  const status = request.nextUrl.searchParams.get("status");
  const search = request.nextUrl.searchParams.get("search");

  try {
    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    const matchStage = { isDeleted: { $ne: true } };
    if (status) matchStage.status = status.toUpperCase();
    if (memberId) {
      const mQuery = ObjectId.isValid(memberId)
        ? { $in: [memberId, new ObjectId(memberId)] }
        : memberId;
      matchStage.$or = [{ member_id: mQuery }, { memberId: mQuery }];
    }
    if (planId) {
      const pQuery = ObjectId.isValid(planId)
        ? { $in: [planId, new ObjectId(planId)] }
        : planId;
      matchStage[matchStage.$or ? "$and" : "$or"] = [
        ...(matchStage.$or ? [{ $or: matchStage.$or }] : []),
        { $or: [{ plan_id: pQuery }, { planId: pQuery }] },
      ];
      if (matchStage.$and) delete matchStage.$or;
    }

    const pipeline = [
      { $match: matchStage },
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
      {
        $unwind: {
          path: "$member",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    if (search) {
      const sanitized = escapeRegex(search);
      pipeline.push({
        $match: {
          $or: [
            { "member.name": { $regex: sanitized, $options: "i" } },
            { "member.email": { $regex: sanitized, $options: "i" } },
            { "plan.plan_name": { $regex: sanitized, $options: "i" } },
          ],
        },
      });
    }

    const result = await paginationAggregate(
      db.collection("memberships"),
      pipeline,
      request,
      "memberships",
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
      member_id,
      plan_id,
      payment_method,
      amount,
      payment_status,
      payment_date,
    } = data;

    if (!member_id || !plan_id || !payment_method || !amount || !payment_date) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    const validMethods = Object.values(PAYMENT_METHOD);
    if (!validMethods.includes(payment_method)) {
      return NextResponse.json(
        {
          message: `Invalid payment_method. Allowed values: ${validMethods.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const validStatuses = Object.values(PAYMENT_STATUS);
    if (payment_status && !validStatuses.includes(payment_status)) {
      return NextResponse.json(
        {
          message: `Invalid payment_status. Allowed values: ${validStatuses.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    // 1. Verify Member exists
    const memberObjId = ObjectId.isValid(member_id)
      ? new ObjectId(member_id)
      : member_id;
    const member = await db.collection("members").findOne({
      $or: [{ _id: memberObjId }, { _id: member_id }],
    });

    if (!member) {
      return NextResponse.json(
        { message: "Member not found" },
        { status: 404 },
      );
    }

    // 2. Verify Plan exists in membership-plans
    const planObjId = ObjectId.isValid(plan_id)
      ? new ObjectId(plan_id)
      : plan_id;
    const plan = await db.collection("membership-plans").findOne({
      $or: [{ _id: planObjId }, { _id: plan_id }],
    });

    if (!plan) {
      return NextResponse.json(
        { message: "Membership plan not found" },
        { status: 404 },
      );
    }

    // 3. Calculate start and end dates based on the plan duration
    const startDate = new Date(payment_date);
    const durationDays = Number(plan.duration_in_days || plan.duration || 30);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + durationDays);

    const membershipStatus =
      payment_status === PAYMENT_STATUS.FAILED
        ? "INACTIVE"
        : MEMBERSHIP_STATUS.ACTIVE;

    // 4. Create Membership record associated with member and plan
    const insertMembership = await db.collection("memberships").insertOne({
      member_id,
      plan_id,
      plan_name: plan.plan_name,
      payment_method,
      amount: Number(amount),
      payment_date: new Date(payment_date),
      payment_status: payment_status || PAYMENT_STATUS.PENDING,
      start_date: startDate,
      end_date: endDate,
      status: membershipStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 5. Update the member record so the member is directly associated with the plan
    await db.collection("members").updateOne(
      { _id: member._id },
      {
        $set: {
          membership_id: insertMembership.insertedId,
          membership_type: plan.plan_name,
          membership_status: membershipStatus,
          membership_end_date: endDate,
          updatedAt: new Date(),
        },
      },
    );

    return NextResponse.json(
      {
        message: "Membership purchased and associated successfully",
        membershipId: insertMembership.insertedId,
        plan: {
          id: plan._id,
          name: plan.plan_name,
          duration_in_days: durationDays,
          end_date: endDate,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.log(error.message);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
};
