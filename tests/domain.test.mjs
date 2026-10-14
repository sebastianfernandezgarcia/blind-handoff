import test from 'node:test';
import assert from 'node:assert/strict';
import { CASES, initialDraft, initialState, structuralIssues, makeSnapshot, finishRun, parseSaved, buildExport } from '../public/domain.js';
const ready = () => Object.fromEntries(CASES.map(c => [c.id, { status: 'ready', note: '' }]));
const correctedDraft = () => Object.fromEntries(CASES.map(c => [c.id, { summary: c.summary, owner: c.owner, action: c.action, evidenceId: c.evidenceId }]));

test('seeded rehearsal has one concrete missing fact per case even if the reader claims confidence', () => {
  const run = finishRun(makeSnapshot(initialDraft(), 1), ready());
  assert.equal(run.structuralGaps, 3);
  assert.equal(run.blockedCases, 3);
  assert.deepEqual(run.findings.map(f => f.issues.map(i => i.field)), [['owner'], ['action'], ['evidenceId']]);
});
test('repairing all three facts and reviewing again produces an independent clean record', () => {
  const before = finishRun(makeSnapshot(initialDraft(), 1), ready());
  const after = finishRun(makeSnapshot(correctedDraft(), 2), ready());
  assert.equal(before.structuralGaps, 3);
  assert.equal(after.structuralGaps, 0);
  assert.equal(after.blockedCases, 0);
});
test('snapshot and completed report do not change when draft, snapshot or answers mutate', () => {
  const draft = initialDraft();
  const snapshot = makeSnapshot(draft, 1);
  const answers = ready();
  const report = finishRun(snapshot, answers);
  draft['CG-07'].owner = 'Changed';
  snapshot.draft['CG-12'].action = 'Changed';
  answers['CG-04'].status = 'blocked';
  assert.equal(report.snapshot.draft['CG-07'].owner, '');
  assert.equal(report.snapshot.draft['CG-12'].action, '');
  assert.equal(report.answers['CG-04'].status, 'ready');
});
test('cannot finish without a decision for every case or with an invalid blocked field', () => {
  const snapshot = makeSnapshot(initialDraft(), 1);
  const answers = ready();
  delete answers['CG-12'];
  assert.throws(() => finishRun(snapshot, answers), /Review all three/);
  answers['CG-12'] = { status: 'blocked', field: 'unknown' };
  assert.throws(() => finishRun(snapshot, answers), /Review all three/);
});
test('a completed field may still be blocked by the reader, with the actual concern retained', () => {
  const answers = ready();
  answers['CG-07'] = { status: 'blocked', field: 'action', note: 'I need the exact dispatch desk contact.' };
  const report = finishRun(makeSnapshot(correctedDraft(), 1), answers);
  assert.equal(report.structuralGaps, 0);
  assert.equal(report.readerConcerns, 1);
  assert.equal(report.blockedCases, 1);
  assert.equal(report.findings[0].issues[0].message, answers['CG-07'].note);
});
test('reader flag for an already missing field does not double count the same gap', () => {
  const answers = ready();
  answers['CG-07'] = { status: 'blocked', field: 'owner', note: 'Who calls?' };
  const report = finishRun(makeSnapshot(initialDraft(), 1), answers);
  assert.equal(report.structuralGaps, 3);
  assert.equal(report.readerConcerns, 0);
  assert.equal(report.answers['CG-07'].note, 'Who calls?');
});
test('evidence for another incident and whitespace-only values cannot pass', () => {
  const draft = correctedDraft();
  Object.assign(draft['CG-07'], { owner: '  ', action: '\n', evidenceId: 'booking-note' });
  assert.equal(structuralIssues('CG-07', draft).length, 3);
});
test('valid persistence re-computes findings instead of trusting forged cached totals', () => {
  const state = initialState();
  const run = finishRun(makeSnapshot(state.draft, 1), ready());
  run.structuralGaps = 0;
  run.findings = [];
  state.runs.push(run);
  const parsed = parseSaved(JSON.stringify(state));
  assert.equal(parsed.warning, '');
  assert.equal(parsed.state.runs[0].structuralGaps, 3);
});
test('corrupt, incompatible or oversized saved input falls back visibly', () => {
  for (const raw of ['oops', 'null', JSON.stringify({ version: 999 }), JSON.stringify({ ...initialState(), draft: { ...initialDraft(), 'CG-07': { ...initialDraft()['CG-07'], owner: 'x'.repeat(101) } } })]) {
    const parsed = parseSaved(raw);
    assert.ok(parsed.warning);
    assert.deepEqual(parsed.state, initialState());
  }
});
test('export is explicit about synthetic data and keeps detached snapshots', () => {
  const state = initialState();
  const exported = buildExport(state);
  state.draft['CG-07'].owner = 'changed';
  assert.equal(exported.synthetic, true);
  assert.equal(exported.draft['CG-07'].owner, '');
  assert.match(exported.limits, /Not a verification/);
});

