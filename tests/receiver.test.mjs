import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { CASES, initialState, makeReceiverPacket, importReceiverResponse, parseSaved, nextSequence, finishRun, makeSnapshot } from '../public/domain.js';
import { receiverHTML } from '../public/receiver.js';

const id = '653d5c15-d683-44e1-bd90-f19c2d7b8dc0';
const now = '2026-10-13T12:00:00.000Z';
const ready = () => Object.fromEntries(CASES.map(c => [c.id, { status: 'ready', field: 'owner', note: '' }]));
function pendingState() {
  const state = initialState();
  state.pendingReceiver = makeReceiverPacket(state.draft, 1, id, now);
  return state;
}
const responseFor = state => ({ format: 'blind-handoff-response', version: 1, packet: structuredClone(state.pendingReceiver.packet), answers: ready(), completedAt: now });

test('receiver file contains only whitelisted frozen notes and chosen attachments', () => {
  const state = pendingState(), packet = state.pendingReceiver.packet;
  const html = receiverHTML(packet);
  assert.deepEqual(Object.keys(packet.cases[0]).sort(), ['attachment', 'id', 'note']);
  assert.equal(packet.cases[0].note.owner, '');
  assert.equal(packet.cases[1].note.action, '');
  assert.equal(packet.cases[2].attachment, null);
  for (const c of CASES) assert.ok(!html.includes(c.source), 'Author source must not travel with receiver file');
  assert.ok(!html.includes('Maya Chen'));
  assert.ok(!html.includes(CASES[2].evidence.body));
  assert.doesNotMatch(html, /structuralIssues|structuralGaps|readerConcerns|localStorage|three deliberate|fetch\(/);
  assert.match(html, /connect-src 'none'/);
  state.draft['CG-07'].owner = 'Later editing';
  assert.equal(packet.cases[0].note.owner, '');
});

test('markup in a frozen note cannot break out of HTML or JSON script elements', () => {
  const state = initialState();
  state.draft['CG-07'].summary = '</script><img src=x onerror=alert(1)>&\"';
  const packet = makeReceiverPacket(state.draft, 1, id, now).packet;
  const html = receiverHTML(packet);
  assert.equal([...html.matchAll(/<script\b/g)].length, 2);
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /&lt;\/script&gt;&lt;img/);
  const embedded = JSON.parse(html.match(/<script id="packet"[^>]*>([\s\S]*?)<\/script>/)[1]);
  assert.equal(embedded.cases[0].note.summary, state.draft['CG-07'].summary);
});

test('response binds to the frozen note even when the working draft changed', () => {
  const state = pendingState();
  state.draft['CG-07'].owner = 'Later draft';
  const response = responseFor(state);
  response.answers['CG-07'] = { status: 'blocked', field: 'owner', note: '<script>untrusted()</script>' };
  const next = importReceiverResponse(state, JSON.stringify(response), now);
  assert.equal(next.pendingReceiver, null);
  assert.equal(next.draft['CG-07'].owner, 'Later draft');
  assert.equal(next.runs[0].snapshot.draft['CG-07'].owner, '');
  assert.equal(next.runs[0].structuralGaps, 3);
  assert.equal(next.runs[0].review.mode, 'receiver-file');
  assert.equal(next.runs[0].answers['CG-07'].note, '<script>untrusted()</script>');
  assert.equal(state.runs.length, 0);
  assert.ok(state.pendingReceiver);
  assert.throws(() => importReceiverResponse(next, JSON.stringify(response)), /already been imported/);
});

