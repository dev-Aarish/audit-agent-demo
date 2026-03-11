import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

export async function analyzeWithGemini(vulnerabilities) {

  if (!vulnerabilities || vulnerabilities.length === 0) {
    return "No vulnerabilities detected.";
  }

const prompt = `
You are an expert Ethereum smart contract security auditor.

The following vulnerabilities were detected by the Slither static analyzer:

${JSON.stringify(vulnerabilities, null, 2)}

For EACH vulnerability provide a clear structured explanation using this format:

Vulnerability: <name>

Severity: <Critical / High / Medium / Low>

Explanation:
Explain what the vulnerability means in 2–3 sentences.

Technical Cause:
Briefly explain why the issue occurs in the contract logic.

Attack Scenario:
Describe a realistic way an attacker could exploit it in 2–3 sentences.

Impact:
Explain the potential damage (loss of funds, denial of service, logic corruption, etc.).

Recommended Fix:
Explain how the developer should fix the issue in Solidity.

Secure Coding Tip:
Provide one best-practice recommendation to avoid this issue in future contracts.

Rules:
- Keep explanations concise but technically accurate.
- Avoid long paragraphs.
- Use simple language suitable for developers.
- Maximum 120 words per vulnerability.
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt
  });

  return response.text;
}