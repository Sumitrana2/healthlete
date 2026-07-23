import { AppError } from "../../../middleware/errorHandler";
import type {
  AIEnrichmentInput,
  AIEnrichmentResult,
} from "../athlete/athlete.types";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export async function enrichAthleteData(
  input: AIEnrichmentInput
): Promise<AIEnrichmentResult> {
  const prompt = buildPrompt(input);

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
        model: "gpt-4.1-2025-04-14",
      // model: "gpt-5.5",
      messages: [
        {
          role: "system",
          content:
            "You are a data enrichment assistant. Based on public social media bio information, infer missing athlete profile attributes. Only return information you can reasonably infer from the given context. Never fabricate specific facts — use null or empty array instead when unsure.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.log(err,"errerrerrerr");
    throw new AppError(502, `OpenAI API failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[];
  };

  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new AppError(502, "OpenAI returned empty response");

  try {
    const parsed = JSON.parse(raw) as AIEnrichmentResult;
    return {
      country: parsed.country ?? null,
      countryName: parsed.countryName ?? null,
      description: parsed.description ?? null,
      languages: parsed.languages ?? [],
      categories: parsed.categories ?? [],
      gender: parsed.gender ?? null,
      healthConditions: parsed.healthConditions ?? [],
    };
  } catch {
    throw new AppError(502, "Failed to parse OpenAI response");
  }
}

// function buildPrompt(input: AIEnrichmentInput): string {
//   return `
//   Athlete Name: ${input.fullName}
//   Known usernames/handles: ${input.usernames.join(", ") || "(none)"}

//   Based on publicly available information about this athlete, return a JSON object with these fields:
//   {
//     "country": "ISO 3166-1 alpha-2 country code (e.g. IN, US) or null if unknown",
//     "countryName": "Full country name (e.g. India, United States) or null if unknown",
//     "description": "A short 1-2 sentence bio for this athlete, or null if you cannot determine one",
//     "languages": ["ISO 639-1 language codes only, e.g. 'en', 'hi', 'es' — NOT full language names, empty array if unknown"],
//     "categories": ["Include MULTIPLE relevant tags, not just the sport. Cover: the sport/activity itself, any notable public role or identity beyond the sport (e.g. 'Survivor', 'Advocate', 'Speaker', 'Coach', 'Author', 'Philanthropist', 'Commentator'). Example for a well-known athlete who is also a cancer survivor and public speaker: ['Tennis', 'Survivor', 'Health Advocate', 'Speaker']. Include 2-5 tags where the athlete's public profile supports it. Empty array only if truly nothing is known."],
//     "gender": "male, female, or null if unknown",
//     "healthConditions": ["Include MULTIPLE relevant health/wellness associations as short tags, separated conceptually like: [sport/fitness domain, any specific medical condition or health cause publicly disclosed, any advocacy role]. Example for an athlete who survived breast cancer and now advocates for cancer awareness: ['Tennis', 'Breast Cancer', 'Advocate']. If no specific medical condition is publicly known, still include the general fitness domain plus any wellness cause, e.g. ['Cricket', 'Fitness Advocate']. This field should never be an empty array — every athlete has at least their sport/fitness domain."]
//   }

//   Only include information you can reasonably infer from public knowledge. Do not fabricate specific personal facts — but DO include multiple short tags rather than a single generic one when the athlete's public profile supports it.
//   `.trim();
// }

// function buildPrompt(input: AIEnrichmentInput): string {
//     return `
//   Athlete Name: ${input.fullName}
//   Known usernames/handles: ${input.usernames.join(", ") || "(none)"}

//   Based on publicly available information about this athlete, return a JSON object with these fields:
//   {
//     "country": "ISO 3166-1 alpha-2 country code (e.g. IN, US) or null if unknown",
//     "countryName": "Full country name (e.g. India, United States) or null if unknown",
//     "description": "A short 1-2 sentence bio for this athlete, or null if you cannot determine one",
//     "languages": ["ISO 639-1 language codes only, e.g. 'en', 'hi', 'es' — NOT full language names, empty array if unknown"],
//     "categories": ["Include MULTIPLE relevant tags covering: the sport/activity, and any notable public role or identity (e.g. 'Olympian', 'Coach', 'Author', 'Commentator', 'Philanthropist'). Base this strictly on what is actually known about this specific athlete. Example structure only, do not copy: ['Tennis', 'Survivor', 'Speaker']. Include 2-5 tags where genuinely supported by their public profile."],
//     "gender": "male, female, or null if unknown",
//     "healthConditions": ["Research this SPECIFIC athlete's actual public health/wellness associations. Include: their sport/fitness domain, AND any specific medical condition, injury, disability, or health cause THEY THEMSELVES are publicly known for (e.g. a specific diagnosed condition, a specific charity they founded, a specific injury they recovered from and spoke about). Do NOT use generic filler terms like 'Fitness Advocate' unless this athlete specifically and verifiably advocates for fitness as a named cause. If you do not have specific verified information beyond their sport, return ONLY their sport/fitness domain as a single-item array rather than inventing a generic second tag."]
//   }

//   Only include information you can reasonably infer from public knowledge about this SPECIFIC athlete. Do not use generic placeholder tags — every tag must be something you can attribute to this particular person, not athletes in general.
//   `.trim();
//   }

// function buildPrompt(input: AIEnrichmentInput): string {
//   return `
//   Athlete Name: ${input.fullName}
//   Known usernames/handles: ${input.usernames.join(", ") || "(none)"}
  
//   Based on publicly available knowledge about this specific athlete, return a JSON object with these fields:
//   {
//     "country": "ISO 3166-1 alpha-2 country code (e.g. IN, US) or null if unknown",
//     "countryName": "Full country name (e.g. India, United States) or null if unknown",
//     "description": "A short 1-2 sentence bio for this athlete, or null if you cannot determine one",
//     "languages": ["ISO 639-1 language codes only, e.g. 'en', 'hi', 'es' — NOT full language names, empty array if unknown"],
//     "categories": ["Multiple tags covering the sport and any known public roles (e.g. 'Coach', 'Author', 'Commentator', 'Advocate' for a specific cause). Base strictly on this athlete's actual public profile."],
//     "gender": "male, female, or null if unknown",
//     "healthConditions": ["Think carefully about what you actually know about THIS specific athlete's health history and public advocacy. Consider: Have they publicly disclosed a specific illness, diagnosis, injury, or disability? Have they survived a specific disease (e.g. cancer) and spoken about it publicly? Do they specifically campaign for a named health cause (e.g. breast cancer awareness, mental health, a specific charity they founded)? If yes to any of these for THIS athlete, include it as a specific tag (e.g. 'Breast Cancer', 'Cancer Survivor', 'Mental Health Advocate') alongside their sport. Only fall back to just their sport/fitness domain if you genuinely have no specific knowledge of any health-related history or advocacy for this person — do not default to the sport-only answer out of caution when you do have relevant knowledge."]
//   }
  
//   Draw on your full knowledge of this specific athlete's public history, not just their sport. Do not fabricate facts you are unsure about, but do not omit facts you do know either.
//   `.trim();
// }


// function buildPrompt(input: AIEnrichmentInput): string {
//     return `
//   Athlete Name: ${input.fullName}
//   Known usernames/handles: ${input.usernames.join(", ") || "(none)"}
  
//   Using reliable publicly available knowledge about THIS SPECIFIC athlete, return ONLY a valid JSON object in the following format:
  
//   {
//     "country": "ISO 3166-1 alpha-2 country code or null",
//     "countryName": "Full country name or null",
//     "description": "A concise 1-2 sentence biography or null",
//     "languages": ["ISO 639-1 language codes only"],
//     "categories": ["Relevant categories"],
//     "gender": "male | female | null",
//     "healthConditions": ["Relevant health-related tags"]
//   }
  
//   Rules:
  
//   1. Return ONLY valid JSON.
  
//   2. Base every field only on reliable publicly available information about THIS athlete.
  
//   3. Never fabricate facts. If information cannot be reasonably determined, return null or [].
  
//   4. Categories:
//      - Return multiple relevant categories whenever possible.
//      - Include sport(s), profession(s), achievements, public roles and advocacy.
//      - Examples:
//        - Cricket
//        - Olympian
//        - Paralympian
//        - Coach
//        - Author
//        - Commentator
//        - Influencer
//        - Mental Health Advocate
  
//   5. HealthConditions:
//      Think beyond diagnosed diseases.
  
//      Return ALL publicly documented health-related tags associated with this athlete.
  
//      This may include:
//      - Medical conditions
//      - Chronic illnesses
//      - Disabilities
//      - Paralympic classifications
//      - Major injuries
//      - Fractures
//      - Surgeries
//      - Rehabilitation
//      - Recoveries
//      - Mental health disclosures
//      - Health advocacy
//      - Health awareness campaigns
//      - Health-related charities or foundations
//      - Disease survivor status
  
//      Use the MOST SPECIFIC tags possible.
  
//      Examples:
//      - ACL Tear
//      - Knee Injury
//      - Hamstring Injury
//      - Finger Fracture
//      - Shoulder Injury
//      - Back Injury
//      - Concussion
//      - Asthma
//      - Type 1 Diabetes
//      - ADHD
//      - Depression
//      - Anxiety
//      - Cancer Survivor
//      - Breast Cancer
//      - Mental Health Advocate
//      - Autism Awareness
  
//      These are ONLY EXAMPLES.
  
//      If THIS athlete has another publicly documented injury, surgery, illness, disability, recovery, advocacy, or health-related achievement that is not listed above, return that instead.
  
//      Return every relevant tag you know.
  
//      Return [] ONLY if there is no reliable publicly documented health-related information about this athlete.
  
//   6. Prefer specificity over generic terms.
//      For example:
//      - "ACL Tear" is better than "Leg Injury"
//      - "Finger Fracture" is better than "Fracture"
//      - "Breast Cancer Survivor" is better than "Cancer"
  
//   Return ONLY the JSON object.
//   `.trim();
//   }

function buildPrompt(input: AIEnrichmentInput): string {
  return `
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
  "healthConditions": ["Relevant health-related tags"]
}

Rules:

1. Return ONLY valid JSON. Do not include markdown or explanations.

2. Base every field ONLY on reliable publicly available information about THIS athlete.

3. Never fabricate, infer or assume facts that are not publicly documented.

4. If information cannot be reliably determined:
   - Return null for scalar fields.
   - Return [] for array fields.

5. Categories:
   - Return multiple relevant categories whenever possible.
   - Include:
     - Primary sport(s)
     - Profession(s)
     - Major public role(s)
     - Coaching roles
     - Commentary roles
     - Authorship
     - Public advocacy
     - Other notable identities associated with the athlete.

6. HealthConditions:

   Think broadly about health-related information instead of only diagnosed diseases.

   Carefully recall the athlete's complete publicly known health history before answering.

   Consider whether the athlete has publicly documented:

   • Medical conditions
   • Chronic illnesses
   • Diseases
   • Disabilities
   • Paralympic classifications
   • Major sports injuries
   • Fractures
   • Surgeries
   • Rehabilitation
   • Significant recoveries
   • Mental health disclosures
   • Disease survivor status
   • Health advocacy
   • Health awareness campaigns
   • Health-related charities or foundations
   • Other notable health-related public contributions

   Include multiple tags whenever applicable.

   Use the MOST SPECIFIC tag possible.

   Good examples:
   - ACL Tear
   - Achilles Tendon Rupture
   - Hamstring Injury
   - Finger Fracture
   - Shoulder Surgery
   - Back Injury
   - Asthma
   - Type 1 Diabetes
   - ADHD
   - Depression
   - Anxiety
   - Breast Cancer Survivor
   - Throat Cancer Survivor
   - Cancer Survivor
   - Sjögren's Syndrome
   - HIV
   - Mental Health Advocate
   - Breast Cancer Awareness

   These are examples only.

   Do NOT limit yourself to these values.

   If another publicly documented health-related tag is more appropriate, return that instead.

   Include major injuries only if they were publicly documented and became a notable part of the athlete's career.

   Do not include routine, temporary or insignificant injuries.

7. Before producing the final JSON, silently review whether there are any additional reliable health-related facts associated with this athlete that have not yet been included.

8. Return every reliable health-related tag you can identify.

9. If no reliable publicly documented health-related information exists, return an empty array.

Return ONLY the JSON object.
`.trim();
}