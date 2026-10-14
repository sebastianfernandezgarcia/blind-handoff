import * as domain from './domain.js';
import { EXTRA_SCENARIOS } from './scenarios.js';

const SCENARIOS = [{ id: 'common-ground', title: 'Common Ground', description: 'An afternoon handoff at a creative workshop: deliveries, uploads and room bookings.', cases: domain.CASES }, ...EXTRA_SCENARIOS];
const requestedScenario = window.location ? new URLSearchParams(window.location.search).get('scenario') : null;
const scenario = SCENARIOS.find(item => item.id === requestedScenario) || SCENARIOS[0];
const { CASES, FIELDS, REPORT_FIELDS, STORAGE_KEY, initialState, structuralIssues, makeSnapshot, finishRun, parseSaved, buildExport, saveLocalState, compareRuns, nextSequence, makeReceiverPacket, importReceiverResponse } = domain.createDomain(scenario.cases, scenario.id);
const REQUIRED_DETAILS = CASES.length * Object.keys(FIELDS).length;

import { receiverHTML } from './receiver.js';

const main = document.querySelector('#main');
const notice = document.querySelector('#notice');
document.querySelector('#workspace-name').textContent = scenario.title;
document.title = `Blind Handoff · ${scenario.title}`;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const ICONS = {
  arrow: '<path d="M4 12h15m-5-5 5 5-5 5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  file: '<path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4M12 14v3"/>',
  export: '<path d="M12 3v12m-4-4 4 4 4-4M5 16v5h14v-5"/>',
  repeat: '<path d="M19 8a8 8 0 0 0-13-2L3 9m0-6v6h6M5 16a8 8 0 0 0 13 2l3-3m0 6v-6h-6"/>',
  question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .7-1.5 1-1.5 2M12 17h.01"/>',
  compare: '<path d="M9 4H4v16h5M15 4h5v16h-5M8 9h8m-3-3 3 3-3 3M16 15H8m3-3-3 3 3 3"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  alert: '<path d="m12 3 10 18H2zM12 9v5M12 17h.01"/>'
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
const number = n => String(n).padStart(3, '0');
const stamp = value => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Time unavailable' : new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Atlantic/Canary' }).format(date);
};
let state, storageWarning = '', saved = true, storage, lastSavedRaw = null, storageConflict = false;
try { storage = window.localStorage; lastSavedRaw = storage.getItem(STORAGE_KEY); const parsed = parseSaved(lastSavedRaw); state = parsed.state; storageWarning = parsed.warning; }
catch { state = initialState(); storageWarning = 'Local saving is unavailable. Rehearse in this tab and export to keep your work.'; saved = false; }
let view = 'prepare', selected = CASES[0].id, snapshot = null, answers = {}, timer;
let reportTab = 'findings', diffCase = CASES[0].id, showUnchanged = false, guideOpen = state.runs.length === 0;

function toast(text) {
  notice.textContent = text;
  notice.classList.add('show');
  clearTimeout(timer);
  timer = setTimeout(() => notice.classList.remove('show'), 5000);
}
function warningMarkup() {
  return `<div class="storage-warning" role="alert">${icon('alert')}<span>${esc(storageWarning)}</span>${storageConflict ? '<button class="text-button" data-action="reload-saved">Reload saved version</button>' : ''}</div>`;
}
function showStorageWarning() {
  let banner = document.querySelector('.storage-warning');
  if (banner) banner.outerHTML = warningMarkup();
  else main.insertAdjacentHTML('afterbegin', warningMarkup());
}
function flagStorageConflict() {
  storageConflict = true;
  saved = false;
  storageWarning = 'Another tab changed the saved rehearsal. This tab is now kept in memory only. Export your changes before reloading the saved version.';
  showStorageWarning();
  toast('Saving paused. Another tab has a newer version.');
}
function save() {
  if (!storageConflict) {
    const result = saveLocalState(storage, STORAGE_KEY, lastSavedRaw, state);
    if (result.status === 'conflict') flagStorageConflict();
    else if (result.status === 'saved') { lastSavedRaw = result.raw; saved = true; }
    else { saved = false; storageWarning = 'Local saving is unavailable. Keep this tab open or export your rehearsal.'; showStorageWarning(); }
  }
  const indicator = document.querySelector('#save-status');
  if (indicator) indicator.textContent = saved ? 'Saved locally' : 'In memory only';
  return saved && !storageConflict;
}
window.addEventListener('storage', event => {
  if (event.key === STORAGE_KEY && event.newValue !== lastSavedRaw && !storageConflict) flagStorageConflict();
});
const activeCase = () => CASES.find(c => c.id === selected);

