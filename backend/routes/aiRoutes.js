const express = require("express");
const router = express.Router();

const { geminiPrompt } = require("../ai/aiGemini");

router.get("/ping", (req, res) => {
  res.json({ ok: true, msg: "ai route mounted" });
});

// When someone POSTs to /api/ai/gemini,
// run the geminiPrompt function
router.post("/gemini", geminiPrompt);

module.exports = router;
