# app.py
from flask import Flask, render_template, request
import requests

app = Flask(__name__)

# Configuration
OLLAMA_API_URL = "http://127.0.0.1:11434/api/generate"
# CHANGE THIS TO 'gemma:2b' OR 'qwen2:0.5b' FOR SPEED
MODEL_NAME = "gemma:2b"  

def get_summary_from_ollama(text):
    payload = {
        "model": MODEL_NAME,
        "prompt": f"Summarize the following text concisely in bullet points:\n\n{text}",
        "stream": False
    }
    
    try:
        response = requests.post(OLLAMA_API_URL, json=payload, timeout=60) # Reduced timeout for fast models
        response.raise_for_status()
        result = response.json()
        summary = result.get("response", "").strip()
        
        if not summary:
            return None, "AI returned empty response."
            
        return summary, None
        
    except requests.exceptions.ConnectionError:
        return None, "Ollama is not running. Start it with 'ollama serve'."
    except requests.exceptions.Timeout:
        return None, "Request timed out. Try shorter text."
    except Exception as e:
        return None, f"Error: {str(e)}"

@app.route("/", methods=["GET", "POST"])
def index():
    summary = None
    error = None
    input_text = ""

    if request.method == "POST":
        input_text = request.form.get("input_text", "")
        
        if not input_text.strip():
            error = "Please enter some text."
        else:
            summary, error = get_summary_from_ollama(input_text)

    return render_template("index.html", 
                           summary=summary, 
                           error=error, 
                           input_text=input_text,
                           model_name=MODEL_NAME)

if __name__ == "__main__":
    app.run(debug=True, port=5000)