const { queryOllama } = require("./aiOllama");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const OpenAI = require("openai");
const Groq = require("groq-sdk");

/**
 * Auto-assign AI provider - tries providers in order until one succeeds
 * Priority order: Ollama (local/free) -> Gemini -> Groq -> OpenAI
 * @param {string} prompt - The prompt to send
 * @param {object} context - Context with userId, dashboardId, taskId
 * @returns {Promise<{provider: string, model: string, output: string}>}
 */
async function autoAssignAI(prompt, context = {}) {
  const TIMEOUT = 8000;
  
  const providers = [
    {
      name: "Ollama",
      test: async () => {
        try {
          console.log("[AutoAssign] Ollama: Testing...");
          const result = await Promise.race([
            queryOllama(prompt, "gemma3:4b", {
              ...context,
              requestPath: context.requestPath || "/auto-assign"
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Ollama timeout")), TIMEOUT)
            )
          ]);
          if (result) {
            console.log("[AutoAssign] Ollama: Success!");
            return { provider: "Ollama", model: "gemma3:4b", output: result };
          }
          console.log("[AutoAssign] Ollama: No result returned");
          return null;
        } catch (err) {
          console.error("[AutoAssign] Ollama error:", err.message);
          return null;
        }
      }
    },
    {
      name: "Gemini",
      test: async () => {
        try {
          const apiKey = process.env.GEMINI_API_KEY;
          if (!apiKey || apiKey.length < 20) {
            console.log("[AutoAssign] Gemini: Missing or invalid API key");
            return null;
          }
          
          console.log("[AutoAssign] Gemini: Testing with API key...");
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
          
          const resultPromise = model.generateContent(prompt);
          const result = await Promise.race([
            resultPromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Gemini timeout")), TIMEOUT)
            )
          ]);
          console.log("[AutoAssign] Gemini: Got result, extracting output...");
          
          let output = "";
          if (result && result.response && typeof result.response.text === "function") {
            output = await result.response.text();
            console.log("[AutoAssign] Gemini: Extracted via .text() function");
          } else if (result?.response?.text && typeof result.response.text === "string") {
            output = result.response.text;
            console.log("[AutoAssign] Gemini: Extracted from .text property");
          } else if (result?.candidates?.[0]?.content?.parts?.[0]?.text) {
            output = result.candidates[0].content.parts[0].text;
            console.log("[AutoAssign] Gemini: Extracted from candidates");
          } else {
            console.warn("[AutoAssign] Gemini: Could not extract output from response");
            return null;
          }
          
          if (!output) {
            console.warn("[AutoAssign] Gemini: Output is empty");
            return null;
          }
          
          console.log("[AutoAssign] Gemini: Success!");
          return { provider: "Gemini", model: "gemini-2.5-flash", output };
        } catch (err) {
          console.error("[AutoAssign] Gemini error:", err.message);
          return null;
        }
      }
    },
    {
      name: "Groq",
      test: async () => {
        try {
          const apiKey = process.env.GROQ_API_KEY;
          if (!apiKey || apiKey.length < 20) {
            console.log("[AutoAssign] Groq: Missing or invalid API key");
            return null;
          }
          
          console.log("[AutoAssign] Groq: Testing...");
          const groq = new Groq({ apiKey });
          const completionPromise = groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.1-8b-instant",
            temperature: 0.7,
            max_tokens: 2048,
          });
          
          const completion = await Promise.race([
            completionPromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Groq timeout")), TIMEOUT)
            )
          ]);
          
          const output = completion?.choices?.[0]?.message?.content;
          if (!output) {
            console.warn("[AutoAssign] Groq: No output in response");
            return null;
          }
          
          console.log("[AutoAssign] Groq: Success!");
          return { provider: "Groq", model: "llama-3.1-8b-instant", output };
        } catch (err) {
          console.error("[AutoAssign] Groq error:", err.message);
          return null;
        }
      }
    },
    {
      name: "OpenAI",
      test: async () => {
        try {
          const apiKey = process.env.OPENAI_API_KEY;
          if (!apiKey || apiKey.length < 20) return null;
          
          const openai = new OpenAI({ apiKey });
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 2048,
          });
          
          const output = completion?.choices?.[0]?.message?.content;
          if (!output) return null;
          
          return { provider: "OpenAI", model: "gpt-4o-mini", output };
        } catch (err) {
          console.log("[AutoAssign] OpenAI unavailable:", err.message);
          return null;
        }
      }
    }
  ];

  // Try each provider in order
  for (const provider of providers) {
    console.log(`[AutoAssign] Trying ${provider.name}...`);
    const result = await provider.test();
    if (result) {
      console.log(`[AutoAssign] ✅ ${provider.name} succeeded`);
      return result;
    }
  }

  // All providers failed
  throw new Error("All AI providers unavailable");
}

/**
 * Get available AI providers (for frontend dropdown)
 * @returns {Promise<Array<{provider: string, model: string, available: boolean}>>}
 */
async function getAvailableProviders() {
  const checks = [
    {
      provider: "Ollama",
      model: "gemma3:4b",
      check: async () => {
        try {
          const result = await queryOllama("test", "gemma3:4b");
          return result !== null;
        } catch {
          return false;
        }
      }
    },
    {
      provider: "Gemini",
      model: "gemini-2.5-flash",
      check: async () => {
        const apiKey = process.env.GEMINI_API_KEY;
        return apiKey && apiKey.length >= 20;
      }
    },
    {
      provider: "Groq",
      model: "llama-3.1-8b-instant",
      check: async () => {
        const apiKey = process.env.GROQ_API_KEY;
        return apiKey && apiKey.length >= 20;
      }
    },
    {
      provider: "OpenAI",
      model: "gpt-4o-mini",
      check: async () => {
        const apiKey = process.env.OPENAI_API_KEY;
        return apiKey && apiKey.length >= 20;
      }
    }
  ];

  const results = await Promise.all(
    checks.map(async (item) => ({
      provider: item.provider,
      model: item.model,
      available: await item.check()
    }))
  );

  return results;
}

module.exports = { autoAssignAI, getAvailableProviders };