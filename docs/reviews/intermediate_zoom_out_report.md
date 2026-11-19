# Intermediate Zoom Out Report (Stage 8)

**Target:** `docs/designs/counting_trainer.md` (lines 1-1160)
**Mode:** REVIEW. Prior report: `zoom_out_report.md` (Stage 5).

## Reviewer Status

| Reviewer | Status |
| --- | --- |
| `egm-zoom-out` (sonnet) | completed |

Notes: no code search was possible (new repository, no counting-trainer code in the workspace). Project Alignment was not checked because no root README or context file was supplied.

## Overall

No Blocker. The document now has enough context (Terms, Problem, Goals) and fixed the worst Stage 5 issues: timed-run leakage, stored session state, inconsistent signatures. It grew by about 150 lines, and much of that growth is anti-cheating rule machinery that serves no stated Goal. Several Stage 5 weeds and scope items were not touched.

## Blocker

None.

## Major

1. **Anti-gaming rules can be bypassed and fight each other** (lines 85-86, 93-98, 292-297, 690-704)
   - G2 counts only the first complete test session per day (Alt W). G4 makes leaving the app a miss (Alt V). Status is calculated and only "complete" sessions count, so a session the user force-quits or lets go idle becomes "abandoned" and costs nothing. The user can start, see it going badly, quit, and start again. That defeats Alt W's 77% retry-luck reasoning and Alt V's skipped-items concern.
   - iOS may not run an async IndexedDB write when the page is hidden or killed, so the "miss" is best-effort, yet it is stated as certain.
   - The 30-minute resume rule adds another route: leave, take a miss, return and continue. If the app was killed before the write, the unanswered item returns with no penalty. The document does not say which item a resumed session shows. Resume is not tied to any Goal and adds `resumable`, a home-screen offer and `abandonAfterMin`.
   - Direction: pick one stance. Either an honour system (void on leave, no resume) or enforcement with the hole closed (for example, an abandoned test session with at least one answer uses up the day's slot). The honour system is simpler and fits "personal".

2. **The O1 build-versus-reuse gate sits after the work it should prevent** (lines 64-69, 141, 153-158, 1155-1158)
   - The Risks mitigation says compare trainers "before Checkpoint A", but Checkpoint A is before the link is shared, after all 44 plan items are built.
   - "Five needs" miscounts: line 67 lists four (Thai UI, offline Home Screen, multi-day pass rule, mistake review), and The Problem lists five different bullets, none being Thai UI.
   - Direction: move O1 to before implementation as a named step. Use one canonical list of needs.

3. **Session status contradicts per-mode lengths; "never stored" does not hold** (lines 284-297, 319, 335, 944-948)
   - "Complete" means answered items reach the step's item count (line 295), but review sessions have 20 items (10 for Step 2) or fewer if fewer are eligible, and learn and speed have no length. A short review session cannot be derived as complete, because the eligible count at start is not stored. The `sessions` row has no length field, yet `sessionLength` needs one.
   - The `outcome` enum (line 319) does not say what happens when the user leaves in speed mode.
   - Direction: define status per mode in one small table. Store `plannedItems` on the immutable row if review needs it.

4. **Stage 5 scope items remain, and timed mode is weakly tied to a Goal** (lines 340, 444, 492-498, 718-719, 892-897, 1021, 1054-1059)
   - Still present and not tied to a Goal: diagnostics screen, `meta.lastPassed` and pass-drop notice, startup config validation with error screen, Hi-Lo data table, the 20,000-attempt / 100 ms test and 2-second launch budget, "Restore from file" button, Safari-tab warning.
   - Timed mode (`running.timed`, `speed`) is in G3 and the Measure of Success, but speed is not a need in The Problem. It adds a drill, screen, route, session mode, history list and tests.
   - Direction: tie each to a named Goal or move it to Future Improvements. Timed mode is the cleanest cut and removes the `speed` special cases in finding 3.

5. **Step 3 coverage rule is ambiguous** (lines 86-87, 351, 398-399, 934)
   - Line 351 requires "at least 7 counted test sessions", while Rule 6, G2 and `strategy.generate` require only a correct answer "in test mode". It is unclear whether a second same-day session, an abandoned session or a cut-short Step 3 test counts.
   - Direction: state the rule once, for example "any test-mode answer, any session", and reword line 351.

6. **Implementation Plan still at code-level altitude (Stage 5 #3 not addressed)** (lines 866-885, 938-948, 1005-1010, 1108-1143)
   - It still names `mulberry32`, Fisher-Yates `shuffle`, `h(tag, attrs, ...children)`, `crypto` seeding and full signatures; the per-assertion test inventory grew.
   - Direction: keep file purpose and interface contracts; drop signatures and per-test cases.

## Nit

7. Risks & Mitigations (137-149) repeats Alternatives and the Technical Plan (rename, rollback, stale cache, wrong chart). "Malicious" import (147) is odd framing for a file the user exported. The threat model could be one line.
8. Security NFR is stated four times (Risks row, NFR 713-715, `index.html` 787, `dom.js` 1008). "Reject unknown fields" (481-482) makes forward-compatible imports harder. State once.
9. Alternatives A-W (508-704) is 23 entries; H through W read as a decision log. Consider a compact table so the five or six real decisions stand out.
10. Day basis is split: `dayKey` comes from the first attempt (335-336), "first session of the day" is by `startTs` (396). A 23:58 start with a 00:02 first answer can be ordered one way and dated another. A row with no attempts has no `dayKey`. Use `startTs` for both.
11. Config holds `dayOffsetHours` and `abandonAfterMin` (444), but the day is fixed at UTC+7 and the timeout is a rule. Speculative knobs.
12. Timed runs have no `itemKey` format (368-370 cover only `values`, `strategy`, `running:stop`).
13. "Personal" (line 12) versus "friends" (Alts B, D at 527, 544; Checkpoint A at 1156). State who the v1 users are.

## Stage 5 Findings: Status

| # | Stage 5 finding | Status | Note |
| --- | --- | --- | --- |
| 1 | Timed drill leaks into pass logic | Addressed | Separate `mode = speed`; `computeProgress` reads only test (391, 928). |
| 2 | Build-versus-reuse not tested | Partly | O1 and Risk row added, but gate is after the build and miscounts needs (Major 2). |
| 3 | Plan at code-level altitude | Not addressed | Test inventory grew (Major 6). |
| 4 | Scope beyond Goals | Not addressed (timed mode partly) | Items remain (Major 4). `persist()` point is moot. |
| 5 | Denormalised session state | Addressed | Status, `itemsDone`, `lastTs`, `dayKey` calculated. New gap: per-mode length (Major 3). |
| 6 | Wrong chart passes stand | Not addressed | Accepted and documented (363-367, Alt R); no third option. |
| 7 | About 6% false-pass on Step 2 | Addressed (accepted) | Quantified (405-410); the Major 1 loophole weakens the estimate. |
| 8 | History lost on origin change or eviction | Addressed | `persist()`, backup reminders, export prompt (142, 485-490). |
| 9 | Review ranking tied to question instances | Partly | Step 2 review explicit (433-436); category key weakness accepted (431). |
| 10 | Internal inconsistencies | Mostly addressed | Signatures, diagram, routes aligned. Remaining: "five needs", personal vs friends. |
| 11 | Chart typed twice by hand | Not addressed | Two hand-typed 330-cell files remain (352-357, 852-863). |
| 12 | SW install failure silent | Addressed | Shown on home and diagnostics (143, 457-458). |
| 13 | Abandoned status as lazy sweep | Addressed | Calculated at read time (293-297). |
| 14 | Q5 and Q6 handle same risk differently | Partly | Q-numbering gone; asymmetry remains in Risks table. |
| 15 | Reversibility note | Not applicable | Origin freezing covered in Risks. |

## Checked and fine

Lucky-pass arithmetic (0.39, 0.06, 0.034, 0.00004, 77% for three tries). Immutable rows with derived status make merge-by-ID import safe and mid-session exports consistent. Core/shell split and derived progress remain sound. Terms (24-43) improve context and are not scope growth.
