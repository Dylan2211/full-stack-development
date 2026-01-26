const agents = [
  // { name: "Claude Code", skills: ["Node.js", "Express", "JWT"] },
  {
    name: "Ollama",
    skills: ["Reasoning", "Natural Language", "Task Analysis"],
  },
];

async function queryOllama(prompt, model = "gemma3:4b") {
  try {
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
  } catch (error) {
    // Ollama not available, silently use fallback
    return null;
  }
}

async function aiAssignAgent(task) {
  const taskSkills = task.requiredSkills || [];
  console.log(`[Agent Assignment] Task: "${task.title}" | Required skills: [${taskSkills.join(", ")}]`);
  
  let bestMatch = null;
  let bestScore = 0;

  for (const agent of agents) {
    const matchCount = agent.skills.filter((s) =>
      taskSkills.includes(s)
    ).length;
    const score = (matchCount / taskSkills.length) * 100;
    console.log(`[Agent Scoring] ${agent.name}: ${matchCount}/${taskSkills.length} skills matched = ${score}% score`);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = agent;
    }
  }
  
  if (bestMatch) {
    console.log(`[Agent Match] Best match before Ollama query: ${bestMatch.name} (${Math.round(bestScore)}% score)`);
  }

  // If Ollama is chosen or no match found, use Ollama to reason
  if (!bestMatch || bestMatch.name === "Ollama") {
    console.log(`[Agent Assignment] Querying Ollama for task analysis...`);
    const analysisPrompt = `
    You are an AI agent assigner.
    Available agents: ${JSON.stringify(agents)}
    Given this task:
    Description: ${task.description || "N/A"}
    Required skills: ${taskSkills.join(", ")}
    Respond ONLY in JSON format with these exact keys:
    {
      "assignedAgent": "string",
      "agentMatchScore": number,
      "agentProgress": number,
      "status": "string"
      "category": "string"
      "estimatedDuration": "string"
    }
    Example:
    {"assignedAgent": "Ollama", "agentMatchScore": 90, "agentProgress": 0, "status": "Pending", "category": "Analysis", "estimatedDuration": "2 hours"}
  `;

    const raw = await queryOllama(analysisPrompt);

    // If Ollama is not available, use fallback values
    if (raw === null) {
      console.log(`[Agent Assignment] Ollama unavailable - using Manual assignment (fallback)`);
      return {
        assignedAgent: "Manual",
        agentMatchScore: 0,
        agentProgress: 0,
        status: "Pending",
        category: "General",
        estimatedDuration: "Not estimated",
      };
    }

    // Try to parse JSON safely
    let parsed;
    try {
      const clean = raw.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
      console.log(`[Agent Assignment] Ollama assigned: ${parsed.assignedAgent} (${parsed.agentMatchScore}% match score)`);
    } catch {
      console.warn("Invalid JSON from Ollama, fallback used:", raw);
      parsed = {
        assignedAgent: "Ollama",
        agentMatchScore: Math.round(bestScore),
        agentProgress: 0,
        status: "Pending",
        category: "General",
        estimatedDuration: "Not estimated",
      };
      console.log(`[Agent Assignment] Fallback assigned: ${parsed.assignedAgent} (${parsed.agentMatchScore}% match score)`);
    }

    return parsed;
  }
  // Agent other than Ollama was chosen
  console.log(`[Agent Assignment] Assigned: ${bestMatch.name} (${Math.round(bestScore)}% match score - no Ollama query needed)`);
  return {
    assignedAgent: bestMatch.name,
    agentMatchScore: Math.round(bestScore),
    agentProgress: 0,
    status: "Pending",
  };
}
module.exports = { aiAssignAgent, queryOllama, agents };

// Assign Default Position Value
// SELECT ISNULL(MAX(Position), 0) + 1
// FROM Tasks
// WHERE BoardId = @BoardId;

// ORDER BY Position ASC

// SELECT BoardId
// FROM Boards
// WHERE DashboardId = @DashboardId AND Name = 'To Do';

// INSERT INTO Tasks (BoardId, Position, Title, Description, CreatedBy)
// VALUES (@ToDoBoardId, @Position, @Title, @Description, @UserId);
