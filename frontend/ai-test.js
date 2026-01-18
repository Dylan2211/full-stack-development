// AI Test Page JS
// Wires the frontend to the backend Gemini endpoint

const API_BASE = 'http://localhost:3000';

document.getElementById('run-ai').addEventListener('click', async () => {
    const input = document.getElementById('ai-input').value.trim();
    const outputDiv = document.getElementById('ai-output');
    outputDiv.textContent = 'Running...';

    if (!input) {
        outputDiv.textContent = 'Please enter a prompt.';
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/ai/gemini`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: input })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'AI request failed');
        outputDiv.textContent = data.output || JSON.stringify(data);
    } catch (err) {
        outputDiv.textContent = 'Error: ' + err.message;
    }
});
