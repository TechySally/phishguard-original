export interface EmailData {
  sender: string;
  senderEmail: string;
  subject: string;
  body: string;
  links: string[];
  messageId: string;
}

export interface PhishSignal {
  label: string;
  detail: string;
  severity: "critical" | "high" | "medium" | "safe";
}

export interface PhishAnalysis {
  score: number;
  verdict: "high_risk" | "suspicious" | "safe";
  summary: string;
  signals: PhishSignal[];
  analyzedAt: number;
}

export interface AnalyzeRequest {
  type: "ANALYZE_EMAIL";
  email: EmailData;
}

export interface AnalyzeResponse {
  type: "ANALYSIS_RESULT";
  messageId: string;
  analysis: PhishAnalysis | null;
  error?: string;
}

export interface SetApiKeyRequest {
  type: "SET_API_KEY";
  apiKey: string;
}

export type MessageToBackground = AnalyzeRequest | SetApiKeyRequest;
