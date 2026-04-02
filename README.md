# StreamDeck

A self-hosted movie download manager powered by Real-Debrid. Browse movies, let AI pick the best torrent, and download automatically.

## How it works

1. **Browse** — Search movies via TMDB or explore trending/now playing
2. **Select** — Click a movie and hit Download
3. **AI Ranking** — Claude Opus ranks available torrents (prefers Spanish audio, good quality, reasonable size)
4. **Real-Debrid** — Adds the torrent to RD, waits for processing
5. **Download** — Downloads the file locally with resume support
6. **Validate** — Checks the file is a valid video (format, size, ffprobe)

## Sources

Streams are fetched from [Peerflix](https://addon.peerflix.mov) and [Torrentio](https://torrentio.strem.fun) — only torrents already cached in Real-Debrid are used, so downloads are instant.

## Stack

- **Next.js 16** (App Router)
- **SQLite** (better-sqlite3) for download tracking
- **Kiro CLI** with Claude Opus 4.6 for torrent ranking
- **Real-Debrid** API for torrent processing
- **Tailwind CSS 4** for UI

## Setup

```bash
# Clone and install
npm install

# Configure
cp .env.example .env.local
# Fill in your TMDB_TOKEN and RD_TOKEN

# Run
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `TMDB_TOKEN` | TMDB API read access token |
| `RD_TOKEN` | Real-Debrid API token |
| `DOWNLOAD_DIR` | Local path for downloads (default: `~/Movies/StreamDeck`) |

## Requirements

- Node.js 20+
- [Kiro CLI](https://github.com/aws/kiro-cli) (for AI torrent ranking)
- Real-Debrid account
- TMDB API key
- `curl` (for downloads)
- `ffprobe` (optional, for video validation)

## License

MIT
