export const VERSION = 1;
export const STORAGE_KEY = 'blind-handoff-v1';
export const FIELDS = { owner: 'Owner', action: 'Next action', evidenceId: 'Evidence' };
export const CASES = [
  {
    id: 'CG-07', title: 'The courier is late', category: 'Delivery', priority: 'Time sensitive',
    summary: 'The replacement drive has not arrived. The editing room needs it for tomorrow’s session.',
    source: '14:12 · The courier moved arrival to 16:30. Maya Chen agreed to call dispatch if the parcel is still missing at 16:30. Keep the old drive in place until the replacement is checked.',
    owner: 'Maya Chen', action: 'At 16:30, call dispatch if the parcel is still missing. Keep the old drive installed until the replacement is checked.',
    evidenceId: 'courier-note',
    evidence: { id: 'courier-note', title: 'Dispatch note #184', body: 'Synthetic dispatch record · 14:12. Replacement drive parcel is delayed. Revised arrival: 16:30. Dispatch contact: workshop courier desk. Do not remove the existing drive before checking the replacement.' },
    draft: { summary: 'Replacement drive delayed. Editing session tomorrow; keep the existing drive installed for now.', owner: '', action: 'At 16:30, call dispatch if the parcel is still missing.', evidenceId: 'courier-note' }
  },
  {
    id: 'CG-12', title: 'One upload needs a retry', category: 'Media', priority: 'Before 17:00',
    summary: 'A workshop recording stopped uploading. The original file is intact on the local workstation.',
    source: '14:26 · Noor Patel owns the retry. Resume upload session U-12 from the local master after checking its checksum against manifest M-12. Confirm the remote checksum matches before closing the case. Do not delete the local master.',
    owner: 'Noor Patel', action: 'Resume session U-12 from the local master after checking checksum manifest M-12. Confirm the remote checksum before closing; keep the local master.',
    evidenceId: 'upload-log',
    evidence: { id: 'upload-log', title: 'Upload log U-12 + manifest M-12', body: 'Synthetic log · 14:26. Session U-12 stopped at 72%. Local master verified against manifest M-12, abbreviated checksum 8f3a…91cd. Session supports resume. Remote checksum has not yet been verified.' },
    draft: { summary: 'One recording stopped at 72%. The local master is intact and must be kept.', owner: 'Noor Patel', action: '', evidenceId: 'upload-log' }
  },
  {
    id: 'CG-04', title: 'A room change is unconfirmed', category: 'Schedule', priority: 'Check at 16:00',
    summary: 'The evening workshop may move from Room A to Room B. The instructor needs an explicit confirmation.',
    source: '14:40 · Eli Torres owns room confirmation. At 16:00, check the booking note R-04. Ask the instructor to confirm Room B before changing the attendee board. The current approved location is still Room A.',
    owner: 'Eli Torres', action: 'At 16:00, check booking note R-04 and ask the instructor to confirm Room B. Keep the attendee board on Room A until confirmation.',
    evidenceId: 'booking-note',
    evidence: { id: 'booking-note', title: 'Booking note R-04', body: 'Synthetic booking note · 14:40. Room B is provisionally held. Instructor confirmation is pending. Approved room remains Room A until explicit confirmation arrives.' },
    draft: { summary: 'Evening workshop may move to Room B. Room A is still the approved location.', owner: 'Eli Torres', action: 'At 16:00, ask the instructor to confirm Room B before changing the attendee board.', evidenceId: '' }
  }
];

export const clone = value => JSON.parse(JSON.stringify(value));
export const RECEIVER_VERSION = 1;
export const REPORT_FIELDS = { summary: 'Situation', ...FIELDS };

