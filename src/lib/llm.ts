const API_KEY = process.env.LLM_API_KEY!;
const MODEL = process.env.LLM_MODEL || "gemini-2.5-flash";
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

export async function askLLM(movieTitle: string, movieYear: string, items: string, userReport?: string): Promise<number[] | "none"> {
  const extra = userReport ? `\nThe user reported a problem with the previous selection: "${userReport}". Avoid similar options.\n` : "";

  const prompt = `You are an expert at selecting video files from Real-Debrid. The user wants to watch: "${movieTitle}" (${movieYear}).
${extra}
This is the list of torrents available on Real-Debrid. Pick the 10 best options to download.

Selection criteria (in priority order):
1. Spanish LATIN AMERICAN audio is the TOP PRIORITY. Safe indicators for Latino: Latino, Lat, LAT, ESP-LAT, Dual-Lat, cinecalidad, wolfmax4k. Castilian Spanish indicators (acceptable if no Latino): Castellano, ESP-CAST. "Multi" or "MULTi" does NOT guarantee Spanish — only accept it if there is ALSO another Spanish indicator in the name.
2. REJECT: cam recordings (CAM, HDCAM, TS, Telesync, Telecine), full discs (COMPLETE BLURAY/UHD, ISO, BDMV), audio files (FLAC, MP3), collections/packs of multiple movies
3. Quality: 1080p BluRay or WEB-DL ideal. 4K acceptable if size is reasonable
4. Size: 3-25GB ideal. Maximum 40GB
5. Modern codecs preferred: x265/HEVC over x264
6. If there are NO options with a safe Spanish indicator, respond NONE

Respond ONLY with the numbers separated by commas (best to worst). If no acceptable options, respond NONE. Nothing else.

${items}`;

  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    console.log(`[LLM] "${movieTitle}" → ${text.slice(0, 200)}`);
    if (!text) { console.error("[LLM] Empty response:", JSON.stringify(data).slice(0, 300)); return []; }
    if (/NONE/i.test(text)) return "none";
    const match = text.match(/[\d]+(?:\s*,\s*[\d]+)+/);
    if (match) return match[0].split(",").map((n: string) => parseInt(n.trim()));
  } catch (e: any) {
    console.error("[LLM] Error:", e.message?.slice(0, 200));
  }
  return [];
}
