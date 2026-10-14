import test from 'node:test';
import assert from 'node:assert/strict';
import { CASES, STORAGE_KEY, createDomain, initialState, makeSnapshot, finishRun, makeReceiverPacket, parseSaved } from '../public/domain.js';

const now = '2026-10-13T12:00:00.000Z';
const packetId = '653d5c15-d683-44e1-bd90-f19c2d7b8dc0';
const definitions = prefix => structuredClone(CASES.slice(0, 2)).map((c, index) => ({
  ...c, id: `${prefix}-${index + 1}`,
  evidenceId: `${prefix}-record-${index + 1}`,
  evidence: { ...c.evidence, id: `${prefix}-record-${index + 1}` },
  draft: { ...c.draft, evidenceId: `${prefix}-record-${index + 1}` }
}));
const answers = domain => Object.fromEntries(domain.CASES.map(c => [c.id, { status: 'ready', field: 'owner', note: '' }]));
const record = (domain, sequence = 1) => domain.finishRun(domain.makeSnapshot(domain.initialDraft(), sequence, now), answers(domain), now);
function pendingState(domain) {
  const state = domain.initialState();
  state.pendingReceiver = domain.makeReceiverPacket(state.draft, 1, packetId, now);
  return state;
}
const response = (domain, state) => JSON.stringify({
  format: 'blind-handoff-response', version: 1, packet: state.pendingReceiver.packet,
  answers: answers(domain), completedAt: now
});

test('scenarios isolate drafts and storage while Common Ground retains the legacy key', () => {
  const source = definitions('PRINT');
  const print = createDomain(source, 'print-studio');
  const events = createDomain(definitions('EVENT'), 'event-desk');
  assert.equal(STORAGE_KEY, 'blind-handoff-v1');
  assert.equal(createDomain(CASES, 'common-ground').STORAGE_KEY, STORAGE_KEY);
  assert.equal(print.STORAGE_KEY, 'blind-handoff-v1:print-studio');
  assert.notEqual(print.STORAGE_KEY, events.STORAGE_KEY);
  source[0].draft.owner = 'Mutated caller data';
  const first = print.initialDraft();
  first['PRINT-1'].owner = 'Edited draft';
  assert.equal(print.initialDraft()['PRINT-1'].owner, '');
  assert.equal(events.initialDraft()['EVENT-1'].owner, '');
  assert.equal(initialState().draft['CG-07'].owner, '');
  const storage = new Map();
  const local = { getItem: key => storage.get(key) ?? null, setItem: (key, raw) => storage.set(key, raw) };
  for (const domain of [print, events]) assert.equal(domain.saveLocalState(local, domain.STORAGE_KEY, null, domain.initialState()).status, 'saved');
  assert.equal(storage.size, 2);
});

test('drafts, restored runs and comparisons reject cases belonging to another scenario', () => {
  const print = createDomain(definitions('PRINT'), 'print-studio');
  const events = createDomain(definitions('EVENT'), 'event-desk');
  assert.equal(print.validDraft(events.initialDraft()), false);
  assert.equal(print.validDraft({ ...print.initialDraft(), ...events.initialDraft() }), false);
  assert.throws(() => print.makeSnapshot(events.initialDraft(), 1), /Invalid handoff draft/);
  assert.throws(() => print.structuralIssues('EVENT-1', print.initialDraft()), /Unknown case/);
  assert.throws(() => print.compareRuns(record(events), record(events, 2)), /Two valid frozen/);
  assert.throws(() => print.compareRuns(record(print), record(events)), /Two valid frozen/);
  const foreignRun = print.initialState(); foreignRun.runs.push(record(events));
  assert.ok(print.parseSaved(JSON.stringify(foreignRun)).warning);
  assert.ok(print.parseSaved(JSON.stringify(events.initialState())).warning);
});

