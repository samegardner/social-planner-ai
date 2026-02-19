import { db } from "@/lib/db";
import { friends } from "@/lib/schema";

export function getFriends() {
  return db.select().from(friends).all();
}
