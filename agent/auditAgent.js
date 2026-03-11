import path from "path";
import runSlither from "./slitherRunner.js";
import parseReport from "./reportParser.js";
import { analyzeWithGemini } from "./aiAnalyzer.js";

export async function audit(contractPath) {

    console.log("Running Slither analysis...\n");

    try {

        const slitherResult = await runSlither(contractPath);
        const findings = parseReport(slitherResult);

        let score = 100;
        score -= findings.length * 10;
        if (score < 0) score = 0;

        const aiAnalysis = await analyzeWithGemini(findings);

        return {
            contract: contractPath,
            vulnerabilities: findings,
            securityScore: score,
            aiAnalysis
        };

    } catch (error) {

        console.error("Audit failed:", error);

        return {
            contract: contractPath,
            vulnerabilities: [],
            securityScore: 0,
            aiAnalysis: "AI analysis unavailable."
        };

    }
}

async function main() {

    const contractFile = process.argv[2];

    if (!contractFile) {
        console.log("Usage: node agent/auditAgent.js <contract.sol>");
        return;
    }

    const contractPath = path.resolve(contractFile);

    const report = await audit(contractPath);

    console.log("\n===== SECURITY REPORT =====\n");

    console.log("Security Score:", report.securityScore);

    console.log("\nVulnerabilities Found:");

    report.vulnerabilities.forEach((v, i) => {

        console.log(`\n#${i + 1}`);
        console.log("Type:", v.vulnerability);
        console.log("Impact:", v.impact);
        console.log("Confidence:", v.confidence);
        console.log("Details:", v.description);

    });

    console.log("\n===== AI ANALYSIS =====\n");
    console.log(report.aiAnalysis);

}

import { fileURLToPath } from "url";

const currentFile = fileURLToPath(import.meta.url);

if (process.argv[1] === currentFile) {
  main();
}