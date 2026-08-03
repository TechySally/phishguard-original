🛡️ PhishGuard

AI-powered phishing detection for Gmail. PhishGuard scans emails as you open them and shows an inline risk badge.

How it works
A content script watches your Gmail inbox and detects when you open an email.
It extracts the sender, subject, body text, and any links, and sends that data to the extension's background service worker.
The background worker calls an LLM via OpenRouter, asking it to score the email for phishing indicators (sender spoofing, urgency manipulation, suspicious links, impersonation, etc).
A color-coded badge is injected above the email body showing the verdict, a risk score, and expandable details.

All analysis happens through your own OpenRouter API key — no email content is ever sent anywhere except OpenRouter's inference API.

Features
🚨 Risk scoring (0–100) with three tiers: Likely Safe, Suspicious, High Risk
🔍 Explainable signals — each verdict comes with specific reasons (e.g. spoofed sender domain, urgency language, suspicious link destination)
🆓 Free to run — uses OpenRouter's free-tier models, with automatic fallback across multiple models if one is rate-limited or unavailable
⚡ Fast & lightweight — results are cached per email so re-opening a thread doesn't re-analyze it
🚫 One-click report — flag high-risk emails directly from the badge
Installation
1. Get a free OpenRouter API key

Sign up at openrouter.ai and generate an API key from your account settings. No payment method is required to use free-tier models.

Note: Free-tier models on OpenRouter may require enabling data-sharing settings under Settings → Privacy (e.g. "Enable free endpoints that may train on inputs"). Free models are provided in exchange for allowing the provider to log/train on your prompts — keep this in mind since this extension sends email content to whichever model you select.

2. Build the extension
bash
npm install
npm run build

This compiles the TypeScript source and outputs a loadable extension into dist/.

3. Load it into Chrome
Go to chrome://extensions
Enable Developer mode (top right)
Click Load unpacked
Select the dist/ folder
4. Add your API key

Click the PhishGuard icon in your Chrome toolbar and paste in your OpenRouter API key.

5. Open Gmail

Navigate to mail.google.com and open any email — PhishGuard will automatically scan it and show a badge above the message body.

Development
bash
npm run dev    # watches src/ and rebuilds on change
npm run build  # one-time production build

After any code change, rebuild and then click the reload icon on the PhishGuard card at chrome://extensions to pick up the new background script. Refresh any open Gmail tabs to reload the content script.

Project structure
src/
  background.ts   — service worker: calls OpenRouter, manages API key storage
  content.ts      — injected into Gmail: extracts email data, renders badges
  popup/          — toolbar popup for entering/saving the API key
  types.ts        — shared TypeScript types
manifest.json     — Chrome extension manifest (Manifest V3)
vite.config.ts    — build config (uses @crxjs/vite-plugin)
Troubleshooting

Badge flashes and disappears with no result
Open the background service worker's console (chrome://extensions → PhishGuard → "service worker") and look for [PhishGuard] Error: — this shows the real failure reason (bad API key, model unavailable, rate limit, etc.), which isn't visible from the Gmail page's own console.

"This model is unavailable for free" / 404 errors
OpenRouter's free-model lineup changes often. Check current free models at OpenRouter and update the MODELS array in background.ts if needed.

Stuck on "PhishGuard is analyzing this email…" indefinitely
Chrome can suspend the extension's background service worker mid-request. A 20-second client-side timeout will surface an error automatically if this happens — try the email again afterward.

Permissions
Permission	Why it's needed
storage	Store your OpenRouter API key locally
activeTab	Interact with the current tab when you click the extension icon
host_permissions: mail.google.com	Inject the content script into Gmail
host_permissions: openrouter.ai	Send analysis requests to OpenRouter

