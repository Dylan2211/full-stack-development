const fs = require("fs/promises");
const path = require("path");

async function saveAIFile(filename, content) {
  const filePath = path.join(process.cwd(), "ai_generated", filename);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
  return filePath;
}

module.exports = { saveAIFile };
