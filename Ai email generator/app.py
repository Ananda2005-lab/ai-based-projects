import os
import smtplib
from email.message import EmailMessage

import requests
from dotenv import load_dotenv
from flask import Flask, flash, redirect, render_template, request, url_for


load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY", "change-this-secret-key")

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma:2b")


def get_smtp_config():
    smtp_user = os.getenv("SMTP_USER")
    if smtp_user:
        smtp_user = smtp_user.strip()

    smtp_password = os.getenv("SMTP_PASSWORD")
    if smtp_password:
        smtp_password = "".join(smtp_password.split())

    sender_email = os.getenv("SENDER_EMAIL", smtp_user)
    if sender_email:
        sender_email = sender_email.strip()

    return {
        "host": os.getenv("SMTP_HOST"),
        "port": int(os.getenv("SMTP_PORT", "587")),
        "user": smtp_user,
        "password": smtp_password,
        "sender": sender_email,
    }


def get_missing_smtp_fields():
    config = get_smtp_config()
    required_fields = {
        "SMTP_HOST": config["host"],
        "SMTP_USER": config["user"],
        "SMTP_PASSWORD": config["password"],
        "SENDER_EMAIL or SMTP_USER": config["sender"],
    }
    return [key for key, value in required_fields.items() if not value]


@app.context_processor
def inject_app_config():
    missing_smtp_fields = get_missing_smtp_fields()
    return {
        "ollama_model": OLLAMA_MODEL,
        "smtp_ready": not missing_smtp_fields,
        "missing_smtp_fields": missing_smtp_fields,
    }


def generate_email(topic):
    prompt = f"""
Write a professional email for the following topic:

Topic: {topic}

Return only the email body. Keep it clear, polite, and ready to send.
""".strip()

    response = requests.post(
        OLLAMA_URL,
        json={
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
        },
        timeout=120,
    )
    response.raise_for_status()

    data = response.json()
    content = data.get("response", "").strip()
    if not content:
        raise ValueError("Ollama returned an empty response.")
    return content


def send_email(receiver_email, subject, body):
    config = get_smtp_config()
    missing = get_missing_smtp_fields()
    if missing:
        raise ValueError(
            "Please add these values in your .env file and restart Flask: "
            + ", ".join(missing)
        )

    message = EmailMessage()
    message["From"] = config["sender"]
    message["To"] = receiver_email
    message["Subject"] = subject
    message.set_content(body)

    with smtplib.SMTP(config["host"], config["port"]) as server:
        server.starttls()
        try:
            server.login(config["user"], config["password"])
        except smtplib.SMTPAuthenticationError as exc:
            raise ValueError(
                "Gmail rejected the SMTP login. Use your full Gmail address as "
                "SMTP_USER and a Google App Password as SMTP_PASSWORD, not your "
                "normal Gmail password."
            ) from exc
        server.send_message(message)


@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        topic = request.form.get("topic", "").strip()
        if not topic:
            flash("Please enter an email topic.", "error")
            return redirect(url_for("index"))

        try:
            email_content = generate_email(topic)
        except requests.RequestException as exc:
            flash(f"Could not connect to Ollama: {exc}", "error")
            return render_template("index.html", topic=topic)
        except Exception as exc:
            flash(f"Could not generate email: {exc}", "error")
            return render_template("index.html", topic=topic)

        return render_template(
            "compose.html",
            topic=topic,
            subject=f"Regarding {topic}",
            email_content=email_content,
        )

    return render_template("index.html")


@app.route("/send", methods=["POST"])
def send():
    receiver_email = request.form.get("receiver_email", "").strip()
    subject = request.form.get("subject", "").strip()
    email_content = request.form.get("email_content", "").strip()
    topic = request.form.get("topic", "").strip()

    if not receiver_email or not subject or not email_content:
        flash("Receiver email, subject, and email content are required.", "error")
        return render_template(
            "compose.html",
            topic=topic,
            subject=subject,
            email_content=email_content,
            receiver_email=receiver_email,
        )

    try:
        send_email(receiver_email, subject, email_content)
    except Exception as exc:
        flash(f"Could not send email: {exc}", "error")
        return render_template(
            "compose.html",
            topic=topic,
            subject=subject,
            email_content=email_content,
            receiver_email=receiver_email,
        )

    flash("Email sent successfully.", "success")
    return redirect(url_for("index"))


if __name__ == "__main__":
    app.run(host='0.0.0.0' , port=int(os.environ.get('PORT' , 5000)))
