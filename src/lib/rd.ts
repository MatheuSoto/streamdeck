const RD_TOKEN = process.env.RD_TOKEN!;
const RD_API = "https://api.real-debrid.com/rest/1.0";
const headers = () => ({ Authorization: `Bearer ${RD_TOKEN}` });
const formHeaders = () => ({ ...headers(), "Content-Type": "application/x-www-form-urlencoded" });

export async function addMagnet(hash: string): Promise<string | null> {
  console.log(`[RD] addMagnet hash=${hash.slice(0, 12)}...`);
  const res = await fetch(`${RD_API}/torrents/addMagnet`, {
    method: "POST", headers: formHeaders(), body: `magnet=magnet:?xt=urn:btih:${hash}`,
  });
  const data = await res.json();
  console.log(`[RD] addMagnet response:`, JSON.stringify(data).slice(0, 200));
  if (!data.id) return null;

  // Get torrent info to find the largest video file
  await new Promise(r => setTimeout(r, 1000));
  const infoRes = await fetch(`${RD_API}/torrents/info/${data.id}`, { headers: headers() });
  const info = await infoRes.json();
  const files = info.files || [];
  console.log(`[RD] torrent has ${files.length} files`);

  let fileIds = "all";
  if (files.length > 1) {
    // Select only video files, pick the largest
    const videoExts = [".mkv", ".mp4", ".avi", ".m4v", ".webm"];
    const videoFiles = files.filter((f: any) => videoExts.some(ext => f.path.toLowerCase().endsWith(ext)));
    if (videoFiles.length > 0) {
      // Sort by size desc, pick the largest
      videoFiles.sort((a: any, b: any) => b.bytes - a.bytes);
      fileIds = videoFiles[0].id.toString();
      console.log(`[RD] Selected file_id=${fileIds} (${videoFiles[0].path}) ${(videoFiles[0].bytes / 1e9).toFixed(1)}GB`);
    }
  }

  console.log(`[RD] selectFiles/${data.id} files=${fileIds}`);
  const selRes = await fetch(`${RD_API}/torrents/selectFiles/${data.id}`, {
    method: "POST", headers: formHeaders(), body: `files=${fileIds}`,
  });
  console.log(`[RD] selectFiles status=${selRes.status}`);
  return data.id;
}

export async function waitForReady(rdId: string, onProgress: (pct: number) => void): Promise<boolean> {
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const res = await fetch(`${RD_API}/torrents/info/${rdId}`, { headers: headers() });
    const info = await res.json();
    console.log(`[RD] poll ${i}: id=${rdId} status=${info.status} progress=${info.progress} files=${info.files?.length || 0} links=${info.links?.length || 0}`);
    if (info.status === "downloaded") return true;
    if (info.status === "error" || info.status === "dead" || info.status === "magnet_error") {
      console.log(`[RD] FAILED: ${info.status}`);
      return false;
    }
    if (i >= 5 && info.status === "magnet_conversion") {
      console.log(`[RD] Still in magnet_conversion after 15s, skipping`);
      return false;
    }
    onProgress(info.progress || 0);
  }
  console.log(`[RD] Timeout after 30s`);
  return false;
}

export async function getDownloadLink(rdId: string): Promise<string | null> {
  const res = await fetch(`${RD_API}/torrents/info/${rdId}`, { headers: headers() });
  const info = await res.json();
  const links = info.links || [];
  console.log(`[RD] getDownloadLink: ${links.length} links, files=${info.files?.length}, status=${info.status}`);
  if (!links.length) return null;

  console.log(`[RD] unrestricting: ${links[0]}`);
  const unres = await fetch(`${RD_API}/unrestrict/link`, {
    method: "POST", headers: formHeaders(), body: `link=${encodeURIComponent(links[0])}`,
  });
  const data = await unres.json();
  console.log(`[RD] unrestrict result: filename=${data.filename} filesize=${data.filesize} download=${data.download?.slice(0, 80)}`);
  return data.download || null;
}

export async function deleteTorrent(rdId: string) {
  console.log(`[RD] deleting torrent ${rdId}`);
  await fetch(`${RD_API}/torrents/delete/${rdId}`, { method: "DELETE", headers: headers() }).catch(() => {});
}

export async function listTorrents(limit = 100) {
  const res = await fetch(`${RD_API}/torrents?limit=${limit}`, { headers: headers() });
  return res.json();
}
