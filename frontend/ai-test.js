// AI Test Page JS
// This assumes you have endpoints or functions to call your AI modules from the backend

document.getElementById('run-ai').addEventListener('click', async () => {
    const module = document.getElementById('ai-module').value;
    const input = document.getElementById('ai-input').value;
    const outputDiv = document.getElementById('ai-output');
    outputDiv.textContent = 'Running...';

    try {
        // Example: POST to /api/ai/{module} with { input }
        const res = await fetch(`/api/ai/${module}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input })
        });
        if (!res.ok) throw new Error('AI request failed');
        const data = await res.json();
        outputDiv.textContent = data.output || JSON.stringify(data);
    } catch (err) {
        outputDiv.textContent = 'Error: ' + err.message;
    }
});
