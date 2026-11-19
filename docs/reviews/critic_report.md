# Goldfish Review Report

**Target:** `docs/designs/counting_trainer.md` (`lines 1-634`)

Stage 7 (Critic Review), review-loop round 1. Mode: REVIEW. All reviewers ran on model "sonnet". Finding ids are `<reviewer>-1-<n>`. The reviewer's own numbering is kept. For egm-design, B1/B2 = 1/2, M1-M10 = 3-12, N1-N12 = 13-24. Merged findings list every contributing id.

## Reviewer Status

| Reviewer | Status |
| --- | --- |
| `egm-design` | completed |
| `egm-structural` | completed |
| `egm-style` | completed |

Note: the design reviewer reported that `agents/egm-design.md` does not exist and used `agents/design_critic.md` (name egm-design) instead.

## Counts

Raw findings: 58 (2 Blocker, 23 Major, 33 Nit). After deduplication: 40 (2 Blocker, 16 Major, 22 Nit).

## Prioritized Findings (Blockers -> Major -> Nits)

### 1. Alternative A (reuse existing trainers) is not evaluated - Severity: Blocker
* **Ids:** `design-1-1`, `structural-1-2` (part), `style-1-1`
* **Reviewer Lens:** `egm-design`, `egm-structural`, `egm-style`
* **Affected Scope:** lines 29, 45-48, 440-449
* **Discrepancy Description:** The spec says Alternative A is "Not rejected on evidence" and that build vs reuse "was not tested". Line 46 says existing trainers "probably cover" the drills; line 29 says the author has not compared them; line 442-443 states as fact that they "already exist". Lines 47-48 give a hypothetical with no decision point.
* **Rationale & Recommendation:** The Alternatives Rule requires viable alternatives to be rejected for documented reasons. Labelling the risk "accepted" does not meet it. Compare 2-3 named trainers against the five needs at lines 31-37 and record the result, or state the real motive (for example a personal learning project) as the justification. Rename the "Reason for Rejection" label to "Status: not evaluated". Change line 443 to "probably exist (unchecked)".

### 2. No Risks & Mitigations section - Severity: Blocker
* **Ids:** `design-1-2`, `structural-1-1`
* **Reviewer Lens:** `egm-design`, `egm-structural`
* **Affected Scope:** whole document; scattered at 45-48, 106-154, 602-617
* **Discrepancy Description:** The standard requires failure modes, security implications, scalability limits and mitigations. Risks are spread across "Known weakness" notes (Q2, Q4, Q5), "Accepted risk" and the NFR list. Unmitigated items: iOS storage eviction, IndexedDB corruption or quota, first-install or stale service-worker cache, GitHub Pages and account/repo-name dependence, chart error, import of untrusted files, rollback after a schema bump, legal framing.
* **Rationale & Recommendation:** Add an H2 "Risks & Mitigations" as a table (risk, impact, mitigation, owner) and move the scattered notes into it. (Structural reviewer rated this Major; the design reviewer rated it Blocker. Kept at Blocker.)

### 3. Voiding is an escape route from scored tests - Severity: Major
* **Ids:** `design-1-3`
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** lines 69-71, 177-184, 295, 312-313
* **Discrepancy Description:** Voided answers leave the total and are not marked wrong, so a user can background the app to avoid a miss. "Leaving the app" is undefined, `visibilitychange` is unreliable on iOS, and resume behaviour is not stated.
* **Rationale & Recommendation:** Cap voids per session, count a void as a miss once the question was shown, or void only short incidental backgrounding. Specify detection and the write mechanism.

### 4. Retry gaming and the Q10 "6%" figure - Severity: Major
* **Ids:** `design-1-4`, `style-1-4`
* **Reviewer Lens:** `egm-design`, `egm-style`
* **Affected Scope:** lines 57-65, 151-154
* **Discrepancy Description:** "about 550 taps" and "passes by chance about 6%" have no stated derivation. The 6% equals 0.39 cubed (0.39 = chance of at least 19 of 20 correct at 90% accuracy), and it assumes one attempt per day. Failed sessions do not count against the user and there is no daily cap, so with 3 tries per day the chance of at least one pass is about 77% per day. Step 1 and Step 3 chance-pass analysis is absent. "Each taken on its own" is unclear.
* **Rationale & Recommendation:** Decide whether to limit counted attempts per step per day, or restate the claim with its assumptions and formula.

