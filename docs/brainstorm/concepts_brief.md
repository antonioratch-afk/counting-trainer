# Blackjack Card-Counting Practice Trainer (Offline iPhone Web App), Narrowed v1
* **Author:** antonioratch-afk
* **Date:** 2026-11-18

## Overview

This is a personal web app for someone who knows card counting exists but does not know how to start practicing it. It runs on iPhone Safari, is installed to the Home Screen, and works offline after the first load. Static files are hosted on GitHub Pages in a new public repository, kept separate from the author's work repository. A service worker caches the app. There are no accounts, no server and no leaderboard. Friends get a link and each uses the app on their own phone. The UI is in Thai.

This is iteration 2, finalized. After iteration 1 the author narrowed v1. After iteration 2 the author accepted fixes for Blockers 1 to 4 and Major 6 (see "Iteration-2 resolutions" below); Blocker 5 moves to the design draft. The full eight-stage ladder, switchable counting systems and the adaptive scheduler are deferred.

**What v1 contains**
- Counting system: Hi-Lo only (2-6 = +1, 7-9 = 0, 10 to Ace = -1).
- One rule preset: 6 decks, dealer stands on soft 17, double after split allowed, late surrender.
- Three steps, shown to the user as Step 1, 2, 3 (internal stage IDs stay `values`, `running`, `strategy`). Each has a short Thai lesson and two modes:
  - **Learn mode:** the reference card is visible. Attempts are logged but never count toward a pass.
  - **Test mode:** the reference card is hidden. Only test-mode attempts count toward a pass.
  - Step 1, Card values (Hi-Lo tags): pass at 98% or higher on at least 50 scored items (1 error allowed).
  - Step 2, Running count: the pass comes only from stop-point items. The drill stops at a random card between card 10 and card 45 and asks for the running count with free numeric entry. A timed full-deck mode is for speed practice only: before it starts, 1 to 3 random cards are removed without being shown, so the final count is not always 0. Time is logged against the 30-second target and shown as a trend. A run interrupted by leaving the app (`visibilitychange`) is voided, not scored.
  - Step 3, Basic strategy for the preset: pass at 96% or higher on at least 50 scored items, and every chart cell must have been answered correctly at least once across all test sessions. The drill asks unseen cells first.
- All three steps are open from the start. The user picks which step to practice. One session covers one step.
- Session rules: a scored session is a test-mode session of one step with at least 50 scored items. A step passes when each of 3 sessions, taken individually, meets the threshold, on 3 different calendar days (Thailand time, UTC+7), not necessarily consecutive.
- Review is a separate button ("practice my most-missed items"). Review sessions never count toward a pass. The 80/20 mix is dropped from v1.
- Data: only raw attempts are stored. Pass status is calculated from them. Thresholds are in a config file that the author edits in code. Export uses the iOS Share Sheet. Import merges by attempt ID and skips duplicates.
- The basic strategy chart is a data file that cites its source. A test compares every cell against a second source.
- The web address is fixed before sharing, for example `<github-user>.github.io/bj-trainer/`, and never changed after friends install.

**Deferred:** stages 3 (group counting), 4 (true count), 6 (full table simulation), 7 (deviations) and 8 (bet ramp); multiple counting systems; custom rules.

The app is presented as a skill-training tool. Casino gambling is illegal in Thailand.

Seven review lenses ran in iteration 2: design, codebase details, zoom-out, comprehension, implementation readiness, structural and inventive catalyst. All seven completed. This is a greenfield project. No existing code applies, and the app should not live in the current working directory.

## Analysis

### Accepted risk (author decision, not resolved)

**Build versus reuse has not been tested.** Free trainers already exist (Blackjack Apprenticeship drills, Wizard of Odds trainers, free iOS counting apps). The author chose to build without trying them. The gaps that are probably real are the Thai UI, guaranteed offline use from the Home Screen, a mastery rule that needs several days, and mistake-driven review. If the only real gap is Thai labels, the build may not pay off. This stays listed as an accepted risk. No reviewer re-raised it.

### Status of iteration-1 blockers

