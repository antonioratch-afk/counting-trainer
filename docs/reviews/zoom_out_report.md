# Zoom Out Report (Stage 5, Mode: REVIEW)

**Target:** `docs/designs/counting_trainer.md` (lines 1-1009)

## Reviewer Status

| Reviewer | Status |
| --- | --- |
| `egm-zoom-out` | completed |
| `egm-inventive-catalyst` | completed |

Notes: No extra context was given (GoldfishContext: none). Both reviewers were run on model sonnet. The zoom-out reviewer did not read project root docs, so Project Alignment is unchecked, and it did no code search because the design is for a new repository. Neither reviewer issued a Blocker. Both reported under their persona files (`zoom_out.md`, `inventive_catalyst.md`).

## Blockers

None.

## Major

### 1. Timed drill can leak into pass logic
* **Raised by:** egm-zoom-out
* **Section:** lines 306-308, 358-362, 805-807
* **Problem:** Timed runs are saved as `mode = test`, `drillId = running.timed`, and `computeProgress` must "ignore this drill ID". Step 2 of the pass calculation counts all non-voided answers in `test` sessions with no drill filter, so a timed answer could count toward a pass.
* **Direction:** Use a distinct `mode` (such as `timed`) or a separate store. Or drop the timed mode (see finding 4), which removes the problem.

### 2. Build-versus-reuse is not tested
* **Raised by:** egm-zoom-out
* **Section:** lines 45-48, 442-448
* **Problem:** The document says existing free trainers "probably cover the drills in all three steps", then commits to 44 plan items without comparing any of them.
* **Direction:** Check 2-3 free trainers against Thai UI, offline Home Screen use, the multi-day pass rule and mistake review. If one covers all four, the build is not justified. If none does, record that as the rejection reason for Alternative A.

### 3. Detailed Implementation Plan is at code-level altitude
* **Raised by:** egm-zoom-out
* **Section:** lines 635-994
* **Problem:** It lists helper names and signatures (`makeRng`/mulberry32 at 748, `shuffle` at 756, `h(...)` at 873), per-file function lists (821, 840, 850-853), the `textContent` rule (874), the `.nojekyll` file (659) and a 12-file test inventory with per-test assertions (964-994). This duplicates the Technical Plan.
* **Direction:** Keep the module list and interfaces. Drop signatures and per-test cases.

### 4. Scope beyond the stated Goals
* **Raised by:** egm-zoom-out
* **Section:** see list
* **Problem:** The following features serve no stated Goal or are premature:
  * Diagnostics screen (424-430, 927-931). Build ID, chart version and config version already appear on the home screen. `persisted()` is shown but `persist()` is never requested.
  * `meta.lastPassed` and the one-time "pass dropped" notice (138-143, 371-373, 828). Only the author's own config edit can drop a pass. A documented note would do.
  * Runtime validation of config and chart with an error screen (389-390, 773-776, 866-868). CI tests already cover this.
  * Timed full-deck mode (G3, 800-807, 915-919). It never affects passing, and speed is not a stated Goal.
  * Hi-Lo kept as a table "so another system can be added later" (761-762). This contradicts the Non-Goal of other counting systems.
  * Polish ahead of v1: import preview (938), update banner gated on "no session open" (402-405), dark mode (689-691), a `t()` that throws on missing keys (941-944).
  * 20,000-attempt under-100 ms performance test (608-610, 985-986). `computeProgress` is a linear scan and no bottleneck has been shown.
* **Direction:** Defer or justify each against a Goal.

### 5. Denormalized session state can drift
* **Raised by:** egm-zoom-out
* **Section:** lines 303-318, 369-372
* **Problem:** Pass status is derived from `attempts` to avoid migrations. But `sessions.status`, `scored` and `lastTs` are stored, and `complete` is written at write time using `minScoredItems`. Changing the completion rule later would need a migration, which the design sets out to avoid.
* **Direction:** Derive `complete` and `scored` from attempts as well, or state why they must be stored.

### 6. Chart corrections leave wrong passes standing (Q5, Alternative R, G7)
* **Raised by:** egm-inventive-catalyst
* **Section:** Q5, Alternative R, G7
* **Problem:** A pass earned on a wrong chart cell still counts. The document calls this a "known weakness" and rejects "void or re-grade" because it can wipe a pass. But `expected`, `given`, `itemKey` and `chartVer` are all stored, so a third option exists that the document does not consider.
* **Direction:** Keep `correct` as the historical grade. Add a derived "tainted" flag in `computeProgress`, set only when the `itemKey` of a corrected cell was answered under an older `chartVer`. Require a fresh correct answer for those cells only, and reuse the Q6 notice path. Costs: the chart needs a per-version list of changed cells, `computeProgress` needs chart history, and the performance test must cover it.