### 5. Import cannot merge mutable session rows correctly - Severity: Major
* **Ids:** `design-1-5`
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** lines 138-143, 198-199, 303-316, 414-421
* **Discrepancy Description:** Import skips records whose `id` exists. Session rows are mutable (`status`, `lastTs`, `scored`), so importing a later export over an earlier mid-session export keeps the stale row, and `computeProgress` (which filters on `complete`) miscomputes. Orphan attempts or sessions have no rules. This contradicts the claim at 198-199 that progress matches the old phone.
* **Rationale & Recommendation:** Derive session status, `scored` and `lastTs` from attempts at read time, or define merge rules (max `lastTs`, status precedence complete > abandoned > open, recompute `scored`). Add an import fixture for this case.

### 6. Alternatives rejection rationales are author preference or lean on unseen documents - Severity: Major
* **Ids:** `design-1-6`, `structural-1-2`, `style-1-5`, `style-1-17`, `style-1-18`
* **Reviewer Lens:** `egm-design`, `egm-structural`, `egm-style`
* **Affected Scope:** lines 447-599 (notably 456, 464, 473, 480-482, 490, 499, 513, 521, 530, 538, 541-549, 555, 563, 571, 575-580, 587, 597)
* **Discrepancy Description:** Most entries say "Rejected / Deferred / Narrowed by author" and restate the cons. Deferral is filed under "Reason for Rejection". Claims lack support: "about half the code" (G), `file://` cannot be added to the Home Screen (C), "iOS often closes background apps" (O), "easier to grow" and "can break after months" (M), "shortest code" (Q). "After review round 2" (513) and "the brief" (580, 594) are not linked. Alternative H "punishes missed days" conflicts with the Non-Goal at line 99. Missing alternatives: build-time chart verification, hosting/origin choice, other pass rules, auto-deal mode for Step 2, not calling `storage.persist()`.
* **Rationale & Recommendation:** Restate each as a concrete trade-off with a source or measurement, drop "by author", separate "Deferred" from "Rejected", and make the section self-contained.

### 7. Offline-on-iOS assumption is unverified - Severity: Major
* **Ids:** `design-1-7`
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** lines 75-76, 168-176, 392-408
* **Discrepancy Description:** The spec assumes one online Safari visit plus "Add to Home Screen" gives offline use. Installed web apps on iOS can use separate storage and service-worker context, so the first icon launch may need to be online. There is no "offline ready" indicator, and a failed file fetch fails the install silently.
* **Rationale & Recommendation:** Add a CUJ step to open from the icon online and wait for an offline-ready badge. Show cache-complete status on home and diagnostics. Test on the target iOS version before freezing.

### 8. Chart verification is weaker than G7 implies - Severity: Major
* **Ids:** `design-1-8`
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** lines 81-83, 123-133, 485-491
* **Discrepancy Description:** Two hand-typed sources catch typos, not wrong rule assumptions. A beginner adjudicates diffs, while Alternative F rejects computed strategy because a beginner cannot spot wrong answers. The Blackjack Apprenticeship chart may not match 6 decks (128-130). The preset is unlike Asian no-hole-card tables (133), and the intended play context is never stated. Licensing of copied chart data is not addressed.
* **Rationale & Recommendation:** State the intended play context, consider a test-time solver as a third source, add a licensing note.

### 9. Storage persistence and origin lock-in lack mitigation - Severity: Major
* **Ids:** `design-1-9`
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** lines 118-122, 320-322, 427, 604-617
* **Discrepancy Description:** Diagnostics only reads `persisted()`, with no `persist()` call and no mention of Safari's 7-day eviction for non-installed use. The frozen origin means a rename loses history, and the spec does not say export/import is the migration path. A custom domain is not considered.
* **Rationale & Recommendation:** Request persistence and surface the result, warn when not installed, document export-before-rename, evaluate a custom domain.

### 10. Session lifecycle is under-specified - Severity: Major
* **Ids:** `design-1-10`
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** lines 57-58, 151-153, 314-316, 377-381
* **Discrepancy Description:** Sessions complete when the answer count reaches `minScoredItems`, while G2 says "at least". Unstated: whether the session ends there, whether an `open` session resumes within 30 minutes, review session length `n`, review with fewer than `n` eligible items, whether `complete` applies to learn/review modes, and how Step 2 "20 items" (20 runs) interacts with review runs.
* **Rationale & Recommendation:** Add a short state machine (open, complete, abandoned) with auto-end and resume rules.