test('wrong identity, version, note, attachment or extra payload cannot be imported', () => {
  const state = pendingState(), before = JSON.stringify(state);
  const changes = [
    response => response.version++,
    response => response.packet.version++,
    response => response.packet.id = '653d5c15-d683-44e1-bd90-f19c2d7b8dc1',
    response => response.packet.sequence++,
    response => response.packet.createdAt = '2026-10-14T12:00:00Z',
    response => response.packet.cases[0].note.owner = 'Forged owner',
    response => response.packet.cases[0].attachment.body = 'Forged attachment',
    response => response.packet.solution = 'Unrequested field',
    response => response.completedAt = 'not a timestamp',
    response => response.answers['CG-07'].note = 'x'.repeat(301),
    response => response.answers['CG-07'].field = 'unexpected',
    response => response.answers['CG-07'].execute = 'malicious',
    response => delete response.answers['CG-04'],
    response => response.answers.EXTRA = { status: 'ready', field: 'owner', note: '' },
    response => response.answers = null,
    response => response.packet = null
  ];
  for (const change of changes) {
    const response = responseFor(state); change(response);
    assert.throws(() => importReceiverResponse(state, JSON.stringify(response)));
    assert.equal(JSON.stringify(state), before);
  }
  for (const raw of ['null', '[]', '{broken', 'x'.repeat(65537)]) assert.throws(() => importReceiverResponse(state, raw));
  assert.throws(() => importReceiverResponse(initialState(), JSON.stringify(responseFor(state))), /no pending/);
});

test('pending packet survives reload, old saves remain readable, sequence is not reused', () => {
  const state = pendingState();
  const parsed = parseSaved(JSON.stringify(state));
  assert.equal(parsed.warning, '');
  assert.deepEqual(parsed.state.pendingReceiver, state.pendingReceiver);
  assert.equal(nextSequence(parsed.state), 2);
  state.runs.push(finishRun(makeSnapshot(state.draft, 2, now), ready(), now));
  const imported = importReceiverResponse(state, JSON.stringify(responseFor(state)), now);
  assert.equal(nextSequence(imported), 3);
  const restored = parseSaved(JSON.stringify(imported));
  assert.equal(restored.state.runs.at(-1).review.packetId, id);
  const legacy = initialState(); delete legacy.pendingReceiver;
  assert.equal(parseSaved(JSON.stringify(legacy)).warning, '');
  state.pendingReceiver.packet.cases[0].note.owner = 'Tampered stored packet';
  assert.ok(parseSaved(JSON.stringify(state)).warning);
});

test('offline runtime collects responses and produces a JSON file accepted by the author', async () => {
  const state = pendingState(), html = receiverHTML(state.pendingReceiver.packet);
  const listeners = {}, windowListeners = {}, status = {}, progress = {};
  const elements = Object.fromEntries(CASES.flatMap(c => [
    [`${c.id}-status`, { value: c.id === 'CG-07' ? 'blocked' : 'ready' }],
    [`${c.id}-field`, { value: 'owner', closest: () => ({ hidden: false }) }],
    [`${c.id}-note`, { value: c.id === 'CG-07' ? 'Who should call dispatch?' : '' }]
  ]));
  let downloaded, link;
  const form = { elements, addEventListener: (name, fn) => listeners[name] = fn, reportValidity: () => true };
  const context = {
    document: {
      querySelector: selector => ({ '#packet': { textContent: JSON.stringify(state.pendingReceiver.packet) }, form, '#status': status, '#progress': progress })[selector],
      createElement: () => (link = { click() {} })
    },
    window: { addEventListener: (name, fn) => windowListeners[name] = fn },
    Blob, Date, URL: { createObjectURL: blob => { downloaded = blob; return 'blob:local'; }, revokeObjectURL() {} }, setTimeout() {}
  };
  vm.runInNewContext([...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)][1][1], context);
  listeners.change(); assert.equal(progress.textContent, '3 of 3 cases reviewed');
  listeners.submit({ preventDefault() {} });
  assert.match(link.download, /response-653d5c15\.json$/);
  const imported = importReceiverResponse(state, await downloaded.text());
  assert.equal(imported.runs[0].answers['CG-07'].note, 'Who should call dispatch?');
  assert.match(status.textContent, /No upload/);
  assert.ok(windowListeners.beforeunload);
});
