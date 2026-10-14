# Blind Handoff

Practise handing over work before the next person has to act on it. Choose a
fictional work situation, prepare three notes, freeze what the recipient will
see, collect a reader's decisions, repair unclear instructions and compare the
two saved versions.

## Run and test

Use Node.js 20 or newer and npm. No package installation, account, API key or
paid service is required. In this extracted folder:

```sh
npm test
npm start
```

Open [Blind Handoff locally](http://127.0.0.1:4319). The server listens only on
this computer. If port 4319 is already in use, stop the existing server first.
Ctrl+C stops it. Saved notes belong to the browser's origin and profile; an
existing browser can therefore show earlier work even after a fresh extraction.

## See the core idea in two minutes

1. Choose **Common Ground**. With a fresh starter, start the self-rehearsal.
2. Read the three notes. CG-07 has no owner, CG-12 no next action and CG-04 no
   selected evidence. Mark the relevant clarification for each one.
3. Review the findings: three structural gaps. Return to editing, read the
   source notes and repair each field, or use **Use these source details**.
4. Rehearse again. Mark a note usable only if it gives you enough information.
   The repaired example has zero structural gaps.
5. Open **Compare runs**. Inspect the exact changed fields and the reader's
   comments. Export the record or reload to check that completed reports remain.

This walkthrough describes deliberately incomplete fictional examples. The
three-to-zero result is a software demonstration, not a measured real-world
improvement. Resetting the selected scenario replaces its saved work only after
confirmation. Export anything you want to keep first.

## Try another work situation or another reader

The app contains fifteen fictional cases in five collections: a creative
workshop, audiovisual delivery, software support, bookings and events, and
studio maintenance. Each added collection mixes a missing field, an ambiguous
or outdated instruction, and a usable note. Drafts, up to ten reports and one
pending receiver file are kept separately for each collection.

In **Another reader**, select **Create receiver file**. The downloaded HTML
contains only the frozen notes and selected attachments, with no authoring
sources or expected answers. A reader opens it offline and selects **Download
my response** after reviewing the three notes. Import that JSON into the same
scenario in the originating browser. The response must match the pending file's
identity and complete frozen contents. Duplicate and replaced-file responses
are rejected. Download the response before closing its page; unsaved answers
are not retained. This exchange does not authenticate the reader's identity.

## What is checked

The deterministic checker detects a missing owner, empty next action or absent
or mismatched evidence reference. The reader separately judges whether a note
makes sense. A filled field is not proof of correctness. Reports distinguish
reader concerns from structural gaps, and imported files from self-rehearsals.
If a reader's opinion changes without a note edit, the comparison shows that
separately rather than claiming the wording improved.

There are no model calls inside the product. AI assistance was used to build
it. All people, incidents and records are synthetic. It does not connect to
workplace systems, verify operational safety, create custom cases or support
simultaneous editors. When a second tab changes a saved record, saving pauses
to avoid silently overwriting the observed version.

## Inspect the work

- [Scope](devpost/scope.md), [requirements](devpost/prd.md) and
  [technical specification](devpost/spec.md) remain explicitly marked draft.
- [Build checklist](devpost/checklist.md) separates mechanical checks from
  learner checkpoints; the [app map](devpost/app-map.html) traces the code.
- [Skill Pack evidence](docs/skill-pack-evidence.md) records the pinned official
  source, actual use, process adaptations and incomplete human checkpoints.
- [Current verification](docs/verification-current.md) separates automated and
  browser evidence from the human checks that remain pending.
- [Package boundary](docs/package-boundary.md) explains the included files.
- `MANIFEST.json` lists the size and SHA-256 of every payload file.

Application code is MIT, with [its license](LICENSE). The included official
Devpost Learn Skill Pack is also MIT and retains its
[third-party notice](THIRD_PARTY_NOTICES.md). It is authoring guidance, not a
runtime dependency. Packaging does not establish contest eligibility, curriculum
completion, publication or submission.
