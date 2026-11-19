# Goldfish Annotated Review Report

**Status: resolved** (all PROPOSE FIX items applied on author approval, 2026-11-18)

**Target:** `docs/designs/counting_trainer.md` (lines 1-634, FeatureRange). Stage 7, round 1.
Source findings: `critic_report.md` (40 after dedup: 2 Blocker, 16 Major, 22 Nit).

Summary of suggestions: 0 CONTEST, 0 ESCALATE, 25 PROPOSE FIX (18 Blocker/Major + 7 Nits), 15 DECLINE (Nits).

Fixes that change behaviour, not only wording, are marked **[behaviour change]**. They need your explicit approval more than the wording fixes.

Edits that touch the Technical Plan will also update the matching items in the Detailed Implementation Plan (lines 635+), so the document stays consistent.

## Prioritized Findings & AI Suggestions

### [Issue 1] [`egm-design`, `egm-structural`, `egm-style`] - Severity: Blocker
*   **Affected Scope:** lines 29, 45-48, 440-449 (The Problem; Alternative A)
*   **Discrepancy Description:** Alternative A is "not rejected on evidence"; the text states unchecked claims as fact ("already exist").
*   **Rationale:** Alternatives must be rejected for documented reasons; "accepted risk" alone does not meet the standard.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** The comparison was never done, so the document cannot claim a reason it does not have. The real reasons for building are personal: the author wants a Thai-language path with a multi-day pass rule, and building it is also part of learning. The fix states that motive and marks the claims as unchecked. Doing the comparison is outside this review; it becomes an open question.
*   ***Proposed Edit:***
    *   Location: The Problem, "Accepted risk" paragraph, and Alternative A.
    *   Change: Rewrite "Accepted risk" as: "Existing free trainers were not compared before this design. They likely cover the single drills (unchecked). The author builds this app anyway as a personal project: the stated needs are a Thai UI, offline Home Screen use, a multi-day pass rule and mistake-based review in one app. If a comparison later shows an existing tool meets all five needs, the project should stop." Alternative A: change "already exist" to "likely exist (unchecked)"; replace "Reason for Rejection" with "**Status**: Not evaluated. Chosen path rests on the author's motive above, not on a comparison." Add Open Question O1: "Compare 2-3 named trainers against the five needs."

### [Issue 2] [`egm-design`, `egm-structural`] - Severity: Blocker
*   **Affected Scope:** whole document; notes scattered at 45-48, 106-154, 602-617
*   **Discrepancy Description:** No Risks & Mitigations section; several risks have no mitigation.
*   **Rationale:** The standard requires failure modes and mitigations in one place.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. The risks exist and are scattered.
*   ***Proposed Edit:***
    *   Location: New H2 "Risks & Mitigations" after Non-Goals.
    *   Change: Table (risk, impact, mitigation) with rows: build-vs-reuse not checked; iOS clears stored data (persist request, backup reminder, export); first install incomplete (offline-ready badge, see Issue 7); stale cache after update (versioned cache, update banner); account or repository rename moves the origin (frozen URL, export before any rename); wrong chart cell (two-source test, overrides list; past grades kept, accepted); untrusted import file (validate every field, render as text only, refuse newer schema); rollback after schema bump (older build refuses to write; restore by redeploying the newer build); legal framing (training-only statement, no betting features). Remove the duplicated "Known weakness" notes from the decision list and point to the table.

### [Issue 3] [`egm-design`] - Severity: Major **[behaviour change]**
*   **Affected Scope:** lines 69-71, 177-184, 295, 312-313
*   **Discrepancy Description:** Voided answers are removed from the total, so leaving the app avoids a miss.
*   **Rationale:** The pass rule can be gamed.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. Voiding was meant for phone calls, but it also lets a user drop any hard item.
*   ***Proposed Edit:***
    *   Location: G3, CUJ 3, Stored data, Technical Plan session text.
    *   Change: "In test mode, leaving the app (page becomes hidden) while a question or a Step 2 run is in progress records that item as a miss. In learn and review modes it is voided and not counted. The `voided` field stays for learn and review." Remove "voided, not marked wrong" from CUJ 3 and state the miss rule there.

