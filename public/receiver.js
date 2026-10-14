const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

// This function is embedded as source into the offline file. It has no imports,
// network calls, answer key, structural checker or access to authoring storage.
function receiverRuntime() {
  const packet = JSON.parse(document.querySelector('#packet').textContent);
  const form = document.querySelector('form');
  const status = document.querySelector('#status');
  const progress = document.querySelector('#progress');
  let dirty = false;
  form.addEventListener('input', () => { dirty = true; });
  form.addEventListener('change', () => {
    dirty = true;
    let completed = 0;
    packet.cases.forEach(item => {
      const selected = form.elements[`${item.id}-status`].value;
      const field = form.elements[`${item.id}-field`];
      field.closest('.concern').hidden = selected !== 'blocked';
      field.required = selected === 'blocked';
      if (selected) completed += 1;
    });
    progress.textContent = `${completed} of ${packet.cases.length} cases reviewed`;
    status.textContent = 'Your answers stay in this page until you download them.';
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const answers = Object.fromEntries(packet.cases.map(item => [item.id, {
      status: form.elements[`${item.id}-status`].value,
      field: form.elements[`${item.id}-field`].value || 'owner',
      note: form.elements[`${item.id}-note`].value
    }]));
    const response = { format: 'blind-handoff-response', version: packet.version, packet, answers, completedAt: new Date().toISOString() };
    const url = URL.createObjectURL(new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `blind-handoff-response-${packet.id.slice(0, 8)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    dirty = false;
    status.textContent = 'Response file prepared. Return that JSON file to the person who gave you this note. No upload was made.';
  });
  window.addEventListener('beforeunload', event => {
    if (dirty) { event.preventDefault(); event.returnValue = ''; }
  });
}

export function receiverHTML(packet) {
  if (!packet || typeof packet.id !== 'string' || !/^[a-f0-9-]{36}$/.test(packet.id)) throw new Error('Invalid receiver file identity.');
  const nonce = `receiver${packet.id.replaceAll('-', '')}`;
  const json = JSON.stringify(packet).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
  const cases = packet.cases.map(item => `<section class="case" aria-labelledby="title-${escape(item.id)}">
    <div class="case-title"><span class="eyebrow">RECEIVING NOTE</span><h2 id="title-${escape(item.id)}">Case ${escape(item.id)}</h2></div>
    <div class="columns"><div class="note"><dl>${[['Situation', item.note.summary], ['Owner', item.note.owner], ['Next action', item.note.action]].map(([label, value]) => `<dt>${label}</dt><dd>${value.trim() ? escape(value) : '<span class="muted">Not provided in this note.</span>'}</dd>`).join('')}</dl>
    ${item.attachment ? `<details><summary>${escape(item.attachment.title)}</summary><p>${escape(item.attachment.body)}</p></details>` : '<p class="muted">No supporting record attached.</p>'}</div>
    <div class="decision"><label for="${escape(item.id)}-status">Do you have enough information to carry out the handoff?</label><select id="${escape(item.id)}-status" name="${escape(item.id)}-status" required><option value="">Choose your response</option><option value="ready">Yes, I have enough information</option><option value="blocked">I need clarification first</option></select>
    <div class="concern" hidden><label for="${escape(item.id)}-field">What needs clarification?</label><select id="${escape(item.id)}-field" name="${escape(item.id)}-field"><option value="">Choose a detail</option><option value="owner">Who owns the next step</option><option value="action">What to do next</option><option value="evidenceId">The supporting record</option></select></div>
    <label for="${escape(item.id)}-note">Your note <span class="muted">Optional</span></label><textarea id="${escape(item.id)}-note" name="${escape(item.id)}-note" maxlength="300" rows="3" placeholder="Explain what you would do, or what you need clarified."></textarea></div></div></section>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; connect-src 'none'; img-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">
    <meta name="referrer" content="no-referrer"><title>Blind Handoff · Receiver file</title>
    <style nonce="${nonce}">
      *{box-sizing:border-box}body{margin:0;background:#f2f5f9;color:#17283e;font:15px/1.65 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}header,main,footer{max-width:1100px;margin:auto;padding:28px 24px}header{border-bottom:1px solid #cbd5e1;display:flex;justify-content:space-between;gap:16px}header strong{font-size:20px;letter-spacing:-.7px}.meta,.eyebrow{font:11px/1.7 ui-monospace,monospace;letter-spacing:1px;color:#53657e}.meta{text-align:right;letter-spacing:0}h1{font-size:38px;line-height:1.15;letter-spacing:-1.3px;margin:12px 0}h2{font-size:19px;margin:2px 0 0}p{margin:10px 0}.intro{max-width:740px;margin-bottom:28px}.muted{color:#58687c}.case{border:1px solid #cdd7e3;background:#fff;border-radius:8px;margin:24px 0;overflow:hidden}.case-title{padding:18px 24px;border-bottom:1px solid #dbe3ed}.columns{display:grid;grid-template-columns:1.1fr 1fr}.note,.decision{padding:24px}.note{background:#f9fbfd;border-right:1px solid #dbe3ed}dl{margin:0}dt,label{display:block;font-size:12px;font-weight:650;margin:0 0 6px}dd{margin:0 0 22px;white-space:pre-wrap;overflow-wrap:anywhere}dd:last-child{margin-bottom:0}details{margin-top:24px;border-top:1px solid #dbe3ed;padding-top:15px}summary{cursor:pointer;font-size:13px;font-weight:600}details p{font-size:14px;white-space:pre-wrap;overflow-wrap:anywhere}select,textarea{width:100%;font:14px/1.6 inherit;color:inherit;background:white;border:1px solid #9eafc4;border-radius:5px;padding:10px;margin-bottom:20px}select{font:14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}textarea{font:14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;resize:vertical}label .muted{font-weight:400;margin-left:6px}button{background:#193f79;color:white;border:0;border-radius:6px;padding:14px 22px;font:600 14px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;cursor:pointer}button:hover{background:#245492}:focus-visible{outline:3px solid #4f82d4;outline-offset:3px}.finish{display:flex;align-items:center;justify-content:space-between;gap:20px}#status,footer{font-size:13px;color:#53657e}#status{min-height:44px}footer{border-top:1px solid #cbd5e1}[hidden]{display:none!important}@media(max-width:680px){header,main,footer{padding:22px 18px}h1{font-size:30px}.columns{grid-template-columns:1fr}.note{border-right:0;border-bottom:1px solid #dbe3ed}.note,.decision,.case-title{padding:20px}.finish{align-items:stretch;flex-direction:column}.meta{font-size:10px}button{width:100%}}@media print{body{background:white}.decision,.finish,#status{display:none}.columns{display:block}.note{border:0}.case{break-inside:avoid}}
    </style></head><body><header><strong>blindhandoff</strong><div class="meta">RECEIVER FILE<br>RUN ${escape(String(packet.sequence).padStart(3, '0'))} · ${escape(packet.id.slice(0, 8))}</div></header><main>
    <div class="intro"><span class="eyebrow">A NOTE FROM THE PREVIOUS SHIFT</span><h1>Can you take it from here?</h1><p>Imagine you are taking over this work. Read each note and its attachment, then tell us what you would do next. This is a fictional exercise; you do not need to carry out the task.</p><p class="muted">Fictional work scenarios. This file contains only the frozen handoff and the records its author included. Your answers are not sent anywhere.</p></div>
    <form>${cases}<div class="finish"><span id="progress">0 of ${packet.cases.length} cases reviewed</span><button type="submit">Download my response</button></div><p id="status" role="status" aria-live="polite">Keep this page open until you download your answers.</p></form></main><footer>Frozen ${escape(packet.createdAt)} · Return the downloaded JSON to the author. A response records your judgment; it does not certify operational correctness.</footer>
    <script id="packet" type="application/json" nonce="${nonce}">${json}</script><script nonce="${nonce}">(${receiverRuntime.toString()})();</script><noscript>JavaScript is needed to collect and download your response. No connection is needed.</noscript></body></html>`;
}
