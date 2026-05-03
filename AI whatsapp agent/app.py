from datetime import datetime, timedelta
import os
import re
import threading

import pywhatkit
import requests
from flask import Flask, render_template, request


app = Flask(__name__)

# Ollama runs locally by default. You can change these with environment variables.
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma:2b")


def validate_phone_number(phone_number):
    """Validate international phone numbers such as +919876543210."""
    cleaned = phone_number.strip()
    pattern = r"^\+[1-9]\d{7,14}$"

    if not re.match(pattern, cleaned):
        return None, "Enter a valid phone number with country code, for example +919876543210."

    return cleaned, None


def parse_send_time(time_text):
    """Parse HH:MM time and ensure it is at least two minutes in the future."""
    try:
        hour, minute = map(int, time_text.strip().split(":"))
        if hour < 0 or hour > 23 or minute < 0 or minute > 59:
            raise ValueError
    except ValueError:
        return None, "Enter time in 24-hour HH:MM format, for example 21:30."

    now = datetime.now()
    send_at = now.replace(hour=hour, minute=minute, second=0, microsecond=0)

    # pywhatkit schedules by hour and minute. If today's time already passed,
    # treat it as tomorrow at the same time.
    if send_at <= now:
        send_at += timedelta(days=1)

    if send_at - now < timedelta(minutes=2):
        return None, "Choose a time at least 2 minutes from now."

    return send_at, None


def generate_message(topic):
    """Ask local Ollama to write a concise WhatsApp message for the topic."""
    prompt = (
        "Write a friendly WhatsApp message about this topic. "
        "Keep it natural, clear, and under 80 words. "
        f"Topic: {topic}"
    )

    response = requests.post(
        OLLAMA_URL,
        json={
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
        },
        timeout=60,
    )
    response.raise_for_status()

    data = response.json()
    message = data.get("response", "").strip()

    if not message:
        raise ValueError("Ollama did not return a message.")

    return message


def send_whatsapp_message(phone_number, message, send_at):
    """Send the WhatsApp message using WhatsApp Web through pywhatkit."""
    pywhatkit.sendwhatmsg(
        phone_no=phone_number,
        message=message,
        time_hour=send_at.hour,
        time_min=send_at.minute,
        wait_time=20,
        tab_close=True,
        close_time=5,
    )


@app.route("/", methods=["GET", "POST"])
def index():
    confirmation = None
    error = None
    generated_message = None

    if request.method == "POST":
        topic = request.form.get("topic", "").strip()
        phone_number = request.form.get("phone_number", "").strip()
        time_text = request.form.get("send_time", "").strip()

        if not topic:
            error = "Message topic is required."
        else:
            phone_number, error = validate_phone_number(phone_number)

        if not error:
            send_at, error = parse_send_time(time_text)

        if not error:
            try:
                generated_message = generate_message(topic)

                # Run pywhatkit in the background so the webpage can respond
                # immediately after the message is scheduled.
                thread = threading.Thread(
                    target=send_whatsapp_message,
                    args=(phone_number, generated_message, send_at),
                    daemon=True,
                )
                thread.start()

                confirmation = (
                    f"Message scheduled for {phone_number} at "
                    f"{send_at.strftime('%Y-%m-%d %H:%M')}."
                )
            except requests.exceptions.ConnectionError:
                error = "Could not connect to Ollama. Make sure Ollama is running locally."
            except requests.exceptions.RequestException as exc:
                error = f"Ollama request failed: {exc}"
            except Exception as exc:
                error = f"Could not schedule the message: {exc}"

    return render_template(
        "index.html",
        confirmation=confirmation,
        error=error,
        generated_message=generated_message,
    )


if __name__ == "__main__":
    app.run(debug=True , port=5000)