### [Issue 4] [`egm-design`, `egm-style`] - Severity: Major **[behaviour change]**
*   **Affected Scope:** lines 57-65, 151-154
*   **Discrepancy Description:** No limit on scored sessions per day, so a user can retry until one passes; "550 taps" and "6%" have no derivation.
*   **Rationale:** With 3 tries per day, the chance of a lucky pass day is about 77%.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. Limiting counted sessions is the smallest change that makes the 3-day rule mean what it says.
*   ***Proposed Edit:***
    *   Location: G2, Q10, pass calculation step 4.
    *   Change: "Only the first complete test session of each step on each Thailand day counts toward passing. Later test sessions that day are stored and shown but do not count." Show arithmetic: "Step 2 run length averages (10+45)/2 = 27.5 cards, so 20 runs is about 550 card taps. At a true accuracy of 90%, the chance of 19 or more correct out of 20 is 0.9^20 + 20 × 0.1 × 0.9^19 ≈ 0.39; three counted days give 0.39^3 ≈ 0.06. For Step 1 (49 of 50 at 90%) the same figure is about 0.000004."

### [Issue 5] [`egm-design`] - Severity: Major **[behaviour change]**
*   **Affected Scope:** lines 138-143, 198-199, 303-316, 414-421
*   **Discrepancy Description:** Import skips records with an existing `id`, but session rows change over time, so a stale session status survives a merge.
*   **Rationale:** Progress after import can differ from the old phone.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. The cleanest fix is to make session rows never change and derive the changing fields from attempts, which matches "store raw facts, calculate the rest".
*   ***Proposed Edit:***
    *   Location: Stored data (`sessions` table), Pass calculation, Backup; Implementation items 25, 26, 28, 29.
    *   Change: `sessions` rows keep only `id`, `stageId`, `mode`, `startTs` and are written once. `status`, `scored`, `lastTs` and `dayKey` are calculated from the session's attempts: complete when non-voided-or-missed answers reach the stage minimum; abandoned when not complete and the last answer is more than 30 minutes old; otherwise open. `dayKey` is the Thailand date of the first answer. Import rejects attempts whose `sessionId` is in neither the file nor the database. Add a backup test: import an export taken mid-session, then a later export of the same session; progress equals the source phone.

### [Issue 6] [`egm-design`, `egm-structural`, `egm-style`] - Severity: Major
*   **Affected Scope:** lines 447-599
*   **Discrepancy Description:** Rejection reasons restate cons or rely on unseen documents; deferrals are filed as rejections; claims lack support; some alternatives are missing.
*   **Rationale:** The section must stand on its own.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid in part. "Rejected by author: <reason>" is the required label form, so it stays, but every entry will carry its concrete reason. Alternative H does not conflict with the Non-Goal; it is the reason for it. That part needs no change.
*   ***Proposed Edit:***
    *   Location: each Alternative.
    *   Change: Use "**Decision**: Rejected by author: <reason>" or "**Decision**: Deferred to a later release: <reason>". Remove "review round 2" and "the brief". Label unsupported numbers as estimates (for example "the table simulator is estimated at about half the code"). Add two entries: "Custom domain" (rejected: yearly cost and DNS upkeep; the frozen GitHub address plus export is the migration path) and "Auto-deal mode for Step 2" (deferred: self-paced tapping first; a timed pace can be added later).

### [Issue 7] [`egm-design`] - Severity: Major
*   **Affected Scope:** lines 75-76, 168-176, 392-408
*   **Discrepancy Description:** Offline use after one Safari visit is assumed; on iOS the Home Screen app has its own storage and service worker, so the first icon launch must be online.
*   **Rationale:** A user could install and go offline before the cache is filled.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid.
*   ***Proposed Edit:***
    *   Location: G5, CUJ 1, Offline and updates.
    *   Change: G5 becomes "After installing and opening the app once from the Home Screen icon while online, the app starts and runs in airplane mode." The home screen shows an "offline ready" mark once every file is cached, and an error line if caching failed. CUJ 1 adds "opens from the icon while online and waits for the offline-ready mark".

### [Issue 8] [`egm-design`] - Severity: Major
*   **Affected Scope:** lines 81-83, 123-133, 485-491
*   **Discrepancy Description:** Two typed sources catch typos, not wrong rule assumptions; play context and licensing not stated.
*   **Rationale:** G7 overstates what the test proves.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid in part. A solver as a third source was rejected under Alternative F, and that stays. The fix narrows the claim and adds the context and a licensing line.
*   ***Proposed Edit:***
    *   Location: G7, Q4 text.
    *   Change: G7 adds "The test catches typing errors and disagreements between sources. It does not prove the sources' rule assumptions match the preset; that is checked by hand once, by confirming each source states the same rules." State the play context: "The chart is for 6-deck tables where the dealer stands on soft 17 and checks for blackjack, common in US casinos. It is not correct for no-hole-card tables." Licensing: "The chart stores strategy decisions, which are results of calculation. Each source is credited by name, URL and retrieval date; no page layout or text is copied."

