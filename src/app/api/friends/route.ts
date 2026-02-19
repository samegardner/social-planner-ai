import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { friends } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const allFriends = db.select().from(friends).all();
    return NextResponse.json(allFriends);
  } catch (error) {
    console.error("Friends fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch friends" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, phoneNumber } = await request.json();
    if (!name || !phoneNumber) {
      return NextResponse.json({ error: "Name and phone number are required" }, { status: 400 });
    }
    const result = db.insert(friends).values({ name, phoneNumber }).returning().get();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Friend create error:", error);
    return NextResponse.json({ error: "Failed to create friend" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, name, phoneNumber } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Friend ID is required" }, { status: 400 });
    }
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;

    db.update(friends).set(updates).where(eq(friends.id, id)).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Friend update error:", error);
    return NextResponse.json({ error: "Failed to update friend" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Friend ID is required" }, { status: 400 });
    }
    db.delete(friends).where(eq(friends.id, parseInt(id))).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Friend delete error:", error);
    return NextResponse.json({ error: "Failed to delete friend" }, { status: 500 });
  }
}
