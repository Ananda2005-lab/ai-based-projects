import { useState, useCallback } from 'react';

export interface UploadedFile {
  id: string;
  name: string;
  content: string;
  language: string;
  size: number;
  lastModified: number;
}

const EXT_TO_LANG: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  java: 'java',
  cpp: 'cpp',
  c: 'cpp',
  h: 'cpp',
  hpp: 'cpp',
  go: 'go',
  rs: 'rust',
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'css',
  sass: 'css',
  json: 'javascript',
  md: 'markdown',
  yaml: 'yaml',
  yml: 'yaml',
  sh: 'bash',
  bash: 'bash',
  sql: 'sql',
  php: 'php',
  rb: 'ruby',
  swift: 'swift',
  kt: 'kotlin',
  dart: 'dart',
};

function detectLangFromName(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return EXT_TO_LANG[ext] || 'javascript';
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function useFileUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  const addFiles = useCallback((newFiles: UploadedFile[]) => {
    setFiles((prev) => {
      const merged = [...prev];
      newFiles.forEach((nf) => {
        const idx = merged.findIndex((f) => f.name === nf.name);
        if (idx >= 0) {
          merged[idx] = nf;
        } else {
          merged.push(nf);
        }
      });
      return merged;
    });
    if (newFiles.length > 0 && !activeFileId) {
      setActiveFileId(newFiles[0].id);
    }
  }, [activeFileId]);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      if (activeFileId === id) {
        setActiveFileId(next.length > 0 ? next[0].id : null);
      }
      return next;
    });
  }, [activeFileId]);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setActiveFileId(null);
  }, []);

  const activeFile = files.find((f) => f.id === activeFileId) || null;

  const handleFileSelect = useCallback(async (fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      // Skip non-text files
      if (file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/')) continue;
      if (file.size > 2 * 1024 * 1024) continue; // Skip files > 2MB

      try {
        const content = await file.text();
        newFiles.push({
          id: crypto.randomUUID(),
          name: file.name,
          content,
          language: detectLangFromName(file.name),
          size: file.size,
          lastModified: file.lastModified,
        });
      } catch {
        // skip unreadable files
      }
    }

    addFiles(newFiles);
  }, [addFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  return {
    files,
    activeFile,
    activeFileId,
    setActiveFileId,
    addFiles,
    removeFile,
    clearFiles,
    handleFileSelect,
    handleDrop,
    formatSize,
  };
}
