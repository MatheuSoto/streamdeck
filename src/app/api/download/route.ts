import { NextResponse } from "next/server";
import { startDownload } from "@/lib/pipeline";

export async function POST(req: Request) {
  const { imdbId, tmdbId, movieTitle, movieYear, userReport } = await req.json();
  if (!imdbId || !movieTitle) return NextResponse.json({ error: "missing params" }, { status: 400 });

  const id = startDownload(imdbId, tmdbId, movieTitle, movieYear, userReport);
  return NextResponse.json({ downloadId: id, status: "queued" });
}