| Iteration-1 blocker | Status after narrowing |
| --- | --- |
| Stage 2 passable by answering 0 | Resolved for the stop-point drill. Not resolved for the timed full-deck mode (see Risk 4). |
| Stage 4 undefined for KO | Resolved. Stage 4 and KO are deferred. |
| Wrong strategy or deviation data | Mostly resolved. One cited chart, one preset, a second-source test. Gaps remain (Risk 9). |
| "Session" and "pass" undefined | Partly resolved. Session size, day rule and review exclusion are stated. Several readings remain (Risks 1, 2, 5, 6). |
| App tests but never teaches | Resolved in scope (lesson and reference card per stage). A conflict between the card and the graded test is new (Risk 3). |
| Stored data shape and stored pass flags | Pass flags resolved (computed). The record fields are still undefined (Risk 5). |
| Web address can delete data | Half resolved. The address is "fixed" but not named or protected (Risk 8). |
| Tool comparison | Recorded as an accepted risk. |

### Iteration-2 resolutions (author decisions after review)

The risks below are kept as the review record. The author resolved them as follows, without a third review round:

| Iteration-2 risk | Resolution |
| --- | --- |
| Blocker 1, pass arithmetic | Minimum 50 scored items per session. Step 1 at 98% (1 error allowed). Step 3 at 96%, plus every chart cell answered correctly at least once, unseen cells asked first. Each of the 3 sessions must meet the threshold on its own. Compare as integers. |
| Blocker 2, current stage and which items count | 80/20 mix dropped. The user picks the step; one session is one step. Review is a separate button and never counts. "Most missed" ranking is defined in the draft. |
| Blocker 3, reference card versus test | Learn mode (card visible, not scored) and test mode (card hidden, scored). Mode is stored on each attempt. |
| Blocker 4, Stage 2 | Pass from stop-point items only, stop point uniform between card 10 and 45, free numeric entry. Timed mode removes 1 to 3 hidden cards before start and is speed practice only. Interrupted runs are voided. |
| Blocker 5, attempt record and session object | Deferred to `/egm-draft`. The field list in Risk 5 is the starting point. |
| Major 6, stage labels | Shown as Step 1, 2, 3. Internal IDs are stable strings. Deferred stages are hidden. No step is locked. |

### Remaining risks, ranked by severity

**Blocker 1. The pass arithmetic makes 98% mean 100% (raised by 6 of 7 lenses).**
- With 20 items, one miss gives 95%. A 98% threshold on 20 items allows 0 errors. It allows one error only from 50 items.
- If review items are mixed in (80/20), only about 16 items are current-stage. The same arithmetic applies.
- Stage 5 has about 280 hand-versus-dealer cells. A random 20-item sample can leave most of the chart untested, so a pass would not show the chart is known.
- "98% in 3 sessions" has three readings: each session on its own, all items pooled, or the best three.
- Decision needed: state "each of 3 sessions individually", state the minimum count of scored current-stage items, and either raise it to 50 or state the rule as "0 errors in 20". Compare as integers (`correct*100 >= threshold*total`). Sample stage 5 items so unseen cells come first.

**Blocker 2. "Current stage", session type and which items count are undefined.**
- Stages 1, 2 and 5 are all open at the start, so "current stage" has three candidates. The 80/20 split cannot be built until one is chosen.
- Review items must be tagged and kept out of the pass calculation. The 20-item minimum and the 98% must apply to current-stage, non-review, first-attempt items only.
- Define "most missed" (count, window, minimum of misses, behavior when no history exists, and whether review attempts feed the ranking).
- Define what "current" means once all stages are passed.
- Suggested rule: current stage is the lowest-numbered unpassed stage by display order. The home screen recommends one next step (Stage 1 for a new user) and shows Stage 5 as a second option with a Thai hint that knowing card values first helps.

**Blocker 3. The always-available reference card conflicts with the 98% test (design, comprehension, inventive catalyst, zoom-out).**
- If the card stays open during graded items, Stage 1 and Stage 5 become look-ups. If it is hidden, a beginner cannot start.
- Options: (a) a learn mode with the card shown and a test mode without it, where only test-mode attempts count; (b) opening the card during a graded item marks that item "assisted" and counts it as a miss for passing.
- The decision belongs to the author. The log needs a field for the mode either way.

