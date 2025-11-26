const agents = [
  // { name: "Claude Code", skills: ["Node.js", "Express", "JWT"] },
  {
    name: "Ollama",
    skills: ["Reasoning", "Natural Language", "Task Analysis"],
  },
];

async function queryOllama(prompt, model = "gemma3:4b") {
  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
    }),
  });

  const data = await response.json();
  console.log("Ollama response:", data);

  if (!data || !data.response) {
    throw new Error("Invalid response from Ollama");
  }

  return data.response.trim();
}

async function aiAssignAgent(task) {
  const taskSkills = task.requiredSkills || [];
  let bestMatch = null;
  let bestScore = 0;

  for (const agent of agents) {
    const matchCount = agent.skills.filter((s) =>
      taskSkills.includes(s)
    ).length;
    const score = (matchCount / taskSkills.length) * 100;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = agent;
    }
  }

  // If Ollama is chosen or no match found, use Ollama to reason
  if (!bestMatch || bestMatch.name === "Ollama") {
    const analysisPrompt = `
    You are an AI agent assigner.
    Given this task:
    Description: ${task.description}
    Required skills: ${taskSkills.join(", ")}
    Respond ONLY in JSON format with these exact keys:
    {
      "assignedAgent": "string",
      "agentMatchScore": number,
      "agentProgress": number,
      "status": "string"
    }
    Example:
    {"assignedAgent": "Ollama", "agentMatchScore": 90, "agentProgress": 0, "status": "Pending"}
  `;

    const raw = await queryOllama(analysisPrompt);
    console.log("Ollama raw response:", raw);

    // Try to parse JSON safely
    let parsed;
    try {
      const clean = raw.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      console.warn("Invalid JSON from Ollama, fallback used:", raw);
      parsed = {
        assignedAgent: "Ollama",
        agentMatchScore: Math.round(bestScore),
        agentProgress: 0,
        status: "Pending",
      };
    }

    return parsed;
  }
}
module.exports = { aiAssignAgent, queryOllama };
