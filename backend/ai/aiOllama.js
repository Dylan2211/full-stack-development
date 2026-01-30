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
        throw new Error(`Ollama server returned ${response.status}`);
      }

      const data = await response.json();
      console.log("[Ollama] response received:", data);

      if (!data || !data.response) {
        throw new Error("Invalid response from Ollama");
      }

      const ms = Date.now() - start;
      const output = data.response.trim();

      // Log success to database
      aiLogger.logAiCall({
        userId,
        dashboardId,
        taskId,
        provider: "Ollama",
        model,
        requestPath: req.path || "/api/ai/ollama",
        prompt,
        response: output,
        responseTimeMs: ms,
        success: true
      });

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
      aiLogger.logAiCall({
        userId,
        dashboardId,
        taskId,
        provider: "Ollama",
        model,
        requestPath: req.path || "/api/ai/ollama",
        prompt,
        response: null,
        responseTimeMs: ms,
        success: false,
        errorMessage: error.message
      });

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
      throw new Error(`Ollama server returned ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.response) {
      throw new Error("Invalid response from Ollama");
    }

    const ms = Date.now() - start;
    const output = data.response.trim();

    // Log success to database if context provided
    if (context.userId || context.dashboardId || context.taskId) {
      aiLogger.logAiCall({
        userId: context.userId || null,
        dashboardId: context.dashboardId || null,
        taskId: context.taskId || null,
        provider: "Ollama",
        model,
        requestPath: context.requestPath || "/internal/ollama",
        prompt,
        response: output,
        responseTimeMs: ms,
        success: true
      });
    }

    return output;

  } catch (error) {
    const ms = Date.now() - start;
    console.error("[Ollama queryOllama] error:", error.message);

    // Log failure to database if context provided
    if (context.userId || context.dashboardId || context.taskId) {
      aiLogger.logAiCall({
        userId: context.userId || null,
        dashboardId: context.dashboardId || null,
        taskId: context.taskId || null,
        provider: "Ollama",
        model,
        requestPath: context.requestPath || "/internal/ollama",
        prompt,
        response: null,
        responseTimeMs: ms,
        success: false,
        errorMessage: error.message
      });
    }

    return null;
  }
}

module.exports = { ollamaPrompt, queryOllama };