**Blocker 4. Stage 2 is incomplete (codebase details, implementation readiness, structural, design).**
- A full deck always sums to 0 for Hi-Lo. The timed full-deck mode ends at a known value, so a user can type 0. The timed run needs a random stop, a hidden removed-card count, or a partial deck. Free numeric entry is needed, not multiple choice.
- The stopping-point distribution is not stated.
- One timed run is one item, so a 20-item session cannot be mostly timed runs. State how the session mixes stop-point items and timed runs, and which of them decide the Stage 2 pass.
- Simplest reading: the pass comes from the stop-point items. The timed run is logged as a speed result with the limit stored on the record.
- A timed run that is interrupted (app backgrounded, call) must be voided, not scored. A voided run is logged as voided, not as a miss.
- Show the elapsed time and the target after each timed run. Say how cards are shown (one at a time with tap, or automatic).

**Blocker 5. The attempt record and the session object are not defined (implementation readiness, structural, codebase details).**
- The record has no session ID, no session type, no mode, and no item key. The pass rule cannot be calculated without them.
- Minimum fields: attempt ID (random UUID), schema version, session ID, stage ID (a stable string, separate from the label on screen), drill ID (including the Stage 2 mode), counting system ID, preset ID, chart version, item key (for example hand and dealer card), expected, given, correct (stored at write time), time taken in ms, UTC timestamp, and session type or mode (pass or review).
- Define a session: created at tap on Start, saved one attempt at a time to IndexedDB, abandoned after a set idle time (suggested 30 minutes), and counted only if complete. State which day applies when a session crosses midnight (suggested: the day of its first attempt).
- Pass status and the Thailand day should be calculated from the UTC timestamp with a fixed +7 hour offset (Thailand has no daylight saving). Do not use the device timezone. Add tests at 23:59 and 00:01 Bangkok time.
- Merge needs rules: a session counts only if complete in the log, merge must give the same result in any order, and merging twice equals merging once. Duplicate IDs with different content: keep the existing record and count the conflict.
- One function calculates progress. The scheduler, stats screen and unlock logic all call it.
- Use stable stage IDs and take display order and labels from config.

**Major 6. Stage numbers 1, 2, 5 look like a bug to a beginner (comprehension, zoom-out).** Show consecutive labels (Step 1, 2, 3) or Thai names and keep 1, 2, 5 as internal IDs. Hide deferred stages or show them as locked. State the reason Stage 5 is open from the start. State whether Stage 2 is locked until Stage 1 passes.

**Major 7. The 3-days rule needs visible feedback.**
- The minimum is 3 days per stage, and the author said they will not practice daily.
- A user can score 100% on day 1 and still see "not passed". Show "N of 3 days counted" and "today already counted, come back tomorrow".
- State that incomplete sessions do not count.
- State that thresholds are code-only, so no settings screen is needed, and show a notice when a threshold change alters a pass status. Decide whether a passed stage can revert (open question).

**Major 8. The web address is fixed in words but not protected (design, implementation readiness, codebase details).**
- All project sites under one `username.github.io` share browser storage. The author's GitHub name (`antonioratch-afk`) would be in the address.
- A repository or account rename gives every installed copy a new address and empties its data.
- Required: write down the exact final address, state it is frozen, and name the IndexedDB database and cache names with the app name.
- The service worker scope, manifest `start_url` and `scope` must all include the `/bj-trainer/` path. Absolute `/` paths break a project site.
- Put an app identifier in the export file and warn on import if it does not match.

**Major 9. The chart check has holes (codebase details, design, structural, zoom-out).**
- Name both sources and the rule set they share. Sources differ on exactly these rules: dealer peek and late surrender, number of splits, resplit aces, double on any two cards.
- Surrender cells (15 against 10, 16 against 9, 10 and Ace) and the pair of 8s against Ace are the likeliest disagreements. The test fails on any disagreement until the author resolves it by hand and records the choice in the data file.
- The test also checks that every legal two-card hand and dealer card appears once (no gap, no duplicate), and that source and retrieval date fields are filled in.
- The second source must be typed from a different publisher, kept as a separate fixture, and not edited together with the chart.
- The chart version should come from file content, or the test should fail if content changed without a version change.
- The reference card and the answer key are rendered from the same file, and a test checks this.
- Define the Stage 5 item as one decision from a two-card hand against a dealer card, with the action set Hit, Stand, Double, Split, Surrender. Late surrender applies only to two-card hands. State how "double if allowed" cells are encoded.
- When a chart is corrected, keep the stored expected answer and do not re-grade. Pass calculation ignores attempts from chart versions the config lists as invalid.

