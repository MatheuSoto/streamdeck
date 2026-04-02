# StreamDeck

A self-hosted movie download manager powered by Real-Debrid. Browse movies, let AI pick the best torrent, and download automatically.

## How it works

1. **Browse** — Search movies via TMDB or explore trending/now playing
2. **Select** — Click a movie and hit Download
3. **AI Ranking** — Gemini ranks available torrents (prefers Spanish audio, good quality, reasonable size)
4. **Real-Debrid** — Adds the torrent to RD, waits for processing
5. **Download** — Downloads the file locally with resume support
6. **Validate** — Checks the file is a valid video (format, size, ffprobe)

## Sources

Streams are fetched from [Peerflix](https://addon.peerflix.mov) and [Torrentio](https://torrentio.strem.fun) — only torrents already cached in Real-Debrid are used, so downloads are instant.

## Stack

- **Next.js 16** (App Router)
- **SQLite** (better-sqlite3) for download tracking
- **Gemini API** for torrent ranking
- **Real-Debrid** API for torrent processing
- **Tailwind CSS 4** for UI

## Setup

```bash
# Clone and install
npm install

# Configure
cp .env.example .env.local
# Fill in your tokens

# Run
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `TMDB_TOKEN` | TMDB API read access token |
| `RD_TOKEN` | Real-Debrid API token |
| `LLM_API_KEY` | Gemini API key |
| `LLM_MODEL` | Model name (default: `gemini-2.5-flash`) |
| `DOWNLOAD_DIR` | Local path for downloads (default: `~/Movies/StreamDeck`) |

## Requirements

- Node.js 20+
- Real-Debrid account
- TMDB API key
- Gemini API key
- `curl` (for downloads)
- `ffprobe` (optional, for video validation)

## License

MIT
