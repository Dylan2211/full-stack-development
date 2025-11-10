// testOllama.js
// Simple connectivity test for Ollama

async function testOllama() {
  try {
    const response = await fetch("http://localhost:11434/api/tags");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Ollama is running. Installed models:");
    console.log(data);
  } catch (err) {
    console.error("❌ Ollama not reachable:", err.message);
  }
}

testOllama();
