import type { EmailData, PhishAnalysis, AnalyzeResponse } from "./types";

const ANALYZED_ATTR = "data-phishguard-analyzed";
const PANEL_ID_PREFIX = "phishguard-panel-";
const CHECK_INTERVAL_MS = 1500;

const analysisCache = new Map<string, PhishAnalysis>();

function init() {
  console.log("[PhishGuard] Content script loaded");
  setInterval(scanForNewEmails, CHECK_INTERVAL_MS);
  scanForNewEmails();
}

function scanForNewEmails() {
  const containers = document.querySelectorAll<HTMLElement>('[data-message-id]');
  containers.forEach((container) => {
    const messageId = container.getAttribute("data-message-id");
    if (!messageId) return;
    if (container.getAttribute(ANALYZED_ATTR) === "true") return;
    const body = container.querySelector(".a3s");
    if (!body) return;
    container.setAttribute(ANALYZED_ATTR, "true");
    processEmail(container, messageId);
  });
}

function extractEmailData(container: HTMLElement, messageId: string): EmailData | null {
  try {
    const senderEl = container.querySelector<HTMLElement>("[email]");
    const senderEmail = senderEl?.getAttribute("email") ?? "";
    const senderName = senderEl?.getAttribute("name") ?? senderEl?.textContent?.trim() ?? "";
    const subjectEl = document.querySelector<HTMLElement>("[data-legacy-thread-id] h2") ?? document.querySelector<HTMLElement>("h2.hP");
    const subject = subjectEl?.textContent?.trim() ?? "(no subject)";
    const bodyEl = container.querySelector<HTMLElement>(".a3s");
    const body = bodyEl?.innerText?.trim() ?? "";
    const linkEls = container.querySelectorAll<HTMLAnchorElement>(".a3s a[href]");
    const links = Array.from(linkEls).map((a) => a.href).filter((href) => href.startsWith("http")).slice(0, 20);
    if (!senderEmail && !body) return null;
    return { sender: senderName, senderEmail, subject, body, links, messageId };
  } catch (err) {
    console.warn("[PhishGuard] Extraction error:", err);
    return null;
  }
}

async function processEmail(container: HTMLElement, messageId: string) {
  injectBadge(container, messageId, "scanning");

  if (analysisCache.has(messageId)) {
    injectBadge(container, messageId, "result", analysisCache.get(messageId)!);
    return;
  }

  const emailData = extractEmailData(container, messageId);
  if (!emailData) { removeBadge(messageId); return; }

  chrome.runtime.sendMessage(
    { type: "ANALYZE_EMAIL", email: emailData },
    (response: AnalyzeResponse) => {
      if (chrome.runtime.lastError) { removeBadge(messageId); return; }
      if (response?.error === "NO_API_KEY") { injectBadge(container, messageId, "no_key"); return; }
      if (response?.analysis) {
        analysisCache.set(messageId, response.analysis);
        injectBadge(container, messageId, "result", response.analysis);
      } else {
        removeBadge(messageId);
      }
    }
  );
}

function removeBadge(messageId: string) {
  document.getElementById(PANEL_ID_PREFIX + messageId)?.remove();
}

