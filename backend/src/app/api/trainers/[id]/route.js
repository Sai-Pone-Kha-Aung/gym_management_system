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

    const trainer = await db.collection("trainers").findOne(filter);

    if (!trainer) {
      return NextResponse.json(
        { message: "Trainer not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ trainer }, { status: 200 });
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

    const updateTrainer = await db
      .collection("trainers")
      .updateOne(filter, { $set: data });

    if (!updateTrainer.matchedCount) {
      return NextResponse.json(
        { message: "Trainer not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Trainer updated successfully" },
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

  try {
    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    const filter = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { _id: id }] }
      : { _id: id };

    const trainer = await db.collection("trainers").findOne(filter);

    if (!trainer) {
      return NextResponse.json(
        { message: "Trainer not found" },
        { status: 404 },
      );
    }

    switch (mode) {
      case "hard": {
        const result = await db.collection("trainers").deleteOne(filter);

        if (!result.deletedCount) {
          return NextResponse.json(
            { message: "Trainer not found" },
            { status: 404 },
          );
        }

        const tQuery = ObjectId.isValid(id)
          ? { $in: [id, new ObjectId(id)] }
          : id;
        await db.collection("training-sessions").deleteMany({
          $or: [{ trainerId: tQuery }, { trainer_id: tQuery }],
        });

        return NextResponse.json(
          { message: "Trainer permanently deleted" },
          { status: 200 },
        );
      }

      case "soft": {
        await db.collection("trainers").updateOne(filter, {
          $set: {
            isDeleted: true,
            status: "INACTIVE",
            deletedAt: new Date(),
            updatedAt: new Date(),
          },
        });

        const tQuery = ObjectId.isValid(id)
          ? { $in: [id, new ObjectId(id)] }
          : id;
        await db.collection("training-sessions").updateMany(
          {
            $or: [{ trainerId: tQuery }, { trainer_id: tQuery }],
            status: "SCHEDULED",
          },
          { $set: { status: "CANCELLED", updatedAt: new Date() } },
        );

        return NextResponse.json(
          { message: "Trainer soft deleted successfully" },
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
