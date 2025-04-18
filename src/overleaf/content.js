/* Inject a toolbar button once the Overleaf editor loads */
const waitForEditor = setInterval(() => {
  const toolbar = document.querySelector('.toolbar-right');   // Overleaf v2 selector
  if (!toolbar) return;

  clearInterval(waitForEditor);

  // Create button
  const btn = document.createElement('button');
  btn.id = 'claudeEqBtn';
  btn.title = 'Generate LaTeX equation with Claude';
  btn.textContent = '↳ Claude‑Eq';
  btn.className = 'btn btn-default';

  toolbar.prepend(btn);

  /* Click handler */
  btn.addEventListener('click', async () => {
    const ace = window.ace;                    // Overleaf exposes Ace editor globally
    const editor = ace.edit(document.querySelector('.ace_editor'));
    const selText = editor.session.getTextRange(editor.getSelectionRange()).trim();

    if (!selText) {
      alert('Highlight a natural‑language description first.');
      return;
    }

    btn.disabled = true;
    btn.textContent = '⟳';

    /* send message to background */
    chrome.runtime.sendMessage(
      { type: 'GEN_EQUATION', text: selText },
      (resp) => {
        btn.disabled = false;
        btn.textContent = '↳ Claude‑Eq';

        if (chrome.runtime.lastError) {
          alert('Extension error: ' + chrome.runtime.lastError.message);
          return;
        }
        if (resp?.error) {
          alert('API error: ' + resp.error);
          return;
        }

        /* Replace selection with generated LaTeX */
        editor.session.replace(
          editor.getSelectionRange(),
          resp.latex
        );
      }
    );
  });
}, 1000);
