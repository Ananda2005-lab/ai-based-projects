import os
import re

class StorageManager:
    """
    Manages local file organization, directory creation, duplicate detection,
    and safe filename generation for downloaded media.
    """
    def __init__(self, base_dir=None):
        if base_dir is None:
            # Base directory is the parent directory of this python folder
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        self.base_dir = base_dir
        self.downloads_dir = os.path.join(self.base_dir, "Downloads")
        
        # Required directory structure
        self.dirs = {
            "root": self.downloads_dir,
            "music": os.path.join(self.downloads_dir, "Music"),
            "videos": os.path.join(self.downloads_dir, "Videos"),
            "history": os.path.join(self.downloads_dir, "History"),
            "temporary": os.path.join(self.downloads_dir, "Temporary"),
            "favorites": os.path.join(self.downloads_dir, "Favorites")
        }
        
        # Create all directories on initialization
        self.setup_directories()

    def setup_directories(self):
        """Creates the downloads subdirectories if they do not exist."""
        for name, path in self.dirs.items():
            if not os.path.exists(path):
                os.makedirs(path, exist_ok=True)
                print(f"[Storage] Created directory: {path}")

    def get_path(self, category):
        """Returns the absolute path of a specific folder category."""
        return self.dirs.get(category.lower(), self.downloads_dir)

    def get_safe_filename(self, filename):
        """
        Converts a string into a safe, cross-platform filename.
        Removes invalid characters and spaces.
        """
        # Remove characters that are illegal in file names
        filename = re.sub(r'[\\/*?:"<>|]', "", filename)
        # Replace spaces and multiple dashes with single dashes
        filename = re.sub(r'\s+', "_", filename)
        filename = re.sub(r'_+', "_", filename)
        return filename.strip("_")

    def get_unique_filepath(self, category, filename):
        """
        Generates a unique file path for a file in a given category.
        If a duplicate file exists, appends '_1', '_2', etc. to the filename.
        """
        category_dir = self.get_path(category)
        safe_name = self.get_safe_filename(filename)
        
        # Split filename into name and extension
        name, ext = os.path.splitext(safe_name)
        if not ext:
            # Default extensions based on category
            ext = ".mp3" if category.lower() == "music" else ".mp4"
            
        target_path = os.path.join(category_dir, f"{name}{ext}")
        
        counter = 1
        # Loop until a non-existent filename is found
        while os.path.exists(target_path):
            target_path = os.path.join(category_dir, f"{name}_{counter}{ext}")
            counter += 1
            
        return target_path

    def list_files(self, category):
        """
        Lists files in a specific category with size and basic info.
        """
        category_dir = self.get_path(category)
        if not os.path.exists(category_dir):
            return []
            
        files_info = []
        for filename in os.listdir(category_dir):
            filepath = os.path.join(category_dir, filename)
            if os.path.isfile(filepath):
                stat = os.stat(filepath)
                files_info.append({
                    "name": filename,
                    "path": filepath,
                    "size_bytes": stat.st_size,
                    "size_formatted": self.format_size(stat.st_size),
                    "created_at": stat.st_mtime
                })
        return sorted(files_info, key=lambda x: x["created_at"], reverse=True)

    @staticmethod
    def format_size(bytes_size):
        """Formats bytes size into human-readable MB/KB format."""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if bytes_size < 1024.0:
                return f"{bytes_size:.2f} {unit}"
            bytes_size /= 1024.0
        return f"{bytes_size:.2f} TB"

# Quick testing block
if __name__ == "__main__":
    manager = StorageManager()
    print("Testing safe filename:")
    print(manager.get_safe_filename("Believer (Official Video) - Imagine Dragons???.mp4"))
    print("Testing unique path in Music:")
    print(manager.get_unique_filepath("music", "Believer.mp3"))
