import os
import time
import threading
import urllib.request
from python.storage import StorageManager
from python.database import DatabaseManager

class DownloadTask:
    """Represents a single active download thread task."""
    def __init__(self, download_id, title, artist, url, file_type, db_manager, storage_manager):
        self.download_id = download_id
        self.title = title
        self.artist = artist
        self.url = url
        self.file_type = file_type
        self.db = db_manager
        self.storage = storage_manager
        
        self.status = "pending"
        self.progress = 0.0
        self.downloaded_bytes = 0
        self.total_size = 0
        self.speed = 0.0 # Bytes/sec
        
        self.cancel_event = threading.Event()
        self.pause_event = threading.Event()
        self.file_path = None
        self.thread = None

    def start(self):
        """Spawns the download worker thread."""
        self.status = "downloading"
        self.thread = threading.Thread(target=self._download_worker, daemon=True)
        self.thread.start()

    def pause(self):
        """Signals the thread to pause."""
        self.pause_event.set()
        self.status = "paused"
        self.db.add_or_update_download(
            self.download_id, self.title, self.artist, self.file_path, 
            "paused", self.progress, self.total_size, self.file_type, self.url
        )

    def resume(self):
        """Signals the thread to resume playback and restarts the thread."""
        self.pause_event.clear()
        self.status = "downloading"
        self.thread = threading.Thread(target=self._download_worker, daemon=True)
        self.thread.start()

    def cancel(self):
        """Signals the thread to cancel, deletes temporary files."""
        self.cancel_event.set()
        self.status = "cancelled"
        self.db.add_or_update_download(
            self.download_id, self.title, self.artist, self.file_path, 
            "cancelled", self.progress, self.total_size, self.file_type, self.url
        )

    def _download_worker(self):
        """Background thread worker that streams the file in chunks."""
        # Determine unique download path
        category = "music" if self.file_type == "music" else "videos"
        if not self.file_path:
            ext = ".mp3" if self.file_type == "music" else ".mp4"
            self.file_path = self.storage.get_unique_filepath(category, f"{self.title}{ext}")

        temp_path = self.file_path + ".tmp"
        
        # Determine range for resuming
        mode = "wb"
        if os.path.exists(temp_path):
            self.downloaded_bytes = os.path.getsize(temp_path)
            mode = "ab" # Append mode
        else:
            self.downloaded_bytes = 0

        # Build network request
        req = urllib.request.Request(self.url)
        if self.downloaded_bytes > 0:
            req.add_header('Range', f'bytes={self.downloaded_bytes}-')

        try:
            print(f"[Downloader] Opening URL: {self.url} (Resume point: {self.downloaded_bytes} bytes)")
            with urllib.request.urlopen(req, timeout=10) as response:
                # Retrieve content length
                headers = response.info()
                content_length = headers.get('Content-Length')
                
                if content_length:
                    self.total_size = int(content_length) + self.downloaded_bytes
                else:
                    self.total_size = self.downloaded_bytes or 50 * 1024 * 1024 # Fallback estimation
                
                # Check for range response
                is_partial = response.status == 206
                if not is_partial and mode == "ab":
                    # Server doesn't support resuming, reset
                    self.downloaded_bytes = 0
                    mode = "wb"

                self.db.add_or_update_download(
                    self.download_id, self.title, self.artist, self.file_path, 
                    "downloading", self.progress, self.total_size, self.file_type, self.url
                )

                # Open local temporary file for writing
                with open(temp_path, mode) as f:
                    chunk_size = 1024 * 64 # 64KB chunks
                    last_time = time.time()
                    bytes_since_last = 0
                    
                    while not self.cancel_event.is_set() and not self.pause_event.is_set():
                        chunk = response.read(chunk_size)
                        if not chunk:
                            break
                        
                        f.write(chunk)
                        self.downloaded_bytes += len(chunk)
                        bytes_since_last += len(chunk)
                        
                        # Speed and progress calculations
                        current_time = time.time()
                        elapsed = current_time - last_time
                        if elapsed >= 0.5: # Update speed metrics every half-second
                            self.speed = bytes_since_last / elapsed
                            bytes_since_last = 0
                            last_time = current_time
                            
                            if self.total_size > 0:
                                self.progress = (self.downloaded_bytes / self.total_size) * 100.0
                            
                            # Sync progress to database
                            self.db.add_or_update_download(
                                self.download_id, self.title, self.artist, self.file_path, 
                                "downloading", round(self.progress, 1), self.total_size, self.file_type, self.url
                            )
            
            # Post-download handlers
            if self.cancel_event.is_set():
                print(f"[Downloader] Cancelled {self.title}")
                if os.path.exists(temp_path):
                    os.remove(temp_path)
            elif self.pause_event.is_set():
                print(f"[Downloader] Paused {self.title} at {self.downloaded_bytes} bytes")
            else:
                # Finished successfully! Rename temp file to final file
                if os.path.exists(self.file_path):
                    os.remove(self.file_path)
                os.rename(temp_path, self.file_path)
                
                self.progress = 100.0
                self.status = "completed"
                self.speed = 0.0
                print(f"[Downloader] Completed download: {self.file_path}")
                
                self.db.add_or_update_download(
                    self.download_id, self.title, self.artist, self.file_path, 
                    "completed", 100.0, self.total_size, self.file_type, self.url
                )
                
        except Exception as e:
            print(f"[Downloader] Error in worker thread: {e}")
            self.status = "failed"
            self.db.add_or_update_download(
                self.download_id, self.title, self.artist, self.file_path, 
                "failed", self.progress, self.total_size, self.file_type, self.url,
                error_message=str(e)
            )
            # Cleanup temp file on failure
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except:
                    pass

