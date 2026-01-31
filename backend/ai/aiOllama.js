const aiLogger = require("../utils/aiLogger");

async function ollamaPrompt(req, res) {
  try {
    const prompt = req.body?.prompt;
    const model = req.body?.model || "gemma3:4b";
    const userId = (req.user && (req.user.id || req.user.userId)) || req.body?.userId || null;
    const dashboardId = req.body?.dashboardId || null;
    const taskId = req.body?.taskId || null;

    console.log("[Ollama] prompt received:", typeof prompt === "string" ? prompt.substring(0, 200) : prompt);

    if (!prompt || typeof prompt !== "string") {
      console.warn("[Ollama] missing or invalid prompt", prompt);
      return res.status(400).json({ error: "Missing or invalid 'prompt' (string)" });
    }

    const start = Date.now();

    try {
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        const raw = await response.text().catch(() => "");
        console.error(`[Ollama] HTTP ${response.status} ${response.statusText}:`, raw.substring ? raw.substring(0, 1000) : raw);
        throw new Error(`Ollama server returned ${response.status}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        const raw = await response.text().catch(() => "");
        console.error("[Ollama] non-JSON response:", raw.substring ? raw.substring(0, 1000) : raw);
        throw new Error("Ollama returned non-JSON response");
      }

      console.log("[Ollama] response received:", data);

      // Accept multiple possible response fields from different Ollama configurations
      const text = data.response || data.output || data.result || null;
      if (!text) {
        console.error("[Ollama] response missing expected keys:", Object.keys(data));
        throw new Error("Invalid response from Ollama");
      }

      const ms = Date.now() - start;
      const output = String(text).trim();

      // Log success to database
      aiLogger.logAiRequest({
        model,
        request_path: req.path || "/api/ai/ollama",
        prompt,
        response_time_ms: ms,
        status: "success"
      }).catch(err => console.error("Failed to log AI request:", err.message));

      console.log("[Ollama] success in", ms, "ms");
      return res.json({
        success: true,
        output,
        latencyMs: ms,
        provider: "Ollama",
        model
      });

    } catch (error) {
      const ms = Date.now() - start;
      console.error("[Ollama] error:", error.message);

      // Log failure to database
      aiLogger.logAiRequest({
        model,
        request_path: req.path || "/api/ai/ollama",
        prompt,
        response_time_ms: ms,
        status: "error",
        error_message: error.message
      }).catch(err => console.error("Failed to log AI request:", err.message));

      return res.status(500).json({
        error: "Ollama request failed",
        details: error.message,
        hint: "Make sure Ollama server is running on http://localhost:11434"
      });
    }

  } catch (err) {
    console.error("[Ollama] unexpected error:", err);
    return res.status(500).json({
      error: "Unexpected error",
      details: err.message
    });
  }
}

/**
 * Helper function to query Ollama directly (for internal use)
 * @param {string} prompt - The prompt to send
 * @param {string} model - The model to use (default: gemma3:4b)
 * @param {object} context - Optional context object with userId, dashboardId, taskId
 * @returns {Promise<string|null>} - The response text or null if Ollama is unavailable
 */
async function queryOllama(prompt, model = "gemma3:4b", context = {}) {
  const start = Date.now();
  
  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      const raw = await response.text().catch(() => "");
      console.error(`[queryOllama] HTTP ${response.status} ${response.statusText}:`, raw.substring ? raw.substring(0, 1000) : raw);
      throw new Error(`Ollama server returned ${response.status}`);
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonErr) {
      const raw = await response.text().catch(() => "");
      console.error("[queryOllama] non-JSON response:", raw.substring ? raw.substring(0, 1000) : raw);
      throw new Error("Ollama returned non-JSON response");
    }

    const text = data.response || data.output || data.result || null;
    if (!text) {
      console.error("[queryOllama] response missing expected keys:", Object.keys(data));
      throw new Error("Invalid response from Ollama");
    }

    const ms = Date.now() - start;
    const output = String(text).trim();

    // Log success to database if context provided
    if (context.userId || context.dashboardId || context.taskId) {
      aiLogger.logAiRequest({
        model,
        request_path: context.requestPath || "/internal/ollama",
        prompt,
        response_time_ms: ms,
        status: "success"
      }).catch(err => console.error("Failed to log AI request:", err.message));
    }

    return output;

  } catch (error) {
    const ms = Date.now() - start;
    console.error("[Ollama queryOllama] error:", error.message);

    // Log failure to database if context provided
    if (context.userId || context.dashboardId || context.taskId) {
      aiLogger.logAiRequest({
        model,
        request_path: context.requestPath || "/internal/ollama",
        prompt,
        response_time_ms: ms,
        status: "error",
        error_message: error.message
      }).catch(err => console.error("Failed to log AI request:", err.message));
    }

    return null;
  }
}

module.exports = { ollamaPrompt, queryOllama };
