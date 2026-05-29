import re
import difflib
import html

class SearchEngine:
    """
    In-memory and database-backed search engine for cinematic music and video.
    Features:
    - High-quality curated cinematic electronic and orchestral media tracks
    - Typo-tolerance using Levenshtein-like string similarity (difflib)
    - Autocomplete suggestions and search predictions
    - Filtering by type (music, video) or category (Synthwave, Epic, Ambient)
    - Real-time dynamic search of Bollywood & International songs via JioSaavn API
    """
    def __init__(self):
        # A curated high-fidelity library of cinematic audio and video files.
        # Direct links are highly reliable and stream fast, perfect for testing.
        self.media_index = [
            # --- CINEMATIC MUSIC (AUDIO) ---
            {
                "id": "audio_1",
                "title": "Neon Horizon",
                "artist": "Dynatron",
                "duration": "06:12",
                "media_type": "music",
                "category": "Synthwave",
                "thumbnail": "https://images.unsplash.com/photo-1515462277126-270d878326e5?q=80&w=400&auto=format&fit=crop",
                "stream_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                "description": "Epic retro synthwave journey driving into an endless obsidian sunset."
            },
            {
                "id": "audio_2",
                "title": "Solar Wind",
                "artist": "Stellar Dynamics",
                "duration": "07:05",
                "media_type": "music",
                "category": "Ambient",
                "thumbnail": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400&auto=format&fit=crop",
                "stream_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
                "description": "Ethereal acoustic and electronic soundscapes floating through deep orbit."
            },
            {
                "id": "audio_3",
                "title": "Cyberpunk Rebellion",
                "artist": "Tokyo Glitch",
                "duration": "05:02",
                "media_type": "music",
                "category": "Synthwave",
                "thumbnail": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=400&auto=format&fit=crop",
                "stream_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
                "description": "Heavy industrial synths, pulsing basslines, and neon dystopian themes."
            },
            {
                "id": "audio_4",
                "title": "Orchestral Overture",
                "artist": "Hans Zimmer Style Orchestra",
                "duration": "05:38",
                "media_type": "music",
                "category": "Epic Orchestral",
                "thumbnail": "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=400&auto=format&fit=crop",
                "stream_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
                "description": "Stunning acoustic violins, horns, and dramatic cinema trailer percussion."
            },
            {
                "id": "audio_5",
                "title": "Stellar Voyage",
                "artist": "Interstellar Traveler",
                "duration": "08:44",
                "media_type": "music",
                "category": "Ambient Lofi",
                "thumbnail": "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=400&auto=format&fit=crop",
                "stream_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
                "description": "Relaxed lofi drum loops mixed with warm interstellar radio transmissions."
            },
            {
                "id": "audio_6",
                "title": "Midnight Eclipse",
                "artist": "Dark Matter",
                "duration": "06:40",
                "media_type": "music",
                "category": "Epic Orchestral",
                "thumbnail": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=400&auto=format&fit=crop",
                "stream_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
                "description": "Dark operatic choir backing massive brass chords for a dramatic movie reveal."
            },
            
            # --- CINEMATIC VIDEOS (VIDEO) ---
            {
                "id": "video_1",
                "title": "Cosmic Orbit",
                "artist": "Galaxy Studios",
                "duration": "00:15",
                "media_type": "video",
                "category": "Space Cinematic",
                "thumbnail": "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=400&auto=format&fit=crop",
                "stream_url": "https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1611-large.mp4",
                "description": "Ultra high-quality cinematic slow-motion journey through a pulsing nebular starfield."
            },
            {
                "id": "video_2",
                "title": "Neon Grid Tunnel",
                "artist": "Vaporwave Art",
                "duration": "00:10",
                "media_type": "video",
                "category": "Cyberpunk Visuals",
                "thumbnail": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=400&auto=format&fit=crop",
                "stream_url": "https://assets.mixkit.co/videos/preview/mixkit-tunnel-of-futuristic-blue-neon-lights-42289-large.mp4",
                "description": "Immersive visual loop rushing through neon blue laser grids and holographic rings."
            },
            {
                "id": "video_3",
                "title": "Mountain Majesty Drone",
                "artist": "Apex Flight",
                "duration": "00:08",
                "media_type": "video",
                "category": "Nature Cinematic",
                "thumbnail": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=400&auto=format&fit=crop",
                "stream_url": "https://assets.mixkit.co/videos/preview/mixkit-dramatic-drone-shot-of-a-mountain-valley-4809-large.mp4",
                "description": "Sweeping cinematic drone reveal shot flying over towering snowcapped peak canyons."
            },
            {
                "id": "video_4",
                "title": "Deep Sea Glares",
                "artist": "Abyssal Tech",
                "duration": "00:12",
                "media_type": "video",
                "category": "Ambient Visuals",
                "thumbnail": "https://images.unsplash.com/photo-1544924222-35298d69037e?q=80&w=400&auto=format&fit=crop",
                "stream_url": "https://assets.mixkit.co/videos/preview/mixkit-underwater-light-glares-and-bubbles-4384-large.mp4",
                "description": "Slow bubbles rising with cinematic lighting beams filtering through deep ocean obsidian waters."
            }
        ]

    def _search_jiosaavn(self, query):
        """Fetches dynamic real-world search results from JioSaavn API."""
        import urllib.request
        import json
        import urllib.parse
        
        try:
            quoted_query = urllib.parse.quote(query)
            url = f"https://saavn.vercel.app/api/search/songs?query={quoted_query}"
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=6) as response:
                data = json.loads(response.read().decode())
                results = data.get("data", {}).get("results", [])
                
                if not results and isinstance(data, list):
                    results = data
                elif not results and isinstance(data, dict) and "results" in data:
                    results = data["results"]
                elif not results and isinstance(data, dict) and "data" in data and isinstance(data["data"], list):
                    results = data["data"]
                
                mapped_results = []
                for song in results:
                    artists_list = song.get("artists", {}).get("primary", [])
                    if isinstance(artists_list, list) and artists_list:
                        artists = ", ".join([a.get("name", "") for a in artists_list if a.get("name")])
                    elif isinstance(artists_list, str):
                        artists = artists_list
                    else:
                        artists = "Unknown Artist"
                        
                    if not artists:
                        artists = "Unknown Artist"
                        
                    duration_sec = song.get("duration", 210)
                    try:
                        total_seconds = int(duration_sec)
                        m = total_seconds // 60
                        s = total_seconds % 60
                        duration = f"{m:02d}:{s:02d}"
                    except:
                        duration = "03:30"
                        
                    images = song.get("image", [])
                    thumbnail = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=200&auto=format&fit=crop"
                    if isinstance(images, list) and images:
                        thumbnail = images[-1].get("url")
                    elif isinstance(images, str):
                        thumbnail = images
                        
                    downloads = song.get("downloadUrl", [])
                    stream_url = ""
                    if isinstance(downloads, list) and downloads:
                        stream_url = downloads[-1].get("url") # High-quality 320kbps URL
                    elif isinstance(downloads, str):
                        stream_url = downloads
                        
                    if not stream_url:
                        continue
                        
                    mapped_results.append({
                        "id": f"saavn_{song.get('id', '')}",
                        "title": html.unescape(song.get("name", "Unknown Track")),
                        "artist": html.unescape(artists),
                        "duration": duration,
                        "media_type": "music",
                        "category": html.unescape(song.get("album", {}).get("name", "Single")) if isinstance(song.get("album"), dict) else "Single",
                        "thumbnail": thumbnail,
                        "stream_url": stream_url,
                        "description": f"Released in {song.get('year', '')}. Album: {song.get('album', {}).get('name', 'Single') if isinstance(song.get('album'), dict) else 'Single'}."
                    })
                return mapped_results
        except Exception as e:
            print(f"[Search Engine] JioSaavn API query failed: {e}")
            return []

    def search(self, query, media_type=None, category=None):
        """
        Performs a full typo-tolerant search across titles, artists, and descriptions.
        """
        local_results = []
        if not query or not query.strip():
            local_results = self.media_index
        else:
            query_clean = query.strip().lower()
            scored_results = []
            
            for item in self.media_index:
                title = item["title"].lower()
                artist = item["artist"].lower()
                category_str = item["category"].lower()
                desc = item["description"].lower()
                
                score = 0
                if query_clean in title:
                    score += 100
                if query_clean in artist:
                    score += 80
                if query_clean in category_str:
                    score += 60
                if query_clean in desc:
                    score += 30
                
                title_ratio = difflib.SequenceMatcher(None, query_clean, title).ratio()
                artist_ratio = difflib.SequenceMatcher(None, query_clean, artist).ratio()
                
                if title_ratio > 0.4:
                    score += int(title_ratio * 50)
                if artist_ratio > 0.4:
                    score += int(artist_ratio * 40)
                    
                if score > 15:
                    scored_results.append((item, score))
            
            scored_results.sort(key=lambda x: x[1], reverse=True)
            local_results = [item for item, score in scored_results]

        # Combine with live dynamic results if query exists and is music-compatible
        if query and query.strip() and (media_type == "music" or media_type == "all" or media_type is None):
            saavn_results = self._search_jiosaavn(query)
            results = saavn_results + local_results
        else:
            results = local_results

        # Apply secondary filters
        if media_type and media_type != "all":
            results = [item for item in results if item["media_type"] == media_type]
        if category and category != "all":
            results = [item for item in results if item["category"].lower() == category.lower()]
            
        return results

    def get_suggestions(self, partial_query):
        """
        Generates predictive suggestions.
        Example: 'ne' -> ['Neon Horizon', 'Neon Grid Tunnel', 'Neon Horizon Remix']
        """
        if not partial_query or not partial_query.strip():
            return []
            
        partial_query = partial_query.strip().lower()
        suggestions = []
        
        # Populate with matched titles, artists, and categories
        for item in self.media_index:
            title = item["title"]
            artist = item["artist"]
            category = item["category"]
            
            # Autocomplete matches
            if title.lower().startswith(partial_query):
                suggestions.append(title)
            elif artist.lower().startswith(partial_query):
                suggestions.append(artist)
                
            # Containment matches (limit length)
            elif partial_query in title.lower() and len(suggestions) < 5:
                suggestions.append(title)
            elif partial_query in artist.lower() and len(suggestions) < 5:
                suggestions.append(f"{artist} tracks")
                
        # Append beautiful cinematic search expansions (predictive mock searches)
        # E.g. user types 'bel', show 'believer remix', 'believer 320kbps'
        for term in suggestions[:]:
            if len(suggestions) >= 7:
                break
            suggestions.append(f"{term} Official Trailer")
            suggestions.append(f"{term} Ambient Cover")
            suggestions.append(f"{term} Ultra HD 4K")

        # De-duplicate suggestions
        unique_suggestions = []
        for s in suggestions:
            if s not in unique_suggestions:
                unique_suggestions.append(s)
                
        return unique_suggestions[:6]

# Quick testing block
if __name__ == "__main__":
    engine = SearchEngine()
    print("Search 'neon':")
    for r in engine.search("neon"):
        print(f" - {r['title']} by {r['artist']} ({r['media_type']})")
    
    print("\nSuggestions for 'cos':")
    print(engine.get_suggestions("cos"))
