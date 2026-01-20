const { GoogleGenerativeAI } = require("@google/generative-ai");

async function geminiPrompt(req, res) {
  try {
    console.log("=== Gemini API called ===");
    console.log("Request body:", req.body);
    const prompt = req.body?.prompt;

    if (!prompt || typeof prompt !== "string") {
      console.log("Invalid prompt:", prompt);
      return res.status(400).json({ error: "Missing or invalid 'prompt' (string)" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    console.log("GEMINI_API_KEY loaded:", apiKey ? "YES (" + apiKey.substring(0, 10) + "...)" : "NO");
    console.log("Full API key length:", apiKey?.length);
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY missing in .env" });
    }

    if (apiKey.length < 20) {
      return res.status(500).json({ error: "GEMINI_API_KEY appears to be invalid (too short)" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    console.log("Creating Gemini model: gemini-2.5-flash");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    console.log("Generating content with prompt...");
    const result = await model.generateContent(prompt);
    const output = result.response.text();
    console.log("AI output generated successfully, length:", output?.length);

    return res.json({ output });
  } catch (err) {
    console.error("=== Gemini error ===");
    console.error("Error message:", err?.message || err);
    console.error("Error stack:", err?.stack);
    return res.status(500).json({
      error: "Gemini request failed",
      details: err?.message || String(err),
      code: err?.code || "UNKNOWN_ERROR"
    });
  }
}

module.exports = { geminiPrompt };
