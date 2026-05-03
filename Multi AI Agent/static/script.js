let historyData = [];

function setTopic(text) { document.getElementById('topicInput').value = text; }
function openModal(id) { document.getElementById(id).style.display = "block"; }
function closeModal(id) { document.getElementById(id).style.display = "none"; }
window.onclick = function(event) { if (event.target.classList.contains('modal')) event.target.style.display = "none"; }

function changeTheme(themeName) {
    document.body.className = themeName;
}

function clearOutput() {
    document.getElementById('thinkingLog').innerHTML = '<div class="log-entry system">System Ready.</div>';
    document.getElementById('finalOutput').innerHTML = '<div class="placeholder-text">Waiting for swarm completion...</div>';
}

async function startGeneration() {
    const topic = document.getElementById('topicInput').value;
    const btn = document.getElementById('generateBtn');
    const logWindow = document.getElementById('thinkingLog');
    const finalOutput = document.getElementById('finalOutput');

    if (!topic) { alert("Enter a topic!"); return; }

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Swarm Active';
    
    logWindow.innerHTML = '';
    finalOutput.innerHTML = '<div class="placeholder-text">Agents are thinking...</div>';

    try {
        const response = await fetch('http://127.0.0.1:5000/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic: topic })
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.trim() === '') continue;
                try {
                    const data = JSON.parse(line);
                    
                    if (data.type === "status") {
                        addLog(data.agent, data.status, data.color);
                    } else if (data.type === "result") {
                        // FIX: Mark as completed immediately
                        addLog(data.agent, "Task Completed.", data.color, true);
                    } else if (data.type === "final") {
                        showFinalOutput(data.content, data.topic);
                    }
                } catch (e) { console.error(e); }
            }
        }
    } catch (error) {
        addLog("System", "Connection Error", "red");
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-bolt"></i> Initiate Swarm';
    }
}

function addLog(agent, message, color, isComplete = false) {
    const logWindow = document.getElementById('thinkingLog');
    const entry = document.createElement('div');
    entry.className = `log-entry ${agent.toLowerCase()}`;
    
    const statusIcon = isComplete ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-spinner fa-spin"></i>';
    entry.innerHTML = `<strong>[${agent}]</strong> ${statusIcon} ${message}`;
    logWindow.appendChild(entry);
    logWindow.scrollTop = logWindow.scrollHeight;
}

function showFinalOutput(content, topic) {
    const finalDiv = document.getElementById('finalOutput');
    finalDiv.innerHTML = `<h3>Final Aggregated Report</h3><hr style="border-color:rgba(255,255,255,0.1); margin:10px 0;">${content.replace(/\n/g, '<br>')}`;
    
    addLog("Aggregator", "Final Report Generated Successfully.", "#10b981", true);
    
    // Add to History
    addToHistory(topic, content);
}

function addToHistory(topic, content) {
    const historyList = document.getElementById('historyList');
    const emptyMsg = document.querySelector('.empty-history');
    if(emptyMsg) emptyMsg.remove();

    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerText = topic;
    item.onclick = () => {
        document.getElementById('topicInput').value = topic;
        document.getElementById('finalOutput').innerHTML = `<h3>${topic}</h3><hr style="border-color:rgba(255,255,255,0.1); margin:10px 0;">${content.replace(/\n/g, '<br>')}`;
    };
    
    historyList.prepend(item);
}

function copyFinal() {
    const text = document.getElementById('finalOutput').innerText;
    navigator.clipboard.writeText(text);
    alert("Copied!");
}