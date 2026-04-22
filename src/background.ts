import type { MessageToBackground, AnalyzeRequest, PhishAnalysis, EmailData } from "./types";


const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openrouter/auto";

async function analyzeWithOpenRouter(email: EmailData, apiKey: string): Promise<PhishAnalysis> {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://phishguard.extension",
      "X-Title": "PhishGuard",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildPrompt(email) },
      ],
      temperature: 0.1,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`OpenRouter error ${response.status}: ${JSON.stringify(err)}`);
  }

  const data = await response.json();
  const text: string = data?.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("Empty response from OpenRouter");

  const clean = text.replace(/```json|```/gi, "").trim();
  const parsed = JSON.parse(clean);
  const score: number = Math.max(0, Math.min(100, parsed.score ?? 0));
  const verdict = score >= 75 ? "high_risk" : score >= 40 ? "suspicious" : "safe";

  return {
    score,
    verdict,
    summary: parsed.summary ?? "",
    signals: parsed.signals ?? [],
    analyzedAt: Date.now(),
  };
}


const SYSTEM_PROMPT = `You are a cybersecurity expert specializing in phishing email analysis.
Analyze the provided email and return ONLY a valid JSON object — no markdown, no explanation, no preamble.

Return this exact schema:
{
  "score": <integer 0-100, where 0=definitely safe, 100=confirmed phishing>,
  "summary": "<one sentence plain-English verdict>",
  "signals": [
    {
      "label": "<short signal name>",
      "detail": "<specific explanation referencing the actual email content>",
      "severity": "<critical|high|medium|safe>"
    }
  ]
}

Scoring guide:
- 0-20: Clearly legitimate (known sender domain, no manipulation, safe links)
- 21-39: Slightly unusual but probably fine
- 40-74: Suspicious - verify before acting
- 75-100: High confidence phishing

Always include 3-5 signals. For safe emails, signals should have severity "safe".
Evaluate: sender domain authenticity, urgency/fear manipulation, link destinations,
impersonation attempts, unexpected requests, generic vs personalized greeting.`;

function buildPrompt(email: EmailData): string {
  const linkList = email.links.length > 0 ? email.links.join("\n") : "No links found";
  return `Analyze this email for phishing indicators:

SENDER NAME: ${email.sender}
SENDER EMAIL: ${email.senderEmail}
SUBJECT: ${email.subject}
LINKS FOUND:
${linkList}

EMAIL BODY:
${email.body.slice(0, 3000)}`;
}



chrome.runtime.onMessage.addListener(
  (message: MessageToBackground, _sender, sendResponse: (response: unknown) => void) => {
    if (message.type === "ANALYZE_EMAIL") {
      handleAnalyze(message, sendResponse);
      return true;
    }
    if (message.type === "SET_API_KEY") {
      chrome.storage.local.set({ openrouterApiKey: message.apiKey }, () => {
        sendResponse({ success: true });
      });
      return true;
    }
  }
);

async function handleAnalyze(message: AnalyzeRequest, sendResponse: (response: unknown) => void) {
  try {
    const result = await chrome.storage.local.get("openrouterApiKey");
    const apiKey: string | undefined = result.openrouterApiKey;

    if (!apiKey) {
      sendResponse({ type: "ANALYSIS_RESULT", messageId: message.email.messageId, analysis: null, error: "NO_API_KEY" });
      return;
    }

    const analysis = await analyzeWithOpenRouter(message.email, apiKey);
    sendResponse({ type: "ANALYSIS_RESULT", messageId: message.email.messageId, analysis });
  } catch (err) {
    console.error("[PhishGuard] Analysis error:", err);
    sendResponse({ type: "ANALYSIS_RESULT", messageId: message.email.messageId, analysis: null, error: err instanceof Error ? err.message : String(err) });
  }
}

export {};