**Major 10. Updates and the offline cache.**
- A cache-first service worker can leave iOS on an old build. A corrected chart then never reaches friends.
- GitHub Pages caches files for 10 minutes. Fetch precache files with `cache: 'reload'`.
- Use a hand-written service worker with a versioned cache name, a full precache at install, no `skipWaiting` mid-session, old cache deletion on activate, an update check when the app returns to the foreground, and an "update available" prompt only between sessions.
- Show the build version and chart version on screen. Store the chart version and config version on each attempt.
- The database version only moves up. A rolled-back build that finds a newer version shows a message and does not write. Records with an unknown version are kept, not dropped.
- Something must stamp the version and file list at deploy (a small script or GitHub Action), or the version bump will be forgotten.

**Major 11. Backup on iOS.**
- Home Screen storage is separate from Safari storage. Practice done before install does not carry over. Deleting the icon deletes the data. `navigator.storage.persist()` is not guaranteed, so show the result in diagnostics.
- Share Sheet export must run directly from a tap and check `navigator.canShare`. A cancelled share is not a failure and must not reset "last backup".
- Provide a copy-to-clipboard fallback and a paste-text import. Do not rely on a `.json` filter on the file picker.
- Show "last backup N days ago". Offer export at the end of a session. When the log is empty at launch, offer "restore from file" next to "start".
- Import checks the whole file, then writes in one transaction. It shows counts (added, duplicates, rejected). A file from a newer schema version is refused with a Thai message.
- A merge can change pass status. Pass status is calculated, so this is accepted.

**Major 12. Items a beginner needs that the narrowed scope does not state (comprehension).**
- The first screen and first action (the Stage 1 lesson, then the drill). Whether the lesson must be read once or can be skipped.
- The rule preset shown on the Stage 5 screen with a one-line Thai explanation of each term, and a warning that the chart does not apply to other rules.
- Stage 2 gives a running count only. The lesson states that a running count is a first step and does not mean the same at the start and end of a shoe.
- Show "0 mistakes allowed" or similar instead of a bare percentage when the item count is 20.

**Nits**
- Record the time per answer for every item. It costs nothing.
- Make timing use `performance.now()`, and void the run on `visibilitychange`.
- Use `crypto.randomUUID()` for IDs (iOS 15.4 and later).
- A diagnostics screen shows build, chart version, schema version, service worker state, `storage.persisted()` and `storage.estimate()`, attempt count, last export, last import, and the last 20 errors, with a copyable text block. Capture `window.onerror` and `unhandledrejection` in a small capped log.
- Put thresholds and structural numbers (3 sessions, 3 days, 20 items, 30 s, 80/20) in one versioned config with unit names such as `timedRunLimitSec`. Validate it at startup.
- Tests: `node --test` with ES modules, run in GitHub Actions before Pages deploy. Game logic modules take a storage adapter and an injectable clock. Use a seeded random generator in tests. Keep a short manual iPhone checklist for install, offline, Share Sheet and update.
- Thai strings live in one table. A missing key fails a test. Fix Thai terms for hit, stand, double, split and surrender. Have a Thai reader check them. The lesson text takes longer to write than the drills.
- Show the install guide ("Share, then Add to Home Screen") in Thai on first visit in Safari.
- Training-only framing goes on the first screen and in the README.
- Card values: Ace counts as -1, and all four ten-value ranks count as -1.
- Clock changes on the device can create several "days". For a personal app this is accepted and stated.
- Stage 5 uses two-card starting hands only in v1.
- A no-hole-card preset for Asian tables stays out of v1.

### Inventive contradictions and suggested patterns

1. **Strict pass bar versus a beginner's progress and a visible reference card.**
   - Split each drill into learn mode (card visible, not counted) and test mode (card hidden, counted). A first miss in test mode can open the card for that item and ask it again later in the session.
   - Add a "nearly there" tier (95% to under 98%) shown on the progress bar.
   - Trade-off: two UI states and one more Thai string set.
