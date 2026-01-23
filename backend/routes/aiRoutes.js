const express = require("express");
const router = express.Router();

const { geminiPrompt } = require("../ai/aiGemini");
const { openAIPrompt } = require("../ai/aiOpenAI");
const { groqPrompt } = require("../ai/aiGroq");

router.get("/ping", (req, res) => {
  res.json({ ok: true, msg: "ai route mounted" });
});

// When someone POSTs to /api/ai/gemini,
// run the geminiPrompt function
router.post("/gemini", geminiPrompt);

// When someone POSTs to /api/ai/openai,
// run the openAIPrompt function
router.post("/openai", openAIPrompt);

// When someone POSTs to /api/ai/groq,
// run the groqPrompt function
router.post("/groq", groqPrompt);

module.exports = router;
