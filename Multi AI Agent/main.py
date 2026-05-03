from flask import Flask, request, jsonify, Response, render_template
from flask_cors import CORS
import requests
import json
import threading
import queue
import time

app = Flask(__name__)
CORS(app)

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3" 

update_queue = queue.Queue()

def call_ollama(model, prompt):
    payload = {"model": model, "prompt": prompt, "stream": False}
    try:
        resp = requests.post(OLLAMA_URL, json=payload)
        resp.raise_for_status()
        return resp.json().get('response', '')
    except Exception as e:
        return f"Error: {str(e)}"

def run_agent(agent_name, role, task_prompt):
    full_prompt = f"You are {agent_name}, a {role}. Task: {task_prompt}"
    update_queue.put(json.dumps({"type": "status", "agent": agent_name, "status": "Thinking...", "color": get_color(agent_name)}) + "\n")
    output = call_ollama(MODEL, full_prompt)
    update_queue.put(json.dumps({"type": "result", "agent": agent_name, "content": output}) + "\n")
    return output

def get_color(agent):
    colors = {"Planner": "#FF6B6B", "Researcher": "#4ECDC4", "Writer": "#FFE66D", "Reviewer": "#1A535C"}
    return colors.get(agent, "#ffffff")

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate_content():
    data = request.json
    topic = data.get('topic', '')
    if not topic: return jsonify({"error": "No topic"}), 400

    def event_stream():
        while not update_queue.empty(): update_queue.get()
        
        threads = []
        tasks = {
            "Planner": f"Create a concise outline for '{topic}'.",
            "Researcher": f"Find 3 key facts about '{topic}'.",
            "Writer": f"Write an intro for '{topic}'.",
            "Reviewer": f"List 2 biases in '{topic}'."
        }

        for name, task in tasks.items():
            t = threading.Thread(target=run_agent, args=(name, "Expert", task))
            threads.append(t)
            t.start()

        active = len(threads)
        while active > 0:
            try:
                msg = update_queue.get(timeout=1)
                yield msg
                if '"type": "result"' in msg: active -= 1
            except queue.Empty: pass
        
        for t in threads: t.join()

        yield json.dumps({"type": "status", "agent": "Aggregator", "status": "Synthesizing...", "color": "#fff"}) + "\n"
        agg_prompt = f"Combine insights on '{topic}' into one final professional article."
        final_output = call_ollama(MODEL, agg_prompt)
        yield json.dumps({"type": "final", "content": final_output, "topic": topic}) + "\n"

    return Response(event_stream(), mimetype='application/x-ndjson')

if __name__ == '__main__':
    app.run(debug=True, port=5000)