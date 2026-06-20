import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Helper: safe JSON parsing from markdown code blocks
function parseJsonFromMarkdown(text) {
  try {
    // Try standard JSON parse first
    return JSON.parse(text);
  } catch (e) {
    // Try to extract from ```json ... ``` block
    const match = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1].trim());
      } catch (innerErr) {
        console.error('Failed to parse inner JSON block:', innerErr);
      }
    }
    throw new Error('Could not parse JSON from model response');
  }
}

// 1. Stream Narrative Analysis (RAG Augmented)
export async function streamNarrativeAnalysis(narrative, context, onChunk) {
  if (!genAI) {
    // Fallback Mock Stream if no API Key is provided
    const mockExplanation = `**ANALYSIS RESUME (DEMO MODE - NO API KEY)**\n\nBased on the incident narrative, the accused broke into Flat 402 using an iron crowbar. This involves trespassing, breaking open a dwelling house, and simple theft.\n\n* **Substantive Offenses**: Sec 303 (Theft), Sec 305 (Theft in dwelling house), and Sec 331 (House-breaking by night) of BNS, 2023.\n* **Procedural Steps**: Sec 105 BNSS (mandatory videography of the crime scene and seized articles).\n* **Evidence Presumptions**: Sec 114 BSA (Illustration a) regarding possession of stolen items soon after theft.\n\n*Next Steps*: Secure physical custody of the crowbar, obtain CCTV footage if available, and complete medical checkup of the accused.`;
    
    // Simulate streaming chunks
    const chunks = mockExplanation.split(' ');
    for (const chunk of chunks) {
      onChunk(chunk + ' ');
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    
    // Final data structure
    const mockJson = {
      bns: [
        { section: "Sec 303 BNS, 2023", desc: "Punishment for simple theft (imprisonment up to 3 years or fine).", descHi: "साधारण चोरी के लिए सजा (3 साल तक की जेल या जुर्माना)।", descGu: "સાદી ચોરી માટેની સજા (૩ વર્ષ સુધીની કેદ અથવા દંડ)." },
        { section: "Sec 305 BNS, 2023", desc: "Theft in dwelling house, means of transportation, or place of worship.", descHi: "निवास गृह, परिवहन के साधन, या पूजा स्थल में चोरी।", descGu: "રહેણાંક મકાન, વાહન વ્યવહારના સાધન અથવા પૂજાના સ્થળે ચોરી." },
        { section: "Sec 331 BNS, 2023", desc: "Lurking house-trespass or house-breaking by night in order to commit offense.", descHi: "अपराध करने के लिए रात में छिपकर गृह-अतिचार या गृह-भेदन।", gu: "ગુનો કરવાના ઇરાદે રાત્રિ દરમિયાન છૂપી રીતે ઘર-પ્રવેશ અથવા ઘરફોડ." }
      ],
      bnss: [
        { section: "Sec 105 BNSS, 2023", desc: "Mandatory videography of search and seizure operations at the crime scene.", descHi: "अपराध स्थल पर तलाशी और जब्ती कार्यों की अनिवार्य वीडियोग्राफी।", descGu: "ગુનાના સ્થળે તપાસ અને જપ્તી પ્રક્રિયાની ફરજિયાત વિડીયોગ્રાફી." },
        { section: "Sec 185 BNSS, 2023", desc: "Search by police officer during investigation.", descHi: "जांच के दौरान पुलिस अधिकारी द्वारा तलाशी।", descGu: "તપાસ દરમિયાન પોલીસ અધિકારી દ્વારા જપ્તી તપાસ." }
      ],
      bsa: [
        { section: "Sec 114 Illus (a) BSA, 2023", desc: "Presumption that person in possession of stolen goods soon after theft is either the thief or receiver.", descHi: "यह अनुमान कि चोरी के तुरंत बाद चोरी के सामान पर कब्जा रखने वाला व्यक्ति या तो चोर है या प्राप्तकर्ता है।", descGu: "ચોરીના તુરંત બાદ જપ્ત માલ સાથે પકડાયેલ વ્યક્તિ ચોર અથવા માલ રાખનાર હોવાની કાનૂની ધારણા." }
      ],
      confidence: 0.95,
      explanation: mockExplanation,
      procedures: [
        "Record search operations at the crime scene digitally as required by Section 105 BNSS.",
        "Produce the accused before the Magistrate within 24 hours of arrest (Section 187 BNSS).",
        "Arrange a medical examination for the accused at the nearest Civil Hospital (Section 53 BNSS)."
      ]
    };
    
    return mockJson;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const contextStr = context.map(c => `[Source: ${c.source}]\n${c.text}`).join('\n\n');
    
    const prompt = `You are CrimeGPT, a Senior Legal Advisor and GovTech Compliance Auditor for the State Police.
Analyze this First Information Report (FIR) narrative:
"${narrative}"

We retrieved the following statutory laws and landmark judgments from our BNS/BNSS/BSA legal database:
${contextStr}

Analyze the narrative and match it against BNS (substantive law), BNSS (procedural law), and BSA (evidence standards).
Produce:
1. Suggested BNS Sections.
2. Suggested BNSS Sections.
3. Suggested BSA Sections.
4. Confidence Score (between 0.0 and 1.0).
5. Detailed explanation of your reasoning (written in clean markdown format).
6. Procedural recommendations or next steps for the Investigating Officer.

For the sections list, make sure to output translations for English, Hindi (descHi), and Gujarati (descGu).
Provide the results in a structured JSON format. We want you to output a JSON object containing the fields: 'bns', 'bnss', 'bsa', 'confidence', 'explanation', and 'procedures'.

Format the response EXACTLY as a JSON object inside a single markdown code block:
\`\`\`json
{
  "bns": [{ "section": "Sec 303 BNS, 2023", "desc": "description in English", "descHi": "description in Hindi", "descGu": "description in Gujarati" }],
  "bnss": [{ "section": "Sec 105 BNSS, 2023", "desc": "...", "descHi": "...", "descGu": "..." }],
  "bsa": [{ "section": "Sec 114 Illus (a) BSA, 2023", "desc": "...", "descHi": "...", "descGu": "..." }],
  "confidence": 0.92,
  "explanation": "Detailed markdown explanation text here...",
  "procedures": ["Procedure step 1...", "Procedure step 2..."]
}
\`\`\``;

    const result = await model.generateContentStream(prompt);
    let fullText = '';
    
    for (const chunk of result.stream) {
      const text = chunk.text();
      fullText += text;
      // Extract the explanation if possible, or stream the raw text chunks to show live progress
      // For simplicity in displaying "reasoning", we stream the text chunks to the client
      onChunk(text);
    }
    
    const parsed = parseJsonFromMarkdown(fullText);
    return parsed;
  } catch (error) {
    console.error('Gemini Narrative streaming failed:', error);
    throw error;
  }
}

// 2. Agentic Compliance Auditor
export async function auditCompliance(caseData) {
  if (!genAI) {
    // Fallback Mock Compliance Audit
    const hasMedical = caseData.timeline.some(t => t.type === 'medical' || t.event.toLowerCase().includes('medical'));
    const hasWitness = caseData.witnesses.length > 0;
    const hasSeizure = caseData.seizedItems.length > 0;
    
    const missing = [];
    if (!hasMedical) missing.push("Mandatory Medical Examination of the accused under Section 53 BNSS.");
    if (!hasWitness) missing.push("Recording of witness statements under Section 180 BNSS.");
    if (!hasSeizure) missing.push("Videography record of seizure operations under Section 105 BNSS.");
    
    const score = Math.max(30, 100 - (missing.length * 20));
    return {
      status: score >= 70 ? 'PASS' : 'FAIL',
      score,
      missingItems: missing,
      relevantSections: ["Section 53 BNSS (Medical Examination)", "Section 105 BNSS (Videography of Seizure)", "Section 180 BNSS (Witness Statements)", "Section 187 BNSS (Remand Timelines)"]
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const prompt = `You are the CrimeGPT Agentic Compliance Auditor.
Review the following police case files details:
- FIR Number: ${caseData.firNo}
- Accused: ${caseData.accused.name} (Arrested: ${caseData.accused.arrestDate || 'No Date'} at ${caseData.accused.arrestTime || 'No Time'})
- Narrative: ${caseData.narrative}
- Witnesses recorded: ${caseData.witnesses.map(w => `${w.name} (${w.relation})`).join(', ') || 'None'}
- Seized items: ${caseData.seizedItems.map(i => i.name).join(', ') || 'None'}
- Timeline logs: ${caseData.timeline.map(t => `${t.date} ${t.time}: ${t.event} [Type: ${t.type}]`).join('\n') || 'None'}

Verify the case for statutory compliance with the Bharatiya Nagarik Suraksha Sanhita (BNSS, 2023):
1. Medical Examination: Check if the accused was taken for a medical exam within 24 hours of arrest (Section 53 BNSS).
2. Witness Statements: Check if witness statements are present and properly recorded (Section 180 BNSS).
3. Seizure Records: Check if seizure operations were videographed/documented (Section 105 BNSS).
4. Presentation Timeline: Check if the accused was presented before a Magistrate within 24 hours (Section 187 BNSS).

Evaluate if the case gets a PASS or FAIL. Provide a compliance score (0 to 100), list the missing items, and mention the relevant BNSS sections.
Format your output exactly as a JSON block:
\`\`\`json
{
  "status": "PASS" or "FAIL",
  "score": 85,
  "missingItems": ["Item 1...", "Item 2..."],
  "relevantSections": ["Sec 53 BNSS...", "Sec 105 BNSS..."]
}
\`\`\``;

    const result = await model.generateContent(prompt);
    return parseJsonFromMarkdown(result.response.text());
  } catch (error) {
    console.error('Compliance Audit failed:', error);
    throw error;
  }
}

// 3. Witness Contradiction Detector
export async function detectWitnessContradictions(narrative, witnesses) {
  if (!genAI) {
    // Fallback Mock Contradictions
    if (witnesses.length < 2) {
      return {
        contradictions: [],
        confidenceScore: 100
      };
    }
    
    // Simulate a simple timeline contradiction check for demo
    return {
      contradictions: [
        {
          type: "Time Conflict",
          statement1: "Incident occurred around 02:30 AM (Narrative).",
          statement2: "Neighbor Maheshbhai Vyas heard noises at 02:25 AM.",
          explanation: "Minor difference of 5 minutes in time perception between narrative registration and neighbor awareness, but not critical.",
          confidenceScore: 0.90
        },
        {
          type: "Sequence/Behavior Conflict",
          statement1: "Accused broke open the balcony door using a crowbar (Narrative).",
          statement2: "Security guard Suresh Patel saw a man jumping the wall at 02:45 AM carrying a backpack.",
          explanation: "Timeline shows the neighbor heard noises at 02:25 AM, narrative logs incident at 02:30 AM, and guard saw accused fleeing at 02:45 AM. This sequence is coherent but requires verifying the flight route.",
          confidenceScore: 0.85
        }
      ],
      confidenceScore: 88
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const witnessesStr = witnesses.map((w, idx) => `Witness #${idx+1} [Name: ${w.name}, Role: ${w.relation}]: "${w.statement}"`).join('\n\n');
    
    const prompt = `You are the CrimeGPT Witness Contradiction Detector.
Analyze the primary incident narrative:
"${narrative}"

Compare it with the following witness statements:
${witnessesStr}

Your goal is to detect any contradictions, discrepancies, or anomalies in:
1. Time (e.g. conflicting times of presence or incident occurrence).
2. Location (e.g. accused spotted in different places at the same time).
3. Sequence of events (e.g. order of entry, flight, actions).

List the contradictions detected, extract the contradicting parts, explain the discrepancy, and rate the confidence score of the contradiction (0.0 to 1.0) and the overall witness coherence score.

Format the response exactly as a JSON block:
\`\`\`json
{
  "contradictions": [
    {
      "type": "Time Conflict" or "Location Conflict" or "Sequence Conflict",
      "statement1": "statement text 1",
      "statement2": "statement text 2",
      "explanation": "Detailed explanation of why this is a contradiction...",
      "confidenceScore": 0.92
    }
  ],
  "confidenceScore": 85
}
\`\`\``;

    const result = await model.generateContent(prompt);
    return parseJsonFromMarkdown(result.response.text());
  } catch (error) {
    console.error('Witness contradiction detection failed:', error);
    throw error;
  }
}

// 4. OCR Extract Fields Parser
export async function extractOcrFields(ocrText) {
  if (!genAI) {
    // Fallback Mock OCR extraction
    return {
      accusedName: "",
      accusedAge: null,
      accusedAddress: "",
      victimName: "",
      victimAge: null,
      seizedArticles: []
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Use flash for fast text parsing
    const prompt = `You are a legal document data parser. Extract structured fields from the following OCR text extracted from police files:
"${ocrText}"

We need to extract:
1. Accused Name (or Alias)
2. Accused Age (integer)
3. Accused Address
4. Victim Name
5. Victim Age (integer)
6. Seized articles (as a list of objects with fields: name, description, quantity)

If a field is not found in the text, leave it blank or null.
Format your output exactly as a JSON block:
\`\`\`json
{
  "accusedName": "extracted name",
  "accusedAge": 28,
  "accusedAddress": "extracted address",
  "victimName": "extracted victim name",
  "victimAge": 42,
  "seizedArticles": [
    { "name": "article name", "description": "details", "quantity": "1 unit" }
  ]
}
\`\`\``;

    const result = await model.generateContent(prompt);
    return parseJsonFromMarkdown(result.response.text());
  } catch (error) {
    console.error('OCR field extraction failed:', error);
    throw error;
  }
}
