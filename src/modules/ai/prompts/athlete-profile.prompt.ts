export type AthleteProfilePromptInput = {
  fullName: string;
  usernames: string[];
};

export const athleteProfilePrompt = (input: AthleteProfilePromptInput): string =>
  `
  Athlete Name: ${input.fullName}
   Known usernames/handles: ${input.usernames.join(", ") || "(none)"}

 Using reliable publicly available knowledge about THIS SPECIFIC athlete, return ONLY a valid JSON object with the following structure:

{
  "country": "ISO 3166-1 alpha-2 country code or null",
  "countryName": "Full country name or null",
  "description": "A concise 1-2 sentence biography or null",
  "languages": ["ISO 639-1 language codes only"],
  "categories": ["Relevant categories"],
  "gender": "male | female | null",
  "healthConditions": ["Relevant health-related tags"],
  "personalHealthConnections": [
    {
      "condition": "Health condition",
      "relationship": "self | immediate_family",
      "reason": "Short factual explanation"
    }
  ]
}

Rules:

1. Return ONLY valid JSON. Do not include markdown, explanations or additional text.

2. Base every field ONLY on reliable, publicly documented information about THIS athlete.

3. Never fabricate, infer or assume facts.

4. If information cannot be reliably verified:
   - Return null for scalar fields.
   - Return [] for array fields.

5. Categories:
   Return all relevant categories whenever possible, including:
   - Primary sport(s)
   - Profession(s)
   - Coaching roles
   - Commentary roles
   - Authorship
   - Public advocacy
   - Other notable public identities

6. healthConditions

   Return every publicly documented health-related tag associated with the athlete.

   Consider:
   - Medical conditions
   - Chronic illnesses
   - Diseases
   - Disabilities
   - Paralympic classifications
   - Major career-defining injuries
   - Major surgeries
   - Rehabilitation
   - Disease survivor status
   - Mental health conditions publicly disclosed
   - Health advocacy
   - Awareness campaigns
   - Health-related charities
   - Other notable health-related public contributions

   Use the MOST SPECIFIC tags possible.

   Examples:
   - ACL Tear
   - Achilles Tendon Rupture
   - Breast Cancer Survivor
   - Throat Cancer Survivor
   - Type 1 Diabetes
   - Asthma
   - ADHD
   - Depression
   - HIV
   - Mental Health Advocate
   - Breast Cancer Awareness

   Do not include routine, temporary or insignificant injuries.

7. personalHealthConnections

   This field represents ONLY genuine PERSONAL connections.

   Include an entry ONLY if one of the following is publicly documented:

   • The athlete personally had, has, or survived the condition.
   • The athlete publicly disclosed having the condition.
   • The athlete suffered the major injury.
   • An immediate family member (parent, sibling, spouse or child) had the condition AND the athlete has publicly discussed that connection.

   relationship values:
   - self
   - immediate_family

   reason:
   A short factual explanation describing the documented connection.

   Examples:

   {
     "condition": "Breast Cancer",
     "relationship": "self",
     "reason": "Publicly diagnosed with breast cancer in 2010."
   }

   {
     "condition": "ADHD",
     "relationship": "self",
     "reason": "Publicly stated that he was diagnosed with ADHD during childhood."
   }

   {
     "condition": "Breast Cancer",
     "relationship": "immediate_family",
     "reason": "Publicly discussed that his mother had breast cancer."
   }

8. IMPORTANT

   Do NOT include:
   - Awareness posts only.
   - Charity work only.
   - Campaign participation only.
   - General support for a cause.
   - Generic health or fitness discussions.
   - Nutrition or workout habits.
   - Temporary injuries.
   - Rumours or unverified reports.

   These belong in healthConditions only if appropriate, but NEVER in personalHealthConnections unless there is a genuine documented personal or immediate family connection.

9. If there is NO reliable evidence of a personal or immediate family connection, return:

   "personalHealthConnections": []

10. Before returning the JSON, silently verify that every item in personalHealthConnections is supported by well-known public documentation.

Return ONLY the JSON object.
`.trim();
