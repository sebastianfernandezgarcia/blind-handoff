---
doc: spec
status: draft
---
# Blind Handoff: technical spec

## How This Works, In Plain Language
The browser keeps a separate three-note draft for each selected scenario. Starting a rehearsal copies those notes so later edits cannot change what the incoming worker saw. The app renders only that copy until the rehearsal ends. A deterministic checker identifies empty fields and invalid evidence references; the reader separately flags information that exists but is unclear. No model judges operational correctness.

## The Core Journey Through the System
Implements `prd.md > The Core Journey`. Edit form → draft object → local save. Start → deep-copy snapshot → incoming view and reviewer decisions. Finish → structural checks plus concerns → immutable report. Repair → edit draft; previous snapshot stays unchanged. Repeat → compare two completed reports.

## Stack
Agent implementation proposal, not a learner-selected stack: Node.js 20+ built-in HTTP and test modules; vanilla browser HTML, CSS and ES modules. No npm dependencies, API keys, external fonts or services. Simpler startup and zero new service charges; tradeoff is manual view composition.
- [Node HTTP](https://nodejs.org/api/http.html)
- [Node test runner](https://nodejs.org/api/test.html)
- [MDN Web Storage](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)

## Where It Runs and How Someone Tries It
`npm start`, then `http://127.0.0.1:4319`. The server binds only loopback and serves a fixed allowlist from `public/`. `npm test` runs deterministic logic and real HTTP tests. No deployment or public repository exists. A public repository and a short accessible demo video remain required for eventual contest submission; local delivery preparation does not publish either.

## Look and Feel
Implements `prd.md > Look and Feel`. CSS variables for white, cool gray and ink blue. Platform sans typography with mono metadata, no display serif or landing hero. Large labels and minimum 44px primary control targets. Two-column editing at desktop, stacked at narrow width. Reduced motion respected.

## Components
### Scenario and Core Rules
`public/domain.js` contains synthetic case facts, defaults, snapshot construction, per-case structural validation, run completion and safe persistence parsing. Implements `prd.md > Findings and Repair`.
### Browser Views
`public/app.js` renders prepare, incoming and report screens using escaped text. Delegated events edit fields, record reviewer answers and invoke domain functions. Implements `prd.md > Prepare a Handoff` and `prd.md > Blind Rehearsal`.
### Frozen Comparison
`compareRuns(previous, current)` derives an immutable per-case/field diff only from saved snapshot values. Finding identity is type plus field: resolved, introduced and persistent issues remain distinct. Reader status/field/comment changes are tracked separately; presentation retains both comments with HTML escaping. No stored schema migration is needed: v1 runs already contain the necessary data. `buildExport()` includes the derived comparison as an additive field. Implements `prd.md > Compare Frozen Runs`.
### Local Storage and Export
Browser localStorage key `blind-handoff-v1` for Common Ground and `blind-handoff-v1:<scenario-id>` for each added scenario; failure visible with in-memory continuation. Schema validation resets incompatible data. An expected saved-value comparison and storage event warning pause writes if another tab changes the record. This is an optimistic guard for one active editor, not transactional multi-user synchronization. Export uses a local Blob download. Implements `prd.md > Local Save and Export`.
### Offline Receiver Exchange
`makeReceiverPacket()` freezes a scenario's draft. `public/receiver.js` creates a self-contained HTML page from whitelisted notes and selected attachments, without authoring sources or expected answers. Its form downloads a JSON response locally. `importReceiverResponse()` validates the version, unique packet identity, full frozen payload and each answer against the scenario's pending file before adding a report. A replacement invalidates the previous pending file; a completed import cannot be repeated. The files have no signature or identity verification. Implements `prd.md > Another Reader, Offline`.
### Local Server
`server.mjs` serves only `/`, `/index.html`, `/styles.css`, `/app.js`, `/domain.js`, `/receiver.js`, `/scenarios.js` and `/health`, with MIME and security headers. No filesystem browsing, uploads or arbitrary file access.

## Data Model
`Draft`: map case ID → summary, owner, action, evidenceId. `Snapshot`: deep copied draft plus synthetic marker and monotonic run number. `Answer`: ready or blocked, optional flagged field and note. `Report`: frozen snapshot, answers, issues and totals, with review provenance for imported responses. Keep up to ten reports and one pending receiver packet locally per scenario. Invalid or incompatible saved structures are rejected. An in-progress self-rehearsal is in memory only; a pending receiver packet survives reload.

## File Structure
```
public/index.html       semantic shell
public/styles.css       responsive presentation
public/domain.js        synthetic data and pure rules
public/scenarios.js     twelve additional fictional cases in four collections
public/receiver.js      self-contained receiving-page generation
public/app.js           rendering and interactions
server.mjs              loopback-only static server
 tests/domain.test.mjs  rehearsal and persistence contracts
 tests/server.test.mjs  serving boundary
 tests/presentation.test.mjs  frozen reader-note rendering regression
 tests/receiver.test.mjs  packet privacy, offline runtime and response validation
 tests/scenario-domain.test.mjs  scenario isolation and legacy compatibility
 tests/scenario-library.test.mjs  added case structure and reader judgment
 devpost/               planning docs, checklist and app map
 docs/                  source evidence, verification and demo shot list
```

## External Services and Dependencies
None at runtime. Official Devpost Learn Skill Pack is preserved locally under `.agents/skills` at upstream commit `a0f065781873e8a7ed9a9a705a8dafa6a0810439`; attribution is in `THIRD_PARTY_NOTICES.md`. It is authoring guidance, not a runtime service.

## Important Failure Modes
- Unavailable/corrupt storage → visible warning, continue in memory or defaults.
- Forged cross-case evidence → invalid evidence gap, never pass.
- Missing reader responses → cannot finish rehearsal.
- Malicious text → HTML escaped at rendering boundary; no external content loaded.

## What Was Simplified and Why
Five selectable fictional scenarios replace real data integration. Deterministic presence/reference checks plus human concerns replace unverifiable AI scoring. This supports practising information transfer without claiming semantic correctness.

## Decisions and Open Issues
No learner uncertainty or learning reflection has been elicited yet. Current stack and detailed design are agent proposals under delegated construction scope. Learner review of draft plans and final app remains pending. A positive rehearsal means required fields are present and the reader says they can continue; it is not proof the instructions are correct.

## Scenario isolation, 13 October

`createDomain(cases, scenarioId)` binds validation, snapshots, findings, comparison and receiver files to one set of case IDs. The URL selects a known scenario; unknown IDs fall back to Common Ground. The original `blind-handoff-v1` storage key and v1 records remain compatible. Added scenarios use `blind-handoff-v1:<scenario-id>`. The UI blocks switching if changes are only in memory, and reset affects only the selected scenario. `public/scenarios.js` is included in the server asset allowlist. No operational backend, custom-case editor or semantic grader was added.
