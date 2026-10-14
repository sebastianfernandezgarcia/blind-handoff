---
doc: checklist
status: draft
---
# Build checklist

Build mode: not learner-selected. Agent implementation proceeded under existing authorization for local construction. Mechanical checks below are actual; learner checkpoints remain open. No curriculum approval is implied by completed implementation.

Current verification, 13 October: **40 tests pass**, including a clean extraction of the portable source ZIP. Counts inside earlier slices are historical results, not the current suite size. [Current verification and limits](../docs/verification-current.md) summarize the expanded app. Historical working-archive documents named below are not bundled with the portable source; they retain the original dated screenshots and agent records locally.

## Slices

- [x] **1. Rehearse a prepared handoff and identify concrete gaps**
  Becomes usable: A local app with three editable synthetic cases, a frozen incoming view and case findings.
  Why now: Proves the receiving-side kernel in the first usable version.
  PRD ref: `prd.md > Blind Rehearsal`, `prd.md > Findings and Repair`.
  Spec ref: `spec.md > Scenario and Core Rules`, `spec.md > Browser Views`.
  Build: Serve local browser files; implement preparation, snapshot, reader responses and findings.
  Verify (mechanical): Node domain/HTTP tests; actual browser produced three gaps and three blocked cases.
  Learner check: Open the seed, rehearse it, and say which missing fact actually prevents continuing.
  Commit: Not created. Proposed unit: `feat: rehearse and repair a synthetic shift handoff`.

- [x] **2. Repair, preserve and compare completed rehearsals**
  Becomes usable: Corrected notes can be tried again without rewriting an earlier record; local saving and JSON export preserve evidence.
  Why now: Closes the learning loop with visible before/after results.
  PRD ref: `prd.md > Local Save and Export`, `prd.md > Findings and Repair`.
  Spec ref: `spec.md > Local Storage and Export`.
  Build: Persistence schema, immutable reports, comparison, export and conflict warning.
  Verify (mechanical): 18 Node tests pass (including the later comparison slice). Browser journey produced 3→0, reload preserved both runs, download verified. Two-tab stale write rejected. Mobile 390px had no horizontal overflow.
  Learner check: Repair the missing facts, rerun and inspect whether the second result corresponds to your changes.
  Commit: Not created. Proposed unit: `feat: preserve handoff rehearsal evidence and protect stale tabs`.

- [x] **3. Explain exactly what improved between rehearsals**
  Becomes usable: A focused console compares the latest frozen runs by field and case, retains both reader comments and links findings to their repair input.
  PRD ref: `prd.md > Compare Frozen Runs`.
  Spec ref: `spec.md > Frozen Comparison`.
  Verify: 18 tests pass; independent review's note-only-change defect repaired and rechecked. Fresh Chrome flow produced 5 field changes and 3 resolved findings, with 0 new/persistent findings; mobile prepare/incoming/comparison fits 390px. See `docs/redesign-verification.md`.
  Learner check: Decide whether the changes explain why the next shift can proceed.
  Commit: Not created. Proposed unit: `feat: compare frozen handoffs in an operations rehearsal console`.

- [x] **4. Exchange a frozen handoff with a separate reader offline**
  Becomes usable: Export an HTML file containing only the note and selected attachments, then import its matching JSON response.
  PRD ref: `prd.md > Another Reader, Offline`.
  Spec ref: `spec.md > Offline Receiver Exchange`.
  Verify: Tests validate whitelisting, HTML escaping, offline form runtime, exact packet matching, stale/duplicate rejection and persistence. A real app download and JSON import were checked in the browser; opening the standalone HTML in a browser remains unverified.
  Learner check: Read or exchange the receiving file and describe any confusing step. Pending.

- [x] **5. Practise across fifteen fictional cases in five scenarios**
  Becomes usable: Choose a work situation without losing another collection's draft, reports or pending receiver file.
  PRD ref: `prd.md > Scenario library, 13 October`.
  Spec ref: `spec.md > Scenario isolation, 13 October`.
  Verify: Forty tests pass, including scenario isolation, legacy saves, all twelve added cases and separate structural/reader judgments. Browser verification confirmed collection switching, report persistence and one ambiguous audiovisual instruction flagged by the agent. No new human or mobile trial is claimed.
  Learner check: Try a new collection through preparation, review and repair. Pending.

## Hands-on Checkpoints

- [ ] Early usable behavior explored by learner.
- [ ] Final exploration and learner feedback completed.

## Final Review

- [x] Agent verification and independent code review performed; observed defects repaired. See `docs/verification.md`.
- [ ] Final learner review complete, feedback resolved and readiness confirmed.

## Code Tour and App Map

- [ ] Learning activity completed with learner.
- [ ] Optional edit and reflection offered or addressed.
- [x] `devpost/app-map.html` generated as a reference route from actual code.
- [ ] App map reviewed with learner.

Activity and evidence: Agent-only checks in `docs/verification.md`; no personal reflection invented.
Route and stops: `public/app.js` start/finish actions → `public/domain.js` makeSnapshot/finishRun → report view.
Edit outcome: Agent fixes verified; learner exercise not performed.
Reflection: Not yet requested or answered.
Activity mode: Reference-only map; live learner activity pending.

## Revisions

- Corrected malformed evidence option found during the first browser pass.
- Incoming case rail now shows review state only; source-only priority hints were excluded after independent review.
- Local saving detects another tab's version and pauses instead of overwriting a saved run; export and reload keep choices explicit.
- Skill-defined learner approvals and per-slice commits were not performed. Planning status remains draft; see `docs/skill-pack-evidence.md` for the process boundary.
