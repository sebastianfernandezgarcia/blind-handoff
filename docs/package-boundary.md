# Portable source boundary

This 2026-10-13 snapshot contains runnable source, automated tests, draft
planning documents, an application map and the attributed official Skill Pack.
It is prepared locally for review. It does not contain a video, final submission
answers, a public repository URL or a submission receipt.

## Included and omitted

| Included | Reason |
| --- | --- |
| `public/`, `server.mjs`, `package.json` | Complete dependency-free runtime |
| `tests/` | Repeatable behavior and HTTP checks |
| Scope, PRD, spec, checklist and app map | Actual planning and implementation record |
| `.agents/skills/` and MIT notice | Official authoring guidance and attribution |
| Skill Pack evidence | Actual use and uncompleted learner checkpoints |

The learner profile, human-trial records, private workspace state, original Git
checkout, browser exports, screenshots, recordings, credentials, dependency
folders and unrelated applications are deliberately excluded. No Git history
is present in this snapshot; a later publication must audit any history it adds.

The source's synthetic case data and tests are part of the prototype, not real
customer or employer records. The copyright holder's name is intentionally
retained in the license. Test packet identifiers are synthetic fixtures.

## Verification

The generator uses an explicit file allowlist, rejects symlinks, scans selected
text for credential patterns, personal email addresses and host paths, checks
the copied Skill Pack against commit `a0f065781873e8a7ed9a9a705a8dafa6a0810439`, and checks local README
links. It creates a deterministic ZIP, verifies CRCs and SHA-256 values, then
runs `npm test` in a clean temporary extraction. Its audit receipt is stored
beside the source folder, outside this source archive.

These checks provide evidence about this snapshot. Pattern scans cannot prove
that no sensitive content exists, and software tests do not prove independent
human validation or full contest-process compliance. Plans remain drafts until
their actual review; no earlier approval is invented.
