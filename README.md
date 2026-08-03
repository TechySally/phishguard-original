# 🛡️ PhishGuard

AI-powered phishing detection for Gmail. PhishGuard scans emails as you open them and shows an inline risk badge.

## Demo

[![PhishGuard demo video](https://img.youtube.com/vi/o62cqE1udFs/maxresdefault.jpg)](https://www.youtube.com/watch?v=o62cqE1udFs)

*Click the thumbnail above to watch PhishGuard in action.*

## How it works

1. A content script watches your Gmail inbox and detects when you open an email.
2. It extracts the sender, subject, body text, and any links, and sends that data to the extension's background service worker.
3. The background worker calls an LLM via OpenRouter, asking it to score the email for phishing indicators (sender spoofing, urgency manipulation, suspicious links, impersonation, etc).
4. A color-coded badge is injected above the email body showing the verdict, a risk score, and expandable details.


## Features

- 🚨 **Risk scoring (0–100)** with three tiers: Likely Safe, Suspicious, High Risk
- 🔍 **Explainable signals** — each verdict comes with specific reasons (e.g. spoofed sender domain, urgency language, suspicious link destination)
- 🆓 **Free to run** — uses OpenRouter's free-tier models, with automatic fallback across multiple models if one is rate-limited or unavailable
- ⚡ **Fast & lightweight** — results are cached per email so re-opening a thread doesn't re-analyze it
- 🚫 **One-click report** — flag high-risk emails directly from the badge


## Installation

### 1. Get a free OpenRouter API key
Sign up at [openrouter.ai](https://openrouter.ai) and generate an API key from your account settings. No payment method is required to use free-tier models.

### 2. Build the extension
\`\`\`bash
npm install
npm run build
\`\`\`
This compiles the TypeScript source and outputs a loadable extension into `dist/`.

### 3. Load it into Chrome
1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `dist/` folder

### 4. Add your API key
Click the PhishGuard icon in your Chrome toolbar and paste in your OpenRouter API key.

### 5. Open Gmail
Navigate to `mail.google.com` and open any email. PhishGuard will automatically scan it and show a badge above the message body.

## Development

\`\`\`bash
npm run dev    # watches src/ and rebuilds on change
npm run build  # one-time production build
\`\`\`

After any code change, rebuild and then click the reload icon on the PhishGuard card at `chrome://extensions` to pick up the new background script. Refresh any open Gmail tabs to reload the content script.

### Project structure
\`\`\`
src/
  background.ts   — service worker: calls OpenRouter, manages API key storage
  content.ts      — injected into Gmail: extracts email data, renders badges
  popup/          — toolbar popup for entering/saving the API key
  types.ts        — shared TypeScript types
manifest.json     — Chrome extension manifest (Manifest V3)
vite.config.ts    — build config (uses @crxjs/vite-plugin)
\`\`\`