test('stale-tab save cannot silently remove another tab’s completed rehearsal', async () => {
  const { saveLocalState } = await import('../public/domain.js');
  let raw = null;
  const storage = { getItem: () => raw, setItem: (_, value) => { raw = value; } };
  const tabA = initialState(), tabB = initialState();
  tabA.runs.push(finishRun(makeSnapshot(tabA.draft, 1), ready()));
  assert.equal(saveLocalState(storage, 'test', null, tabA).status, 'saved');
  tabB.draft['CG-07'].owner = 'Different tab';
  assert.equal(saveLocalState(storage, 'test', null, tabB).status, 'conflict');
  assert.equal(JSON.parse(raw).runs.length, 1);
  assert.equal(JSON.parse(raw).draft['CG-07'].owner, '');
});
test('storage failures return an explicit unavailable result', async () => {
  const { saveLocalState } = await import('../public/domain.js');
  assert.equal(saveLocalState({ getItem: () => { throw new Error('denied'); } }, 'test', null, initialState()).status, 'unavailable');
});

test('comparison explains each repaired field from frozen records, including a changed reader decision', async () => {
  const { compareRuns } = await import('../public/domain.js');
  const answers = ready();
  answers['CG-07'] = { status: 'blocked', field: 'owner', note: 'Who owns this?' };
  const before = finishRun(makeSnapshot(initialDraft(), 1), answers);
  const after = finishRun(makeSnapshot(correctedDraft(), 2), ready());
  const diff = compareRuns(before, after);
  assert.equal(diff.from, 1);
  assert.equal(diff.to, 2);
  assert.equal(diff.resolvedIssues, 3);
  assert.equal(diff.introducedIssues, 0);
  assert.equal(diff.persistentIssues, 0);
  assert.equal(diff.changedReaders, 1);
  assert.deepEqual(diff.cases.map(c => c.outcome), ['resolved', 'resolved', 'resolved']);
  const owner = diff.cases[0].fields.find(f => f.field === 'owner');
  assert.equal(owner.change, 'added');
  assert.equal(owner.before, '');
  assert.equal(owner.after, 'Maya Chen');
  after.snapshot.draft['CG-07'].owner = 'Later mutation';
  assert.equal(owner.after, 'Maya Chen');
});
test('comparison distinguishes new regressions and persistent gaps instead of claiming progress', async () => {
  const { compareRuns } = await import('../public/domain.js');
  const beforeDraft = correctedDraft();
  beforeDraft['CG-12'].action = '';
  const afterDraft = structuredClone(beforeDraft);
  afterDraft['CG-07'].evidenceId = '';
  const diff = compareRuns(finishRun(makeSnapshot(beforeDraft, 2), ready()), finishRun(makeSnapshot(afterDraft, 3), ready()));
  assert.equal(diff.resolvedIssues, 0);
  assert.equal(diff.introducedIssues, 1);
  assert.equal(diff.persistentIssues, 1);
  assert.equal(diff.cases[0].outcome, 'regressed');
  assert.equal(diff.cases[0].fields.find(f => f.field === 'evidenceId').change, 'removed');
  assert.equal(diff.cases[1].outcome, 'blocked');
  assert.equal(diff.cases[2].outcome, 'clear');
});
test('unchanged wording and changed reader judgment are reported separately', async () => {
  const { compareRuns } = await import('../public/domain.js');
  const oldAnswers = ready();
  oldAnswers['CG-07'] = { status: 'blocked', field: 'action', note: 'This trigger is unclear.' };
  const draft = correctedDraft();
  const diff = compareRuns(finishRun(makeSnapshot(draft, 1), oldAnswers), finishRun(makeSnapshot(draft, 2), ready()));
  assert.equal(diff.changedFields, 0);
  assert.equal(diff.changedReaders, 1);
  assert.equal(diff.resolvedIssues, 1);
  assert.equal(diff.cases[0].fields.find(f => f.field === 'action').change, 'unchanged');
});
test('comparison empty state and old v1 data remain compatible', async () => {
  const { compareRuns } = await import('../public/domain.js');
  assert.equal(compareRuns(null, null), null);
  const oldState = initialState();
  oldState.runs.push(finishRun(makeSnapshot(oldState.draft, 1), ready()));
  const loaded = parseSaved(JSON.stringify(oldState));
  assert.equal(loaded.warning, '');
  assert.equal(loaded.state.runs.length, 1);
  assert.equal(buildExport(loaded.state).comparison, null);
});