// Keep each scenario's records and receiver packets in its own local workspace.
export function createDomain(caseDefinitions = CASES, scenarioId = 'common-ground') {
  if (typeof scenarioId !== 'string' || !/^[a-z][a-z0-9-]{0,79}$/.test(scenarioId) ||
      !Array.isArray(caseDefinitions) || !caseDefinitions.length ||
      caseDefinitions.some(c => !c || typeof c.id !== 'string' || !c.id) ||
      new Set(caseDefinitions.map(c => c.id)).size !== caseDefinitions.length) {
    throw new Error('A scenario requires an identifier and a unique set of cases.');
  }
  const CASES = clone(caseDefinitions);
  const STORAGE_KEY = scenarioId === 'common-ground' ? 'blind-handoff-v1' : `blind-handoff-v1:${scenarioId}`;
  const initialDraft = () => Object.fromEntries(CASES.map(c => [c.id, clone(c.draft)]));
  const initialState = () => ({ version: VERSION, draft: initialDraft(), runs: [], pendingReceiver: null });
  const string = (value, max) => typeof value === 'string' && value.length <= max;
  function validDraft(draft) {
    return exactKeys(draft, CASES.map(c => c.id)) && CASES.every(c => {
      const d = draft[c.id];
      return d && string(d.summary, 600) && string(d.owner, 100) && string(d.action, 600) && string(d.evidenceId, 80);
    });
  }
  function structuralIssues(id, draft) {
    const item = draft[id] || {};
    const c = CASES.find(c => c.id === id);
    if (!c) throw new Error('Unknown case');
    const issues = [];
    if (!item.owner?.trim()) issues.push({ field: 'owner', type: 'missing', message: 'Nobody is named to take the next step.' });
    if (!item.action?.trim()) issues.push({ field: 'action', type: 'missing', message: 'The next step is missing. The incoming shift cannot tell what to do.' });
    if (item.evidenceId !== c.evidenceId) issues.push({ field: 'evidenceId', type: 'missing', message: item.evidenceId ? 'This evidence does not belong to this case.' : 'The supporting record was not included in this handoff.' });
    return issues;
  }
  function makeSnapshot(draft, sequence, now = new Date().toISOString()) {
    if (!validDraft(draft)) throw new Error('Invalid handoff draft');
    return { sequence, createdAt: now, synthetic: true, draft: clone(draft) };
  }
  function validateAnswer(answer) {
    return answer && ['ready', 'blocked'].includes(answer.status) && string(answer.note ?? '', 300) &&
      (answer.status === 'ready' || Object.hasOwn(FIELDS, answer.field));
  }
  function finishRun(snapshot, answers, now = new Date().toISOString()) {
    if (!snapshot || !validDraft(snapshot.draft)) throw new Error('Invalid snapshot');
    if (!answers || !CASES.every(c => validateAnswer(answers[c.id]))) throw new Error(`Review all ${CASES.length === 3 ? 'three' : CASES.length} cases before finishing.`);
    const findings = CASES.map(c => {
      const issues = structuralIssues(c.id, snapshot.draft);
      const answer = answers[c.id];
      if (answer.status === 'blocked' && !issues.some(i => i.field === answer.field)) {
        issues.push({ field: answer.field, type: 'reader', message: answer.note?.trim() || `The incoming reader needs a clearer ${FIELDS[answer.field].toLowerCase()}.` });
      }
      return { id: c.id, issues, answer: clone(answer) };
    });
    return {
      snapshot: clone(snapshot), answers: clone(answers), findings, completedAt: now,
      structuralGaps: findings.flatMap(f => f.issues).filter(i => i.type === 'missing').length,
      readerConcerns: findings.flatMap(f => f.issues).filter(i => i.type === 'reader').length,
      blockedCases: findings.filter(f => f.issues.length).length
    };
  }
  function parseSaved(raw) {
    if (!raw) return { state: initialState(), warning: '' };
    try {
      const value = JSON.parse(raw);
      if (value.version !== VERSION || !validDraft(value.draft) || !Array.isArray(value.runs) || value.runs.length > 10) throw new Error();
      const runs = value.runs.map(run => {
        if (!Number.isSafeInteger(run.snapshot?.sequence) || run.snapshot.sequence < 1 || !string(run.snapshot.createdAt, 40) || !string(run.completedAt, 40)) throw new Error();
        const restored = finishRun(run.snapshot, run.answers, run.completedAt);
        if (run.review?.mode === 'receiver-file' && typeof run.review.packetId === 'string' && validDate(run.review.importedAt)) {
          restored.review = { mode: 'receiver-file', packetId: run.review.packetId, importedAt: run.review.importedAt };
        }
        return restored;
      });
      const pendingReceiver = value.pendingReceiver ?? null;
      if (pendingReceiver) validatePendingReceiver(pendingReceiver);
      return { state: { version: VERSION, draft: clone(value.draft), runs, pendingReceiver: clone(pendingReceiver) }, warning: '' };
    } catch {
      return { state: initialState(), warning: 'The saved rehearsal could not be read. A fresh synthetic draft is open; your old saved value has not been uploaded anywhere.' };
    }
  }
  function buildExport(state) {
    return { format: 'blind-handoff', version: VERSION, synthetic: true, exportedAt: new Date().toISOString(), draft: clone(state.draft), runs: clone(state.runs), pendingReceiver: clone(state.pendingReceiver ?? null), comparison: compareRuns(state.runs.at(-2), state.runs.at(-1)), limits: 'Structural presence and evidence-reference checks plus reader feedback. Not a verification of operational correctness.' };
  }

  const validDate = value => typeof value === 'string' && value.length <= 40 && Number.isFinite(Date.parse(value));
  const exactKeys = (value, keys) => value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
  const canonical = value => JSON.stringify(value, function (_, item) {
    return item && typeof item === 'object' && !Array.isArray(item)
      ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item;
  });
  const nextSequence = state => Math.max(0, ...state.runs.map(run => run.snapshot.sequence), state.pendingReceiver?.snapshot.sequence || 0) + 1;

  /** Whitelist receiver data. Never serialize CASES or the full authoring state. */
  function receiverPayload(snapshot, id) {
    if (!validDraft(snapshot?.draft) || !Number.isSafeInteger(snapshot.sequence) || snapshot.sequence < 1 || !validDate(snapshot.createdAt) ||
        typeof id !== 'string' || !/^[a-f0-9-]{36}$/.test(id)) throw new Error('Invalid receiver packet.');
    return {
      format: 'blind-handoff-receiver', version: RECEIVER_VERSION, id, sequence: snapshot.sequence, createdAt: snapshot.createdAt,
      cases: CASES.map(c => {
        const note = snapshot.draft[c.id];
        return { id: c.id, note: { summary: note.summary, owner: note.owner, action: note.action },
          attachment: note.evidenceId === c.evidenceId ? { title: c.evidence.title, body: c.evidence.body } : null };
      })
    };
  }
  function makeReceiverPacket(draft, sequence, id, now) {
    const snapshot = makeSnapshot(draft, sequence, now);
    return { snapshot, packet: receiverPayload(snapshot, id) };
  }
  function validatePendingReceiver(pending) {
    if (!exactKeys(pending, ['snapshot', 'packet']) || canonical(receiverPayload(pending.snapshot, pending.packet?.id)) !== canonical(pending.packet)) {
      throw new Error('The saved receiver packet does not match its frozen note.');
    }
  }
  function importReceiverResponse(state, raw, now = new Date().toISOString()) {
    if (typeof raw !== 'string' || raw.length > 65536) throw new Error('Choose a receiver response JSON file smaller than 64 KB.');
    let response;
    try { response = JSON.parse(raw); } catch { throw new Error('This is not a readable receiver response JSON file.'); }
    if (!exactKeys(response, ['format', 'version', 'packet', 'answers', 'completedAt']) || response.format !== 'blind-handoff-response' || response.version !== RECEIVER_VERSION) {
      throw new Error('Unsupported response format or version. Use the JSON downloaded from the receiver file.');
    }
    if (state.runs.some(run => run.review?.packetId === response.packet?.id)) throw new Error('This receiver response has already been imported. No second record was added.');
    if (!state.pendingReceiver) throw new Error('There is no pending receiver file in this workspace. Return to the browser that created it.');
    validatePendingReceiver(state.pendingReceiver);
    if (canonical(response.packet) !== canonical(state.pendingReceiver.packet)) {
      throw new Error('This response belongs to another file or a different frozen note. Nothing was imported.');
    }
    if (!validDate(response.completedAt) || !exactKeys(response.answers, CASES.map(c => c.id)) || !CASES.every(c => {
      const answer = response.answers[c.id];
      return exactKeys(answer, ['status', 'field', 'note']) && validateAnswer(answer) && Object.hasOwn(FIELDS, answer.field);
    })) throw new Error('The response must contain one valid decision for each case, with notes of at most 300 characters.');
    const run = finishRun(state.pendingReceiver.snapshot, response.answers, response.completedAt);
    run.review = { mode: 'receiver-file', packetId: response.packet.id, importedAt: now };
    return { ...clone(state), runs: [...clone(state.runs), run].slice(-10), pendingReceiver: null };
  }

  // Optimistic guard: never silently overwrite a newer version observed in another tab.
  function saveLocalState(storage, key, expectedRaw, state) {
    try {
      if (storage.getItem(key) !== expectedRaw) return { status: 'conflict' };
      const raw = JSON.stringify(state);
      storage.setItem(key, raw);
      return { status: 'saved', raw };
    } catch { return { status: 'unavailable' }; }
  }


  /** Compare only immutable records, never the editable draft or original source notes. */
  function compareRuns(previous, current) {
    if (!previous || !current) return null;
    if (!validDraft(previous.snapshot?.draft) || !validDraft(current.snapshot?.draft)) throw new Error('Two valid frozen handoffs are required.');
    const issueKey = issue => `${issue.type}:${issue.field}`;
    const cases = CASES.map(c => {
      const before = previous.snapshot.draft[c.id];
      const after = current.snapshot.draft[c.id];
      const priorIssues = previous.findings.find(f => f.id === c.id).issues;
      const currentIssues = current.findings.find(f => f.id === c.id).issues;
      const priorKeys = new Set(priorIssues.map(issueKey));
      const currentKeys = new Set(currentIssues.map(issueKey));
      const resolved = priorIssues.filter(issue => !currentKeys.has(issueKey(issue)));
      const introduced = currentIssues.filter(issue => !priorKeys.has(issueKey(issue)));
      const persistent = currentIssues.filter(issue => priorKeys.has(issueKey(issue)));
      const fields = Object.entries(REPORT_FIELDS).map(([field, label]) => {
        const oldValue = before[field];
        const newValue = after[field];
        let change = 'unchanged';
        if (oldValue !== newValue) {
          if (!oldValue.trim() && newValue.trim()) change = 'added';
          else if (oldValue.trim() && !newValue.trim()) change = 'removed';
          else if (oldValue.trim() === newValue.trim()) change = 'spacing';
          else change = 'edited';
        }
        return { field, label, before: oldValue, after: newValue, change, resolved: resolved.filter(i => i.field === field), introduced: introduced.filter(i => i.field === field), persistent: persistent.filter(i => i.field === field) };
      });
      const readerBefore = previous.answers[c.id];
      const readerAfter = current.answers[c.id];
      const readerValue = a => JSON.stringify([a.status, a.status === 'blocked' ? a.field : null, a.note?.trim() || '']);
      return {
        id: c.id, fields, resolved, introduced, persistent,
        beforeIssueCount: priorIssues.length, afterIssueCount: currentIssues.length,
        readerBefore: clone(readerBefore), readerAfter: clone(readerAfter), readerChanged: readerValue(readerBefore) !== readerValue(readerAfter),
        outcome: currentIssues.length === 0 ? (priorIssues.length ? 'resolved' : 'clear') : priorIssues.length === 0 ? 'regressed' : 'blocked'
      };
    });
    return {
      from: previous.snapshot.sequence, to: current.snapshot.sequence, cases,
      changedFields: cases.reduce((n, c) => n + c.fields.filter(f => f.change !== 'unchanged').length, 0),
      resolvedIssues: cases.reduce((n, c) => n + c.resolved.length, 0),
      introducedIssues: cases.reduce((n, c) => n + c.introduced.length, 0),
      persistentIssues: cases.reduce((n, c) => n + c.persistent.length, 0),
      changedReaders: cases.filter(c => c.readerChanged).length
    };
  }

  return { VERSION, STORAGE_KEY, FIELDS, REPORT_FIELDS, RECEIVER_VERSION, CASES, clone,
    initialDraft, initialState, validDraft, structuralIssues, makeSnapshot, validateAnswer, finishRun, parseSaved, buildExport, nextSequence, receiverPayload, makeReceiverPacket, importReceiverResponse, saveLocalState, compareRuns };
}

export const {
  initialDraft, initialState, validDraft, structuralIssues, makeSnapshot, validateAnswer, finishRun, parseSaved, buildExport, nextSequence, receiverPayload, makeReceiverPacket, importReceiverResponse, saveLocalState, compareRuns
} = createDomain();
