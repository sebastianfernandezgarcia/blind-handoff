---
doc: prd
status: draft
---
# Blind Handoff: product requirements

## Basis
Agent draft derived from `scope.md`, written before code. No detailed learner review has occurred. Construction proceeds under the existing local-work authorization; this is not a completed curriculum checkpoint.

## The Core Journey
1. Choose one of five fictional work situations, each with three prepared cases.
2. Select a case. Compare source notes against editable summary, owner, next action and evidence.
3. Start a blind rehearsal. Freeze the draft; remove source notes from the rendered view.
4. Read each case as the incoming worker. Mark “I can continue” or identify a field that leaves the reader blocked.
5. Review case-level findings. Missing structured fields remain gaps even if the reader claims to continue.
6. Return to the outgoing desk, edit or deliberately copy source details, and run another rehearsal.
7. Compare the latest two runs and export the frozen handoff plus findings.

## Look and Feel
Revised after explicit learner feedback that the first interface felt generic. A working rehearsal console with white/cool-gray surfaces, ink-blue controls, system sans/mono typography, source and receiving-note panes, centered Prepare/Rehearse/Review steps and no landing hero. No external fonts or images. Visible focus, real labels, restrained motion and responsive layout.

## Features and Behavior

### Prepare a Handoff
Three cases remain in view in a navigation rail. Every case has source notes and an editable outgoing draft. Edits save locally. A “Use source details” button fills the selected case; it does not repair every case secretly. A reset action asks before replacing saved drafts and runs.

### Blind Rehearsal
Only the frozen handoff and referenced evidence render in this view. No source-note panel or autofill exists here. Source information remains in browser code, so this is a rehearsal boundary, not access control. All three cases require a reviewer decision before finishing. An “I can continue” answer never overrides a structurally missing field.

### Findings and Repair
For each case show the exact missing owner, next action or relevant evidence, plus reader-reported concerns. The summary counts structural gaps and blocked cases, not accuracy or safety. The report keeps previous and current results distinct and points back to editing. Evidence references must belong to their incident.

### Compare Frozen Runs
After two completed rehearsals, compare the latest two by case and field. Show exact previous/current situation, owner, next action and evidence values; classify added/removed/edited/spacing-only values. Separate resolved, newly introduced and persistent findings. Show reader status, flagged field and before/after comments independently of note edits. A changed reader opinion with unchanged wording must not claim the wording improved. The first run has an explicit empty comparison. An optional toggle reveals unchanged fields. Repair links focus the relevant draft field.

### Local Save and Export
Save drafts, rehearsal snapshots and one pending receiver file per scenario in browser localStorage. Export a JSON record with version, synthetic-data label, current draft, completed runs and the derived latest-pair comparison. The existing v1 saved schema remains compatible. No network upload takes place. If storage is corrupt/unavailable, explain the fallback and continue in memory without silently claiming persistence.

### Another Reader, Offline
Download a self-contained HTML file containing only the frozen notes and their selected attachments. The receiving page excludes authoring sources and expected findings. Its reader downloads a JSON response; the originating app accepts it only when its version, identity, complete frozen contents and answers match the pending file for that scenario. Duplicate or replaced-file responses are rejected. Reports distinguish imported responses from self-rehearsals. File matching does not authenticate the reader or prove an independent trial.

## States and Boundaries
- Keyboard: report tabs support arrows/Home/End; case changes focus their heading; repair links focus the exact input.
- Export: disable the active button while building the record; recover with explicit failure feedback.
- First use: Common Ground has three deliberate gaps. Each added scenario mixes one missing field, one ambiguous or outdated instruction, and one actionable note.
- Incomplete rehearsal: keep responses and show remaining case count; no success report yet.
- Complete rehearsal: only complete when every case has an explicit reader response.
- Browser reload: preserve draft and completed runs; incomplete rehearsal is deliberately restarted.
- Concurrent tab update: preserve the current tab in memory, pause local writes and offer export/reload instead of silently overwriting the newer saved version.
- Old/corrupt local save: ignore incompatible data with a visible message; no execution of stored markup.
- Outgoing revision: cannot modify completed snapshots.

## What We're Building
The full preparation, blind review, exact findings, repair, repeat, local save and export journey described above.

## Deferred From the POC
Custom cases, collaborative shared links, simultaneous editing, server persistence, semantic AI checking and actual operations use. Separate readers can exchange local files; there is no account or collaboration backend.

## Product Decisions
User decisions: solo, online, zero new spending, proceed with shortlisted local concepts. Agent assumptions: synthetic workshop setting, exact case copy, interface layout, field structure and deterministic checks. These are reviewable proposals, not invented learner preferences.

## Open Questions
Does the learner find the receiving-side exercise useful? Which terminology and case details need changing? Hands-on review is pending and must precede any claim of curriculum completion or submission readiness.

## Scenario library, 13 October

Select one of five work situations before preparing a handoff. Each contains three fictional cases. Switching retains other scenarios’ drafts, completed reports and pending receiver files; exports and reports concern only the selected collection. A reader may flag a concern when every field is present. A filled field must never be treated as automatic proof that an instruction is correct. The original Common Ground workspace remains readable.