### [Issue 9] [`egm-design`] - Severity: Major
*   **Affected Scope:** lines 118-122, 320-322, 427, 604-617
*   **Discrepancy Description:** `persist()` is never requested; no warning when not installed; rename migration not stated.
*   **Rationale:** iOS can clear stored data.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid.
*   ***Proposed Edit:***
    *   Location: Backup, Diagnostics, Q3.
    *   Change: Call `navigator.storage.persist()` after the first completed session and show the result on the diagnostics screen. In a Safari tab (not installed), show a warning that practice there is not kept with the installed app. Q3 adds: "Before any account or repository rename, every user exports; after the rename, they import on the new address." Custom domain is added as an Alternative (Issue 6).

### [Issue 10] [`egm-design`] - Severity: Major
*   **Affected Scope:** lines 57-58, 151-153, 314-316, 377-381
*   **Discrepancy Description:** Whether a session ends at the minimum, resume rules and review length are not stated.
*   **Rationale:** The session lifecycle cannot be built from the text.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. Also raised in Stage 6.
*   ***Proposed Edit:***
    *   Location: New subsection "Session lifecycle" in the Technical Plan.
    *   Change: Test sessions have a fixed length equal to the stage minimum (50, 20, 50) and end automatically; the score uses all of those answers. Learn sessions have no length and end when the user taps Finish. Review sessions have 20 items (Step 2: 10 runs), or fewer if fewer items are eligible; with none eligible, the app says so and offers learn mode. An open session resumes if the user returns within 30 minutes; after that it is abandoned (calculated, see Issue 5). Only test sessions can be complete for passing.

### [Issue 11] [`egm-design`, `egm-style`] - Severity: Major
*   **Affected Scope:** lines 301, 375-381, 604-610
*   **Discrepancy Description:** The 100 ms target covers only the pure function; "iPhone from the last 5 years" names no device; size estimate is low.
*   **Rationale:** The NFR cannot be checked as written.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid.
*   ***Proposed Edit:***
    *   Location: Non-Functional Requirements; Stored data indexes.
    *   Change: "Start-up offline, from tapping the icon to a usable home screen, is under 2 seconds on the author's iPhone (model and iOS version recorded in the manual checklist), measured by hand with 20,000 generated attempts loaded." Keep the 100 ms unit test for `computeProgress`. Add index `[itemKey, ts]`. Change the size estimate to "about 350 bytes per attempt as JSON (two UUIDs are 72 bytes); 20,000 attempts is about 7 MB".

### [Issue 12] [`egm-design`, `egm-style`] - Severity: Major
*   **Affected Scope:** lines 31-37, 66-71, 87-89
*   **Discrepancy Description:** Success metric has no baseline or date; a Step 2 pass proves only self-paced counting.
*   **Rationale:** Success cannot be judged.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. The 8-week target below is a starting value for you to change.
*   ***Proposed Edit:***
    *   Location: Measure of success; G3.
    *   Change: "Success: the author passes all three steps within 8 weeks of first use. A Step 2 pass means accurate running count at the user's own pace; it does not show table speed. Timed results are reported separately as a speed trend."

### [Issue 13] [`egm-structural`, `egm-style`, `egm-design`] - Severity: Major
*   **Affected Scope:** lines 29, 108-111, 514, 596, 621
*   **Discrepancy Description:** References to "the brief" and "review round 2" cannot be followed.
*   **Rationale:** The document must be self-contained.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. Also raised in Stage 6.
*   ***Proposed Edit:***
    *   Location: all listed lines.
    *   Change: State each rule directly. Remove "change them here if needed". Additional Resources: "`concepts_brief.md` (earlier brainstorm notes; not needed to read this document)".

### [Issue 14] [`egm-structural`, `egm-design`] - Severity: Major
*   **Affected Scope:** lines 106-199
*   **Discrepancy Description:** "Open Questions" holds only resolved decisions and sits before the content that uses them.
*   **Rationale:** The heading misdescribes the content; readers jump back and forth.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. Also raised in Stage 6.
*   ***Proposed Edit:***
    *   Location: Open Questions section and the cross-references to it.
    *   Change: Move each resolved rule into the Technical Plan section it governs (review ranking, chart sources and corrections, pass drop, web address, Step 2 size). Replace "Q2/Q5/Q6" cross-references with section names. "Open Questions" keeps only: O1 compare existing trainers (Issue 1); O2 confirm the Blackjack Apprenticeship chart is for 6 decks (Issue 16).

