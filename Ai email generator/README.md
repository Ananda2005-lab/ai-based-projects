# AI Email Generator Flask App

A complete Flask app where a user enters an email topic, Ollama generates the email content, the user reviews or edits it, then sends it through SMTP.

## File Structure

```text
.
├── app.py
├── requirements.txt
├── .env.example
├── README.md
├── static
│   └── css
│       └── styles.css
└── templates
    ├── base.html
    ├── compose.html
    └── index.html
```

## Requirements

- Python 3.10+
- Ollama installed and running
- An Ollama model pulled locally, such as `gemma:2b`
- SMTP credentials for your email provider

## Setup

1. Create and activate a virtual environment.

```bash
python -m venv venv
venv\Scripts\activate
```

2. Install dependencies.

```bash
pip install -r requirements.txt
```

3. Copy `.env.example` to `.env` and update the values.

```bash
copy .env.example .env
```

4. Start Ollama and make sure your selected model exists.

```bash
ollama serve
ollama pull gemma:2b
```

5. Run the Flask app.

```bash
python app.py
```

6. Open the app at:

```text
http://127.0.0.1:5000
```

## SMTP Notes

For Gmail, use an app password instead of your normal account password. Keep `.env` private and do not commit it to source control.
