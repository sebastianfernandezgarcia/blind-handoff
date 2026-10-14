import test from 'node:test';
import assert from 'node:assert/strict';
import { createDomain } from '../public/domain.js';
import { EXTRA_SCENARIOS } from '../public/scenarios.js';

const date = '2026-10-13T16:00:00.000Z';
const packetId = '738db62f-2bfb-4da1-b92e-055c8352b464';
const exerciseDesign = {
  'studio-delivery': { missing: 'SD-02', field: 'owner', judgment: 'SD-01', ready: 'SD-03' },
  'software-ops': { missing: 'SO-01', field: 'owner', judgment: 'SO-02', ready: 'SO-03' },
  'bookings-events': { missing: 'BE-02', field: 'evidenceId', judgment: 'BE-01', ready: 'BE-03' },
  'studio-maintenance': { missing: 'SM-01', field: 'action', judgment: 'SM-02', ready: 'SM-03' }
};
const decisions = scenario => Object.fromEntries(scenario.cases.map(c => [c.id, { status: 'ready', field: 'action', note: '' }]));

test('the extra library provides twelve distinct, bounded cases with consistent attachment references', () => {
  assert.equal(EXTRA_SCENARIOS.length, 4);
  assert.equal(new Set(EXTRA_SCENARIOS.map(s => s.id)).size, 4);
  const cases = EXTRA_SCENARIOS.flatMap(s => s.cases);
  assert.equal(cases.length, 12);
  assert.equal(new Set(cases.map(c => c.id)).size, 12);
  assert.equal(new Set(cases.map(c => c.evidenceId)).size, 12);
  for (const scenario of EXTRA_SCENARIOS) {
    assert.equal(scenario.cases.length, 3);
    assert.ok(scenario.title.trim());
    assert.ok(scenario.description.trim());
    const domain = createDomain(scenario.cases, scenario.id);
    assert.ok(domain.validDraft(domain.initialDraft()));
    for (const c of scenario.cases) {
      for (const field of ['id', 'title', 'category', 'priority', 'summary', 'source', 'owner', 'action', 'evidenceId']) {
        assert.equal(typeof c[field], 'string');
        assert.ok(c[field].trim(), `${c.id} needs ${field}`);
      }
      assert.equal(c.evidence.id, c.evidenceId);
      assert.ok(c.evidence.title.trim());
      assert.ok(c.evidence.body.trim());
      for (const [field, max] of Object.entries({ summary: 600, owner: 100, action: 600, evidenceId: 80 })) {
        assert.ok(c[field].length <= max, `${c.id} ${field} reference is too long`);
        assert.equal(typeof c.draft[field], 'string');
        assert.ok(c.draft[field].length <= max, `${c.id} ${field} draft is too long`);
      }
      assert.ok(c.draft.evidenceId === '' || c.draft.evidenceId === c.evidenceId);
    }
  }
});

for (const scenario of EXTRA_SCENARIOS) {
  test(`${scenario.id}: a missing field, a reader judgment, and a usable note remain distinct`, () => {
    const domain = createDomain(scenario.cases, scenario.id);
    const design = exerciseDesign[scenario.id];
    const draft = domain.initialDraft();
    assert.deepEqual(domain.structuralIssues(design.missing, draft).map(i => i.field), [design.field]);
    assert.deepEqual(domain.structuralIssues(design.judgment, draft), []);
    assert.deepEqual(domain.structuralIssues(design.ready, draft), []);
    const judgment = scenario.cases.find(c => c.id === design.judgment);
    assert.notEqual(judgment.draft.action, judgment.action);

    // A reference-text difference is not an automatic verdict on operational correctness.
    const answers = decisions(scenario);
    const accepted = domain.finishRun(domain.makeSnapshot(draft, 1, date), answers, date);
    assert.equal(accepted.structuralGaps, 1);
    assert.equal(accepted.readerConcerns, 0);
    assert.equal(accepted.blockedCases, 1);
    assert.deepEqual(accepted.findings.find(f => f.id === design.judgment).issues, []);
    assert.deepEqual(accepted.findings.find(f => f.id === design.ready).issues, []);

    answers[design.judgment] = { status: 'blocked', field: 'action', note: 'The instruction and attached record do not agree.' };
    const questioned = domain.finishRun(domain.makeSnapshot(draft, 2, date), answers, date);
    assert.equal(questioned.structuralGaps, 1);
    assert.equal(questioned.readerConcerns, 1);
    assert.equal(questioned.blockedCases, 2);
    assert.equal(questioned.findings.find(f => f.id === design.judgment).issues[0].type, 'reader');

    const complete = Object.fromEntries(scenario.cases.map(c => [c.id, {
      summary: c.summary, owner: c.owner, action: c.action, evidenceId: c.evidenceId
    }]));
    const repaired = domain.finishRun(domain.makeSnapshot(complete, 3, date), decisions(scenario), date);
    assert.equal(repaired.structuralGaps, 0);
    assert.equal(repaired.blockedCases, 0);
  });

  test(`${scenario.id}: receiver packet includes selected evidence without author source notes`, () => {
    const domain = createDomain(scenario.cases, scenario.id);
    const packet = domain.makeReceiverPacket(domain.initialDraft(), 1, packetId, date).packet;
    assert.deepEqual(packet.cases.map(c => c.id), scenario.cases.map(c => c.id));
    for (const [index, entry] of packet.cases.entries()) {
      const original = scenario.cases[index];
      assert.deepEqual(Object.keys(entry).sort(), ['attachment', 'id', 'note']);
      assert.deepEqual(Object.keys(entry.note).sort(), ['action', 'owner', 'summary']);
      assert.equal(entry.note.action, original.draft.action);
      assert.ok(!JSON.stringify(packet).includes(original.source));
      assert.deepEqual(entry.attachment, original.draft.evidenceId ? {
        title: original.evidence.title, body: original.evidence.body
      } : null);
    }
  });
}
