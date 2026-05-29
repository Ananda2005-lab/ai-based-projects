/**
 * songApi.ts — Real song search via iTunes Search API (free, no auth)
 *
 * Returns millions of real songs with artwork, duration, and 30-second
 * preview clips that actually play audio.
 */

export interface iTunesSong {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string; // "3:42"
  cover: string;    // artwork URL
  genre: string;
  previewUrl: string; // 30-sec iTunes preview (real audio!)
  trackUrl: string;   // iTunes store link
}

const ITUNES_SEARCH = "https://itunes.apple.com/search";

/**
 * Search for songs on iTunes.
 * Returns up to `limit` results with real artwork and 30-sec previews.
 */
export async function searchSongs(
  query: string,
  limit: number = 25
): Promise<iTunesSong[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    term: query,
    media: "music",
    entity: "song",
    limit: String(limit),
  });

  try {
    const res = await fetch(`${ITUNES_SEARCH}?${params}`);
    if (!res.ok) throw new Error(`iTunes API ${res.status}`);
    const data = await res.json();

    return (data.results ?? [])
      .filter((item: any) => item.previewUrl) // only songs with playable previews
      .map((item: any): iTunesSong => ({
        id: String(item.trackId ?? ""),
        title: item.trackName ?? "Unknown",
        artist: item.artistName ?? "Unknown",
        album: item.collectionName ?? "",
        duration: msToMMSS(item.trackTimeMillis ?? 0),
        cover: (item.artworkUrl100 ?? "").replace("100x100", "300x300"), // higher res
        genre: item.primaryGenreName ?? "Music",
        previewUrl: item.previewUrl ?? "",
        trackUrl: item.trackViewUrl ?? "",
      }));
  } catch (err) {
    console.error("Song search failed:", err);
    return [];
  }
}

/**
 * Get trending / popular songs (uses a few popular search terms).
 */
export async function getTrendingSongs(): Promise<iTunesSong[]> {
  const terms = ["popular 2024", "top hits", "chart"];
  const term = terms[Math.floor(Math.random() * terms.length)];
  return searchSongs(term, 20);
}

function msToMMSS(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
