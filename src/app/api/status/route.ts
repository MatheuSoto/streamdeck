import { NextResponse } from "next/server";
import { getDownload, getDownloadById } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const imdbId = searchParams.get("imdbId");

  try {
    const row = id ? getDownloadById(parseInt(id)) : imdbId ? getDownload(imdbId) : null;
    if (!row) return NextResponse.json({ status: "none" });
    return NextResponse.json({
      id: row.id, status: row.status, step: row.step,
      torrent: row.torrent_name, sizeGB: row.size_gb, rank: row.rank,
    });
  } catch {
    return NextResponse.json({ status: "none" });
  }
}