### 11. Performance NFR is mis-scoped and unverifiable - Severity: Major
* **Ids:** `design-1-11`, `style-1-6`
* **Reviewer Lens:** `egm-design`, `egm-style`
* **Affected Scope:** lines 301, 375-381, 604-610
* **Discrepancy Description:** "Under 100 ms for `computeProgress`" measures only the pure function, not the IndexedDB read on each home render. No `[itemKey, ts]` index for "last 5 per item". "Under 2 seconds on an iPhone from the last 5 years" names no device or method, and has no stated check. The 200 B per attempt figure is likely low (two UUIDs alone are 72 bytes) and the roughly 4 MB export is fragile to share.
* **Rationale & Recommendation:** Name a reference device and a procedure, measure end to end, consider cached per-session aggregates and a compact export format.

### 12. Success metric is unmeasurable and passing does not show counting readiness - Severity: Major
* **Ids:** `design-1-12`, `style-1-12`
* **Reviewer Lens:** `egm-design`, `egm-style`
* **Affected Scope:** lines 31-37, 66-71, 87-89
* **Discrepancy Description:** "Accuracy rises over time" has no baseline or window, "passes all three steps" is self-referential, and neither shows value over existing trainers. Step 2 is self-paced and the timed mode never affects passing, so the pass proves slow counting only. External aids cannot be excluded.
* **Rationale & Recommendation:** Define a target and an evaluation date, and state the pass as "accuracy at self-paced speed" or add a minimum pace.

### 13. "The brief" references cannot be resolved - Severity: Major
* **Ids:** `structural-1-3`, `style-1-2`, `design-1-14`
* **Reviewer Lens:** `egm-structural`, `egm-style`, `egm-design`
* **Affected Scope:** lines 29, 108-111, 514, 596, 621
* **Discrepancy Description:** The text cites "the brief's suggestions", "change them here if needed", "review round 2", and `concepts_brief.md` without path or link. "Change them here" is review-process language.
* **Rationale & Recommendation:** State each rule and value directly, link the brief by relative path, and remove the process wording.

### 14. "Open Questions" holds only resolved decisions and sits before the content that uses them - Severity: Major
* **Ids:** `structural-1-4`, `design-1-15`
* **Reviewer Lens:** `egm-structural`, `egm-design`
* **Affected Scope:** lines 106-199
* **Discrepancy Description:** Q1-Q10 are all "Resolved", yet they precede the CUJs and Technical Plan and cross-reference both ways ("see Technical Plan", "under Q3"). The heading misdescribes the content.
* **Rationale & Recommendation:** Rename to "Resolved Decisions" or move the content into the Technical Plan. Keep only genuinely open questions under "Open Questions".

### 15. Q6 "only a stricter config can remove a pass" is an overclaim - Severity: Major
* **Ids:** `style-1-3`
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** lines 138-143 vs 349-373, 598
* **Discrepancy Description:** A changed `daysToPass`, `minScoredItems`, or chart `cells` list can also remove a pass under the pass rules.
* **Rationale & Recommendation:** Reword to "a config or chart change that raises a requirement".

### 16. Caveats with no decision (Q2, Q4, Q5) - Severity: Major
* **Ids:** `style-1-7`
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** lines 116-117, 128-137
* **Discrepancy Description:** Q2 states a weakness (an item seen once and missed once ranks 100%) without a mitigation or "accepted". Q5 says a pass earned with a wrong chart cell still counts, without saying who corrects it. Q4 says the chart "may" cover a range of deck counts, which could be checked once. Q3 (120-122) is a legitimate operator caveat and should stay.
* **Rationale & Recommendation:** Mark each as accepted or add the fix, and check the Q4 source once.

### 17. Step/stage terminology is mixed - Severity: Major
* **Ids:** `structural-1-6`, `style-1-14`
* **Reviewer Lens:** `egm-structural`, `egm-style`
* **Affected Scope:** lines 52-56, 258-265, 275-286, 336, 386
* **Discrepancy Description:** Goals use "Step", the Drill table uses "Stage ID", and prose mixes "Step 2 items" with "per stage".
* **Rationale & Recommendation:** State once that "step" is the UI term and "stage" the code term, and keep prose consistent (table heading "Step ID").

### 18. Item key form inconsistent - Severity: Major
* **Ids:** `structural-1-5`
* **Reviewer Lens:** `egm-structural`
* **Affected Scope:** lines 253 vs 334
* **Discrepancy Description:** `strategy:16v10` at 253 vs `strategy:H16v10` at 334. Row and cell counts (33 x 10 = 330) check out.
* **Rationale & Recommendation:** Use one form; `strategy:H16v10`.

