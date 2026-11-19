# Comprehension Report: Stage 6

* **Target:** docs/designs/counting_trainer.md (FeatureRange 1–634, DetailedRange 635–1009)
* **Reviewer:** egm-comprehension (Sonnet), no GoldfishContext
* **Date:** 2026-11-18

## What this proposes

Build "Counting Trainer", a Thai-language, offline-capable web app for iPhone Safari (installed to the Home Screen, hosted as static files on GitHub Pages, no server or accounts). It teaches a beginner three Blackjack card-counting skills in order: Step 1 Hi-Lo card values, Step 2 running count, Step 3 basic strategy for one fixed rule set. Each step has a learn mode (reference card shown, nothing scored) and a test mode (card hidden, scored). A step counts as passed when 3 separate test sessions on 3 different Thailand calendar days each meet an accuracy threshold; Step 3 also needs every chart cell answered correctly at least once. Every answer is stored on the phone, and pass status is recomputed from the stored answers each time. A review button replays the most-missed items without affecting passing. Export and import of history lets the user move to a new phone. The strategy chart is a data file that an automated test checks against a second, separately typed chart. The design also admits that it did not compare itself to existing free trainers.

## How the existing system works, per this document

There is no existing system. This is a new repository (`counting-trainer`) and nothing is added to the author's current work repository. The "existing" parts are external sources: the Wizard of Odds strategy generator and the Blackjack Apprenticeship chart, which supply the chart data. The document also refers to a prior `concepts_brief.md` and to review rounds. These are only named, not summarised. Because those references are not explained, the reader cannot tell what in this design was inherited from them. The architecture is described in full: a pure "core" layer of rules, a "shell" layer (screens, IndexedDB, service worker, Share Sheet), and config and chart data files. Deploy runs tests, stamps a build ID into the service worker, and publishes to GitHub Pages.

## Findings

1. **Major.** Location: Q1 (line 108-111), Alternative I (line 514), Alternative S (line 595), Additional Resources (line 621). Problem: the text depends on a "brief" and on "review round 2" that the reader does not have. Q1 says the abandon rule and "day of first answer" are "taken from the brief's suggestions". Alternative S says "which the brief ruled out". Alternative Q says "the brief had deferred". Direction: state the relevant decision and its reason inline, or drop the references. Say what the brief is, or that it is not needed to understand the design.

2. **Major.** Location: Overview, Goals G1 and G2 (lines 11-17, 52-65). Problem: "Hi-Lo", "running count", "basic strategy", "late surrender", "dealer stands on soft 17", "double after split" and "stop-point items" are used with no glossary. The Overview says the app teaches a "complete beginner", but the document gives a non-gambler no definitions. This is domain vocabulary, not general engineering terms. Direction: add a short glossary or a one-line definition on first use: Hi-Lo tags (+1/0/-1 by rank), running count, soft hand, surrender, and what a "stop-point item" is.

3. **Major.** Location: G2 (line 57-59) versus Technical Plan session model (lines 303-318). Problem: it is not clear when a session ends, or what happens if the user stops before the minimum. A "scored session" is defined as having "at least the step's minimum of scored items". The only stated completion rule is that the session becomes `complete` on the answer that reaches the minimum. It does not say whether the session continues after that, whether the user can stop early, or whether the test mode has a fixed length. CUJ 2 says "answers 50 items", but the document never states whether 50 is a fixed length or a floor. The `total >= minScoredItems` check in pass step 3 (line 362) would be redundant if sessions end exactly at the minimum. Direction: state whether sessions have a fixed length, and whether the accuracy check uses only the first N answers or all answers.

4. **Major.** Location: `computeProgress` signature, line 354 versus line 827. Problem: the two signatures differ. The Technical Plan gives `computeProgress(attempts, sessions, config)` and Implementation item 26 gives `computeProgress(attempts, sessions, chart, config, nowTs)`. Rule 5 needs the chart, and `todayCounted` needs the time, so the earlier signature is incomplete. Similarly `pickReview` takes `now` at line 377 and has no `now` at line 834. Direction: make the signatures agree.

5. **Major.** Location: "Stage ID" vs "Step", lines 54-56 and 258-265. Problem: the document uses three names for the same thing. Display labels are "Step 1/2/3", internal IDs are `values`/`running`/`strategy`, and the drill table calls them "Stage ID". The word "stage" is used without definition elsewhere, such as the `stageId` field and "eight-stage ladder" in Alternative G. Direction: define "stage" as the internal name for "step" once, and use one term.

