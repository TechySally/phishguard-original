const y="https://openrouter.ai/api/v1/chat/completions",m="openrouter/auto";async function d(e,t){var o,c,l;const n=await fetch(y,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`,"HTTP-Referer":"https://phishguard.extension","X-Title":"PhishGuard"},body:JSON.stringify({model:m,messages:[{role:"system",content:g},{role:"user",content:f(e)}],temperature:.1,max_tokens:1024})});if(!n.ok){const h=await n.json().catch(()=>({}));throw new Error(`OpenRouter error ${n.status}: ${JSON.stringify(h)}`)}const i=await n.json(),r=((l=(c=(o=i==null?void 0:i.choices)==null?void 0:o[0])==null?void 0:c.message)==null?void 0:l.content)??"";if(!r)throw new Error("Empty response from OpenRouter");const u=r.replace(/```json|```/gi,"").trim(),s=JSON.parse(u),a=Math.max(0,Math.min(100,s.score??0)),p=a>=75?"high_risk":a>=40?"suspicious":"safe";return{score:a,verdict:p,summary:s.summary??"",signals:s.signals??[],analyzedAt:Date.now()}}const g=`You are a cybersecurity expert specializing in phishing email analysis.
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
impersonation attempts, unexpected requests, generic vs personalized greeting.`;function f(e){const t=e.links.length>0?e.links.join(`
`):"No links found";return`Analyze this email for phishing indicators:

SENDER NAME: ${e.sender}
SENDER EMAIL: ${e.senderEmail}
SUBJECT: ${e.subject}
LINKS FOUND:
${t}

EMAIL BODY:
${e.body.slice(0,3e3)}`}chrome.runtime.onMessage.addListener((e,t,n)=>{if(e.type==="ANALYZE_EMAIL")return E(e,n),!0;if(e.type==="SET_API_KEY")return chrome.storage.local.set({openrouterApiKey:e.apiKey},()=>{n({success:!0})}),!0});async function E(e,t){try{const i=(await chrome.storage.local.get("openrouterApiKey")).openrouterApiKey;if(!i){t({type:"ANALYSIS_RESULT",messageId:e.email.messageId,analysis:null,error:"NO_API_KEY"});return}const r=await d(e.email,i);t({type:"ANALYSIS_RESULT",messageId:e.email.messageId,analysis:r})}catch(n){console.error("[PhishGuard] Analysis error:",n),t({type:"ANALYSIS_RESULT",messageId:e.email.messageId,analysis:null,error:n instanceof Error?n.message:String(n)})}}
