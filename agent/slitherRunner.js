import { spawn } from "child_process";

function runSlither(contractPath) {
  return new Promise((resolve, reject) => {

    const slither = spawn("slither", [contractPath, "--json", "-"]);

    let stdout = "";
    let stderr = "";

    slither.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    slither.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    slither.on("close", (code) => {

      if (!stdout) {
        return reject(`Slither error: ${stderr}`);
      }

      try {

        const jsonStart = stdout.indexOf("{");

        if (jsonStart === -1) {
          return reject("No JSON output from Slither");
        }

        const jsonString = stdout.slice(jsonStart);
        const result = JSON.parse(jsonString);
        
        resolve(result);

      } catch (err) {

        reject(`Failed to parse Slither JSON: ${err.message}`);

      }

    });

  });
}

export default runSlither;