### Nits

* **N1** (`design-1-13`) Lines 31 vs 52-55, 144-147: "a fixed order of steps" conflicts with all steps being open from the start. Reconcile.
* **N2** (`design-1-16`) Lines 271, 366-367: `strategy.cell` prioritizes cells "never answered correctly" without stating modes; rule 5 and abandoned test sessions unclear.
* **N3** (`design-1-17`) Lines 112-113, 378: ranking uses any mode, so learn-mode answers (reference card visible) dilute the review signal.
* **N4** (`design-1-18`) Lines 411-415: `navigator.share` needs a user gesture; an async IndexedDB read for large exports may throw `NotAllowedError`.
* **N5** (`design-1-19`) Lines 434-436: publishing the repo root deploys tests, tools and docs; `stamp.mjs` makes deployed code differ from committed code.
* **N6** (`design-1-20`) Lines 20-22, 606: the legality statement is unsourced; the public repo shows the author's account name.
* **N7** (`design-1-21`) Lines 66-70, 264: timed mode does not say whether wrong answers record time, how results display, or what "speed record" means.
* **N8** (`design-1-22`) Lines 416-421: import must render strings as text only; `correct` is trusted, not recomputed; consider a meta CSP.
* **N9** (`design-1-23`) Lines 614-617: after a schema bump a reverted build refuses to run; rollback is not possible and this is not stated.
* **N10** (`design-1-24`, `style-1-19`, `style-1-20`) Lines 495-496, 568-570, 610: unsourced numbers ("about half the code", "roughly 500 sessions", 200 B per attempt, UTF-16 localStorage limit). Label as estimates or show arithmetic.
* **N11** (`structural-1-7`, `style-1-21`) Lines 619-631: "Additional Resources" and "Future Improvements" are H3 under "Non-Functional Requirements" and have no URLs; Future Improvements repeats Non-Goals (93-96); the horizontal rule at 600 is used inconsistently.
* **N12** (`structural-1-8`, `style-1-13`) Lines 238, 315, 389, 400: misaligned diagram border and overlong lines; line 315 combines two rules (session `complete`, abandon) in one sentence.
* **N13** (`structural-1-9`) Lines 3-5: no reviewers or last-updated field; "Proposed" has no linked decision record. Not required by the standard.
* **N14** (`structural-1-10`, `style-1-22`) Lines 14-15, 119, 245, 326, 622-623: the URL is repeated and not a Markdown link; sources named without URLs or retrieval dates.
* **N15** (`structural-1-11`) Lines 29, 448-449: "see Accepted Risk below" points at a bold paragraph, not a heading.
* **N16** (`structural-1-12`) Lines 24-48, 201: "The Problem" also describes the solution; "Technical Plan (Architecture)" differs from the standard's "Proposed Architecture".
* **N17** (`style-1-8`) Lines 11-16: "complete beginner" and "the first three skills" are redundant; "this address is frozen before sharing" is vague and repeats Q3.
* **N18** (`style-1-9`) Lines 20-22, 33-35, 40: "measured, not guessed" is rhetorical; "a skill learned in one evening fades" is unsourced.
* **N19** (`style-1-10`) Lines 71-72, 129, 183-185, 295, 316: "a run interrupted by leaving the app is voided" repeated; define once.
* **N20** (`style-1-11`) Lines 126-129 vs G1: "Shared rule assumptions" duplicates G1 with slightly different rule sets; state once.
* **N21** (`style-1-15`) Lines 267-272: "short runs" is vague; use "10-45 cards" as at line 532.
* **N22** (`style-1-16`) Lines 270, 332-333: "at least 7 test sessions" assumes 50 distinct unseen cells per session, while line 270 filters on "never answered correctly". State consistently.

## Top 5 (ranked)

1. Alternative A not evaluated (Blocker; `design-1-1`, `structural-1-2`, `style-1-1`).
2. No Risks & Mitigations section (Blocker; `design-1-2`, `structural-1-1`).
3. Import cannot merge mutable session rows, so pass progress can be miscomputed (Major; `design-1-5`).
4. Voiding and retry loopholes weaken the pass rule, and the Q10 6% figure is misleading (Major; `design-1-3`, `design-1-4`, `style-1-4`).
5. Alternatives rationales are bare author preference or cite unseen documents (Major; `design-1-6`, `structural-1-2`, `structural-1-3`, `style-1-2`).
