const { GoogleGenerativeAI } = require("@google/generative-ai");

async function geminiPrompt(req, res) {
  try {
    const prompt = req.body?.prompt;

    if (!prompt || typeof prompt !== "string") {
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
