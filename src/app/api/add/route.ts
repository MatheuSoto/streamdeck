import { NextResponse } from "next/server";
import { deleteTorrent } from "@/lib/rd";

export async function DELETE(req: Request) {
  const { id } = await req.json();
  if (id) await deleteTorrent(id);
  return NextResponse.json({ success: true });
}