function steps() {
  const current = { prepare: 1, incoming: 2, report: 3 }[view];
  return `<div class="workflow"><span class="workflow-label">HANDOFF CYCLE</span><ol class="steps" aria-label="Rehearsal steps">${['Prepare', 'Rehearse', 'Review'].map((label, i) => `<li class="${current === i + 1 ? 'active' : current > i + 1 ? 'passed' : ''}" ${current === i + 1 ? 'aria-current="step"' : ''}><span class="step-number">${i + 1 < current ? icon('check') : `0${i + 1}`}</span><span>${label}</span>${i < 2 ? '<span class="step-connector" aria-hidden="true"></span>' : ''}</li>`).join('')}</ol><span class="workflow-meta">${esc(scenario.title.toUpperCase())} <span>/</span> ${String(CASES.length).padStart(2, '0')} CASES</span></div>`;
}
function pageHeader(kicker, title, description, actions = '') {
  return `${steps()}<div class="page-heading"><div><p class="eyebrow">${kicker}</p><h1>${title}</h1><p class="description">${description}</p></div><div class="heading-actions">${actions}</div></div>`;
}
function scenarioLibrary() {
  return `<section class="scenario-library" aria-label="Practice library"><div><label for="practice-scenario">Choose a work situation</label><select id="practice-scenario">${SCENARIOS.map(item => `<option value="${item.id}" ${item.id === scenario.id ? 'selected' : ''}>${esc(item.title)} · ${item.cases.length} cases</option>`).join('')}</select></div><div class="scenario-description"><p>${esc(scenario.description)}</p><span>${SCENARIOS.reduce((sum, item) => sum + item.cases.length, 0)} fictional cases · Each scenario keeps its own drafts and reports.</span></div></section>`;
}
function guide() {
  return `<details id="quick-guide" class="quick-guide" ${guideOpen ? 'open' : ''}><summary><span>${icon('question')}<strong>Before the next person takes over</strong><span class="guide-caption">A 3-step practice handoff</span></span><span class="guide-toggle">How it works</span></summary><div class="guide-body"><ol><li><b>01</b><div><strong>Prepare the note</strong><p>Source records stay on the left. Write what the next shift should receive on the right.</p></div></li><li><b>02</b><div><strong>Switch perspective</strong><p>Try a self-rehearsal, or give another reader an offline file containing only the frozen note.</p></div></li><li><b>03</b><div><strong>Repair and compare</strong><p>Fix the specific gaps. Rehearse again to see exactly which fields and findings changed.</p></div></li></ol><p class="guide-footnote">These are fictional tasks. Practise passing on useful instructions; you do not need to carry out the work. The exercise tests the note, not the reader.</p></div></details>`;
}
function checkStrip(draft, id) {
  const missing = new Set(structuralIssues(id, draft).map(i => i.field));
  return `<span class="check-strip" aria-label="${Object.entries(FIELDS).map(([f, label]) => `${label} ${missing.has(f) ? 'missing' : 'present'}`).join(', ')}">${Object.entries(FIELDS).map(([field, label]) => `<span class="${missing.has(field) ? 'absent' : 'present'}" title="${label}: ${missing.has(field) ? 'missing' : 'present'}">${missing.has(field) ? '−' : '✓'} ${label === 'Next action' ? 'Action' : label}</span>`).join('')}</span>`;
}
function sidebar() {
  const count = view === 'incoming' ? Object.keys(answers).length : CASES.length;
  return `<nav class="case-nav" aria-label="Incident selection"><div class="rail-heading"><span>${view === 'incoming' ? 'YOUR REVIEW QUEUE' : 'ACTIVE CASES'}</span><span class="mono">${view === 'incoming' ? `${count}/${CASES.length}` : String(CASES.length).padStart(2, '0')}</span></div>${CASES.map((c, i) => {
    const answer = view === 'incoming' && answers[c.id];
    return `<button class="case-button ${selected === c.id ? 'selected' : ''}" data-case="${c.id}" ${selected === c.id ? 'aria-current="true"' : ''}><span class="case-label"><span class="mono">${c.id}</span><span class="case-index">0${i + 1}</span></span><strong>${esc(c.title)}</strong><span class="case-category">${view === 'incoming' ? (answer ? `<span class="review-dot ${answer.status}"></span>${answer.status === 'ready' ? 'Reader can continue' : 'Reader is blocked'}` : '<span class="review-dot"></span>Awaiting review') : `${esc(c.category)} <span>·</span> ${esc(c.priority)}`}</span>${view === 'prepare' ? checkStrip(state.draft, c.id) : ''}</button>`;
  }).join('')}<div class="rail-note">${icon(view === 'incoming' ? 'lock' : 'file')}<p>${view === 'incoming' ? 'Only the frozen handoff is available here. Go case by case; don’t fill gaps from memory.' : `${esc(scenario.description)}<br>All cases are fictional.`}</p></div></nav>`;
}
function evidenceMarkup(c, included, compact = false) {
  if (!included) return `<div class="empty-field">${icon('file')}<div><strong>No record attached</strong><span>The next shift has no supporting evidence to inspect.</span></div></div>`;
  return `<details class="evidence ${compact ? 'compact' : ''}"><summary>${icon('file')}<span><strong>${esc(c.evidence.title)}</strong><small>Synthetic record · Read attachment</small></span><span class="evidence-arrow" aria-hidden="true">↗</span></summary><div class="evidence-content"><span class="record-label">REFERENCE COPY</span><p>${esc(c.evidence.body)}</p></div></details>`;
}
function preparationHistory() {
  const latest = state.runs.at(-1);
  if (!latest) return `<div class="history-strip empty-history">${icon('repeat')}<div><strong>No rehearsal recorded yet</strong><span>Your first run will establish a baseline. Repairs can be compared after a second run.</span></div><span class="mono">BASELINE PENDING</span></div>`;
  return `<div class="history-strip">${icon('lock')}<div><strong>Latest record <span class="mono">RUN ${number(latest.snapshot.sequence)}</span></strong><span>${latest.structuralGaps + latest.readerConcerns} open findings · ${stamp(latest.completedAt)} · Frozen independently of this draft</span></div><button class="secondary small" data-action="last-report">Open latest report ${icon('arrow')}</button></div>`;
}
function prepare() {
  const c = activeCase(), d = state.draft[c.id];
  const included = REQUIRED_DETAILS - CASES.reduce((sum, c) => sum + structuralIssues(c.id, state.draft).length, 0);
  return pageHeader('OUTGOING SHIFT / WORKING DRAFT', 'Prepare the handoff', 'Check whether another person can take over using your note alone. Prepare the handoff, collect their response, then improve anything they need clarified.', `<span class="save-indicator"><span class="status-dot"></span><span id="save-status">${saved ? 'Saved locally' : 'In memory only'}</span></span><button class="secondary" data-action="export">${icon('export')} Export</button>`) + scenarioLibrary() + guide() +
    `<div class="workspace">${sidebar()}<section class="desk" aria-labelledby="desk-title"><header class="desk-heading"><div><div class="case-kicker"><span class="mono">${c.id}</span><span class="badge neutral">${esc(c.category)}</span></div><h2 id="desk-title" tabindex="-1">${esc(c.title)}</h2></div><span class="draft-badge">WORKING COPY</span></header><div class="editor-columns"><aside class="source"><div class="pane-label">${icon('file')}<span>SOURCE CONTEXT</span><span class="pane-mode">You can see this</span></div><p class="source-summary">${esc(c.summary)}</p><div class="source-note"><span class="record-label">OUTGOING SHIFT NOTE</span><p>${esc(c.source)}</p></div>${evidenceMarkup(c, true, true)}<button class="secondary copy-button" data-action="use-source">Use these source details ${icon('arrow')}</button><p class="help">Copies owner, action and evidence for this case only. Review what you pass on.</p></aside>
    <form class="draft" aria-label="Handoff draft"><div class="pane-label">${icon('arrow')}<span>RECEIVING-SIDE NOTE</span><span class="pane-mode">They will see this</span></div><div class="field-group"><label for="summary">Situation <span class="optional">Context</span></label><textarea id="summary" name="summary" maxlength="600" rows="2">${esc(d.summary)}</textarea></div><div class="field-group"><label for="owner"><span class="field-index">01</span> Who owns the next step?</label><input id="owner" name="owner" maxlength="100" value="${esc(d.owner)}" placeholder="Name the person or team"><p class="field-help">Make ownership explicit, even when it seems obvious.</p></div><div class="field-group"><label for="action"><span class="field-index">02</span> What happens next?</label><textarea id="action" name="action" maxlength="600" rows="3" placeholder="A specific action, its trigger and what to preserve">${esc(d.action)}</textarea></div><div class="field-group"><label for="evidenceId"><span class="field-index">03</span> Where is the supporting record?</label><select id="evidenceId" name="evidenceId"><option value="">No record attached</option><option value="${c.evidenceId}" ${d.evidenceId === c.evidenceId ? 'selected' : ''}>${esc(c.evidence.title)}</option></select></div></form></div>
    <footer class="desk-footer"><div class="draft-coverage"><span class="coverage-number" id="coverage-count">${included}<small>/${REQUIRED_DETAILS}</small></span><span>required details included<br><small>Presence is checked; meaning still needs a reader.</small></span></div><button class="primary" data-action="start">Start self-rehearsal ${icon('arrow')}</button></footer></section></div>${receiverPanel()}${preparationHistory()}<div class="utility"><span class="utility-note">All records and names in this exercise are synthetic.</span><button class="text-button subdued" data-action="reset">${icon('repeat')} Reset sample</button></div>`;
}
function receiverPanel() {
  const pending = state.pendingReceiver;
  return `<section class="receiver-panel" aria-labelledby="receiver-title"><div><span class="record-label">ANOTHER READER</span><h2 id="receiver-title">Let the note speak for itself.</h2><p>Download a file that contains only the frozen note and its selected attachments. Another reader can open it offline and return their response as JSON.</p>${pending ? `<p class="receiver-reference">Awaiting response · RUN ${number(pending.snapshot.sequence)} · ${esc(pending.packet.id.slice(0, 8))}<br>Frozen ${stamp(pending.snapshot.createdAt)}. Later draft edits do not change this file.</p>` : '<p class="receiver-reference">No file awaiting a response. No account or upload is needed.</p>'}</div><div class="receiver-actions">${pending ? '<button class="primary" data-action="receiver-import">Import response</button><button class="secondary" data-action="receiver-download">Download receiver file</button><button class="text-button" data-action="receiver-create">Replace with current draft</button>' : '<button class="primary" data-action="receiver-create">Create receiver file</button>'}<input id="receiver-response" type="file" accept=".json,application/json" hidden></div></section>`;
}
function downloadReceiver() {
  if (!state.pendingReceiver) return;
  try {
    const packet = state.pendingReceiver.packet;
    const url = URL.createObjectURL(new Blob([receiverHTML(packet)], { type: 'text/html' }));
    const link = document.createElement('a'); link.href = url; link.download = `blind-handoff-receiver-${packet.id.slice(0, 8)}.html`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Receiver file prepared. Only the frozen note and chosen attachments are included.');
  } catch { toast('The receiver file could not be prepared. Your frozen note is still saved.'); }
}
function emptyField(title, body) {
  return `<div class="empty-field">${icon('alert')}<div><strong>${title}</strong><span>${body}</span></div></div>`;
}
function incoming() {
  const c = activeCase(), d = snapshot.draft[c.id], answer = answers[c.id];
  const count = Object.keys(answers).length;
  return pageHeader(`SELF-REHEARSAL / RUN ${number(snapshot.sequence)}`, 'Take the next shift', 'You have seen the source. This is your own rehearsal, not an independent reader trial.', `<button data-action="cancel" class="secondary">Return to editing</button>`) +
    `<div class="frozen-banner">${icon('lock')}<div><strong>Frozen handoff</strong><span>Source notes are hidden. Edits to the working draft cannot alter this record.</span></div><span class="frozen-time mono">${stamp(snapshot.createdAt)} <small>CANARY TIME</small></span></div>
    <div class="workspace">${sidebar()}<section class="desk incoming-desk" aria-labelledby="incoming-title"><header class="desk-heading"><div><div class="case-kicker"><span class="mono">${c.id}</span><span class="badge neutral">${esc(c.category)}</span></div><h2 id="incoming-title" tabindex="-1">${esc(c.title)}</h2></div><span class="frozen-label">${icon('lock')} READ ONLY</span></header><div class="received"><div class="received-situation"><span class="record-label">SITUATION AS RECEIVED</span><p>${d.summary.trim() ? esc(d.summary) : '<span class="absent-copy">No situation summary included.</span>'}</p></div><div class="received-item"><span class="field-index">01</span><div><h3>Owner</h3>${d.owner.trim() ? `<p class="received-owner">${esc(d.owner)}</p>` : emptyField('No owner named', 'There is no explicit person or team for the next step.')}</div></div><div class="received-item"><span class="field-index">02</span><div><h3>Next action</h3>${d.action.trim() ? `<p>${esc(d.action)}</p>` : emptyField('No next action written', 'The note says what happened, but not what to do next.')}</div></div><div class="received-item"><span class="field-index">03</span><div><h3>Supporting evidence</h3>${evidenceMarkup(c, d.evidenceId === c.evidenceId)}</div></div></div>
    <section class="review-box" aria-labelledby="review-title"><div class="review-heading"><div><span class="record-label">READER DECISION</span><h3 id="review-title">Do you have enough information to carry out the handoff?</h3></div>${answer ? '<span class="badge blue">Response recorded</span>' : '<span class="badge neutral">Response needed</span>'}</div><div class="review-options"><button class="choice ${answer?.status === 'ready' ? 'chosen' : ''}" data-answer="ready" aria-pressed="${answer?.status === 'ready'}">${icon('check')}<span><strong>Yes, I have enough information</strong><small>The owner, action and evidence are clear.</small></span></button><button class="choice ${answer?.status === 'blocked' ? 'chosen blocked' : ''}" data-answer="blocked" aria-pressed="${answer?.status === 'blocked'}">${icon('question')}<span><strong>I need clarification first</strong><small>Something is missing or needs clarification.</small></span></button></div>${answer ? `<div class="concern-fields ${answer.status === 'ready' ? 'ready-note' : ''}">${answer.status === 'blocked' ? `<div><label for="concern-field">What is missing or unclear?</label><select id="concern-field"><option value="owner" ${answer.field === 'owner' ? 'selected' : ''}>Who owns the next step</option><option value="action" ${answer.field === 'action' ? 'selected' : ''}>What to do next</option><option value="evidenceId" ${answer.field === 'evidenceId' ? 'selected' : ''}>The supporting record</option></select></div>` : ''}<div><label for="concern-note">${answer.status === 'ready' ? 'What would you do next?' : 'What would help?'} <span class="optional">Optional</span></label><input id="concern-note" maxlength="300" value="${esc(answer.note)}" placeholder="${answer.status === 'ready' ? 'Describe your next step' : 'Name the exact detail you need'}"></div></div>` : ''}</section><footer class="desk-footer"><div class="review-progress"><div class="progress-segments" aria-hidden="true">${CASES.map(c => `<span class="${answers[c.id] ? 'complete' : ''}"></span>`).join('')}</div><span><b>${count} of ${CASES.length}</b> cases reviewed</span></div><div class="button-row">${count < CASES.length ? '<button class="secondary" data-action="next">Next unreviewed case →</button>' : ''}<button class="primary" data-action="finish" ${count < CASES.length ? 'disabled' : ''}>Review findings ${icon('arrow')}</button></div></footer></section></div><p class="method-note">A confident answer cannot override a missing field. This rehearsal checks the note that was actually passed on.</p>`;
}
function issueAction(issue) {
  if (issue.type === 'reader') return 'Clarify the wording, then ask the reader to test it again.';
  return { owner: 'Name the person or team responsible for the next step.', action: 'Write what to do, when to do it and what must be preserved.', evidenceId: 'Attach the supporting record for this case.' }[issue.field];
}
function snapshotFields(run, c) {
  const d = run.snapshot.draft[c.id];
  return `<dl class="snapshot-fields">${Object.entries(REPORT_FIELDS).map(([f, label]) => `<div><dt>${label}</dt><dd>${d[f].trim() ? esc(f === 'evidenceId' && d[f] === c.evidenceId ? c.evidence.title : d[f]) : '<span class="absent-copy">Not included</span>'}</dd></div>`).join('')}</dl>`;
}
function findingsContent(run) {
  return `<section class="findings-list" aria-label="Case findings">${run.findings.map(f => {
    const c = CASES.find(c => c.id === f.id);
    return `<article class="finding ${f.issues.length ? 'needs-repair' : 'clear'}"><header class="finding-heading"><span class="case-state-icon">${icon(f.issues.length ? 'alert' : 'check')}</span><div><span class="mono">${c.id}</span><h2>${esc(c.title)}</h2></div><span class="badge ${f.issues.length ? 'attention' : 'blue'}">${f.issues.length ? `${f.issues.length} open finding${f.issues.length > 1 ? 's' : ''}` : 'Reader can continue'}</span><button class="secondary small" data-repair="${c.id}">${f.issues.length ? 'Repair note' : 'Review draft'} ${icon('arrow')}</button></header>${f.issues.length ? `<div class="finding-body">${f.issues.map(i => `<div class="issue-row"><div class="issue-type"><span class="record-label">${i.type === 'reader' ? 'READER CONCERN' : 'REQUIRED DETAIL MISSING'}</span><strong>${FIELDS[i.field]}</strong></div><div class="issue-explanation"><p>${esc(i.message)}</p><span>${issueAction(i)}</span></div><button class="text-button" data-repair="${c.id}" data-field="${i.field}">Go to ${FIELDS[i.field].toLowerCase()} ${icon('arrow')}</button></div>`).join('')}${f.answer.note?.trim() ? `<div class="reader-comment"><span class="record-label">READER’S NOTE</span><p>“${esc(f.answer.note)}”</p></div>` : ''}</div>` : `<div class="clear-explanation">All three required details are present. The reader marked this case usable.</div>${f.answer.note?.trim() ? `<div class="finding-body"><div class="reader-comment"><span class="record-label">READER’S NOTE</span><p>“${esc(f.answer.note)}”</p></div></div>` : ''}`}<details class="tested-note"><summary>${icon('lock')}<span>Inspect frozen handoff</span><span class="mono">RUN ${number(run.snapshot.sequence)}</span></summary>${snapshotFields(run, c)}</details></article>`;
  }).join('')}</section>`;
}
const OUTCOMES = { resolved: 'Resolved', regressed: 'New blocker', blocked: 'Still blocked', clear: 'Still clear' };
const CHANGE_LABELS = { added: 'Added', removed: 'Removed', edited: 'Edited', spacing: 'Spacing only', unchanged: 'Unchanged' };
function displayDiffValue(field, value, c) {
  if (!value.trim()) return '<span class="not-included">Not included</span>';
  return esc(field === 'evidenceId' && value === c.evidenceId ? c.evidence.title : value);
}
function readerNotes(change) {
  const hasNote = [change.readerBefore, change.readerAfter].some(answer => answer.note?.trim());
  if (!hasNote) return '';
  return `<dl class="reader-note-diff">${[['PREVIOUS READER NOTE', change.readerBefore], ['CURRENT READER NOTE', change.readerAfter]].map(([label, answer]) => `<div><dt>${label}</dt><dd>${answer.note?.trim() ? esc(answer.note) : '<span class="not-included">No reader note recorded</span>'}</dd></div>`).join('')}</dl>`;
}
function compareContent(run, previous) {
  const diff = compareRuns(previous, run);
  if (!diff) return `<section class="empty-comparison">${icon('compare')}<h2>A baseline, ready for a second run</h2><p>This is the first frozen handoff. Repair the notes and rehearse again to compare exact field values, reader decisions and unresolved findings.</p><button class="primary" data-action="edit">Prepare another rehearsal ${icon('arrow')}</button><span class="mono">NO COMPARISON GENERATED</span></section>`;
  const change = diff.cases.find(c => c.id === diffCase), c = CASES.find(c => c.id === diffCase);
  const visibleFields = change.fields.filter(f => showUnchanged || f.change !== 'unchanged' || f.resolved.length || f.introduced.length || f.persistent.length);
  return `<section class="comparison" aria-label="Compare frozen rehearsals"><div class="comparison-intro"><div><h2>What changed between these handoffs?</h2><p>Field values come from the two frozen records. Reader decisions are tracked separately.</p></div><span class="compare-run-label mono">RUN ${number(diff.from)} ${icon('arrow')} RUN ${number(diff.to)}</span></div><div class="comparison-summary"><span><b>${diff.changedFields}</b> fields changed</span><span><b>${diff.resolvedIssues}</b> findings resolved</span><span><b>${diff.introducedIssues}</b> new findings</span><span><b>${diff.persistentIssues}</b> still open</span></div><div class="comparison-workspace"><nav class="diff-nav" aria-label="Case comparison">${diff.cases.map(item => {
    const itemCase = CASES.find(c => c.id === item.id);
    return `<button data-diff-case="${item.id}" class="diff-case ${item.id === diffCase ? 'selected' : ''}" ${item.id === diffCase ? 'aria-current="true"' : ''}><span class="mono">${item.id}</span><strong>${esc(itemCase.title)}</strong><span class="diff-case-result ${item.outcome}">${OUTCOMES[item.outcome]}<span>${item.beforeIssueCount} → ${item.afterIssueCount} findings</span></span></button>`;
  }).join('')}</nav><div class="diff-content"><div class="diff-toolbar"><h3 id="diff-title" tabindex="-1">${esc(c.title)}</h3><label class="checkbox-label"><input id="show-unchanged" type="checkbox" ${showUnchanged ? 'checked' : ''}> Show unchanged fields</label></div><div class="diff-table" role="table" aria-label="Changed handoff fields"><div class="diff-table-head" role="row"><span role="columnheader">FIELD</span><span role="columnheader">RUN ${number(diff.from)} <small>PREVIOUS</small></span><span role="columnheader">RUN ${number(diff.to)} <small>CURRENT</small></span></div>${visibleFields.length ? visibleFields.map(f => `<div class="diff-row ${f.change}" role="row"><div class="diff-field" role="cell"><strong>${f.label}</strong><span class="change-label">${CHANGE_LABELS[f.change]}</span>${f.resolved.length ? '<span class="field-finding resolved">Finding resolved</span>' : ''}${f.introduced.length ? '<span class="field-finding new">New finding</span>' : ''}${f.persistent.length ? '<span class="field-finding persistent">Still open</span>' : ''}</div><div class="diff-before" role="cell"><span class="mobile-diff-label">PREVIOUS</span>${displayDiffValue(f.field, f.before, c)}</div><div class="diff-after" role="cell"><span class="mobile-diff-label">CURRENT</span>${displayDiffValue(f.field, f.after, c)}</div></div>`).join('') : '<div class="no-field-changes">No field text changed in this case. Use “Show unchanged fields” to inspect the complete notes.</div>'}</div><div class="reader-diff"><span class="record-label">READER ASSESSMENT ${change.readerChanged ? 'CHANGED' : 'UNCHANGED'}</span><div><span>${change.readerBefore.status === 'ready' ? 'Can continue' : `Blocked: ${FIELDS[change.readerBefore.field].toLowerCase()}`}</span>${icon('arrow')}<strong>${change.readerAfter.status === 'ready' ? 'Can continue' : `Blocked: ${FIELDS[change.readerAfter.field].toLowerCase()}`}</strong></div>${readerNotes(change)}${change.readerChanged && change.fields.every(f => f.change === 'unchanged') ? '<p>The reader’s assessment changed without any change to the note. This does not establish that the wording improved.</p>' : '<p>Recorded reader judgment, separate from structural field checks. This app does not verify who answered.</p>'}</div><div class="diff-footer"><span>${change.afterIssueCount ? 'This case still needs attention.' : 'No open finding in the current rehearsal.'}</span><button class="text-button" data-repair="${c.id}">${change.afterIssueCount ? 'Repair this case' : 'Open working draft'} ${icon('arrow')}</button></div></div></div></section>`;
}
function report() {
  const run = state.runs.at(-1), previous = state.runs.at(-2);
  if (!run) return pageHeader('REHEARSAL RECORDS', 'No completed run yet', 'Start with the working draft to create your first frozen handoff.') + `<section class="empty-comparison">${icon('repeat')}<h2>Your baseline starts here</h2><p>Review each case from the receiving side. The report will preserve the notes and your decisions together.</p><button class="primary" data-action="edit">Open working draft ${icon('arrow')}</button></section>`;
  const total = run.structuralGaps + run.readerConcerns, clean = total === 0;
  return pageHeader(`REHEARSAL RECORD / RUN ${number(run.snapshot.sequence)}`, clean ? 'The handoff is ready for review' : `${total} finding${total === 1 ? '' : 's'} to resolve`, clean ? 'Required details are present and the reader can continue. Inspect what changed before deciding the next step.' : 'Each finding points to a detail that the receiving shift could not use. Repair the note, then test it again.', `<button class="secondary" data-action="export">${icon('export')} Export record</button><button class="primary" data-action="edit">${clean ? 'Open working draft' : 'Repair handoff'} ${icon('arrow')}</button>`) +
    `<section class="report-overview" aria-label="Rehearsal outcome"><div class="report-outcome ${clean ? 'clear' : 'attention'}">${icon(clean ? 'check' : 'alert')}<div><strong>${clean ? 'Reader can continue' : `${run.blockedCases} of ${CASES.length} cases blocked`}</strong><span>${run.review?.mode === 'receiver-file' ? 'Imported receiver file · Identity not verified' : 'Self-rehearsal · Not an independent reader trial'}</span></div></div><dl class="report-numbers"><div><dt>Structural gaps</dt><dd>${run.structuralGaps}</dd></div><div><dt>Reader concerns</dt><dd>${run.readerConcerns}</dd></div><div><dt>${previous ? 'Previous → current' : 'Cases reviewed'}</dt><dd>${previous ? `${previous.structuralGaps + previous.readerConcerns}<span>→</span>${total}` : `${CASES.length}/${CASES.length}`}</dd></div></dl></section>
    <div class="record-toolbar"><div class="report-tabs" role="tablist" aria-label="Report view"><button id="findings-tab" role="tab" aria-selected="${reportTab === 'findings'}" aria-controls="report-panel" data-report-tab="findings" tabindex="${reportTab === 'findings' ? '0' : '-1'}">${icon('file')} Findings <span>${total}</span></button><button id="compare-tab" role="tab" aria-selected="${reportTab === 'compare'}" aria-controls="report-panel" data-report-tab="compare" tabindex="${reportTab === 'compare' ? '0' : '-1'}">${icon('compare')} Compare runs ${previous ? '<span>2</span>' : ''}</button></div><span class="record-stamp">${icon('lock')}Frozen ${stamp(run.snapshot.createdAt)}<span class="mono">CANARY</span></span></div><div id="report-panel" role="tabpanel" aria-labelledby="${reportTab}-tab">${reportTab === 'findings' ? findingsContent(run) : compareContent(run, previous)}</div><p class="method-note">The result describes these synthetic records and the reader’s feedback. It does not verify that an operational action is correct or safe.</p>`;
}
function render({ focus, top = false } = {}) {
  main.innerHTML = `${storageWarning ? warningMarkup() : ''}${view === 'prepare' ? prepare() : view === 'incoming' ? incoming() : report()}`;
  if (focus) document.querySelector(focus)?.focus({ preventScroll: top });
  if (top) window.scrollTo({ top: 0, behavior: 'instant' });
}
function changeView(next, focus = '#main') { view = next; render({ focus, top: true }); }
function updateDraftIndicators() {
  const included = REQUIRED_DETAILS - CASES.reduce((sum, c) => sum + structuralIssues(c.id, state.draft).length, 0);
  const counter = document.querySelector('#coverage-count');
  if (counter) counter.innerHTML = `${included}<small>/${REQUIRED_DETAILS}</small>`;
  const strip = document.querySelector(`[data-case="${selected}"] .check-strip`);
  if (strip) strip.outerHTML = checkStrip(state.draft, selected);
}
main.addEventListener('submit', event => event.preventDefault());
main.addEventListener('toggle', event => { if (event.target.id === 'quick-guide') guideOpen = event.target.open; }, true);
main.addEventListener('input', event => {
  if (view === 'prepare' && ['summary', 'owner', 'action', 'evidenceId'].includes(event.target.name)) {
    state.draft[selected][event.target.name] = event.target.value;
    save(); updateDraftIndicators();
  }
  if (event.target.id === 'concern-note') answers[selected].note = event.target.value;
});
main.addEventListener('change', async event => {
  if (event.target.id === 'practice-scenario') {
    const next = SCENARIOS.find(item => item.id === event.target.value);
    if (!next || next.id === scenario.id) return;
    if (!saved || storageConflict) {
      event.target.value = scenario.id;
      toast('Export this rehearsal before switching. Your latest changes are only in this tab.');
      return;
    }
    const url = new URL(window.location.href);
    if (next.id === 'common-ground') url.searchParams.delete('scenario');
    else url.searchParams.set('scenario', next.id);
    window.location.assign(url.pathname + url.search + url.hash);
    return;
  }

  if (event.target.id === 'receiver-response') {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (storageConflict) throw new Error('Reload the newer saved version before importing a response.');
      if (file.size > 65536) throw new Error('Choose a response JSON file smaller than 64 KB.');
      const raw = await file.text();
      if (storageConflict) throw new Error('Another tab changed this workspace. Reload it before importing.');
      state = importReceiverResponse(state, raw); save();
      reportTab = state.runs.length > 1 ? 'compare' : 'findings'; diffCase = CASES[0].id; changeView('report');
      toast(saved ? 'Receiver response imported for its frozen note.' : 'Response is in memory only. Export this record to keep it.');
    } catch (error) { toast(error.message); event.target.value = ''; }
    return;
  }
  if (event.target.id === 'evidenceId') { state.draft[selected].evidenceId = event.target.value; save(); updateDraftIndicators(); }
  if (event.target.id === 'concern-field') answers[selected].field = event.target.value;
  if (event.target.id === 'show-unchanged') { showUnchanged = event.target.checked; render({ focus: '#show-unchanged' }); }
});
main.addEventListener('keydown', event => {
  if (event.target.matches('[role="tab"]') && ['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
    event.preventDefault();
    reportTab = event.key === 'Home' ? 'findings' : event.key === 'End' ? 'compare' : reportTab === 'findings' ? 'compare' : 'findings';
    render({ focus: `#${reportTab}-tab` });
  }
});
main.addEventListener('click', async event => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  if (button.dataset.case) { selected = button.dataset.case; render({ focus: view === 'incoming' ? '#incoming-title' : '#desk-title' }); return; }
  if (button.dataset.repair) { selected = button.dataset.repair; view = 'prepare'; render({ focus: button.dataset.field ? `#${button.dataset.field}` : '#desk-title', top: !button.dataset.field }); return; }
  if (button.dataset.diffCase) { diffCase = button.dataset.diffCase; render({ focus: '#diff-title' }); return; }
  if (button.dataset.reportTab) { reportTab = button.dataset.reportTab; render({ focus: `#${reportTab}-tab` }); return; }
  if (button.dataset.answer) {
    const status = button.dataset.answer;
    answers[selected] = { status, field: answers[selected]?.field || 'owner', note: answers[selected]?.note || '' };
    render({ focus: status === 'blocked' ? '#concern-field' : '[data-answer="ready"]' });
    toast('Reader decision recorded.'); return;
  }
  switch (button.dataset.action) {
    case 'use-source': {
      const c = activeCase();
      Object.assign(state.draft[selected], { owner: c.owner, action: c.action, evidenceId: c.evidenceId });
      save(); render({ focus: '#owner' }); toast('Source details copied for this case. Review the receiving-side note.'); break;
    }
    case 'receiver-create': {
      if (storageConflict) { toast('Reload the newer saved version before creating a receiver file.'); break; }
      if (state.pendingReceiver && !window.confirm('Replace the pending receiver file with this draft? Responses to the old file will no longer be accepted.')) break;
      state.pendingReceiver = makeReceiverPacket(state.draft, nextSequence(state), crypto.randomUUID());
      if (!save()) { toast('The receiver file could not be saved locally. Restore local saving before downloading it.'); break; }
      downloadReceiver(); render({ focus: '[data-action="receiver-download"]' }); break;
    }
    case 'receiver-download': downloadReceiver(); break;
    case 'receiver-import': document.querySelector('#receiver-response').click(); break;
    case 'start': snapshot = makeSnapshot(state.draft, nextSequence(state)); answers = {}; selected = CASES[0].id; changeView('incoming'); break;
    case 'next': {
      const ordered = [...CASES.slice(CASES.findIndex(c => c.id === selected) + 1), ...CASES.slice(0, CASES.findIndex(c => c.id === selected) + 1)];
      const next = ordered.find(c => !answers[c.id]);
      if (next) { selected = next.id; render({ focus: '#incoming-title' }); }
      break;
    }
    case 'cancel': if (window.confirm('Leave this rehearsal? Your draft and completed runs stay saved; this unfinished review will be discarded.')) { snapshot = null; answers = {}; changeView('prepare'); } break;
    case 'finish': try {
      state.runs.push(finishRun(snapshot, answers)); state.runs = state.runs.slice(-10); save();
      reportTab = state.runs.length > 1 ? 'compare' : 'findings'; diffCase = CASES[0].id; changeView('report');
    } catch (e) { toast(e.message); } break;
    case 'edit': changeView('prepare'); break;
    case 'reload-saved': if (window.confirm('Reload the version from the other tab? Export first to keep this tab’s unsaved changes.')) location.reload(); break;
    case 'last-report': if (state.runs.length) { reportTab = state.runs.length > 1 ? 'compare' : 'findings'; changeView('report'); } break;
    case 'export': {
      const label = button.innerHTML;
      button.disabled = true; button.setAttribute('aria-busy', 'true'); button.textContent = 'Preparing export…';
      try {
        await new Promise(resolve => requestAnimationFrame(resolve));
        const blob = new Blob([JSON.stringify(buildExport(state), null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob), link = document.createElement('a');
        link.href = url; link.download = `blind-handoff-${scenario.id}-rehearsal.json`; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000); toast('JSON record prepared. No upload was made.');
      } catch { toast('The export could not be created. Your record is still in this tab; try again.'); }
      finally { button.disabled = false; button.removeAttribute('aria-busy'); button.innerHTML = label; }
      break;
    }
    case 'reset': if (window.confirm('Reset this scenario to its fictional starter? Its drafts, reports and pending file will be replaced. Other scenarios stay saved. Export first if you want to keep this work.')) {
      state = initialState(); selected = CASES[0].id; guideOpen = true; save(); changeView('prepare'); toast('Synthetic starter restored. No other browser data was changed.');
    } break;
  }
});
render();