### 7. About 6% false-pass chance on Step 2 (Q10, G2, Alternative K)
* **Raised by:** egm-inventive-catalyst
* **Section:** Q10, G2, Alternative K
* **Problem:** A 90%-accuracy user passes Step 2 by luck about 6% of the time. The document accepts this as the cost of 20-item sessions (about 550 taps). It treats item-level and card-level cost as the same thing, though each item is a run of 10 to 45 cards.
* **Direction:** Consider early stopping (fail once the error budget is exceeded, add confirmation items only when borderline), or weight the 3-day rule by pooled accuracy across passing days. Costs: variable session length complicates `minScoredItems`, the progress bar and `complete`, and the pass rule is harder to state in one Thai line.

### 8. History is lost on origin change or storage eviction (G6, Backup, Q3, Non-Functional Requirements)
* **Raised by:** egm-inventive-catalyst
* **Section:** G6, Backup, Q3, Non-Functional Requirements
* **Problem:** History lives in one origin's IndexedDB. A rename, origin change or Safari eviction loses it unless the user exported. The mitigation is passive ("last backup N days ago" label, export button). `persist()` is never called.
* **Direction:** Request `persist()` after the first completed scored session. Make backup-overdue or unpersisted storage an active, dismissible prompt at session end. Make the export a self-describing snapshot usable as the origin-move path. Costs: iOS may deny `persist()`, prompts can become tiresome, and `meta` is not exported.

### 9. Review ranking is tied to question instances (Q2, pass calculation, data model)
* **Raised by:** egm-inventive-catalyst
* **Section:** Q2, data model
* **Problem:** An item seen once and missed once ranks at 100% (known weakness). `running:stop:<n>` items never repeat, so Step 2 review is a generic run.
* **Direction:** Add a stable skill-category key to each attempt (for `running`, count-magnitude bands or cards since last zero). Rank review on category with a minimum-attempts floor. Costs: schema version bump, category tests, and import/export must handle attempts without the field.

## Nits

### 10. Internal inconsistencies
* **Raised by:** egm-zoom-out
* **Section:** lines 354 vs 827, 377 vs 834, 240 vs 837-860, 869, 954, 1007, 11-18 vs 456-457 and 604-606
* **Problem:** `computeProgress(attempts, sessions, config)` (354) differs from `(attempts, sessions, chart, config, nowTs)` (827). `pickReview(..., n, now)` (377) differs from `(attempts, stageId, n)` (834). The diagram shows `src/store/backup.js` (240) but the plan has `src/core/backup.js` and `src/store/share.js`. Routes differ between the diagram and line 869. "Step" and "stage" are mixed. "Checkpoint A" (954, 1007) is never defined. "Personal" with "no shared data" (11-18) conflicts with sharing by link, friends and a public repository (456-457, 604-606).
* **Direction:** Align signatures, paths and terms. Define Checkpoint A. State who the v1 users are.

### 11. Chart is typed twice by hand (G7)
* **Raised by:** egm-zoom-out
* **Section:** lines 123-132, 731-742, 973-975
* **Problem:** 330 cells transcribed twice plus curated `overrides` is a large content cost.
* **Direction:** Consider an existing open-source strategy table as the second source.

### 12. Service worker install failure is silent (Service worker and Offline)
* **Raised by:** egm-inventive-catalyst
* **Section:** lines 397-408
* **Problem:** One failed fetch aborts install and the old cache stays, but the user sees nothing.
* **Direction:** Show "update failed, using previous version" in diagnostics or the update banner.

### 13. Abandoned-session status is a lazy sweep
* **Raised by:** egm-inventive-catalyst
* **Section:** lines 74, 315, 328
* **Problem:** Line 74 describes `abandoned` as a status, but line 315 marks it only at app start or step open. A stale `open` session is ignored by `computeProgress` in between.
* **Direction:** State this as an explicit invariant.

### 14. Q5 and Q6 handle the same risk differently
* **Raised by:** egm-inventive-catalyst
* **Section:** lines 135-143
* **Problem:** Both describe a pass that can be silently wrong or dropped. Q6 has a notice, Q5 has none.
* **Direction:** Resolve together with finding 6.

### 15. Reversibility note
* **Raised by:** egm-zoom-out
* **Section:** lines 118-122
* **Problem:** The core/shell split keeps Future Improvements open. The one hard-to-reverse coupling is the frozen origin tied to the GitHub account name. Export and import mitigate it.
* **Direction:** None required. See finding 8.

## Checked, no issue found
* G3 and Alternative L (hidden removed cards) resolve the timed-benchmark versus guessable-answer conflict.
* The pure core with injected clock and rng, and derived progress, avoid the testability and migration trade-offs.
