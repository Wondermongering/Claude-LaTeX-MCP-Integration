/* ---------------------------------------------------------------
 * Claude‑Eq ▸ Background service‑worker
 * ------------------------------------------------------------- */

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Claude‑Eq] extension installed');
});

/**
 * Fetch helper that respects user‑saved endpoint settings.
 */
async function fetchEquation({ text, format, numbered }) {
  const cfg = await chrome.storage.sync.get({
    apiUrl: 'http://localhost:3000',
    apiEndpoint: '/tools/equation/generate'
  });

  const url = cfg.apiUrl.replace(/\/$/, '') + cfg.apiEndpoint;

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: text,
      format,
      numbered
    })
  });

  if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
  const { result } = await resp.json();
  return result;          // { latex, … }
}

/**
 * Message router
 */
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== 'GEN_EQUATION') return;

  fetchEquation(msg)
    .then(res => sendResponse({ latex: res.latex }))
    .catch(err => sendResponse({ error: err.message }));

  return true; // keep message channel open
});
