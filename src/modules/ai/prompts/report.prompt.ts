export const reportPrompt = (input: unknown) => `
You are a partnership report assistant.

Summarize the following analytics JSON into an executive brief.

Return ONLY valid JSON:
{
  "headline": "",
  "summary": "",
  "highlights": [],
  "risks": []
}

Input:
${JSON.stringify(input)}
`;
