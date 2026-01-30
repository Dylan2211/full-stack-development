const aiLogger = require("../utils/aiLogger");

/**
 * Auto-assign AI function that tries multiple providers as fallbacks
 * @param {string} prompt - The prompt to send to AI
 * @param {Object} context - Context object with userId, dashboardId, taskId, requestPath
 * @returns {Promise<{output: string, provider: string}>} - Response with output and provider used
 */
async function autoAssignAI(prompt, context = {}) {
  const { userId, dashboardId, taskId, requestPath } = context;
  
  // List of providers to try in order
  const providers = [
    { name: 'Gemini', tryFunction: tryGemini },
    { name: 'OpenAI', tryFunction: tryOpenAI },
    { name: 'Groq', tryFunction: tryGroq }
  ];
  
  console.log("[autoAssignAI] Trying providers in order:", providers.map(p => p.name).join(', '));
  
  for (const provider of providers) {
    try {
      console.log(`[autoAssignAI] Attempting ${provider.name}...`);
      const result = await provider.tryFunction(prompt, context);
      
      if (result && result.trim()) {
        console.log(`[autoAssignAI] Success with ${provider.name}`);
        return {
          output: result.trim(),
          provider: provider.name
        };
      }
    } catch (error) {
      console.log(`[autoAssignAI] ${provider.name} failed:`, error.message);
      continue;
    }
  }
  
  throw new Error("All AI providers failed");
}

/**
 * Try Gemini API
 */
async function tryGemini(prompt, context) {
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const { userId, dashboardId, taskId, requestPath } = context;
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.length < 20) {
    throw new Error("GEMINI_API_KEY missing or invalid");
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  const start = Date.now();
  const result = await model.generateContent(prompt);
  const ms = Date.now() - start;
  
  let output = "";
  if (result && result.response && typeof result.response.text === "function") {
    output = await result.response.text();
  } else {
    throw new Error("Invalid response from Gemini");
  }
  
  // Log success
  aiLogger.logAiCall({
    userId,
    dashboardId,
    taskId,
    provider: "Gemini",
    model: "gemini-2.5-flash",
    prompt: prompt.substring(0, 1000),
    output: output.substring(0, 1000),
    responseTimeMs: ms,
    status: "success",
    requestPath: requestPath || "/api/ai/auto-assign"
  });
  
  return output;
}

/**
 * Try OpenAI API
 */
async function tryOpenAI(prompt, context) {
  const OpenAI = require("openai");
  const { userId, dashboardId, taskId, requestPath } = context;
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY missing");
  }
  
  const openai = new OpenAI({ apiKey });
  const model = "gpt-4o-mini";
  
  const start = Date.now();
  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.7,
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: prompt }
    ],
  });
  const ms = Date.now() - start;
  
  const output = completion.choices?.[0]?.message?.content;
  if (!output) {
    throw new Error("No response from OpenAI");
  }
  
  // Log success
  aiLogger.logAiCall({
    userId,
    dashboardId,
    taskId,
    provider: "OpenAI",
    model,
    prompt: prompt.substring(0, 1000),
    output: output.substring(0, 1000),
    responseTimeMs: ms,
    status: "success",
    requestPath: requestPath || "/api/ai/auto-assign"
  });
  
  return output;
}

/**
 * Try Groq API
 */
async function tryGroq(prompt, context) {
  const Groq = require("groq-sdk");
  const { userId, dashboardId, taskId, requestPath } = context;
  
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY missing");
  }
  
  const groq = new Groq({ apiKey });
  const model = "llama-3.3-70b-versatile";
  
  const start = Date.now();
  const completion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: prompt }
    ],
    model,
    temperature: 0.7,
  });
  const ms = Date.now() - start;
  
  const output = completion.choices?.[0]?.message?.content;
  if (!output) {
    throw new Error("No response from Groq");
  }
  
  // Log success
  aiLogger.logAiCall({
    userId,
    dashboardId,
    taskId,
    provider: "Groq",
    model,
    prompt: prompt.substring(0, 1000),
    output: output.substring(0, 1000),
    responseTimeMs: ms,
    status: "success",
    requestPath: requestPath || "/api/ai/auto-assign"
  });
  
  return output;
}

module.exports = { autoAssignAI };