2. **Anti-cramming rule (3 days) versus cheap sessions.**
   - Score only current-stage items. Show "days counted" and "today already counted".
   - Optional coverage rule: the three passing sessions together must have asked at least a set share of chart cells.
   - Trade-off: one more parameter to tune.
3. **No server versus storage loss.** Make export the last step of a session. The empty-log launch screen leads to restore. Ask for a test export once after install, so the author finds out early whether the Share Sheet works on that phone.
4. **Update freshness versus offline use.** Install and precache the new build in the background and activate it only between sessions. The app refuses to write to a database newer than its own code.
5. **Slow but correct timed runs versus motivation.** Show the time trend ("52 s, then 41 s") as a speed badge separate from the pass. The pass stays with the stop-point drill.
6. **Computed pass versus a changed threshold or chart.** Store the expected answer and the chart and config versions on each attempt. Pass calculation reads stored values and a list of invalid chart versions in config. Show a notice when a change alters a pass status.
7. **Shared contract.** A drill has a question generator, a grader, a measured value and an item key. A stage has drills plus a pass rule and an unlock rule, both data. Display order and labels come from config. One progress function serves every screen.

### Ideal Final Result

A static bundle where one rule file (thresholds, session size, day offset, which mode counts) and one chart file drive everything. Learn mode and test mode are the same drill with a visibility flag, so a visible card cannot change a pass. The log is append-only, and pass status is a function of the log and the rule file. The end of each session offers the backup. A new build installs in the background and starts between sessions. Losing the phone costs at most the work since the last export.

## Goals vs. Non-Goals

### In-Scope Goals
- Offline Home Screen web app on iPhone Safari, served from GitHub Pages under one named, frozen address.
- Hi-Lo only, one preset (6 decks, dealer stands on soft 17, double after split, late surrender).
- Three stages (card values, running count, basic strategy), each with a short Thai lesson and a reference card.
- Pass rule written with exact numbers: 50 scored test-mode items, per-session threshold (98% Step 1, 96% plus full coverage Step 3), 3 sessions, 3 Thailand days, review and learn-mode items excluded.
- Step 2 with a random stopping point (card 10 to 45) as the pass route, plus a timed speed mode with hidden removed cards.
- A chart data file with cited source, rule assumptions, a gap-and-duplicate check and a cell-by-cell test against a second source.
- Raw attempt log in IndexedDB with the fields listed in Risk 5, a schema version and migrations.
- Pass status, current stage and review picks calculated by one function.
- Export through the Share Sheet with a clipboard fallback. Import merges by attempt ID with a preview and counts.
- Versioned service worker cache. Build and chart version visible on screen.
- Thai UI with one string table and a short glossary. Diagnostics screen.
- Training-only framing on the first screen and in the repository.

### Out-of-Scope Non-Goals
- Stages 3, 4, 6, 7, 8 in v1.
- More than one counting system. Custom or multiple rule presets.
- Accounts, server sync, leaderboards, push reminders.
- A settings screen for thresholds. The author edits the config in code.
- Daily streaks or penalties for missed days.
- A native iOS App Store app.
- Charting libraries.
- Real-money or gambling features.
- Placing the app in the current work repository.

## Alternatives Weighed