function injectBadge(container: HTMLElement, messageId: string, state: "scanning" | "result" | "no_key", analysis?: PhishAnalysis) {
  removeBadge(messageId);

  const panel = document.createElement("div");
  panel.id = PANEL_ID_PREFIX + messageId;
  panel.style.cssText = "font-family:'Google Sans',Roboto,sans-serif;margin:8px 16px 0 16px;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.12);animation:phishguardFadeIn 0.3s ease;";

  if (!document.getElementById("phishguard-styles")) {
    const style = document.createElement("style");
    style.id = "phishguard-styles";
    style.textContent = `
      @keyframes phishguardFadeIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
      @keyframes phishguardSpin { to{transform:rotate(360deg)} }
      .phishguard-signal { padding:6px 12px;font-size:12px;line-height:1.4;border-bottom:1px solid rgba(0,0,0,0.05); }
      .phishguard-signal:last-child { border-bottom:none; }
      .phishguard-toggle { background:none;border:none;cursor:pointer;font-size:12px;padding:4px 8px;border-radius:4px; }
      .phishguard-toggle:hover { background:rgba(0,0,0,0.06); }
    `;
    document.head.appendChild(style);
  }

  if (state === "scanning") {
    panel.innerHTML = `<div style="background:#f8f9fa;border:1px solid #e0e0e0;border-radius:10px;padding:10px 14px;display:flex;align-items:center;gap:10px;"><div style="width:14px;height:14px;border:2px solid #1a73e8;border-top-color:transparent;border-radius:50%;animation:phishguardSpin 0.8s linear infinite;flex-shrink:0;"></div><span style="font-size:12px;color:#5f6368;">PhishGuard is analyzing this email…</span></div>`;
  } else if (state === "no_key") {
    panel.innerHTML = `<div style="background:#fff3e0;border:1px solid #ffb74d;border-radius:10px;padding:10px 14px;display:flex;align-items:center;gap:10px;"><span style="font-size:16px;">🔑</span><span style="font-size:12px;color:#e65100;">PhishGuard needs an API key. <strong>Click the extension icon</strong> to add one.</span></div>`;
  } else if (state === "result" && analysis) {
    const { bg, border, icon, label, textColor } = getRiskStyle(analysis.score);
    const signalsHtml = analysis.signals.map((s) => {
      const dot = getSeverityDot(s.severity);
      return `<div class="phishguard-signal"><span style="margin-right:6px;">${dot}</span><strong style="color:#202124;">${s.label}:</strong><span style="color:#5f6368;"> ${s.detail}</span></div>`;
    }).join("");

    panel.innerHTML = `
      <div style="background:${bg};border:1px solid ${border};border-radius:10px;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;" id="phishguard-header-${messageId}">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:16px;">${icon}</span>
            <span style="font-size:12px;font-weight:700;color:${textColor};">${label}</span>
            <span style="font-size:12px;color:#5f6368;">— ${analysis.summary}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:11px;font-weight:700;color:${textColor};background:rgba(0,0,0,0.08);padding:2px 8px;border-radius:20px;">Score: ${analysis.score}/100</span>
            <button class="phishguard-toggle" id="phishguard-toggle-${messageId}" style="color:#5f6368;">▼ Details</button>
          </div>
        </div>
        <div id="phishguard-signals-${messageId}" style="display:none;border-top:1px solid ${border};">
          ${signalsHtml}
          ${analysis.score >= 40 ? `<div style="padding:8px 14px;display:flex;gap:8px;"><button onclick="this.closest('[id^=phishguard-panel]').remove()" style="font-size:11px;padding:5px 12px;border-radius:6px;border:1px solid #dadce0;background:white;cursor:pointer;color:#5f6368;">Dismiss</button><button onclick="alert('Report submitted!')" style="font-size:11px;padding:5px 12px;border-radius:6px;border:none;background:#d93025;cursor:pointer;color:white;font-weight:600;">🚫 Report Phishing</button></div>` : ""}
        </div>
      </div>`;

    setTimeout(() => {
      const toggleBtn = document.getElementById(`phishguard-toggle-${messageId}`);
      const signalsDiv = document.getElementById(`phishguard-signals-${messageId}`);
      if (toggleBtn && signalsDiv) {
        toggleBtn.addEventListener("click", () => {
          const open = signalsDiv.style.display !== "none";
          signalsDiv.style.display = open ? "none" : "block";
          toggleBtn.textContent = open ? "▼ Details" : "▲ Hide";
        });
      }
    }, 0);
  }

  const bodyEl = container.querySelector<HTMLElement>(".a3s");
  if (bodyEl?.parentElement) {
    bodyEl.parentElement.insertBefore(panel, bodyEl);
  } else {
    container.prepend(panel);
  }
}

function getRiskStyle(score: number) {
  if (score >= 75) return { bg: "#fce8e6", border: "#f28b82", icon: "🚨", label: "HIGH RISK — Likely Phishing", textColor: "#c5221f" };
  if (score >= 40) return { bg: "#fef7e0", border: "#fbbc04", icon: "⚠️", label: "SUSPICIOUS — Verify Before Acting", textColor: "#b45309" };
  return { bg: "#e6f4ea", border: "#81c995", icon: "✅", label: "LIKELY SAFE", textColor: "#137333" };
}

function getSeverityDot(severity: string): string {
  const map: Record<string, string> = { critical: "🔴", high: "🟠", medium: "🟡", safe: "🟢" };
  return map[severity] ?? "⚪";
}

init();
