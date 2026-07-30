export const campaignPrompt = (input: unknown) => `
You are a campaign strategy assistant.

Given the following JSON input, propose campaign angles that are compliant and health-aware.

Return ONLY valid JSON:
{
  "angles": [],
  "risks": [],
  "recommendedFormats": []
}

Input:
${JSON.stringify(input)}
`;
