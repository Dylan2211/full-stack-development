const { GoogleGenerativeAI } = require("@google/generative-ai");

async function geminiPrompt(req, res) {
  try {
    const prompt = req.body?.prompt;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'prompt' (string)" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY missing in .env" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Good default model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(prompt);
    const output = result.response.text();

    return res.json({ output });
  } catch (err) {
    console.error("Gemini error:", err?.message || err);
    return res.status(500).json({
      error: "Gemini request failed",
      details: err?.message || String(err),
    });
  }
}

module.exports = { geminiPrompt };
