const API_KEY = process.env.LLM_API_KEY!;
const MODEL = process.env.LLM_MODEL || "gemini-2.5-flash";
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

export async function askLLM(movieTitle: string, movieYear: string, items: string, userReport?: string): Promise<number[] | "none"> {
  const extra = userReport ? `\nEl usuario reportó un problema con la selección anterior: "${userReport}". Evita opciones similares.\n` : "";

  const prompt = `Eres un experto seleccionando archivos de video de Real-Debrid. El usuario quiere ver: "${movieTitle}" (${movieYear}).
${extra}
Esta es la lista de torrents disponibles en Real-Debrid. Elige los 10 mejores para descargar.

Criterios de selección (en orden de prioridad):
1. Audio en español LATINO es la PRIORIDAD. Indicadores de latino (PREFERIDOS): Latino, Lat, LAT, ESP-LAT, Dual-Lat, cinecalidad, wolfmax4k. Indicadores de castellano (aceptable si no hay latino): Castellano, ESP-CAST. "Multi" o "MULTi" NO garantiza español — solo acéptalo si ADEMÁS tiene otro indicador de español en el nombre.
2. RECHAZA: grabaciones de cine (CAM, HDCAM, TS, Telesync, Telecine), discos completos (COMPLETE BLURAY/UHD, ISO, BDMV), archivos de audio (FLAC, MP3), colecciones/packs de múltiples películas
3. Calidad: 1080p BluRay o WEB-DL ideal. 4K aceptable si el tamaño es razonable
4. Tamaño: 3-25GB ideal. Máximo 40GB
5. Codecs modernos preferidos: x265/HEVC sobre x264
6. Si NO hay NINGUNA opción con indicador seguro de español, responde NONE

Responde SOLO con los números separados por comas (del mejor al peor). Si no hay opciones aceptables responde NONE. Nada más.

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
