# 🛡️ PhishGuard

AI-powered phishing detection Chrome extension for Gmail. Uses OpenRouter (free, no credit card).

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Build
npm run build

# 3. For auto-rebuild while developing
npm run dev
```

## Load into Chrome

1. Run `npm run build` first — this creates the `dist/` folder
2. Go to `chrome://extensions`
3. Toggle **Developer mode** ON (top right)
4. Click **Load unpacked** → select the `dist/` folder
5. Click the 🛡️ icon in your toolbar → paste your API key → Save
6. Open Gmail and open any email

## Add your icons

Drop these 3 files into `public/icons/`:
- `icon16.png`
- `icon48.png`
- `icon128.png`

## Get a free API key

1. Go to https://openrouter.ai
2. Sign up (email only, no credit card)
3. Click **Keys** → **Create Key** → copy it (starts with `sk-or-v1-...`)
4. Paste into the PhishGuard popup → Save
