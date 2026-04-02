// Shared types

export interface Movie {
  id: number;
  imdbType: string;
  title: string;
  year: string;
  poster: string | null;
  overview: string;
  rating: string;
}

export interface MovieDetail extends Movie {
  backdrop: string | null;
  runtime: number;
  genres: string[];
  imdbId?: string;
}

export interface Torrent {
  name: string;
  hash: string;
  sizeGB: string;
  tags: string[];
  idx: number;
}

export interface DownloadStatus {
  id?: number;
  status: "none" | "queued" | "searching" | "ranking" | "adding" | "downloading" | "refreshing" | "done" | "failed";
  step?: string;
  torrent?: string;
  sizeGB?: number;
  rank?: number;
}

export interface DownloadRow {
  id: number;
  imdb_id: string;
  tmdb_id: number;
  movie_title: string;
  status: string;
  step: string;
  hash: string;
  torrent_name: string;
  size_gb: number;
  rank: number;
  rd_id: string;
  user_report: string;
  created_at: string;
  updated_at: string;
}
