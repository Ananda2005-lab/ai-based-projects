from dataclasses import dataclass
from pathlib import Path

from pypdf import PdfReader

from services.text_utils import chunk_text, score_text


class PdfStoreError(RuntimeError):
    pass


@dataclass
class TextChunk:
    index: int
    text: str
    score: int = 0


@dataclass
class PdfDocument:
    document_id: str
    filename: str
    path: Path
    text: str
    chunks: list[TextChunk]


class PdfStore:
    def __init__(self, upload_dir: Path):
        self.upload_dir = upload_dir
        self.documents: dict[str, PdfDocument] = {}

    def add_pdf(self, path: Path, original_filename: str) -> PdfDocument:
        text = self._extract_text(path)
        if not text.strip():
            raise PdfStoreError("No readable text was found in this PDF.")

        chunks = [
            TextChunk(index=index, text=chunk)
            for index, chunk in enumerate(chunk_text(text), start=1)
        ]
        document = PdfDocument(
            document_id=path.stem,
            filename=original_filename,
            path=path,
            text=text,
            chunks=chunks,
        )
        self.documents[document.document_id] = document
        return document

    def get_document(self, document_id: str) -> PdfDocument | None:
        return self.documents.get(document_id)

    def search(self, document_id: str, query: str, limit: int = 5) -> list[TextChunk]:
        document = self.get_document(document_id)
        if not document:
            return []

        scored_chunks = [
            TextChunk(index=chunk.index, text=chunk.text, score=score_text(query, chunk.text))
            for chunk in document.chunks
        ]
        scored_chunks.sort(key=lambda chunk: chunk.score, reverse=True)

        relevant = [chunk for chunk in scored_chunks if chunk.score > 0]
        return (relevant or scored_chunks)[:limit]

    def _extract_text(self, path: Path) -> str:
        try:
            reader = PdfReader(path)
            pages = []
            for page_number, page in enumerate(reader.pages, start=1):
                page_text = page.extract_text() or ""
                if page_text.strip():
                    pages.append(f"[Page {page_number}]\n{page_text}")
            return "\n\n".join(pages)
        except Exception as exc:
            raise PdfStoreError("Could not read that PDF. Try a text-based PDF file.") from exc
