/* ---------------------------------------------------------------
 * Claude‑Eq ▸ Content script
 * ------------------------------------------------------------- */
const DEFAULTS = {
  apiUrl:        'http://localhost:3000',
  apiEndpoint:   '/tools/equation/generate',
  defaultFormat: 'display',
  numbered:      false
};

let settings = { ...DEFAULTS };

chrome.storage.sync.get(Object.keys(DEFAULTS), res => {
  settings = { ...settings, ...res };
});

/* ---------- tiny UI helpers ---------- */
const css = `
.cl-equ-toolbar { display:flex; align-items:center; gap:6px; margin-right:8px; }
.cl-equ-toolbar .btn { font-weight:bold; background:#4caf50;color:#fff;border:none;padding:4px 8px;border-radius:3px; }
.cl-equ-toolbar select,.cl-equ-toolbar label{ font-size:12px; }
.cl-notify{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);
           background:#333;color:#fff;padding:8px 14px;border-radius:4px;opacity:0;transition:opacity .3s;}
.cl-notify.show{opacity:.9}
`;
const styleTag = document.createElement('style');
styleTag.textContent = css;
document.head.appendChild(styleTag);

function notify(msg, type='info'){
  const div=document.createElement('div');
  div.className='cl-notify show';
  div.style.background = type==='error'? '#d32f2f' : type==='success'? '#2e7d32' : '#333';
  div.textContent=msg;
  document.body.appendChild(div);
  setTimeout(()=>div.classList.remove('show'),2600);
  setTimeout(()=>div.remove(),3000);
}

/* ---------- inject toolbar ---------- */
function injectToolbar() {
  const topBar = document.querySelector('.toolbar-right,.menubar-right');
  if (!topBar || document.getElementById('claudeEqBtn')) return;

  const wrap = document.createElement('div');
  wrap.className = 'cl-equ-toolbar';
  wrap.innerHTML = `
    <button id="claudeEqBtn" class="btn">↳ Claude‑Eq</button>

    <select id="clEqFmt">
      <option value="inline">$…$</option>
      <option value="display">\\[ … \\]</option>
      <option value="align">align</option>
      <option value="gather">gather</option>
      <option value="multline">multline</option>
    </select>

    <label style="display:flex;align-items:center;gap:2px" title="Number equation">
      <input type="checkbox" id="clEqNum">
      <span style="user-select:none">#</span>
    </label>
  `;
  topBar.prepend(wrap);

  /* initialise */
  wrap.querySelector('#clEqFmt').value = settings.defaultFormat;
  wrap.querySelector('#clEqNum').checked = settings.numbered;

  /* persist changes */
  wrap.querySelector('#clEqFmt').addEventListener('change', e=>{
    settings.defaultFormat = e.target.value;
    chrome.storage.sync.set({ defaultFormat: settings.defaultFormat });
  });
  wrap.querySelector('#clEqNum').addEventListener('change', e=>{
    settings.numbered = e.target.checked;
    chrome.storage.sync.set({ numbered: settings.numbered });
  });

  /* click ➜ generate */
  wrap.querySelector('#claudeEqBtn').addEventListener('click', generateEquation);
}

async function generateEquation() {
  const ace = window.ace;
  if (!ace) return notify('Overleaf editor not detected','error');

  const editor = ace.edit(document.querySelector('.ace_editor'));
  const sel = editor.session.getTextRange(editor.getSelectionRange()).trim();
  if (!sel) return notify('Highlight a natural‑language description first','error');

  const btn = document.getElementById('claudeEqBtn');
  btn.disabled = true; btn.textContent = '⟳';

  try {
    const res = await chrome.runtime.sendMessage({
      type:     'GEN_EQUATION',
      text:     sel,
      format:   document.getElementById('clEqFmt').value,
      numbered: document.getElementById('clEqNum').checked
    });

    if (res?.error) throw new Error(res.error);

    editor.session.replace(editor.getSelectionRange(), res.latex);
    notify('Equation inserted','success');
  }
  catch(e){ notify(e.message,'error'); }
  finally{ btn.disabled=false; btn.textContent='↳ Claude‑Eq'; }
}

/* ---------- bootstrap once DOM ready ---------- */
(function wait(){
  if(document.querySelector('.ace_editor') && document.querySelector('.toolbar-right, .menubar-right')){
    injectToolbar();
    console.log('[Claude‑Eq] UI injected');
  } else {
    setTimeout(wait, 800);
  }
})();
