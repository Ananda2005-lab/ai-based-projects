import sqlite3
import os
import time

class DatabaseManager:
    """
    Manages SQLite database creation, migrations, and operations for tracking
    history, favorites, downloads, search history, and settings.
    """
    def __init__(self, db_path=None):
        if db_path is None:
            # Place database in the same python folder
            python_dir = os.path.dirname(os.path.abspath(__file__))
            db_path = os.path.join(python_dir, "database.db")
            
        self.db_path = db_path
        self.setup_tables()

    def get_connection(self):
        """Returns a standard connection to the SQLite database with row factory."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def setup_tables(self):
        """Initializes database tables if they do not exist."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # 1. Favorites Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS favorites (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    artist TEXT,
                    duration TEXT,
                    media_type TEXT,
                    thumbnail TEXT,
                    stream_url TEXT,
                    added_at REAL NOT NULL
                )
            """)
            
            # 2. History Table (Listening/Playback History)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    track_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    artist TEXT,
                    duration TEXT,
                    media_type TEXT,
                    thumbnail TEXT,
                    played_at REAL NOT NULL
                )
            """)
            
            # 3. Downloads Table (Track download queue and file locations)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS downloads (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    artist TEXT,
                    file_path TEXT,
                    status TEXT NOT NULL, -- 'pending', 'downloading', 'completed', 'failed', 'paused'
                    progress REAL DEFAULT 0.0,
                    total_size INTEGER DEFAULT 0,
                    file_type TEXT NOT NULL, -- 'music' or 'video'
                    url TEXT,
                    error_message TEXT,
                    created_at REAL NOT NULL
                )
            """)
            
            # 4. Search History Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS search_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    query TEXT UNIQUE NOT NULL,
                    searched_at REAL NOT NULL,
                    search_count INTEGER DEFAULT 1
                )
            """)
            
            # 5. Settings Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                )
            """)
            
            conn.commit()
            print(f"[Database] SQLite DB initialized at: {self.db_path}")

    # --- FAVORITES METHODS ---
    def add_favorite(self, track_id, title, artist, duration, media_type, thumbnail, stream_url):
        try:
            with self.get_connection() as conn:
                conn.execute("""
                    INSERT OR REPLACE INTO favorites (id, title, artist, duration, media_type, thumbnail, stream_url, added_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (track_id, title, artist, duration, media_type, thumbnail, stream_url, time.time()))
                conn.commit()
                return True
        except Exception as e:
            print(f"[Database] Error adding favorite: {e}")
            return False

    def remove_favorite(self, track_id):
        try:
            with self.get_connection() as conn:
                conn.execute("DELETE FROM favorites WHERE id = ?", (track_id,))
                conn.commit()
                return True
        except Exception as e:
            print(f"[Database] Error removing favorite: {e}")
            return False

    def is_favorite(self, track_id):
        with self.get_connection() as conn:
            row = conn.execute("SELECT 1 FROM favorites WHERE id = ?", (track_id,)).fetchone()
            return row is not None

    def get_favorites(self):
        with self.get_connection() as conn:
            rows = conn.execute("SELECT * FROM favorites ORDER BY added_at DESC").fetchall()
            return [dict(row) for row in rows]

    # --- HISTORY METHODS ---
    def add_history(self, track_id, title, artist, duration, media_type, thumbnail):
        try:
            with self.get_connection() as conn:
                # Keep history clean by removing old items if count exceeds 100
                conn.execute("""
                    INSERT INTO history (track_id, title, artist, duration, media_type, thumbnail, played_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (track_id, title, artist, duration, media_type, thumbnail, time.time()))
                
                # Delete items beyond top 100
                conn.execute("""
                    DELETE FROM history WHERE id NOT IN (
                        SELECT id FROM history ORDER BY played_at DESC LIMIT 100
                    )
                """)
                conn.commit()
                return True
        except Exception as e:
            print(f"[Database] Error adding history: {e}")
            return False

    def get_history(self):
        with self.get_connection() as conn:
            rows = conn.execute("SELECT * FROM history ORDER BY played_at DESC").fetchall()
            return [dict(row) for row in rows]

    def clear_history(self):
        try:
            with self.get_connection() as conn:
                conn.execute("DELETE FROM history")
                conn.commit()
                return True
        except Exception as e:
            print(f"[Database] Error clearing history: {e}")
            return False

    # --- DOWNLOADS METHODS ---
    def add_or_update_download(self, download_id, title, artist, file_path, status, progress, total_size, file_type, url, error_message=None):
        try:
            with self.get_connection() as conn:
                conn.execute("""
                    INSERT INTO downloads (id, title, artist, file_path, status, progress, total_size, file_type, url, error_message, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        status=excluded.status,
                        progress=excluded.progress,
                        total_size=excluded.total_size,
                        file_path=coalesce(excluded.file_path, downloads.file_path),
                        error_message=excluded.error_message
                """, (download_id, title, artist, file_path, status, progress, total_size, file_type, url, error_message, time.time()))
                conn.commit()
                return True
        except Exception as e:
            print(f"[Database] Error adding/updating download: {e}")
            return False

    def get_downloads(self):
        with self.get_connection() as conn:
            rows = conn.execute("SELECT * FROM downloads ORDER BY created_at DESC").fetchall()
            return [dict(row) for row in rows]

    def get_download(self, download_id):
        with self.get_connection() as conn:
            row = conn.execute("SELECT * FROM downloads WHERE id = ?", (download_id,)).fetchone()
            return dict(row) if row else None

    # --- SEARCH HISTORY METHODS ---
    def add_search_query(self, query):
        if not query or not query.strip():
            return
        query = query.strip()
        try:
            with self.get_connection() as conn:
                conn.execute("""
                    INSERT INTO search_history (query, searched_at, search_count)
                    VALUES (?, ?, 1)
                    ON CONFLICT(query) DO UPDATE SET
                        searched_at=excluded.searched_at,
                        search_count=search_history.search_count + 1
                """, (query, time.time()))
                conn.commit()
        except Exception as e:
            print(f"[Database] Error saving search: {e}")

    def get_recent_searches(self, limit=10):
        with self.get_connection() as conn:
            rows = conn.execute("SELECT query, searched_at, search_count FROM search_history ORDER BY searched_at DESC LIMIT ?", (limit,)).fetchall()
            return [dict(row) for row in rows]

    def clear_search_history(self):
        try:
            with self.get_connection() as conn:
                conn.execute("DELETE FROM search_history")
                conn.commit()
                return True
        except Exception as e:
            print(f"[Database] Error clearing search history: {e}")
            return False

    # --- SETTINGS METHODS ---
    def save_setting(self, key, value):
        try:
            with self.get_connection() as conn:
                conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (key, str(value)))
                conn.commit()
                return True
        except Exception as e:
            print(f"[Database] Error saving setting: {e}")
            return False

    def get_setting(self, key, default=None):
        with self.get_connection() as conn:
            row = conn.execute("SELECT value FROM settings WHERE key = ?", (key,)).fetchone()
            return row[0] if row else default

    def get_all_settings(self):
        with self.get_connection() as conn:
            rows = conn.execute("SELECT * FROM settings").fetchall()
            return {row['key']: row['value'] for row in rows}

# Quick testing block
if __name__ == "__main__":
    db = DatabaseManager()
    db.add_search_query("synthwave music")
    db.add_search_query("cinematic orchestral")
    db.add_search_query("synthwave music") # test duplicate/upsert
    print("Recent searches:", db.get_recent_searches())
