import os
from pathlib import Path
from uuid import uuid4

from dotenv import load_dotenv
from flask import Flask, flash, redirect, render_template, request, session, url_for
from werkzeug.utils import secure_filename

from services.ollama_client import DEFAULT_MODEL, OllamaError, ask_ollama
from services.pdf_store import PdfStore, PdfStoreError


load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
ALLOWED_EXTENSIONS = {".pdf"}


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY", "dev-secret-key-change-me")
    app.config["UPLOAD_FOLDER"] = UPLOAD_DIR
    max_mb = int(os.getenv("MAX_CONTENT_LENGTH_MB", "25"))
    app.config["MAX_CONTENT_LENGTH"] = max_mb * 1024 * 1024

    UPLOAD_DIR.mkdir(exist_ok=True)
    store = PdfStore(UPLOAD_DIR)

    @app.route("/", methods=["GET", "POST"])
    def index():
        answer = None
        question = ""
        active_document = None
        relevant_chunks = []

        document_id = session.get("document_id")
        if document_id:
            active_document = store.get_document(document_id)

        if request.method == "POST":
            action = request.form.get("action")

            if action == "upload":
                uploaded_file = request.files.get("pdf")
                if not uploaded_file or uploaded_file.filename == "":
                    flash("Choose a PDF file to upload.", "error")
                    return redirect(url_for("index"))

                file_ext = Path(uploaded_file.filename).suffix.lower()
                if file_ext not in ALLOWED_EXTENSIONS:
                    flash("Only PDF files are supported.", "error")
                    return redirect(url_for("index"))

                original_name = secure_filename(uploaded_file.filename)
                saved_name = f"{uuid4().hex}_{original_name}"
                saved_path = UPLOAD_DIR / saved_name
                uploaded_file.save(saved_path)

                try:
                    document = store.add_pdf(saved_path, original_name)
                except PdfStoreError as exc:
                    saved_path.unlink(missing_ok=True)
                    flash(str(exc), "error")
                    return redirect(url_for("index"))

                session["document_id"] = document.document_id
                flash(f"Uploaded {document.filename}. Ask a question below.", "success")
                return redirect(url_for("index"))

            if action == "ask":
                question = request.form.get("question", "").strip()
                if not active_document:
                    flash("Upload a PDF before asking a question.", "error")
                    return redirect(url_for("index"))
                if not question:
                    flash("Type a question about the PDF.", "error")
                    return redirect(url_for("index"))

                relevant_chunks = store.search(active_document.document_id, question, limit=5)
                context = "\n\n".join(chunk.text for chunk in relevant_chunks)

                try:
                    answer = ask_ollama(question=question, context=context)
                except OllamaError as exc:
                    flash(str(exc), "error")

        return render_template(
            "index.html",
            answer=answer,
            question=question,
            document=active_document,
            chunks=relevant_chunks,
            model_name=os.getenv("OLLAMA_MODEL", DEFAULT_MODEL),
        )

    @app.route("/reset", methods=["POST"])
    def reset():
        session.pop("document_id", None)
        flash("Cleared the active PDF.", "success")
        return redirect(url_for("index"))

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True)
