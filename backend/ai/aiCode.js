const ai = require("../ai/aiAssignAgent");

const prompt = `Write a Node.js Express server with one GET route. 
Respond ONLY with raw code for server.js. No backticks.`;
ai.queryOllama(prompt);