test('a scenario with two cases reviews, repairs, compares and exports only its own cases', () => {
  const print = createDomain(definitions('PRINT'), 'print-studio');
  const before = record(print);
  assert.equal(before.structuralGaps, 2);
  assert.throws(() => print.finishRun(before.snapshot, {}), /Review all 2 cases/);
  assert.throws(() => print.finishRun(before.snapshot, null), /Review all 2 cases/);
  const state = print.initialState();
  for (const c of print.CASES) state.draft[c.id] = { summary: c.summary, owner: c.owner, action: c.action, evidenceId: c.evidenceId };
  const after = print.finishRun(print.makeSnapshot(state.draft, 2, now), answers(print), now);
  state.runs = [before, after];
  const exported = print.buildExport(state);
  assert.equal(after.structuralGaps, 0);
  assert.equal(exported.comparison.resolvedIssues, 2);
  assert.deepEqual(exported.comparison.cases.map(c => c.id), ['PRINT-1', 'PRINT-2']);
  assert.deepEqual(print.parseSaved(JSON.stringify(state)), { state, warning: '' });
});

test('receiver packets bind to their scenario even when another group reuses the packet ID', () => {
  const print = createDomain(definitions('PRINT'), 'print-studio');
  const events = createDomain(definitions('EVENT'), 'event-desk');
  const printState = pendingState(print), eventState = pendingState(events);
  assert.deepEqual(printState.pendingReceiver.packet.cases.map(c => c.id), ['PRINT-1', 'PRINT-2']);
  assert.deepEqual(print.parseSaved(JSON.stringify(printState)).state.pendingReceiver, printState.pendingReceiver);
  const unchanged = JSON.stringify(printState);
  assert.throws(() => print.importReceiverResponse(printState, response(events, eventState)), /another file/);
  assert.equal(JSON.stringify(printState), unchanged);
  assert.ok(print.parseSaved(JSON.stringify({ ...printState, pendingReceiver: eventState.pendingReceiver })).warning);
  const imported = print.importReceiverResponse(printState, response(print, printState), now);
  assert.equal(imported.pendingReceiver, null);
  assert.equal(imported.runs.length, 1);
  assert.equal(imported.runs[0].review.packetId, packetId);
  assert.deepEqual(imported.runs[0].findings.map(c => c.id), ['PRINT-1', 'PRINT-2']);
});

test('legacy v1 Common Ground runs and pending packets round-trip through the factory unchanged', () => {
  const legacy = initialState();
  const ready = Object.fromEntries(CASES.map(c => [c.id, { status: 'ready', note: '' }]));
  legacy.runs.push(finishRun(makeSnapshot(legacy.draft, 1, now), ready, now));
  legacy.pendingReceiver = makeReceiverPacket(legacy.draft, 2, packetId, now);
  const raw = JSON.stringify(legacy);
  const domain = createDomain(CASES, 'common-ground');
  assert.deepEqual(domain.parseSaved(raw), { state: legacy, warning: '' });
  assert.deepEqual(parseSaved(raw), domain.parseSaved(raw));
  assert.equal(domain.nextSequence(domain.parseSaved(raw).state), 3);
  const older = structuredClone(legacy); delete older.pendingReceiver;
  const restored = domain.parseSaved(JSON.stringify(older));
  assert.equal(restored.warning, '');
  assert.equal(restored.state.pendingReceiver, null);
  assert.deepEqual(restored.state.runs, legacy.runs);
});

test('new scenarios retain the ten-record and response-size limits', () => {
  const print = createDomain(definitions('PRINT'), 'print-studio');
  const state = pendingState(print);
  state.runs = Array.from({ length: 10 }, (_, index) => record(print, index + 2));
  assert.equal(print.parseSaved(JSON.stringify(state)).warning, '');
  const imported = print.importReceiverResponse(state, response(print, state), now);
  assert.equal(imported.runs.length, 10);
  assert.equal(imported.runs[0].snapshot.sequence, 3);
  assert.throws(() => print.importReceiverResponse(state, 'x'.repeat(65537)), /64 KB/);
  state.runs.push(record(print, 12));
  assert.ok(print.parseSaved(JSON.stringify(state)).warning);
});
