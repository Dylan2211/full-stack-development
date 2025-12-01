const { exec } = require("child_process");

function runAICommand(command) {
  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      resolve({
        success: !error,
        stdout,
        stderr,
      });
    });
  });
}

module.exports = { runAICommand };
