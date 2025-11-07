const fetch = require("node-fetch");

const agents = [
  // { name: "Claude Code", skills: ["Node.js", "Express", "JWT"] },
  {
    name: "Ollama",
    skills: ["Reasoning", "Natural Language", "Task Analysis"],
  },
];

async function queryOllama(prompt, model = "llama3") {
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
    const analysis = await queryOllama(
      `Given this task: ${task.description}.
      Required skills: ${taskSkills.join(", ")}.
      Suggest the most suitable AI agent name or confirm Ollama should handle it.`
    );

    return {
      assignedAgent: analysis || "Ollama",
      agentMatchScore: Math.round(bestScore),
      agentProgress: 0,
      status: "Pending",
    };
  }

  return {
    assignedAgent: bestMatch.name,
    agentMatchScore: Math.round(bestScore),
    agentProgress: 0,
    status: "Pending",
  };
}

module.exports = aiAssignAgent;
