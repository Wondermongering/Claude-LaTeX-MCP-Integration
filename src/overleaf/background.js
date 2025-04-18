/* ------------------------------------------------------------------
 * Configuration – point to your running equation‑generator server
 * ------------------------------------------------------------------ */
const API_BASE = 'http://localhost:4000';       // change to prod URL
const ENDPOINT  = '/generate';                 // your express route

chrome.runtime.onInstalled.addListener(() => {
  console.log('Claude‑Equation extension installed');
});

/* Handle message from content script */
chrome.runtime.onMessage.addListener(
  (msg, sender, sendResponse) => {
    if (msg.type !== 'GEN_EQUATION') return;

    fetch(API_BASE + ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: msg.text,
        format: 'inline',
        numbered: false
      })
    })
      .then(r => r.json())
      .then(({ result }) => sendResponse({ latex: result.latex }))
      .catch(err => sendResponse({ error: err.message }));

    // Keep channel open for async response
    return true;
  }
);
