import os

import requests


class OllamaError(RuntimeError):
    pass


DEFAULT_MODEL = "gemma:2b"


def ask_ollama(question: str, context: str) -> str:
    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
    model = os.getenv("OLLAMA_MODEL", DEFAULT_MODEL)

    prompt = f"""
You are a careful assistant answering questions using only the provided PDF context.

Rules:
- Answer from the context.
- If the answer is not in the context, say you could not find it in the PDF.
- Keep the answer clear and concise.

PDF context:
{context}

Question:
{question}
""".strip()

    try:
        response = requests.post(
            f"{base_url}/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.2,
                    "num_ctx": 8192,
                },
            },
            timeout=120,
        )
    except requests.RequestException as exc:
        raise OllamaError(
            "Could not reach Ollama. Make sure Ollama is installed and running on "
            f"{base_url}."
        ) from exc

    if response.status_code >= 400:
        error_message = _extract_ollama_error(response)
        if "not found" in error_message.lower():
            raise OllamaError(
                f"Ollama model '{model}' is not installed. Run: ollama pull {model}"
            )
        raise OllamaError(f"Ollama returned an error: {error_message}")

    data = response.json()
    return data.get("response", "").strip() or "Ollama returned an empty response."


def _extract_ollama_error(response: requests.Response) -> str:
    try:
        return response.json().get("error", response.text)
    except ValueError:
        return response.text
