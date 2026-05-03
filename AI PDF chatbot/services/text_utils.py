import re
from collections import Counter


WORD_RE = re.compile(r"[A-Za-z0-9']+")
STOPWORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "how",
    "in",
    "is",
    "it",
    "of",
    "on",
    "or",
    "that",
    "the",
    "this",
    "to",
    "was",
    "what",
    "when",
    "where",
    "which",
    "who",
    "why",
    "with",
}


def normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def tokenize(text: str) -> list[str]:
    words = [word.lower() for word in WORD_RE.findall(text)]
    return [word for word in words if word not in STOPWORDS and len(word) > 1]


def chunk_text(text: str, chunk_size: int = 1200, overlap: int = 180) -> list[str]:
    clean_text = normalize_whitespace(text)
    if len(clean_text) <= chunk_size:
        return [clean_text]

    chunks = []
    start = 0
    while start < len(clean_text):
        end = start + chunk_size
        chunk = clean_text[start:end]

        if end < len(clean_text):
            last_period = chunk.rfind(". ")
            if last_period > chunk_size * 0.6:
                end = start + last_period + 1
                chunk = clean_text[start:end]

        chunks.append(chunk.strip())
        next_start = end - overlap
        start = next_start if next_start > start else end

    return [chunk for chunk in chunks if chunk]


def score_text(query: str, text: str) -> int:
    query_terms = Counter(tokenize(query))
    if not query_terms:
        return 0

    text_terms = Counter(tokenize(text))
    return sum(text_terms[term] * weight for term, weight in query_terms.items())
