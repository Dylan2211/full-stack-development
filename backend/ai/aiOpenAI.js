const OpenAI = require("openai");

async function openAIPrompt(req, res) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OPENAI_API_KEY missing in .env" });
    }

    const openai = new OpenAI({ apiKey });

    // Accept either a simple prompt or full messages array
    const prompt = req.body?.prompt;
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : null;
    const system = typeof req.body?.system === "string" ? req.body.system : "You are a helpful assistant.";
    const model = typeof req.body?.model === "string" && req.body.model.length > 0 ? req.body.model : "gpt-4o-mini";
    const temperature = typeof req.body?.temperature === "number" ? req.body.temperature : 0.7;
    const max_tokens = typeof req.body?.max_tokens === "number" ? req.body.max_tokens : undefined;

    if (!messages && (!prompt || typeof prompt !== "string")) {
      return res.status(400).json({ error: "Provide 'prompt' (string) or 'messages' (array)" });
    }

    const chatMessages = messages && messages.length
      ? messages
      : [
          { role: "system", content: system },
          { role: "user", content: prompt }
        ];

    // Retry with exponential backoff for transient 429 / rate-limit errors
    const maxRetries = 4;
    let attempt = 0;
    let lastErr = null;

    while (attempt <= maxRetries) {
      try {
        const completion = await openai.chat.completions.create({
          model,
          temperature,
          max_tokens,
          messages: chatMessages,
        });

        const choice = completion.choices?.[0];
        const output = choice?.message?.content ?? "";
        const usage = completion.usage || undefined;

        return res.json({ output, model, usage });
      } catch (e) {
        lastErr = e;

        // If it's a rate-limit / quota error, retry after backoff
        const status = e?.status || e?.response?.status || null;
        const isRateLimit = status === 429 || (e?.message && /quota|rate limit|429/i.test(e.message));

        attempt += 1;
        if (!isRateLimit || attempt > maxRetries) {
          // No more retries or not a rate-limit; surface the error
          break;
        }

        // Respect Retry-After header if provided
        let retryAfter = null;
        try {
          const ra = e?.response?.headers?.get ? e.response.headers.get('retry-after') : e?.response?.headers?.['retry-after'];
          if (ra) retryAfter = parseInt(ra, 10);
        } catch (_) {
          retryAfter = null;
        }

        const delaySec = retryAfter && !isNaN(retryAfter) ? retryAfter : Math.min(2 ** attempt, 16);
        console.warn(`OpenAI rate-limited (attempt ${attempt}/${maxRetries}), retrying in ${delaySec}s`);
        await new Promise((r) => setTimeout(r, delaySec * 1000));
        continue;
      }
    }

    // If we exit loop, return a clear error to client
    console.error("OpenAI final error:", lastErr?.message || lastErr);
    if (lastErr?.status === 429 || (lastErr?.message && /quota|rate limit|429/i.test(lastErr.message))) {
      return res.status(429).json({
        error: "OpenAI quota or rate limit exceeded",
        details: lastErr?.message || String(lastErr),
        hint: "Check your OpenAI billing/usage or add retries/backoff. Consider using a different API key or the Gemini endpoint as a fallback.",
      });
    }

    return res.status(500).json({
      error: "OpenAI request failed",
      details: lastErr?.message || String(lastErr),
    });
  } catch (err) {
    console.error("OpenAI error:", err?.message || err);
    return res.status(500).json({
      error: "OpenAI request failed",
      details: err?.message || String(err),
    });
  }
}

module.exports = { openAIPrompt };