class DownloadEngine:
    """
    Core download engine coordinating multiple parallel DownloadTask items,
    updating states, and keeping disk directories clean.
    """
    def __init__(self, db_manager=None, storage_manager=None):
        self.db = db_manager or DatabaseManager()
        self.storage = storage_manager or StorageManager()
        
        self.tasks = {} # download_id -> DownloadTask
        self.max_parallel = 3
        
        # Automatically restore interrupted downloads from database
        self._recover_interrupted_downloads()

    def _recover_interrupted_downloads(self):
        """Sets any hanging 'downloading' downloads to 'paused' on engine startup."""
        for dl in self.db.get_downloads():
            if dl["status"] in ["downloading", "pending"]:
                self.db.add_or_update_download(
                    dl["id"], dl["title"], dl["artist"], dl["file_path"],
                    "paused", dl["progress"], dl["total_size"], dl["file_type"], dl["url"]
                )

    def start_download(self, media_id, title, artist, url, file_type):
        """Creates and schedules a new download task."""
        download_id = f"dl_{media_id}_{int(time.time())}"
        
        # Check if already downloading this exact item
        for existing_id, task in self.tasks.items():
            if task.url == url and task.status in ["downloading", "pending"]:
                return existing_id

        # Register in database
        self.db.add_or_update_download(
            download_id, title, artist, None, "pending", 0.0, 0, file_type, url
        )

        task = DownloadTask(
            download_id, title, artist, url, file_type, 
            self.db, self.storage
        )
        self.tasks[download_id] = task
        
        # Manage parallel thread pool limits
        active_count = sum(1 for t in self.tasks.values() if t.status == "downloading")
        if active_count < self.max_parallel:
            task.start()
        else:
            task.status = "pending"
            
        return download_id

    def pause_download(self, download_id):
        """Pauses a running task."""
        if download_id in self.tasks:
            self.tasks[download_id].pause()
            self._process_queue()
            return True
        return False

    def resume_download(self, download_id):
        """Resumes a paused task."""
        if download_id in self.tasks:
            task = self.tasks[download_id]
            if task.status == "paused":
                task.resume()
                return True
        else:
            # Recreate task from database info
            info = self.db.get_download(download_id)
            if info:
                task = DownloadTask(
                    download_id, info["title"], info["artist"], info["url"], info["file_type"],
                    self.db, self.storage
                )
                task.file_path = info["file_path"]
                self.tasks[download_id] = task
                task.resume()
                return True
        return False

    def cancel_download(self, download_id):
        """Cancels a task and clears database state."""
        if download_id in self.tasks:
            self.tasks[download_id].cancel()
            self._process_queue()
            return True
        return False

    def _process_queue(self):
        """Schedules pending tasks based on maximum concurrency levels."""
        active_count = sum(1 for t in self.tasks.values() if t.status == "downloading")
        if active_count >= self.max_parallel:
            return
            
        for task in self.tasks.values():
            if task.status == "pending":
                task.start()
                active_count += 1
                if active_count >= self.max_parallel:
                    break

    def get_all_statuses(self):
        """
        Gathers real-time statuses from memory, syncing from database
        for historical or offline records.
        """
        db_downloads = self.db.get_downloads()
        status_list = []
        
        for dl in db_downloads:
            dl_id = dl["id"]
            if dl_id in self.tasks:
                task = self.tasks[dl_id]
                status_list.append({
                    "id": dl_id,
                    "title": task.title,
                    "artist": task.artist,
                    "status": task.status,
                    "progress": round(task.progress, 1),
                    "total_size": task.total_size,
                    "downloaded_bytes": task.downloaded_bytes,
                    "speed_formatted": StorageManager.format_size(task.speed) + "/s" if task.speed > 0 else "0 B/s",
                    "file_type": task.file_type,
                    "file_path": task.file_path
                })
            else:
                # Offline historical record
                status_list.append({
                    "id": dl_id,
                    "title": dl["title"],
                    "artist": dl["artist"],
                    "status": dl["status"],
                    "progress": dl["progress"],
                    "total_size": dl["total_size"],
                    "downloaded_bytes": int(dl["total_size"] * (dl["progress"] / 100.0)),
                    "speed_formatted": "0 B/s",
                    "file_type": dl["file_type"],
                    "file_path": dl["file_path"]
                })
                
        return status_list

# Quick testing block
if __name__ == "__main__":
    engine = DownloadEngine()
    print("Download manager initialized")