- **Existing free card-counting apps and sites. Accepted risk (author chose to build without testing).** The author wants a structured path from zero with stats and a multi-day pass rule. Existing tools likely cover stages 1, 2 and 5. The comparison was not done and the question is not resolved.
- **Native iOS app through the App Store. Rejected by author.** It needs a paid developer account and App Store review, and friends would need TestFlight or a listing, which goes against sharing by link.
- **Raw HTML file opened from the iPhone Files app. Rejected by author.** It cannot run a service worker or install to the Home Screen, and storage is unreliable.
- **Server-backed sync, friend leaderboard, push reminders. Rejected by author.** Each needs a server, which conflicts with offline use and free static hosting.
- **Deviations for all counting systems. Deferred by author.** Index numbers depend on system and rules, and a beginner cannot check them.
- **Fully custom rules with computed basic strategy. Deferred by author.** Computed strategy cannot be checked by a beginner. Precomputed presets with cited sources can be verified.
- **Fixed daily streak. Rejected by author.** The author will not practice daily.
- **Switchable counting systems in v1. Deferred by author.** KO breaks stage 4, and stages 7 and 8 are Hi-Lo only. Card values stay in a data file so another system can be added later.
- **Full 8-stage v1. Narrowed by author.** Stage 6 needs a full game engine, and a beginner needs weeks on stages 1 to 5 before stages 6 to 8 matter. v1 keeps stages 1, 2 and 5.
- **Hand-written service worker versus Workbox. Open.** About 40 lines with versioned caches avoids a build step. Most reviewers in iteration 2 favored the hand-written one if the deploy step stamps the version.
- **80/20 current-stage and review mix in v1. Dropped by author after iteration 2.** With three open steps, "current stage" had no single meaning, and review items diluted the scored count. v1 is "pick a step and drill it" plus a separate review button. The mix may return with the scheduler in a later release.
- **Always-visible reference card during graded items. Rejected by author.** It turns graded items into look-ups. Replaced by learn and test modes.
- **"Assisted" items (opening the card counts as a miss). Not chosen.** Learn and test modes are easier for a beginner to understand.
- **20-item sessions at 98%. Rejected by author.** 98% of 20 allows 0 errors. Replaced by 50-item sessions.
- **Timed full-deck mode as a pass route. Rejected by author.** A full deck sums to 0 in Hi-Lo. Timed mode is now speed practice with hidden removed cards.

## Key Decisions & Staging for Next Steps

### Decisions resolved
- Static web app on GitHub Pages in a new public repository, separate from the work repository.
- Offline through a service worker, installed to the Home Screen.
- No accounts, no server, no leaderboard, no in-app reminders.
- Hi-Lo only. One rule preset. Stages 1, 2 and 5 in v1.
- Steps shown as 1, 2, 3; all open from the start; the user picks the step; one session is one step.
- Learn mode (card visible, not scored) and test mode (card hidden, scored).
- Scored session minimum of 50 items. Step 1 at 98%, Step 3 at 96% plus full chart coverage. Each of 3 sessions meets the threshold on its own, on 3 different Thailand days (UTC+7).
- Step 2 passes on stop-point items only (stop between card 10 and 45). Timed mode removes 1 to 3 hidden cards and is not a pass route. Interrupted runs are voided.
- Review is a separate button and never counts. No 80/20 mix in v1.
- Only raw attempts are stored. Pass status is calculated.
- Thresholds are in a config file edited by the author.
- Export through the Share Sheet. Import merges by attempt ID.
- Chart as a cited data file with a second-source test.
- Web address fixed before sharing.
- No streak.
- Build versus reuse is an accepted, untested risk.

### Suggested staging
1. **Write a one-page spec** that settles Blockers 1 to 5. Builders can start the repository, Pages deploy with a test gate, service worker shell, deck and shoe modules, Hi-Lo values, config loader, string table and chart file with its test before this is done. They cannot finish the log, session logic, pass calculation, Stage 2 or review selection without it.
2. **Checkpoint A, before sharing with anyone.** On the author's iPhone:
   - Stages 1, 2 and 5 with lessons.
   - Log, calculated pass status, and an export and import round trip (export, wipe, import gives the same status; second import adds 0).
   - Offline install from the Home Screen icon after a cold start in airplane mode.
   - Update flow and version display.
   - Manual iPhone checklist done.
3. **Share with friends** only after the web address is named and frozen.
4. **Later releases:** stages 3 and 4 with a scheduler that uses them, then the full table simulator, then stages 7 and 8.

### Open questions for the author
Questions 1 to 4, 10 and 11 from the iteration-2 list are resolved above. These remain for `/egm-draft`:
1. The attempt record and session object (Blocker 5): exact fields, session start and abandon rule (suggested 30 idle minutes), and the day a midnight-crossing session belongs to (suggested: day of first attempt).
2. How "most missed" is ranked for the review button.
3. What exactly is the final web address?
4. Which two sources feed the chart, and which rule assumptions do they share? Who resolves disagreements?
5. When a chart is corrected, are past attempts kept as graded (suggested), re-graded, or voided?
6. Can a passed step revert after a threshold change or merge? Does the app show a notice?
7. Can a user who already counts skip ahead (for example a placement test)?
8. Hand-written service worker or Workbox?
