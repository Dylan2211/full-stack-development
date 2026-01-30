const Groq = require("groq-sdk");
const aiTracker = require("../utils/aiTracker");

async function groqPrompt(req, res) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GROQ_API_KEY missing in .env" });
    }

    const groq = new Groq({ apiKey });

    // Accept either a simple prompt or full messages array
    const prompt = req.body?.prompt;
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : null;
    const system = typeof req.body?.system === "string" ? req.body.system : "You are a helpful assistant.";
      const model = typeof req.body?.model === "string" && req.body?.model.length > 0 ? req.body.model : (process.env.GROQ_MODEL || "llama-3.1-70b-versatile");
    const temperature = typeof req.body?.temperature === "number" ? req.body.temperature : 0.7;
    const max_tokens = typeof req.body?.max_tokens === "number" ? req.body.max_tokens : 1024;

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

    const start = Date.now();
    while (attempt <= maxRetries) {
      try {
        const completion = await groq.chat.completions.create({
          model,
          temperature,
          max_tokens,
          messages: chatMessages,
        });

        const choice = completion.choices?.[0];
        const output = choice?.message?.content ?? "";
        const usage = completion.usage || undefined;
        const ms = Date.now() - start;

        aiTracker.track({
          provider: 'Groq',
          model,
          prompt: prompt || JSON.stringify(messages || []),
          response: output,
          tokens: (usage?.prompt_tokens || 0) + (usage?.completion_tokens || 0),
          latencyMs: ms,
          success: true
        });

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
        console.warn(`Groq rate-limited (attempt ${attempt}/${maxRetries}), retrying in ${delaySec}s`);
        await new Promise((r) => setTimeout(r, delaySec * 1000));
        continue;
      }
    }

    // If we exit loop, return a clear error to client
    console.error("Groq final error:", lastErr?.message || lastErr);
    aiTracker.track({
      provider: 'Groq',
      model,
      prompt: prompt || JSON.stringify(messages || []),
      response: null,
      tokens: 0,
      latencyMs: Date.now() - start,
      success: false,
      errorMessage: lastErr?.message || String(lastErr)
    });
      // Handle model decommissioned errors specifically
      const groqErrorCode = lastErr?.response?.data?.error?.code || lastErr?.code || null;
      const groqErrorMessage = lastErr?.response?.data?.error?.message || lastErr?.message || '';
      if (groqErrorCode === 'model_decommissioned' || /decommissioned/i.test(groqErrorMessage)) {
        return res.status(400).json({
          error: "model_decommissioned",
          details: groqErrorMessage,
          hint: "Selected Groq model has been decommissioned. Choose a supported model such as 'llama-3.1-8b-instant' or check https://console.groq.com/docs/deprecations",
        });
      }

    if (lastErr?.status === 429 || (lastErr?.message && /quota|rate limit|429/i.test(lastErr.message))) {
      return res.status(429).json({
        error: "Groq quota or rate limit exceeded",
        details: lastErr?.message || String(lastErr),
        hint: "Check your Groq usage limits or try again later. Consider using Gemini or OpenAI as a fallback.",
      });
    }

    return res.status(500).json({
      error: "Groq request failed",
      details: lastErr?.message || String(lastErr),
    });
  } catch (err) {
    console.error("Groq initialization error:", err?.message || err);
    try {
      await logAiRequest({
        model: req.body?.model || process.env.GROQ_MODEL || "llama-3.1-8b-instant",
        request_path: "/api/ai/groq",
        prompt: req.body?.prompt || JSON.stringify(req.body?.messages || []),
        status: "error",
        error_message: err?.message || String(err),
      });
    } catch (_) {}
    return res.status(500).json({
      error: "Groq request failed",
      details: err?.message || String(err),
    });
  }
}

module.exports = { groqPrompt };
