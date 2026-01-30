const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/jwtAuth");

const { geminiPrompt } = require("../ai/aiGemini");
const { openAIPrompt } = require("../ai/aiOpenAI");
const { groqPrompt } = require("../ai/aiGroq");
const { ollamaPrompt } = require("../ai/aiOllama");
const { autoAssignAI, getAvailableProviders } = require("../ai/aiAutoAssign");
const aiTracker = require("../utils/aiTracker");

router.get("/ping", (req, res) => {
  res.json({ ok: true, msg: "ai route mounted" });
});

// Require JWT auth so AI calls are attributed to the logged-in user
router.use(authMiddleware);

// When someone POSTs to /api/ai/gemini,
// run the geminiPrompt function
router.post("/gemini", geminiPrompt);

// When someone POSTs to /api/ai/openai,
// run the openAIPrompt function
router.post("/openai", openAIPrompt);

// When someone POSTs to /api/ai/groq,
// run the groqPrompt function
router.post("/groq", groqPrompt);

// When someone POSTs to /api/ai/ollama,
// run the ollamaPrompt function
router.post("/ollama", ollamaPrompt);

// Auto-assign endpoint - tries providers in order
router.post("/auto", async (req, res) => {
  try {
    const prompt = req.body?.prompt;
    const userId = (req.user && (req.user.id || req.user.userId)) || req.body?.userId || null;
    const dashboardId = req.body?.dashboardId || null;
    const taskId = req.body?.taskId || null;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'prompt' (string)" });
    }

    const start = Date.now();
    const result = await autoAssignAI(prompt, { userId, dashboardId, taskId, requestPath: req.path });
    const ms = Date.now() - start;

    // Log the successful auto-assign call
    aiTracker.track({
      userId,
      dashboardId,
      taskId,
      provider: result.provider,
      model: result.model,
      requestPath: req.path,
      prompt,
      response: result.output,
      responseTimeMs: ms,
      success: true
    });

    res.json({
      success: true,
      output: result.output,
      provider: result.provider,
      model: result.model,
      latencyMs: ms
    });
  } catch (err) {
    console.error("[/api/ai/auto] error:", err.message);
    res.status(500).json({
      error: "All AI providers unavailable",
      details: err.message
    });
  }
});

// Get available providers
router.get("/providers", async (req, res) => {
  try {
    const providers = await getAvailableProviders();
    res.json({ providers });
  } catch (err) {
    console.error("[/api/ai/providers] error:", err.message);
    res.status(500).json({ error: "Failed to check providers" });
  }
});

module.exports = router;
