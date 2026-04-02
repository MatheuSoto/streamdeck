import { NextResponse } from "next/server";
import { listTorrents } from "@/lib/rd";

export async function GET() {
  const data = await listTorrents();
  return NextResponse.json(
    (data || []).map((t: any) => ({
      id: t.id, name: t.filename,
      size: (t.bytes / (1024 * 1024 * 1024)).toFixed(1),
      status: t.status, added: t.added,
    }))
  );
}
