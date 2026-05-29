import http.server
import socketserver
import os
import json
import urllib.parse
import sys

# Append parent directory to path so python directory imports work
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from python.storage import StorageManager
from python.database import DatabaseManager
from python.search_engine import SearchEngine
from python.download_engine import DownloadEngine

class CinematicHTTPHandler(http.server.BaseHTTPRequestHandler):
    """
    Custom HTTP Request Handler serving static frontend assets (HTML, CSS, JS, manifest, media)
    and exposing clean JSON REST API endpoints.
    """
    # Shared instances initialized in the main loop
    db = None
    storage = None
    search_engine = None
    download_engine = None

    def log_message(self, format, *args):
        # Silence normal server console logs to prevent clogging the user's shell
        pass

    def send_json_response(self, data, status=200):
        """Sends a robust JSON response with appropriate headers."""
        try:
            response_bytes = json.dumps(data).encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.send_header('Content-Length', str(len(response_bytes)))
            self.end_headers()
            self.wfile.write(response_bytes)
        except Exception as e:
            print(f"[Server] Error sending JSON: {e}")

    def do_OPTIONS(self):
        """Supports CORS pre-flight requests."""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        """Handles static file routing and API GET requests."""
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        query_params = urllib.parse.parse_qs(parsed_url.query)

        # --- API GET ENDPOINTS ---
        
        # 1. Media Search
        if path == "/api/search":
            query = query_params.get("q", [""])[0]
            media_type = query_params.get("type", ["all"])[0]
            category = query_params.get("category", ["all"])[0]
            
            # Log query to search history in database
            if query:
                self.db.add_search_query(query)
                
            results = self.search_engine.search(query, media_type, category)
            return self.send_json_response(results)

        # 2. Live Smart Suggestions
        elif path == "/api/suggestions":
            query = query_params.get("q", [""])[0]
            suggestions = self.search_engine.get_suggestions(query)
            return self.send_json_response(suggestions)

        # 3. Playback History
        elif path == "/api/history":
            history = self.db.get_history()
            return self.send_json_response(history)

        # 4. Favorites Collection
        elif path == "/api/favorites":
            favorites = self.db.get_favorites()
            return self.send_json_response(favorites)

        # 5. Download Queue Status
        elif path == "/api/downloads":
            statuses = self.download_engine.get_all_statuses()
            return self.send_json_response(statuses)

        # 6. User Settings
        elif path == "/api/settings":
            settings = self.db.get_all_settings()
            return self.send_json_response(settings)

        # 7. Recent Search Queries
        elif path == "/api/recent-searches":
            searches = self.db.get_recent_searches()
            return self.send_json_response(searches)

        # 8. CORS-bypassing Media Streaming Proxy
        elif path == "/api/proxy":
            url_to_proxy = query_params.get("url", [""])[0]
            if not url_to_proxy:
                self.send_response(400)
                self.end_headers()
                return
            self.proxy_media_stream(url_to_proxy)

        # --- STATIC FILE ROUTING ---
        else:
            self.serve_static_file(path)

    def do_POST(self):
        """Handles state-changing REST API POST requests."""
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        # Parse request body size
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = {}
        if content_length > 0:
            try:
                post_data = json.loads(self.rfile.read(content_length).decode('utf-8'))
            except Exception as e:
                print(f"[Server] Error parsing JSON post data: {e}")
                return self.send_json_response({"error": "Invalid JSON payload"}, 400)

        # --- API POST ENDPOINTS ---

        # 1. Add to History
        if path == "/api/history":
            track_id = post_data.get("track_id")
            title = post_data.get("title")
            artist = post_data.get("artist")
            duration = post_data.get("duration")
            media_type = post_data.get("media_type")
            thumbnail = post_data.get("thumbnail")
            
            if not track_id or not title:
                return self.send_json_response({"error": "Missing track ID or title"}, 400)
                
            success = self.db.add_history(track_id, title, artist, duration, media_type, thumbnail)
            return self.send_json_response({"success": success})

        # 2. Clear History
        elif path == "/api/history/clear":
            success = self.db.clear_history()
            return self.send_json_response({"success": success})

        # 3. Add/Remove Favorites
        elif path == "/api/favorites":
            action = post_data.get("action") # 'add' or 'remove'
            track_id = post_data.get("track_id")
            
            if not track_id:
                return self.send_json_response({"error": "Missing track ID"}, 400)

            if action == "add":
                success = self.db.add_favorite(
                    track_id, 
                    post_data.get("title"),
                    post_data.get("artist"),
                    post_data.get("duration"),
                    post_data.get("media_type"),
                    post_data.get("thumbnail"),
                    post_data.get("stream_url")
                )
            else:
                success = self.db.remove_favorite(track_id)
                
            return self.send_json_response({"success": success})

        # 4. Clear Search History
        elif path == "/api/recent-searches/clear":
            success = self.db.clear_search_history()
            return self.send_json_response({"success": success})

        # 5. Initiate a New Bulk Download
        elif path == "/api/downloads":
            media_id = post_data.get("media_id")
            title = post_data.get("title")
            artist = post_data.get("artist")
            url = post_data.get("url")
            file_type = post_data.get("file_type") # 'music' or 'video'
            
            if not all([media_id, title, url, file_type]):
                return self.send_json_response({"error": "Missing required download parameters"}, 400)
                
            download_id = self.download_engine.start_download(media_id, title, artist, url, file_type)
            return self.send_json_response({"success": True, "download_id": download_id})

        # 6. Control Download Status (Pause, Resume, Cancel)
        elif path == "/api/downloads/action":
            action = post_data.get("action") # 'pause', 'resume', 'cancel'
            download_id = post_data.get("download_id")
            
            if not action or not download_id:
                return self.send_json_response({"error": "Missing action or download ID"}, 400)

            success = False
            if action == "pause":
                success = self.download_engine.pause_download(download_id)
            elif action == "resume":
                success = self.download_engine.resume_download(download_id)
            elif action == "cancel":
                success = self.download_engine.cancel_download(download_id)
                
            return self.send_json_response({"success": success})

        # 7. Update User Settings
        elif path == "/api/settings":
            success = True
            for k, v in post_data.items():
                if not self.db.save_setting(k, v):
                    success = False
            return self.send_json_response({"success": success})

        else:
            self.send_response(404)
            self.end_headers()

    def serve_static_file(self, path):
        """
        Maps URLs to local static files in the project workspace,
        attaching proper MIME types and streaming media segments correctly.
        """
        # Resolve static folders
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        # Clean paths (prevent directory traversal vulnerability)
        clean_path = path.lstrip('/')
        if not clean_path or clean_path == "":
            clean_path = "index.html"
            
        # Support running the client shell by mapping screen requests
        # E.g. `/search.html` will load `index.html` to support SPA refreshing
        # We can serve sub-screens if requested by Fetch/XHR, but if it is a main document navigation,
        # redirect to index.html to maintain Shell player state!
        sub_screens = ["home.html", "search.html", "player.html", "queue.html", "library.html", "settings.html"]
        if clean_path in sub_screens and "Sec-Fetch-Mode" in self.headers and self.headers["Sec-Fetch-Mode"] == "navigate":
            clean_path = "index.html"

        # Special routing for downloaded local media streaming
        # Route: `/media/{music|videos}/{filename}`
        if clean_path.startswith("media/"):
            parts = clean_path.split("/")
            if len(parts) >= 3:
                category = parts[1]
                filename = parts[2]
                category_dir = self.storage.get_path(category)
                local_file = os.path.join(category_dir, urllib.parse.unquote(filename))
            else:
                local_file = ""
        else:
            local_file = os.path.join(base_dir, clean_path)

        # Standard file checking and serving
        if os.path.exists(local_file) and os.path.isfile(local_file):
            # Map extensions to proper MIME Content-Types
            ext = os.path.splitext(local_file)[1].lower()
            mime_types = {
                '.html': 'text/html; charset=utf-8',
                '.css': 'text/css; charset=utf-8',
                '.js': 'application/javascript; charset=utf-8',
                '.json': 'application/json; charset=utf-8',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.svg': 'image/svg+xml',
                '.ico': 'image/x-icon',
                '.mp3': 'audio/mpeg',
                '.mp4': 'video/mp4',
                '.webmanifest': 'application/manifest+json'
            }
            content_type = mime_types.get(ext, 'application/octet-stream')

            # Streaming support (HTTP range requests) for media elements
            file_size = os.path.getsize(local_file)
            
            if 'Range' in self.headers and (ext == '.mp3' or ext == '.mp4'):
                self.serve_media_range(local_file, content_type, file_size)
            else:
                # Ordinary file serving
                try:
                    with open(local_file, 'rb') as f:
                        content = f.read()
                    self.send_response(200)
                    self.send_header('Content-Type', content_type)
                    self.send_header('Content-Length', str(len(content)))
                    # Cache control for static assets (PWA performance boost)
                    if ext in ['.png', '.jpg', '.svg', '.js', '.css']:
                        self.send_header('Cache-Control', 'public, max-age=86400')
                    self.end_headers()
                    self.wfile.write(content)
                except Exception as e:
                    print(f"[Server] Error reading file: {e}")
                    self.send_response(500)
                    self.end_headers()
        else:
            # Fallback to index.html for virtual routes if file doesn't exist
            # Allows refresh on custom client routers
            index_path = os.path.join(base_dir, "index.html")
            if os.path.exists(index_path) and not clean_path.startswith("api/") and not clean_path.startswith("media/"):
                try:
                    with open(index_path, 'rb') as f:
                        content = f.read()
                    self.send_response(200)
                    self.send_header('Content-Type', 'text/html; charset=utf-8')
                    self.send_header('Content-Length', str(len(content)))
                    self.end_headers()
                    self.wfile.write(content)
                except Exception as e:
                    print(f"[Server] Error reading index fallback: {e}")
                    self.send_response(500)
                    self.end_headers()
            else:
                self.send_response(404)
                self.end_headers()

    def serve_media_range(self, local_file, content_type, file_size):
        """Processes partial content chunk delivery to allow scrubbing and streaming."""
        range_header = self.headers.get('Range')
        
        # Parse range: e.g. "bytes=12345-" or "bytes=12345-67890"
        try:
            range_bytes = range_header.split('=')[1]
            parts = range_bytes.split('-')
            start = int(parts[0])
            end = int(parts[1]) if parts[1] else file_size - 1
        except:
            self.send_response(400)
            self.end_headers()
            return

        # Constrain range limits
        if start >= file_size:
            self.send_response(416)
            self.send_header('Content-Range', f'bytes */{file_size}')
            self.end_headers()
            return
            
        if end >= file_size:
            end = file_size - 1

        length = end - start + 1
        
        try:
            self.send_response(206) # Partial Content
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Range', f'bytes {start}-{end}/{file_size}')
            self.send_header('Content-Length', str(length))
            self.send_header('Accept-Ranges', 'bytes')
            self.end_headers()

            with open(local_file, 'rb') as f:
                f.seek(start)
                buffer_size = 1024 * 64
                remaining = length
                
                while remaining > 0:
                    read_size = min(buffer_size, remaining)
                    data = f.read(read_size)
                    if not data:
                        break
                    self.wfile.write(data)
                    remaining -= len(data)
        except Exception as e:
            # Connection reset by peer usually happens when user scrubs quickly
            pass

def run_server(port=8000):
    """Initializes and runs the custom HTTP API Server."""
    # Ensure all backend sub-managers are instantiated
    db = DatabaseManager()
    storage = StorageManager()
    search = SearchEngine()
    downloader = DownloadEngine(db, storage)
    
    # Inject static sub-managers into Handler context
    CinematicHTTPHandler.db = db
    CinematicHTTPHandler.storage = storage
    CinematicHTTPHandler.search_engine = search
    CinematicHTTPHandler.download_engine = downloader

    server_address = ('', port)
    
    # Enable socket re-use to prevent "Address already in use" errors during quick server restarts
    class ReusableTCPServer(socketserver.TCPServer):
        allow_reuse_address = True

    try:
        with ReusableTCPServer(server_address, CinematicHTTPHandler) as httpd:
            print(f"\n=======================================================")
            print(f"  CINEMATIC LUXURY MUSIC SERVER RUNNING!")
            print(f"  Url: http://localhost:{port}")
            print(f"=======================================================\n")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[Server] Shutdown signal received. Closing server...")
    except Exception as e:
        print(f"[Server] Crash starting server: {e}")

if __name__ == "__main__":
    run_server()