6. **Major.** Location: Q10 and G3 (line 151-154, 67). Problem: Q10 says "about 550 taps" without showing how the number is derived. Q10 also gives a 6% chance of passing by luck without stating the assumptions behind it. The reader cannot check either figure. Direction: show the arithmetic, or drop the figures.

7. **Major.** Location: Step 2 sessions and `running.stop`, lines 67-69 and 267-269, with Step 2's "item". Problem: the unit of a Step 2 "item" is hard to follow. One item is a run of 10 to 45 cards ending in a question, and a 20-item session is 20 such runs. But `itemKey` for Step 2 is `running:stop:<n>`, and Step 2 items are excluded from review ranking while the review section also says `running` has review "saved with `mode = review`". It is not clear what a Step 2 review is or what it replays. "Running-count items do not repeat" is stated without explanation. Direction: define Step 2 review explicitly, with one example.

8. **Major.** Location: Q6 and pass calculation, lines 138-143, 349-373. Problem: the "current config" behavior is hard to follow. `meta.lastPassed` is described as "comparison only" and also "saved with the new set", and `meta` is not exported. After an import on a new phone `lastPassed` is empty, so it is not stated whether the notice fires. Direction: say what happens on import and on first run.

9. **Minor to Major.** Location: Q4 and the Chart section (lines 123-133, 326-337). Problem: it is not clear how a cell code becomes a question when the stored `expected` and the chart disagree after an override. "Shared rule assumptions" lists rules (dealer peeks, double on any two cards, split to 4 hands, no resplitting aces) that differ from the preset named in G1, and the reader cannot tell whether they are a refinement of it. The row count (33 = 15 hard + 8 soft + 10 pairs) is not shown. Also, G1 says "double after split allowed" for a chart whose cells are only two-card hands. Direction: show how the row count is derived, and say how split-related rules affect a two-card-hand question.

10. **Major.** Location: "Open Questions" section. Problem: the section is a list of resolved decisions, not questions, and Q numbers are used as cross-references throughout (Q2, Q5, Q6) as if they were definitions. A reader must jump back and forth to learn the actual rules. Direction: move the resolved rules into their own sections (review ranking, chart corrections, pass drop), and leave only real open items.

11. **Nit.** Location: item keys, lines 335-337 versus 262-265. Problem: the Drill contract example uses `strategy:16v10`, but the Item keys section uses `strategy:H16v10`. They disagree. Direction: use one format.

12. **Nit.** Location: Checkpoint A (line 954, 1007), Config section, `src/ui/drill.js` and home items. Problem: "Checkpoint A" is used without any definition. Direction: define it or remove it.

13. **Nit.** Location: Technical Plan line 238-243, Components diagram. Problem: the diagram refers to `#/drill/...`, while Implementation item 31 lists `#/lesson/<stage>`, `#/drill/<stage>/<mode>`, `#/timed`, `#/review/<stage>`. The diagram omits `#/lesson`, `#/timed`, and shows `#/step/values`, which is not in the Implementation router list. Direction: align the diagram with item 31.

14. **Nit.** Location: Implementation item 2 versus the Q3 frozen URL text, and `manifest` item 5 versus line 394. Problem: `start_url` is "for example `/counting-trainer/`" in the Technical Plan, but "./" in item 5. Both can be right, but the document does not say so. Direction: state that "./" resolves to the repository path.

15. **Nit.** Location: Non-Functional Requirements, "Supported platform" (line 611). Problem: it says iOS 15.4 is needed for `crypto.randomUUID`, but the Performance line says "iPhone from the last 5 years", with no link between the two. Direction: say which iPhones this excludes, or drop the five-year phrase.

16. **Nit.** Location: undefined project terms: "preset" (used from the Overview onward), "shoe" (line 263, 795), "cell" vs "row" vs "item", "hard total", "soft total" (line 328), "up-card", "mulberry32", "Leitner boxes" (line 574), "no-hole-card tables" (line 131). Problem: each appears once or twice with no gloss. Leitner and mulberry32 are named with a one-clause hint; "shoe" and "up-card" have none. Direction: gloss on first use.

Overall: the paraphrase was possible for every section, so there is no Blocker. The main gap is a reader who knows neither Blackjack counting vocabulary nor the earlier brief and review rounds.
