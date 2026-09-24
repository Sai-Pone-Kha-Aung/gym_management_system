import { NextResponse } from "next/server";
import { getClientPromise } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getUserFromRequest } from "@/lib/auth";

export const GET = async (request) => {
  try {
    const authUser = getUserFromRequest(request);

    if (!authUser || !authUser.id) {
      return NextResponse.json(
        { message: "Unauthorized. Valid token required." },
        { status: 401 },
      );
    }

    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    const filter = ObjectId.isValid(authUser.id)
      ? { _id: new ObjectId(authUser.id) }
      : { _id: authUser.id };

    const user = await db
      .collection("users")
      .findOne(filter, { projection: { password: 0 } });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Auth Me Error:", error.message);
    return NextResponse.json(
      { message: "Failed to retrieve user profile" },
      { status: 500 },
    );
  }
};
