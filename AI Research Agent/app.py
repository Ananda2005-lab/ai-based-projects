import os
import json
from datetime import datetime
from pathlib import Path
from uuid import uuid4

from flask import Flask, redirect, render_template, request, url_for
from markupsafe import Markup
import markdown
import requests


app = Flask(__name__)

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma:2b")
HISTORY_FILE = Path(__file__).with_name("reports_history.json")


def build_prompt(topic):
    return f"""
You are an expert research assistant. Write a detailed, well-structured
research report about:

{topic}

Format the report with these exact Markdown sections:

# Introduction
Explain the topic clearly and give useful background in 2-3 concise paragraphs.

# Key Points
Use detailed bullet points. Start each bullet with a bold label, then explain it.
Include definitions, causes, impacts, examples, current relevance, and important
debates where appropriate.

# Analysis
Explain the topic in depth using connected paragraphs and short bullet lists
where useful. Make important terms bold.

# Conclusion
Use bullet points for the most important takeaways and end with a thoughtful
closing paragraph.

Keep the report factual, organized, and accessible to a general reader.
""".strip()


@app.template_filter("markdown_to_html")
def markdown_to_html(text):
    html = markdown.markdown(
        text or "",
        extensions=["extra", "sane_lists"],
        output_format="html5",
    )
    return Markup(html)


def load_history():
    if not HISTORY_FILE.exists():
        return []

    try:
        with HISTORY_FILE.open("r", encoding="utf-8") as file:
            history = json.load(file)
    except (json.JSONDecodeError, OSError):
        return []

    return history if isinstance(history, list) else []


def save_history(history):
    with HISTORY_FILE.open("w", encoding="utf-8") as file:
        json.dump(history, file, indent=2, ensure_ascii=False)


def add_history_item(topic, report):
    history = load_history()
    item = {
        "id": uuid4().hex,
        "topic": topic,
        "report": report,
        "created_at": datetime.now().strftime("%d %b %Y, %I:%M %p"),
    }
    history.insert(0, item)
    save_history(history[:25])
    return item


def generate_report(topic):
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": build_prompt(topic),
        "stream": False,
    }

    response = requests.post(OLLAMA_URL, json=payload, timeout=180)
    response.raise_for_status()
    data = response.json()
    return data.get("response", "").strip()


@app.route("/", methods=["GET", "POST"])
def index():
    report = None
    error = None
    topic = ""
    selected_id = request.args.get("report_id", "")
    history = load_history()
    selected_report = next(
        (item for item in history if item.get("id") == selected_id),
        history[0] if history else None,
    )

    if request.method == "POST":
        topic = request.form.get("topic", "").strip()

        if not topic:
            error = "Please enter a research topic."
        else:
            try:
                report = generate_report(topic)
                if not report:
                    error = "Ollama returned an empty report. Try another topic."
                else:
                    selected_report = add_history_item(topic, report)
                    history = load_history()
            except requests.exceptions.ConnectionError:
                error = (
                    "Could not connect to Ollama. Make sure Ollama is running "
                    "locally with `ollama serve`."
                )
            except requests.exceptions.Timeout:
                error = "The request to Ollama timed out. Try a smaller topic or a faster model."
            except requests.exceptions.HTTPError as exc:
                error = f"Ollama returned an HTTP error: {exc}"
            except requests.exceptions.RequestException as exc:
                error = f"Could not generate the report: {exc}"

    return render_template(
        "index.html",
        topic=topic,
        report=report,
        error=error,
        model=OLLAMA_MODEL,
        history=history,
        selected_report=selected_report,
    )


@app.post("/delete/<report_id>")
def delete_report(report_id):
    history = [item for item in load_history() if item.get("id") != report_id]
    save_history(history)
    return redirect(url_for("index"))


if __name__ == "__main__":
    app.run(debug=True)