### [Issue 15] [`egm-style`] - Severity: Major
*   **Affected Scope:** lines 138-143
*   **Discrepancy Description:** "Only a stricter config can remove a pass" is too narrow.
*   **Rationale:** `daysToPass`, `minScoredItems` and the chart cell list can also remove a pass.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid.
*   ***Proposed Edit:***
    *   Location: Q6 text (moved to "Pass drop" per Issue 14).
    *   Change: "A config or chart change that raises any requirement (threshold, items, days, chart cells) can remove a pass."

### [Issue 16] [`egm-style`] - Severity: Major
*   **Affected Scope:** lines 116-117, 128-137
*   **Discrepancy Description:** Weaknesses in Q2, Q4 and Q5 are stated without a decision.
*   **Rationale:** A caveat must be accepted or fixed.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid.
*   ***Proposed Edit:***
    *   Location: Q2, Q4, Q5 text (moved per Issue 14), Risks table.
    *   Change: Q2: "Accepted: an item missed once on its only try ranks at 100%." Q5: "Accepted: a pass earned while a chart cell was wrong stays; the author announces chart fixes in the README." Q4: becomes open question O2.

### [Issue 17] [`egm-structural`, `egm-style`] - Severity: Major
*   **Affected Scope:** lines 52-56, 258-265, 275-286, 336, 386
*   **Discrepancy Description:** "Step" and "stage" are mixed.
*   **Rationale:** One concept, two names, no definition.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. Also raised in Stage 6.
*   ***Proposed Edit:***
    *   Location: G1 and prose.
    *   Change: G1 adds "Step is the word the user sees; `stage` is the code name (`stageId`)." Prose uses "step"; code identifiers keep `stageId`. Drill table header "Step (stageId)".

### [Issue 18] [`egm-structural`] - Severity: Major
*   **Affected Scope:** lines 253 vs 334
*   **Discrepancy Description:** `strategy:16v10` vs `strategy:H16v10`.
*   **Rationale:** Item keys must be one form.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid.
*   ***Proposed Edit:***
    *   Location: Drill contract.
    *   Change: `strategy:16v10` becomes `strategy:H16v10`.

### Nits proposed for fixing

*   **N1** (`design-1-13`) PROPOSE FIX: change "a fixed order of steps" to "a suggested order of steps (all open from the start)".
*   **N3** (`design-1-17`) PROPOSE FIX **[behaviour change]**: review ranking uses only test and review answers, not learn-mode answers (the card is visible in learn mode).
*   **N4** (`design-1-18`) PROPOSE FIX: build the export text before the user taps Share (prepare on entering the backup screen), so `navigator.share` runs directly in the tap.
*   **N5** (`design-1-19`) PROPOSE FIX: deploy only app files (`index.html`, `manifest.webmanifest`, `sw.js`, `.nojekyll`, `icons/`, `styles/`, `src/`, `data/`); the stamped files are build output and are not committed.
*   **N8** (`design-1-22`) PROPOSE FIX: import recomputes nothing but rejects records with unknown fields or values; all imported strings are shown with `textContent` only; add a Content-Security-Policy meta tag allowing only same-origin scripts.
*   **N9** (`design-1-23`) PROPOSE FIX: state "After a schema version increase, rolling back the code is not possible; fix forward instead." (also in the Risks table).
*   **N22** (`style-1-16`) PROPOSE FIX: "at least 7 test sessions" becomes "at least 7 counted test sessions (330 cells ÷ 50, when every question is a new cell)".

### Nits declined (recorded, no change)

*   **N2** (`design-1-16`): covered by Issue 10 (only test answers count for coverage).
*   **N6** (`design-1-20`): legality line is a framing statement, not a legal claim the app depends on; account name visibility is in Q3.
*   **N7** (`design-1-21`): timed-mode display details belong in the Implementation section.
*   **N10** (`design-1-24`, `style-1-19`, `style-1-20`): handled by Issue 6 and Issue 11 where they matter.
*   **N11** (`structural-1-7`, `style-1-21`): heading levels follow the design template.
*   **N12** (`structural-1-8`, `style-1-13`): diagram alignment is cosmetic.
*   **N13** (`structural-1-9`): not required by the standard.
*   **N14** (`structural-1-10`, `style-1-22`): URLs are added by Issue 8's credit line.
*   **N15** (`structural-1-11`): resolved by Issue 1's rewrite.
*   **N16** (`structural-1-12`): section names follow the design template.
*   **N17** (`style-1-8`), **N18** (`style-1-9`), **N19** (`style-1-10`), **N20** (`style-1-11`), **N21** (`style-1-15`): wording; several disappear with Issues 3, 8 and 14.
