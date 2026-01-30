const { GoogleGenerativeAI } = require("@google/generative-ai");
const aiLogger = require("../utils/aiLogger");

async function geminiPrompt(req, res) {
  try {
    const prompt = req.body?.prompt;
    const userId = (req.user && (req.user.id || req.user.userId)) || req.body?.userId || null;
    const dashboardId = req.body?.dashboardId || null;
    const taskId = req.body?.taskId || null;

    console.log("[Gemini] prompt received:", typeof prompt === "string" ? prompt.substring(0, 200) : prompt);

    if (!prompt || typeof prompt !== "string") {
      console.warn("[Gemini] missing or invalid prompt", prompt);
      return res.status(400).json({ error: "Missing or invalid 'prompt' (string)" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    console.log("GEMINI_API_KEY loaded:", apiKey ? "YES (" + apiKey.substring(0, 10) + "...)" : "NO");
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY missing in .env" });
    }

    if (apiKey.length < 20) {
      return res.status(500).json({ error: "GEMINI_API_KEY appears to be invalid (too short)" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Good default model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const start = Date.now();
    const result = await model.generateContent(prompt);

    // Defensive extraction + logging to aid debugging when SDK shape differs
    console.log("[Gemini] raw result keys:", Object.keys(result || {}));
    try {
      console.log("[Gemini] raw result (preview):", JSON.stringify(result, null, 2).substring(0, 2000));
    } catch (_) {}

    let output = "";
    if (result && result.response && typeof result.response.text === "function") {
      output = await result.response.text();
    } else if (typeof result === "string") {
      output = result;
    } else if (result && result.output && typeof result.output === "string") {
      output = result.output;
    } else if (result && Array.isArray(result?.candidates) && result.candidates[0]) {
      output = result.candidates[0].content || JSON.stringify(result.candidates[0]);
    } else {
      output = JSON.stringify(result);
    }

    const ms = Date.now() - start;

    // Log to database
    aiLogger.logAiCall({
      userId,
      dashboardId,
      taskId,
      provider: "Gemini",
      model: "gemini-2.5-flash",
      requestPath: "/api/ai/gemini",
      prompt,
      response: output,
      responseTimeMs: ms,
      success: true
    });

    return res.json({ output });
  } catch (err) {
    const ms = Date.now() - start;
    console.error("Gemini error:", err?.message || err);

    const userId = (req.user && (req.user.id || req.user.userId)) || req.body?.userId || null;
    const dashboardId = req.body?.dashboardId || null;
    const taskId = req.body?.taskId || null;

    // Log error to database
    aiLogger.logAiCall({
      userId,
      dashboardId,
      taskId,
      provider: "Gemini",
      model: "gemini-2.5-flash",
      requestPath: "/api/ai/gemini",
      prompt: req.body?.prompt || null,
      response: null,
      responseTimeMs: ms,
      success: false,
      errorMessage: err?.message || String(err)
    });

    return res.status(500).json({
      error: "Gemini request failed",
      details: err?.message || String(err)
    });
  }
}

module.exports = { geminiPrompt };

