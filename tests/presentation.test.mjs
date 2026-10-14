import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import * as domain from '../public/domain.js';
import { EXTRA_SCENARIOS } from '../public/scenarios.js';

test('comparison renders both frozen reader notes when only the concern changes, escaping markup', async () => {
  const source = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');
  const main = { innerHTML: '', addEventListener() {} };
  const context = {
    domain, EXTRA_SCENARIOS, Intl, Date, console,
    document: { querySelector: selector => selector === '#main' ? main : {} },
    window: { localStorage: { getItem: () => null }, addEventListener() {} },
  };
  vm.createContext(context);
  vm.runInContext(source.replace(/^import[^\n]+\n/gm, '') + '\nthis.renderComparison = compareContent;', context);
  const draft = Object.fromEntries(domain.CASES.map(c => [c.id, { summary: c.summary, owner: c.owner, action: c.action, evidenceId: c.evidenceId }]));
  const answers = Object.fromEntries(domain.CASES.map(c => [c.id, { status: 'ready', note: '' }]));
  answers['CG-07'] = { status: 'blocked', field: 'action', note: 'Need the exact courier phone number.' };
  const before = domain.finishRun(domain.makeSnapshot(draft, 1), answers);
  answers['CG-07'].note = 'Need the escalation deadline. <script>unexpected()</script>';
  const after = domain.finishRun(domain.makeSnapshot(draft, 2), answers);
  const html = context.renderComparison(after, before);
  assert.match(html, /PREVIOUS READER NOTE/);
  assert.match(html, /Need the exact courier phone number\./);
  assert.match(html, /CURRENT READER NOTE/);
  assert.match(html, /Need the escalation deadline\. &lt;script&gt;unexpected\(\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /READER ASSESSMENT CHANGED/);
  assert.match(html, /without any change to the note/);
  assert.equal(domain.compareRuns(before, after).changedFields, 0);
});

test('a ready reader’s note remains visible and escaped in findings and comparison', async () => {
  const source = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');
  const main = { innerHTML: '', addEventListener() {} };
  const context = {
    domain, EXTRA_SCENARIOS, Intl, Date,
    document: { querySelector: selector => selector === '#main' ? main : {} },
    window: { localStorage: { getItem: () => null }, addEventListener() {} }
  };
  vm.createContext(context);
  vm.runInContext(source.replace(/^import[^\n]+\n/gm, '') + '\nthis.renderFindings = findingsContent; this.renderComparison = compareContent;', context);
  const draft = Object.fromEntries(domain.CASES.map(c => [c.id, { summary: c.summary, owner: c.owner, action: c.action, evidenceId: c.evidenceId }]));
  const answers = Object.fromEntries(domain.CASES.map(c => [c.id, { status: 'ready', note: '' }]));
  answers['CG-07'].note = 'I can call dispatch at the stated time.';
  const before = domain.finishRun(domain.makeSnapshot(draft, 1), answers);
  answers['CG-07'].note = 'Agent software QA: ready note retained <img onerror=unsafe()>.';
  const after = domain.finishRun(domain.makeSnapshot(draft, 2), answers);
  const findings = context.renderFindings(after);
  assert.match(findings, /Agent software QA: ready note retained &lt;img/);
  assert.doesNotMatch(findings, /<img/);
  const comparison = context.renderComparison(after, before);
  assert.match(comparison, /I can call dispatch at the stated time/);
  assert.match(comparison, /Agent software QA: ready note retained &lt;img/);
  assert.match(comparison, /READER ASSESSMENT CHANGED/);
  assert.equal(domain.compareRuns(before, after).changedReaders, 1);
  assert.equal(domain.compareRuns(before, after).changedFields, 0);
});
