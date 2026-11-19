# Counting Trainer: Blackjack Card-Counting Practice (Offline iPhone Web App), v1

*   **Author:** antonioratch-afk
*   **Status:** Proposed
*   **Date:** 2026-11-18

--------------------------------------------------------------------------------

## Overview

Counting Trainer is a personal web app that teaches a beginner the first three
skills of Blackjack card counting: Hi-Lo card values, keeping a running count,
and basic strategy for one set of table rules. It runs in iPhone Safari, is
installed to the Home Screen, and works with no network once installed. Static
files are served from GitHub Pages at
[https://antonioratch-afk.github.io/counting-trainer/](https://antonioratch-afk.github.io/counting-trainer/)
(repository `counting-trainer`). There is no server, no account and no shared
data: each phone keeps its own practice log. The UI is in Thai.

The app is a skill-training tool. It has no betting, no real money and no link to
any gambling service. The first screen and the repository README say the app is
for training only.

### Terms used in this document

*   **Hi-Lo**: a counting system that gives each card a tag: 2 to 6 are +1, 7 to
    9 are 0, 10, J, Q, K and A are -1.
*   **Running count**: the sum of the tags of all cards seen so far.
*   **Shoe**: the box of shuffled decks the dealer deals from; here 6 decks.
*   **Basic strategy**: the table of best plays (hit, stand, double, split,
    surrender) for each player hand against each dealer up-card.
*   **Up-card**: the dealer's face-up card.
*   **Hard / soft total**: a hand with no ace counted as 11 is hard; a hand
    with an ace counted as 11 is soft (for example A+7 is soft 18).
*   **Late surrender**: giving up half the bet after the dealer checks for
    blackjack.
*   **Preset**: the fixed table rules the strategy chart is built for (see G1).
*   **Cell**: one entry of the strategy chart: one player hand row against one
    dealer up-card.
*   **Item**: one scored question. Step 1: one card. Step 2: one run of 10 to 45
    cards ending in a count question (a "stop-point item"). Step 3: one cell.
*   **Step / stage**: "Step" is the word the user sees. `stage` (`stageId`) is
    the same thing in code.

## The Problem

The author knows card counting exists but does not know how to start practicing.
Written guides explain the method but do not check whether the reader can apply
it, and they do not say when the reader is ready to move on. The author wants:

*   a suggested order of steps (all open from the start), each with a short Thai
    lesson;
*   a test for each step with a stated pass rule, so readiness is measured;
*   a pass rule that needs results on several different days, not one sitting;
*   a record of mistakes, so practice can return to what was missed;
*   use on an iPhone with no signal, without installing from the App Store.

The proposed solution is a static web app with three steps. Each step has a
learn mode (reference card visible, nothing scored) and a test mode (card
hidden, answers scored). Every answer is stored on the phone. Pass status is
calculated from the stored answers each time it is needed, so changing a pass
threshold later does not need a data migration.

**Why build instead of reuse.** Existing free trainers were not compared before
this design. They likely cover the single drills (unchecked). The author builds
this app anyway as a personal project, to get the five needs listed above in
one Thai-language app. The comparison is done in Phase 0, before any code is
written. If an existing tool meets all five needs, the project stops. This is
open question O1.

## Goals

*   **G1. Three steps, each passable.** Step 1 card values, Step 2 running count,
    Step 3 basic strategy. The preset is: 6 decks, dealer stands on soft 17,
    dealer checks for blackjack, double on any two cards, double after split,
    split to 4 hands, no resplitting aces, late surrender. Step 3 asks only
    two-card starting hands, so the split rules do not change any question; they
    are listed because they decide the chart's values. All three steps are open
    from the start. Step IDs in code: `values`, `running`, `strategy`.
*   **G2. Exact pass rules.** A test session has a fixed length: 50 items for
    Step 1 and Step 3, 20 items for Step 2. A test session meets the bar when
    `correct * 100 >= threshold * total` (integer comparison). Thresholds: Step
    1 98% (1 error in 50); Step 2 95% (1 error in 20); Step 3 96% (2 errors in
    50). Only the first test session of each step started on each Thailand
    calendar day (UTC+7) counts; if it is abandoned or misses the bar, that day
    does not pass. A step passes when counted sessions meet the bar on 3
    different days, not necessarily consecutive. Step 3 also needs
    every chart cell answered correctly at least once in test mode.
*   **G3. Step 2 cannot be passed without counting.** Test items stop at a
    random card between card 10 and card 45 and ask for the running count with
    free numeric entry. A separate timed mode deals one 52-card deck with 1 to
    3 cards removed unseen, so the final count is not always 0; it records time
    against a 30-second target and never affects passing.
*   **G4. Leaving the app during a test is a miss.** In test mode, if the user
    leaves the app (including closing it) while a question or a Step 2 run is in
    progress, that item is recorded as a miss when the app is next in front. In
    learn and review modes it is voided and not counted.
*   **G5. Review that targets mistakes.** A separate review button builds a
    session from the items missed most. Review sessions never count toward
    passing.
*   **G6. Works offline on iPhone.** After installing and opening the app once
    from the Home Screen icon while online, the app starts and runs in airplane
    mode. The home screen shows an "offline ready" mark when every file is
    cached.
*   **G7. Practice history survives a phone change.** Export writes all stored
    answers and sessions to a file through the iOS Share Sheet, with a
    copy-to-clipboard fallback. Import merges by record ID and reports counts of
    added, duplicate and rejected records. Progress after import equals the
    source phone. Importing the same file twice adds nothing.
*   **G8. The strategy chart is checked.** The chart is a data file that names
    its source. An automated test compares every cell against a second,
    independently typed source and fails on any difference. The test catches
    typing errors and disagreements between sources. It does not prove that the
    sources' rule assumptions match the preset; that is checked by hand once,
    by confirming each source states the same rules.
*   **G9. Visible progress.** Each step shows days counted toward the pass
    ("2 of 3 days"), and says when today's counted session is already done.

**Measure of success.** The author passes all three steps within 8 weeks of
first use. A Step 2 pass means an accurate running count at the user's own
pace; it does not show table speed. Timed results are reported separately as a
speed trend.

## Non-Goals

*   Steps for group counting, true count, full-table play, playing deviations
    and bet sizing. These are later releases.
*   Counting systems other than Hi-Lo.
*   Rule presets other than the one above, and user-defined rules.
*   Accounts, server sync, leaderboards and push reminders. The phone's own
    Reminders app can be used instead.
*   Daily streaks or penalties for missed days.
*   A settings screen for thresholds. The author changes them in a config file
    in the repository.
*   A native App Store app.
*   Any betting with real or play money.
*   Android or desktop support as a target. They may work, but are not tested.

## Risks & Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Existing free trainers already meet the needs (unchecked) | Build effort is wasted | Open question O1: compare 2-3 named trainers in Phase 0, before any code; stop if one meets all five needs |
| iOS clears the app's stored data | Practice history lost | Request persistent storage after the first completed session; "last backup N days ago" reminder; export offered after each test session |
| First install not fully cached | App fails offline | Open once from the icon while online; "offline ready" mark; caching error shown on home and diagnostics |
| Stale cache after an update | Old build or old chart keeps running | Versioned cache name; files fetched bypassing the HTTP cache; update banner between sessions; build and chart version on screen |
| Account or repository rename | Web address changes and installed copies see empty data | Address is frozen; before any rename every user exports, then imports on the new address |
| Wrong chart cell | Users learn and are graded on a wrong play | Two-source test and `overrides` list; past grades are kept (accepted); chart fixes are announced in the README |
| Malicious or broken import file | Bad data or script injection | Every record validated; unknown fields rejected; all text shown with `textContent`; Content-Security-Policy allows only same-origin scripts; newer schema refused |
| Rollback after a schema version increase | Older build cannot open the database | Older build shows a Thai message and does not write; fix forward instead of rolling back |
| Gambling framing | App seen as promoting gambling | Training-only statement on first screen and README; no betting features |

## Open Questions

*   **O1. Compare existing trainers.** Test 2-3 named free trainers against the
    five needs in The Problem and record the result.
*   **O2. Check the Blackjack Apprenticeship chart's deck count.** Confirm
    whether it is built for exactly 6 decks. If it covers a range, cells that
    differ for that reason are recorded in `overrides`.

## Critical User Journeys (CUJs)

### CUJ 1: First use, install and first lesson

*   **Given**: The author opens the app link in iPhone Safari for the first time,
    online.
*   **When**: The app shows a Thai guide ("Share, then Add to Home Screen"); the
    author installs it, opens it from the icon while still online, waits for
    the "offline ready" mark, and taps Step 1.
*   **Then**: The Step 1 lesson opens, followed by learn mode with the reference
    card visible. Nothing is scored. The home screen shows Step 1 as "0 of 3
    days".

### CUJ 2: Test session counts toward a pass

*   **Given**: The app is installed. The phone is in airplane mode.
*   **When**: The author starts a Step 1 test session and answers its 50 items
    with 1 error.
*   **Then**: The session ends, is saved with 98%, and the step shows "1 of 3
    days". A second test session the same day is saved and shown, but the step
    still shows "1 of 3 days" and says "today's counted session is done".

### CUJ 3: Step 2 stop-point drill

*   **Given**: The author is in Step 2 test mode.
*   **When**: Cards are shown one at a time on each tap, and the drill stops at a
    random card between card 10 and 45 and asks for the running count.
*   **Then**: The typed number is graded against the true running count. If the
    author leaves the app before answering, the item is recorded as a miss.

### CUJ 4: Review missed items

*   **Given**: The author has missed several Step 3 cells in earlier test or
    review sessions.
*   **When**: The author taps the review button.
*   **Then**: A session of up to 20 items is built from the most-missed cells.
    Its answers are stored but do not change pass progress.

### CUJ 5: Back up and restore on a new phone

*   **Given**: The author has a practice history on the old phone.
*   **When**: The author taps Export, saves the file through the Share Sheet,
    installs the app on the new phone, and imports the file.
*   **Then**: The import reports how many records were added. Pass progress on
    the new phone matches the old phone. Importing the same file again adds 0.

## Technical Plan (Architecture)

### Stack

Plain JavaScript ES modules, HTML and CSS, served as-is from GitHub Pages. No
framework, no bundler and no runtime dependencies. The only tooling is Node.js
(for `node --test` and one deploy script) on the author's machine and in GitHub
Actions. Types are documented with JSDoc comments.

The code is split into two layers:

*   **Core** (`src/core/`): pure functions with no DOM, no IndexedDB and no
    clock access. They take data in and return data out. All rules live here:
    card values, deck building, drill generation, grading, the Thailand day
    calculation, session status, pass calculation and review selection. Every
    core module runs in Node tests.
*   **Shell** (`src/ui/`, `src/store/`, `sw.js`): the screens, the IndexedDB
    adapter, the service worker and the Share Sheet. The shell passes the
    current time, the random generator and stored data into core functions.

### Components and data flow

```text
 iPhone Home Screen app (Safari engine)
 +--------------------------------------------------------------------+
 |  index.html -> src/app.js  (hash router: #/home, #/lesson/<step>,   |
 |                #/drill/<step>/<mode>, #/timed, #/review/<step>,     |
 |                #/backup, #/diag)                                    |
 |                                                                     |
 |  src/ui/*  (screens)                                                |
 |     |  user taps / typed answers                                    |
 |     v                                                               |
 |  src/core/*  (pure rules)  <---- data/config.json                   |
 |     |   drill generators       data/chart-6d-s17-das-ls.json        |
 |     |   grader, session status src/i18n/th.js (Thai strings)        |
 |     |   progress (pass calc)                                        |
 |     |   review picker                                               |
 |     v                                                               |
 |  src/store/db.js     ---> IndexedDB "countingtrainer"               |
 |                           stores: attempts, sessions, meta          |
 |  src/store/share.js  ---> Share Sheet file / clipboard text         |
 +--------------------------------------------------------------------+
        ^ cached files
 sw.js (service worker, cache "countingtrainer-<build>")
        ^ first load and update checks only
 GitHub Pages: https://antonioratch-afk.github.io/counting-trainer/
```

### Drill contract

Every drill is a core module that exports the same shape:

*   `generate(rng, state) -> Item` creates the next question. `Item` has an
    `itemKey` (a stable string such as `strategy:H16vT` or `values:K`), the
    data the screen shows, and the `expected` answer.
*   `grade(item, given) -> { correct: boolean }`.
*   `stageId` and `drillId`.

Drills in v1:

| Step (`stageId`) | Drill ID | Question | Answer input | Counts toward passing |
| --- | --- | --- | --- | --- |
| `values` | `values.single` | One card | Buttons +1 / 0 / -1 | Yes (test mode) |
| `running` | `running.stop` | Cards one at a time from a fresh 6-deck shoe; stops at a random card from 10 to 45 | On-screen keypad with ± key | Yes (test mode) |
| `running` | `running.timed` | One 52-card deck with 1 to 3 cards removed unseen | On-screen keypad with ± key, timer | No (speed record only) |
| `strategy` | `strategy.cell` | Two-card hand against dealer up-card | Buttons Hit / Stand / Double / Split / Surrender | Yes (test mode) |

After each answer, every mode shows whether it was right and the expected
answer, then a Next button.

In `running.stop`, cards advance when the user taps (no auto-deal in v1). The
user cannot go back. Each stop is one item, so a 20-item test session is 20
runs of 10 to 45 cards.

`strategy.cell` asks cells the user has never answered correctly in test mode
first, then picks at random. Within one session no cell repeats until every
cell has been asked. The chart file encodes "double if allowed,
otherwise hit" as `Dh` and "double if allowed, otherwise stand" as `Ds`; in a
two-card question doubling is always allowed, so both grade as Double. The same
applies to surrender codes (`Rh`, `Rs`, `Rp`), which grade as Surrender.

### Session lifecycle

*   **Test sessions** have a fixed length equal to the step's item count (50,
    20, 50) and end automatically after the last item. The score uses all of
    those items.
*   **Learn sessions** have no length and end when the user taps Finish.
*   **Review sessions** have 20 items, or fewer if fewer items are eligible.
    With none eligible, the app says so and offers learn mode. Step 2 review is
    always 10 fresh runs.
*   **Timed runs** are saved as their own session with `mode = speed`.
*   The planned length is written on the session row at Start (`length`; empty
    for learn and speed).
*   An unfinished session resumes if the user returns within 30 minutes. After
    that it is abandoned.
*   Session status is calculated from its attempts, never stored (see Stored
    data): **complete** when its answered or missed items reach `length`;
    **abandoned** when not complete and the last answer (or the start, if there
    is none) is more than 30 minutes old; otherwise **open**.
*   **Counted session**: for each step and Thailand day, the first test session
    started that day is the counted one. If it is abandoned or misses the bar,
    the day does not pass, and later test sessions that day cannot replace it.
*   **Leaving the app**: before a test question or Step 2 run is shown, the app
    writes a "pending item" record. Answering clears it. If the app is hidden or
    closed first, the pending item is written as `missed` (test) or `voided`
    (learn, review) the next time the app is in front, and the screen says so.
    An interrupted speed run is discarded as `voided`.

### Stored data

IndexedDB database `countingtrainer`, schema version 1, three object stores.
`attempts` and `sessions` rows are written once and never changed, so import
can merge them by ID without conflicts.

**`attempts`** (one row per answered item)

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | string | `crypto.randomUUID()`, primary key |
| `v` | number | record schema version (1) |
| `sessionId` | string | owning session |
| `stageId` | string | `values` / `running` / `strategy` |
| `drillId` | string | see drill table |
| `mode` | string | `learn` / `test` / `review` / `speed` |
| `itemKey` | string | stable item identity |
| `expected` | string | expected answer, stored at write time |
| `given` | string | user's answer; empty when missed or voided |
| `correct` | boolean | graded at write time; false when missed |
| `outcome` | string | `answered` / `missed` (left the app in test mode) / `voided` (left the app in learn or review mode) |
| `ms` | number | time from question shown to answer |
| `ts` | number | UTC milliseconds |
| `chartVer` | string | chart file version (strategy only) |
| `cfgVer` | string | config version |

Indexes: `sessionId`, `[stageId, mode]`, `[itemKey, ts]`.

**`sessions`** (one row per session, written when the user taps Start)

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | string | UUID, primary key |
| `stageId`, `mode` | string | one step and one mode per session |
| `startTs` | number | UTC ms when the session was started |
| `length` | number or null | planned item count (test and review); null for learn and speed |

`dayKey` is the Thailand date of `startTs`. Calculated from attempts, not
stored: `status`, `itemsDone`, `lastTs` (voided answers also update it).

**`meta`**: key-value rows for `lastExportTs`, `lastImportTs`, `installTs`,
`persistResult`, `pendingItem`, `lastPassed` (array of step IDs, used only for
the pass-drop notice) and a capped error log (last 20 errors). `meta` is not
exported.

### Strategy chart and item keys

Rows are hard totals 5 to 19 (15 rows: non-pair two-card hands), soft totals
A2 to A9 (8 rows), and pairs 22 to TT and AA (10 rows): 33 rows. Columns are
dealer up-cards 2 to 9, ten and A (10 columns). That is 330 cells. Full
coverage needs at least 7 test sessions (330 cells ÷ 50 items, when every
question is a new cell).

**Key grammar.** Ten-value cards are `T` everywhere in data; the screen shows
10, J, Q or K. Row keys: `H5`..`H19`, `A2`..`A9` (soft), `P22`..`P99`, `PTT`,
`PAA`. Up-card keys: `2`..`9`, `T`, `A`. A `cellKey` is row + `v` + up-card,
for example `H16vT`, `A7v9`, `P88vA`.

**Chart file** `data/chart-6d-s17-das-ls.json`:

```json
{
  "version": "1",
  "rules": { "decks": 6, "dealerSoft17": "stand", "peek": true,
             "doubleAnyTwo": true, "das": true, "maxHands": 4,
             "resplitAces": false, "surrender": "late" },
  "sources": [{ "name": "Wizard of Odds strategy generator", "url": "...",
                "retrieved": "YYYY-MM-DD", "settings": "..." }],
  "cells": { "H16": { "2": "S", "3": "S", "...": "...", "T": "Rh", "A": "Rh" } },
  "overrides": [{ "cell": "H16vT", "primary": "Rh", "check": "H",
                  "chosen": "Rh", "reason": "..." }]
}
```

`cells` has all 33 rows, each with all 10 up-cards. Values are stored as the
source writes them: `H`, `S`, `D`, `Dh`, `Ds`, `P`, `Rh`, `Rs`, `Rp`. The check
fixture `tests/fixtures/chart-check-bja.json` has the same `cells` and
`sources` shape and nothing else.

**Sources.** Primary: the Wizard of Odds basic strategy generator set to the
preset. Check: the Blackjack Apprenticeship chart, typed into a separate file.
Any cell that differs fails the test until the author picks a value and writes
the reason in `overrides`. The chart is for 6-deck tables where the dealer
stands on soft 17 and checks for blackjack, as in many US casinos. It is not
correct for no-hole-card tables (dealer takes no second card until players
finish), which are common in Asia; the Step 3 screen says so. The chart stores
strategy decisions, which are results of calculation; each source is credited
by name, URL and retrieval date, and no page layout or text is copied.

**Chart corrections.** Past answers keep the grade they got when stored. A
corrected chart only affects new answers. Accepted: a pass earned while a chart
cell was wrong still counts. `chartVer` on each answer shows which chart graded
it.

**Item keys**: `values:<rank>` (for example `values:K`), `strategy:<cellKey>`
(for example `strategy:H16vT`), `running:stop:<n>` where `n` is the stop card
number, and `running:timed`.

**Dealing a strategy question.** The drill picks a cell, then deals cards that
form that row and nothing else, so the screen shows real cards:

*   Hard rows: two non-ace cards of different values that sum to the total
    (H16 is 10+6 or 9+7, never 8+8, which is the pair row).
*   Soft rows `Ax`: an ace and a card of value `x`.
*   Pair rows: two cards of the same value; `PTT` may mix 10, J, Q and K.
*   A dealer ten is a random one of 10, J, Q, K.

### Thailand day

`dayKey(ts) = date of (ts + 7 hours) in UTC`, formatted `YYYY-MM-DD`. Thailand
has no daylight saving, so a fixed offset is used and the phone's time zone
setting is ignored.

### Pass calculation

One core function serves the home screen, the step screens and the diagnostics
screen:

`computeProgress(attempts, sessions, chart, config, nowTs) -> { [stageId]: StageProgress }`

For each step:

1. Take sessions with `mode = test`.
2. Group by `dayKey` and keep only the first one started each day (earliest
   `startTs`). This is the counted session for that day.
3. A counted session meets the bar only if its status is complete and
   `correct * 100 >= threshold * total`, using the `correct` value stored at
   answer time. Missed items count as wrong. An abandoned or open counted
   session does not meet the bar.
4. Count distinct days whose counted session meets the bar.
5. For `strategy`, also require that every chart cell has at least one correct
   test-mode answer in any test session, counted or not.
6. `passed = days >= config.daysToPass (3)`, plus rule 5 for `strategy`.

`StageProgress = { passed, daysCounted, todayCounted, todayPassed, lastSession,
bestSession, cellsCovered, cellsTotal }`. `todayCounted` is true when today's
counted session exists, pass or fail. `lastSession` and `bestSession` are
`{ pct, ts }` over complete test sessions; ties go to the earlier one.
`cellsCovered` and `cellsTotal` are for `strategy` only.

**Lucky-pass estimate.** Step 2 runs average (10 + 45) / 2 = 27.5 cards, so a
20-item session is about 550 card taps. At a true accuracy of 90%, the chance
of 19 or more correct out of 20 is 0.9^20 + 20 × 0.1 × 0.9^19 ≈ 0.39. Only one
session counts per day, so three passing days by luck is 0.39^3 ≈ 0.06. For
Step 1 (49 of 50 at 90% accuracy) the per-day figure is about 0.034 and the
three-day figure is about 0.00004.

**Pass drop.** Progress always uses the current config and chart. Import only
adds records, so it cannot remove a pass. A config or chart change that raises
any requirement (threshold, item count, days, chart cells) can remove a pass.
After each calculation the app compares the passed set with `meta.lastPassed`,
shows a one-time Thai notice for any step that dropped, then saves the new set.
On first run or right after an import, `lastPassed` is empty, so no notice is
shown.

**Skip-ahead.** All three steps are open from the start, so nothing blocks a
user who already counts. They still need 3 passing days.

### Review selection

`pickReview(attempts, stageId, n) -> itemKey[]` uses test and review answers
only (learn mode is excluded because the reference card is visible), and
ignores voided items. For each item it looks at the last 5 such answers. Items
with at least one miss in that window are eligible. Sort by miss rate in the
window (descending), then by number of answers in the window (descending, so 5
of 5 ranks above 1 of 1), then by most recent miss. Accepted: an item missed
once on its only try ranks at 100%.

Step 2 items never repeat, because every run is a new shuffle. Step 2 review is
therefore a session of 10 new stop-point runs saved with `mode = review`: for
example, after missing two counts in a test, the user taps Review and gets 10
fresh runs that do not affect passing.

### Config

`data/config.json` holds every number above in one place:

```json
{
  "version": "1",
  "itemsPerTest": { "values": 50, "running": 20, "strategy": 50 },
  "reviewItems": { "values": 20, "running": 10, "strategy": 20 },
  "thresholdPct": { "values": 98, "running": 95, "strategy": 96 },
  "daysToPass": 3,
  "stopMin": 10, "stopMax": 45,
  "timedRemovedMin": 1, "timedRemovedMax": 3, "timedTargetSec": 30,
  "abandonAfterMin": 30,
  "dayOffsetHours": 7
}
```

A core function validates it at startup: every value is an integer;
thresholds 50 to 100; item counts 1 to 500; `stopMin < stopMax <= 312`;
`timedRemovedMin <= timedRemovedMax < 52`. On failure the app shows an error
screen instead of running.

### Offline and updates

*   `manifest.webmanifest` sets `start_url` and `scope` to `./`, which the
    browser resolves to `/counting-trainer/`. All URLs in the app are relative,
    never starting with `/`.
*   `sw.js` holds a build ID and a file list, both written by
    `tools/stamp.mjs` at deploy. The list holds `./` relative paths and always
    includes `./` and `./index.html`. On `install` it fetches every listed file
    with `cache: 'reload'` (to bypass the 10-minute GitHub Pages cache) into
    `countingtrainer-<build>`. If any fetch fails, install fails and the app
    shows a caching error on the home and diagnostics screens. On `activate` it
    deletes other `countingtrainer-*` caches. Navigation requests
    (`request.mode === 'navigate'`) are answered with the cached
    `./index.html`; other requests are served cache-first with
    `ignoreSearch: true`.
*   On iPhone, the installed Home Screen app has its own storage and service
    worker, separate from Safari tabs, so it must be opened once from the icon
    while online. The home screen shows "offline ready" once the active service
    worker's cache holds every listed file.
*   The app registers `./sw.js` with `updateViaCache: 'none'` and calls
    `registration.update()` each time it comes back to the foreground. A new
    worker waits; the app shows "update ready" on the home screen only when no
    session is open. Tapping it sends `SKIP_WAITING`, waits for
    `controllerchange`, then reloads.
*   The home and diagnostics screens show build ID, chart version and config
    version.

### Backup

*   **Export**: the export text is prepared when the backup screen opens, so
    the tap on Share calls `navigator.share({ files })` directly (iOS requires a
    direct tap). The file is
    `{ app: "countingtrainer", schema: 1, exportedTs, attempts, sessions }`. If
    `navigator.canShare` refuses, or sharing fails, offer "copy as text". A
    cancelled share does not update `lastExportTs`.
*   **Import**: accept a picked file or pasted text. Check `app` and `schema`
    first; refuse a newer schema with a Thai message. Validate every record;
    reject records with unknown fields or values, and attempts whose
    `sessionId` is in neither the file nor the database. Write all new records
    in one transaction. Records with an existing `id` are skipped; because
    rows never change, a skipped row is identical. Report added, duplicate and
    rejected counts.
*   **Persistence**: after the first complete session, call
    `navigator.storage.persist()` and store the result in `meta`; the
    diagnostics screen shows it.
*   The home screen shows "last backup N days ago" and offers export at the end
    of each test session. In a Safari tab (not installed), the app shows a
    warning that practice there is not kept with the installed app.

### Diagnostics screen

Build ID, chart version, config version, schema version, service worker state,
offline-ready state, `persist()` result, `navigator.storage.persisted()`,
`navigator.storage.estimate()`, counts of attempts and sessions, last export and
import times, and the last 20 errors, with a "copy all" button. Errors come from
`window.onerror` and `unhandledrejection`.

### Repository and deploy

New public repository `counting-trainer`. GitHub Actions on push to `main`: run
`node --test`, run `tools/stamp.mjs`, then publish only the app files
(`index.html`, `manifest.webmanifest`, `sw.js`, `icons/`, `styles/`, `src/`,
`data/`) to GitHub Pages. There is no `.nojekyll`: an Actions artifact deploy
does not run Jekyll. Stamped files are build output and
are not committed. A failing test stops the deploy.

## Alternatives Considered

### Alternative A: Use existing free card-counting trainers

*   **Pros**: No build cost. Drills for card values, running count and basic
    strategy likely exist and are maintained by others (unchecked).
*   **Cons**: Not known whether any of them offers Thai UI, offline Home Screen
    use, a multi-day pass rule and mistake-based review together.
*   **Status**: Not evaluated. The chosen path rests on the author's motive
    (see "Why build instead of reuse"), not on a comparison. Open question O1.

### Alternative B: Native iOS app through the App Store

*   **Pros**: Full offline storage control, local notifications for practice
    reminders, no Safari storage eviction rules.
*   **Cons**: Needs a paid Apple developer account (yearly fee), App Store
    review, and TestFlight or a listing to share with friends. Needs Swift and
    Xcode on a Mac.
*   **Decision**: Rejected by author: a yearly fee and review process to share
    a personal tool with a few friends costs more than a static web page.

### Alternative C: An HTML file opened from the iPhone Files app

*   **Pros**: No hosting at all.
*   **Cons**: Service workers only run on HTTPS (or localhost) pages, not on
    files opened from storage, so the app cannot be cached for offline use or
    installed as a Home Screen web app.
*   **Decision**: Rejected by author: it fails G6 (offline after install) and G7
    (history kept).

### Alternative D: Server-backed sync, friend leaderboard and push reminders

*   **Pros**: History survives phone loss without manual export; friends can
    compare; the app can remind the user to practice.
*   **Cons**: Needs a server, accounts and hosting costs. Web push on iPhone
    needs a server to send messages.
*   **Decision**: Rejected by author: a server adds cost and upkeep and
    conflicts with free static hosting; export covers the phone-change case.

### Alternative E: Switchable counting systems in v1

*   **Pros**: Users of KO or other systems could practice too.
*   **Cons**: KO has no true count, which breaks the planned true-count step.
    Deviation and bet tables differ per system and a beginner cannot check
    them. Progress would need tracking per system.
*   **Decision**: Deferred to a later release: Hi-Lo values live in a data
    table so another system can be added.

### Alternative F: Fully custom table rules with computed basic strategy

*   **Pros**: Matches any casino's rules.
*   **Cons**: Computing strategy needs a probability engine, and a beginner
    cannot spot a wrong result.
*   **Decision**: Deferred to a later release: one preset with two cited
    sources can be checked by hand.

### Alternative G: All eight planned steps in v1

*   **Pros**: Covers the whole path from card values to bet sizing in one
    release.
*   **Cons**: The full table simulator needed for later steps is estimated at
    about half the code and testing. A beginner needs weeks on the first steps
    before later steps matter.
*   **Decision**: Deferred to later releases: v1 has three steps.

### Alternative H: Daily streak

*   **Pros**: A common motivation pattern.
*   **Cons**: Punishes missed days.
*   **Decision**: Rejected by author: the author will not practice every day,
    and a broken streak discourages a return.

### Alternative I: Mixed daily session (80% one step, 20% review)

*   **Pros**: One button a day; review happens without the user asking.
*   **Cons**: With three steps open at once, "current step" has no single
    meaning. Review items reduce the scored count in each session.
*   **Decision**: Rejected by author: the user picks one step per session, and
    review is a separate button.

### Alternative J: Reference card visible during scored items

*   **Pros**: A beginner can always check the rule.
*   **Cons**: Scored items become look-ups, so a pass does not show the rule was
    learned.
*   **Decision**: Rejected by author: replaced by learn mode (card shown, not
    scored) and test mode (card hidden, scored). An "opening the card counts as
    a miss" rule was also considered and not chosen, because two modes are
    easier for a beginner to understand.

### Alternative K: 20-item sessions at 98% for every step

*   **Pros**: Shorter sessions.
*   **Cons**: 98% of 20 allows zero errors.
*   **Decision**: Rejected by author: Steps 1 and 3 use 50 items. Step 2 uses 20
    items at 95% (1 error allowed), because each Step 2 item is a run of 10 to
    45 cards and 50 runs would take about 25 to 40 minutes.

### Alternative L: Timed full-deck run as a way to pass Step 2

*   **Pros**: Matches the common "count down a deck in 30 seconds" benchmark.
*   **Cons**: A full Hi-Lo deck always ends at 0, so typing 0 passes.
*   **Decision**: Rejected by author: the timed run removes 1 to 3 hidden cards
    and records speed only; passing uses the stop-point drill.

### Alternative M: A framework with a build step (Vite with Preact or Svelte, TypeScript)

*   **Pros**: Shorter screen code and type checking; more useful once the table
    simulator adds many screen states.
*   **Cons**: Dependencies to update and a build step that can fail when
    dependencies change; a generated service worker is harder to hold back
    during a session.
*   **Decision**: Rejected by author for v1: plain ES modules with no build
    step. Revisit when the table simulator is added.

### Alternative N: Single HTML file

*   **Pros**: Simplest caching; one file per update.
*   **Cons**: Rules inside the page cannot be imported by Node tests.
*   **Decision**: Rejected by author: the chart and pass rules must have
    automated tests.

### Alternative O: One IndexedDB record per session, written at the end

*   **Pros**: Simpler code; no half-finished sessions in storage.
*   **Cons**: iOS can end a backgrounded web app at any time; every answer in
    the session is lost when that happens.
*   **Decision**: Rejected by author: answers are written one at a time to the
    `attempts` store.

### Alternative P: One JSON value in localStorage

*   **Pros**: Shortest code.
*   **Cons**: Limited to about 5 MB (estimate: roughly 15,000 attempts at 350
    bytes each), the whole value is rewritten on each answer, and one
    interrupted write can corrupt all of it.
*   **Decision**: Rejected by author: IndexedDB chosen.

### Alternative Q: Review ranked by total miss count, or by Leitner boxes

*   **Pros**: Total miss count is simple. Leitner boxes (items move between
    boxes reviewed at longer intervals as they are answered correctly) bring
    back items that are due, which suits irregular practice.
*   **Cons**: Total count keeps early mistakes at the top forever. Leitner
    boxes add due dates, state and tests.
*   **Decision**: Rejected by author for v1: miss rate over the last 5 answers
    per item. Leitner boxes are a Future Improvement.

### Alternative R: Void or re-grade answers after a chart correction

*   **Pros**: A pass cannot rest on a wrong chart cell.
*   **Cons**: Voiding a whole chart version can wipe a Step 3 pass for one
    rarely asked cell. Re-grading makes old results change silently.
*   **Decision**: Rejected by author: answers keep the grade they got when
    stored.

### Alternative S: Passes that never drop

*   **Pros**: A user never loses a pass. Either judge each session by the
    config version in force at the time, or store a `passedAt` date once.
*   **Cons**: The first needs a permanent history of every config version. The
    second stores pass status as truth, which breaks "calculate everything
    from answers", and is not in the export file.
*   **Decision**: Rejected by author: progress uses the current config, with a
    notice when a pass drops.

### Alternative T: Custom domain

*   **Pros**: The address does not depend on the GitHub account or repository
    name, so hosting can move without losing stored data.
*   **Cons**: Yearly fee, DNS setup, and if the domain lapses someone else can
    serve content to installed copies.
*   **Decision**: Rejected by author: the frozen GitHub address plus export and
    import covers a move.

### Alternative U: Auto-deal mode for Step 2

*   **Pros**: Trains counting at a fixed pace closer to a real table.
*   **Cons**: Harder for a beginner; needs a pace setting and timing tests.
*   **Decision**: Deferred to a later release: v1 is self-paced; timed mode
    gives a speed trend.

### Alternative V: Leaving the app voids the item in test mode

*   **Pros**: A phone call does not cost a miss.
*   **Cons**: A user can leave the app to skip any hard item, which inflates
    the score.
*   **Decision**: Rejected by author: in test mode it is a miss; learn and
    review modes still void.

### Alternative W: Count every complete test session of the day, or the first complete one

*   **Pros**: A user who fails, or is interrupted, can try again the same day.
*   **Cons**: Retrying until one session passes makes a lucky pass day likely
    (about 77% per day with three tries at 90% accuracy on Step 2). Counting
    the first *complete* session lets a user abandon a bad session and start
    again.
*   **Decision**: Rejected by author: the first test session *started* each day
    is the counted one; if it is abandoned or fails, the day does not pass.

--------------------------------------------------------------------------------

## Non-Functional Requirements

*   **Privacy**: No data leaves the phone except through a user-started export.
    No analytics, no third-party scripts, no fonts or files from other sites.
    The repository and the link show the author's GitHub account name.
*   **Security**: A Content-Security-Policy meta tag allows only same-origin
    scripts. All stored and imported text is shown with `textContent`, never
    `innerHTML`.
*   **Performance**: Start-up offline, from tapping the icon to a usable home
    screen, is under 2 seconds on the author's iPhone (model and iOS version
    recorded in the manual checklist), measured by hand with 20,000 generated
    attempts loaded. `computeProgress` runs in under 100 ms on 20,000 attempts;
    a unit test checks this with generated data.
*   **Storage**: About 350 bytes per attempt as JSON (two UUIDs alone are 72
    bytes); 20,000 attempts is about 7 MB.
*   **Supported platform**: iOS Safari 15.4 or later (needed for
    `crypto.randomUUID`), installed to the Home Screen. Other browsers are not
    tested.
*   **Rollout and rollback**: Each push to `main` deploys after tests pass. A
    code-only change is rolled back with a revert commit. After a schema version
    increase, rolling back is not possible: an older build that opens a newer
    database shows a Thai message and does not write, so problems are fixed
    forward.

### Additional Resources

*   `concepts_brief.md` (earlier brainstorm notes; not needed to read this
    document).
*   Wizard of Odds basic strategy generator (primary chart; URL and retrieval
    date recorded in the chart file).
*   Blackjack Apprenticeship basic strategy chart (check chart; URL and
    retrieval date recorded in the fixture file).

### Future Improvements

*   Steps for group counting, true count, full-table play, deviations and bet
    sizing.
*   A placement test so an experienced counter can pass a step in one sitting.
*   Leitner-box review once more steps exist.
*   Other counting systems and rule presets, including no-hole-card tables.

--------------------------------------------------------------------------------

## Detailed Implementation Plan

All paths are relative to the root of the new repository `counting-trainer`.
Nothing is added to the author's current work repository.

### Build phases

Each phase ends with an exit check. A phase does not start until the previous
exit check passes.

| Phase | Work | Files (item numbers below) | Exit check |
| --- | --- | --- | --- |
| 0. Before code | Answer O1 (compare 2-3 named trainers; stop if one meets all five needs) and O2 (Blackjack Apprenticeship deck count). Create the public repository, branch `main`, and set Settings > Pages > Source to "GitHub Actions". | 1, 2 (skeleton), 3 | O1 and O2 answers written into Open Questions; repository exists |
| 1. Core basics | Random numbers, cards, Hi-Lo, Thailand day, config | 12, 15-19, tests for each | `npm test` passes |
| 2. Rules | Chart and check fixture (typed by the author, `sources` filled in), chart module, drills and registry, session, progress, review, backup | 13, 14, 20-29, tests for each | `npm test` passes; chart test shows no unresolved difference |
| 3. Storage and screens | IndexedDB, Share Sheet, app entry, all screens, strings, styles, icons | 4, 6, 7, 30-45 | App served locally (`python -m http.server 8000`, open `http://localhost:8000/`) completes CUJ 1-5 in a desktop browser |
| 4. Offline and deploy | Service worker, manifest, stamp, data generator, CI, checklist | 5, 8-11, 46-47 | **Checkpoint A** (see Verification Plan) |

### Target Files to Create/Modify

#### 1. `package.json` (Create)

*   **Type / Scope**: Node project metadata.
*   **Proposed Changes**: `"type": "module"`, `"private": true`, scripts
    `"test": "node --test"` (finds `tests/**/*.test.js`; no other
    `*.test.js` files exist) and `"stamp": "node tools/stamp.mjs --src . --out
    _site"`, `"engines": { "node": ">=22" }`. No dependencies.

#### 2. `README.md` (Create)

*   **Type / Scope**: Documentation.
*   **Proposed Changes**: What the app is; the training-only statement; iPhone
    install steps in Thai and English (including "open once from the icon
    while online"); the frozen URL and the rule never to rename the account or
    repository (export first if a rename is ever forced); how to run tests; how
    to run locally (`python -m http.server 8000`, then
    `http://localhost:8000/`; iPhone tests use the public URL); how to change
    thresholds in `data/config.json`; how to update the chart and record
    `overrides`; a "Chart changes" list announcing chart fixes.

#### 3. `.gitignore` (Create)

*   **Type / Scope**: Git settings.
*   **Proposed Changes**: `_site/`, `node_modules/`, `gen.json`.

#### 4. `index.html` (Create)

*   **Type / Scope**: App shell.
*   **Proposed Changes**: `lang="th"`; viewport meta with
    `viewport-fit=cover`; `<meta http-equiv="Content-Security-Policy"
    content="default-src 'self'">`; `apple-mobile-web-app-capable` `yes`,
    `apple-mobile-web-app-status-bar-style` `default`,
    `apple-mobile-web-app-title` `Counting`; `apple-touch-icon` link to
    `icons/icon-180.png`; manifest link; `styles/app.css`; one
    `<main id="app">`; `<script type="module" src="src/app.js">`. All paths
    relative. No inline scripts or styles.

#### 5. `manifest.webmanifest` (Create)

*   **Type / Scope**: Web app manifest.
*   **Proposed Changes**: `name` "Counting Trainer", `short_name` "Counting",
    `start_url` "./", `scope` "./", `display` "standalone", `theme_color`
    `#0b6e4f`, `background_color` `#ffffff`, icons 192 and 512.

#### 6. `icons/icon.svg`, `icons/icon-180.png`, `icons/icon-192.png`, `icons/icon-512.png` (Create)

*   **Type / Scope**: Images.
*   **Proposed Changes**: `icon.svg` is a hand-written SVG: a white playing card
    with "+1" in `#0b6e4f` on a `#0b6e4f` square. The author exports the three
    PNG sizes once with any image tool and commits them. 180 is the iPhone
    Home Screen icon.

#### 7. `styles/app.css` (Create)

*   **Type / Scope**: Styles.
*   **Proposed Changes**: Mobile-first layout; tap targets at least 44 px;
    card faces drawn with CSS and text (no image per card); safe-area padding;
    light and dark color schemes using `#0b6e4f` as the accent; font stack
    `-apple-system, "Sukhumvit Set", "Thonburi", sans-serif`.

#### 8. `sw.js` (Create)

*   **Type / Scope**: Service worker.
*   **Proposed Changes**: Two placeholder lines replaced by `stamp.mjs` by
    exact string match: `const BUILD = 'dev'; // @stamp` and
    `const FILES = []; // @stamp`. `install`: open `countingtrainer-<BUILD>`,
    fetch every entry of `FILES` with `cache: 'reload'`, store; any failed
    fetch rejects and fails the install. `activate`: delete other
    `countingtrainer-*` caches, `clients.claim()`. `fetch` (same-origin GET
    only): if `request.mode === 'navigate'`, answer with the cached
    `./index.html`; otherwise `caches.match(request, { ignoreSearch: true })`,
    then network. `message`: on `SKIP_WAITING`, call `skipWaiting()`. No
    `skipWaiting()` at install.

#### 9. `tools/stamp.mjs` (Create)

*   **Type / Scope**: Deploy script (Node).
*   **Proposed Changes**: Arguments `--src <dir> --out <dir>`. Copies
    `index.html`, `manifest.webmanifest`, `sw.js`, `icons/`, `styles/`, `src/`,
    `data/` from `src` to `out`. `FILES` = every file in `out` except `sw.js`,
    as `./`-relative paths, plus `./`. Build ID = `<short git hash>-<UTC
    yyyymmddHHMM>`, or `local-<UTC yyyymmddHHMM>` when git is not available.
    Writes `BUILD` and `FILES` into `out/sw.js` and `out/src/build.js`. Exits 1
    if a placeholder line is missing or a file referenced by `index.html` is
    missing. Never changes files in `src`.

#### 10. `src/build.js` (Create)

*   **Type / Scope**: Constant module (stamped copy is build output).
*   **Proposed Changes**: `export const BUILD = 'dev'; // @stamp` and
    `export const FILES = []; // @stamp`. The page uses `FILES` to check
    "offline ready".

#### 11. `.github/workflows/deploy.yml` (Create)

*   **Type / Scope**: CI and deploy.
*   **Proposed Changes**:
    *   Triggers: `push` to `main`, `pull_request`.
    *   `permissions: { contents: read, pages: write, id-token: write }`;
        `concurrency: { group: pages, cancel-in-progress: false }`.
    *   Job `test`: `actions/checkout@v4`, `actions/setup-node@v4` with
        `node-version: 24`, `npm test`.
    *   Job `deploy`: `needs: test`; `if: github.event_name == 'push' &&
        github.ref == 'refs/heads/main'`; `environment: github-pages`;
        checkout (with full history for the git hash), setup-node 24,
        `npm run stamp`, `actions/upload-pages-artifact@v3` with
        `path: _site`, `actions/deploy-pages@v4`.

#### 12. `data/config.json` (Create)

*   **Type / Scope**: Rule data.
*   **Proposed Changes**: Exactly the JSON in Technical Plan, Config.

#### 13. `data/chart-6d-s17-das-ls.json` (Create)

*   **Type / Scope**: Rule data.
*   **Proposed Changes**: The 330 cells typed by the author from the Wizard of
    Odds generator set to the preset, in the shape in Technical Plan, Strategy
    chart. `sources[0]` gets the URL, retrieval date and generator settings at
    typing time.

#### 14. `tests/fixtures/chart-check-bja.json` (Create)

*   **Type / Scope**: Test fixture.
*   **Proposed Changes**: The same 330 cells typed separately by the author from
    the Blackjack Apprenticeship chart, with its own `sources`. Never edited in
    the same commit as the main chart (stated in README). Phase 2 cannot start
    until O2 is answered.

#### 15. `src/core/rng.js` (Create)

*   **Type / Scope**: Core module.
*   **Proposed Changes**: `makeRng(seed: number) -> () => number` using
    mulberry32 (returns numbers in [0, 1)); `randInt(rng, min, max)`
    inclusive. The seed comes from the shell (item 32), so `core` never reads
    `crypto`.

#### 16. `src/core/cards.js` (Create)

*   **Type / Scope**: Core module.
*   **Proposed Changes**: `Card = { rank: '2'..'9' | 'T' | 'J' | 'Q' | 'K' |
    'A', suit: 'S' | 'H' | 'D' | 'C' }`. `deck()`, `shoe(decks)`,
    `shuffle(cards, rng)` (Fisher-Yates, returns a new array),
    `cardValue(rank)` (2-9 face value; T, J, Q, K = 10; A = 11),
    `chartRank(rank)` (J, Q, K map to `T`), `displayRank(rank)` (T shows as
    "10").

#### 17. `src/core/hilo.js` (Create)

*   **Type / Scope**: Core module.
*   **Proposed Changes**: Table `{ '2'..'6': 1, '7'..'9': 0, T, J, Q, K, A: -1 }`;
    `tag(rank) -> -1 | 0 | 1`; `runningCount(cards)`; `formatTag(n)` returns
    `"+1"`, `"0"` or `"-1"`.

#### 18. `src/core/daykey.js` (Create)

*   **Type / Scope**: Core module.
*   **Proposed Changes**: `dayKey(tsUtcMs, offsetHours) -> 'YYYY-MM-DD'`.

#### 19. `src/core/config.js` (Create)

*   **Type / Scope**: Core module.
*   **Proposed Changes**: `validateConfig(obj) -> { ok, errors: string[] }`
    with the rules in Technical Plan, Config. Each error names the field.

#### 20. `src/core/chart.js` (Create)

*   **Type / Scope**: Core module.
*   **Proposed Changes**: `ROWS` (33 row keys in order) and `UPS`
    (`2`..`9`, `T`, `A`); `allCells(chart) -> cellKey[]`;
    `parseCellKey('H16vT') -> { row: 'H16', up: 'T' }`;
    `expectedAction(chart, cellKey) -> 'H'|'S'|'D'|'P'|'R'` (`Dh`, `Ds` to `D`;
    `Rh`, `Rs`, `Rp` to `R`); `validateChart(chart) -> { ok, errors }` (every
    row and up-card present once, known codes only, every `sources` entry has
    `name`, `url`, `retrieved`).

#### 21. `src/core/drills/index.js` (Create)

*   **Type / Scope**: Core module.
*   **Proposed Changes**: Registry `{ 'values.single': ..., 'running.stop':
    ..., 'running.timed': ..., 'strategy.cell': ... }` and
    `drillFor(stageId, mode)`.

#### 22. Drill contract (applies to items 23-26)

*   `ctx = { config, chart, covered: Set<cellKey>, askedThisSession:
    Set<cellKey> }`. The caller builds `covered` from stored test-mode
    correct answers plus correct answers in the current session.
*   `generate(rng, ctx) -> Item`; `itemFromKey(itemKey, rng, ctx) -> Item`
    (review); `grade(item, given) -> { correct, withinTarget? }`.
*   `Item = { itemKey, cards: Card[], dealer?: Card, expected: string }`.
*   Answer encodings: values `"+1" | "0" | "-1"`; running counts as integer
    strings with ASCII minus (`"-3"`, `"0"`, `"7"`); strategy
    `"H" | "S" | "D" | "P" | "R"`. Any other `given` grades as incorrect.

#### 23. `src/core/drills/values.js` (Create)

*   **Type / Scope**: Core drill `values.single`.
*   **Proposed Changes**: Random rank (13 ranks, equal weight), random suit;
    `expected = formatTag(tag(rank))`; `itemFromKey('values:K')` returns that
    rank.

#### 24. `src/core/drills/running-stop.js` (Create)

*   **Type / Scope**: Core drill `running.stop`.
*   **Proposed Changes**: Shuffle a 6-deck shoe; `n = randInt(rng, stopMin,
    stopMax)`; `cards` = first `n`; `expected = String(runningCount(cards))`;
    `itemKey = 'running:stop:' + n`. `itemFromKey` is not supported (review
    uses fresh runs).

#### 25. `src/core/drills/running-timed.js` (Create)

*   **Type / Scope**: Core drill `running.timed`.
*   **Proposed Changes**: One shuffled 52-card deck; remove
    `k = randInt(rng, timedRemovedMin, timedRemovedMax)` cards unseen;
    `expected` = count of the rest; `itemKey = 'running:timed'`. The screen
    starts the clock when the first card shows and stops it on OK.
    `grade` returns `withinTarget = correct && seconds <= timedTargetSec`.

#### 26. `src/core/drills/strategy.js` (Create)

*   **Type / Scope**: Core drill `strategy.cell`.
*   **Proposed Changes**: Cell choice: uncovered cells not yet asked this
    session first; then any cell not asked this session; once all 330 are
    asked, any cell. Dealing follows Technical Plan, "Dealing a strategy
    question". `expected = expectedAction(chart, cellKey)`.
    `itemFromKey('strategy:P88vA')` deals that cell.

#### 27. `src/core/session.js` (Create)

*   **Type / Scope**: Core module.
*   **Proposed Changes**: `newSession(stageId, mode, length, nowTs) -> { id,
    stageId, mode, startTs, length }` (the shell passes the id).
    `sessionStatus(session, attemptsOfSession, nowTs, config) -> { status,
    itemsDone, lastTs, dayKey }` per Technical Plan, Session lifecycle
    (answered and missed count toward `length`, voided do not; `lastTs` is the
    latest attempt or `startTs`). `countedSessions(sessions) -> Map<stageId,
    Map<dayKey, session>>` (first test session started each day).

#### 28. `src/core/progress.js` (Create)

*   **Type / Scope**: Core module.
*   **Proposed Changes**: `computeProgress(attempts, sessions, chart, config,
    nowTs) -> { [stageId]: StageProgress }` per Technical Plan, Pass
    calculation. `droppedPasses(prev: string[] | undefined, next: string[])`
    returns `[]` when `prev` is undefined.

#### 29. `src/core/review.js` (Create)

*   **Type / Scope**: Core module.
*   **Proposed Changes**: `pickReview(attempts, stageId, n) -> itemKey[]` per
    Technical Plan, Review selection. Returns `[]` for `running`; the caller
    then starts `reviewItems.running` fresh runs.

#### 30. `src/core/backup.js` (Create)

*   **Type / Scope**: Core module.
*   **Proposed Changes**: `buildExport(attempts, sessions, nowTs) -> string`;
    `exportFileName(nowTs)` = `counting-trainer-YYYYMMDD.json` (Thailand
    date); `parseImport(text) -> { ok, error, data }`;
    `planMerge(existingAttemptIds, existingSessionIds, data) -> { toAdd: {
    attempts, sessions }, duplicates: number, rejected: [{ id, reason }] }`.
    Validation rules:

    | Field | Rule |
    | --- | --- |
    | file | at most 20 MB; `app === "countingtrainer"`; `schema === 1` (newer refused with a Thai message) |
    | `id`, `sessionId` | UUID format |
    | `v` | 1 |
    | `stageId` | `values`, `running`, `strategy` |
    | `drillId` | one of the four drill IDs and matching `stageId` |
    | `mode` | `learn`, `test`, `review`, `speed` (`speed` only with `running.timed`) |
    | `outcome` | `answered`, `missed`, `voided`; `missed` and `voided` require `correct = false` and empty `given` |
    | `ts`, `startTs` | between 2026-01-01 and now + 1 day |
    | `ms` | 0 to 3,600,000 |
    | `length` | null, or integer 1-500 |
    | strings | at most 200 characters |
    | unknown fields | rejected |

    A rejected session rejects its attempts. An attempt whose `sessionId` is
    in neither the file's accepted sessions nor the database is rejected.

#### 31. `src/store/db.js` (Create)

*   **Type / Scope**: Storage adapter.
*   **Proposed Changes**: `openDb()`: database `countingtrainer` version 1;
    `onupgradeneeded` from version 0 creates `attempts` (key `id`, indexes
    `sessionId`, `stageMode` on `['stageId','mode']`, `itemTs` on
    `['itemKey','ts']`), `sessions` (key `id`) and `meta` (key path `key`).
    A `VersionError` from `indexedDB.open` makes `app.js` show the full-screen
    message "มีข้อมูลจากเวอร์ชันใหม่กว่า กรุณาอัปเดตแอป" and nothing is written.
    Functions: `addSession`, `addAttempt` (uses `add`, so a second write with
    the same id fails and is ignored), `getAll()`, `addMany(attempts,
    sessions)` (one transaction), `getMeta(key)`, `setMeta(key, value)`,
    `logError(err)` (keeps the last 20), `requestPersist()` (calls
    `navigator.storage.persist()` only if it exists; stores `granted`,
    `denied` or `unsupported`). No function updates an `attempts` or
    `sessions` row.

#### 32. `src/store/share.js` (Create)

*   **Type / Scope**: Platform adapter.
*   **Proposed Changes**: `shareFile(name, text)` builds a `File` with type
    `application/json`, checks `navigator.canShare({ files })`, calls
    `navigator.share`; returns `shared`, `cancelled` (on `AbortError`) or
    `unsupported`. `copyText(text)` uses `navigator.clipboard.writeText`,
    falling back to `document.execCommand('copy')` on a hidden textarea.
    `pickFile()` resolves with the file text on `change`; the backup screen
    shows a Cancel button so the user is never stuck waiting.

#### 33. `src/app.js` (Create)

*   **Type / Scope**: App entry.
*   **Proposed Changes**:
    *   Creates the random seed with `crypto.getRandomValues` and passes it to
        `makeRng`.
    *   Installs `window.onerror` and `unhandledrejection` handlers that call
        `logError`.
    *   Opens the database, writes `meta.installTs` on first launch, loads and
        validates config and chart (error screen on failure).
    *   Registers `./sw.js` with `updateViaCache: 'none'`; tracks offline
        ready (active worker and every entry of `FILES` in its cache).
    *   On launch and on `visibilitychange` to visible: recovers any
        `meta.pendingItem` (item 39) and calls `registration.update()`.
    *   Hash router: `#/home`, `#/lesson/<step>`, `#/drill/<step>/<mode>`
        (`learn`, `test`, `review`), `#/timed`, `#/resume/<sessionId>`,
        `#/backup`, `#/diag`; anything else goes to `#/home`.
    *   Logs `performance.now()` when the home screen first shows step cards
        (shown on the diagnostics screen).

#### 34. `src/ui/dom.js` (Create)

*   **Type / Scope**: UI helper.
*   **Proposed Changes**: `h(tag, attrs, ...children)` and `render(root,
    node)`. Text is set with `textContent`; event handlers with
    `addEventListener`; styles with `element.style` (the CSP blocks inline
    handlers and style attributes).

#### 35. `src/ui/home.js` (Create)

*   **Type / Scope**: Screen.
*   **Proposed Changes**:
    *   Three step cards with Thai names (item 44), each showing "N of 3
        days", today's counted state (not yet / passed / not passed), last
        session result, and buttons for lesson, learn, test, review, and for
        Step 2 timed.
    *   Offers to resume an open session (`#/resume/<id>`).
    *   Shows the "offline ready" mark or the caching error, "last backup N
        days ago", the update banner (only when no session is open), the
        pass-drop notice (calls `droppedPasses`, then saves
        `meta.lastPassed`), the training-only line, build and chart versions.
    *   Mounts `install.js`.
    *   With no attempts stored, shows "Restore from file" next to "Start".

#### 36. `src/ui/install.js` (Create)

*   **Type / Scope**: Screen part, mounted by `home.js`.
*   **Proposed Changes**: Standalone check: `navigator.standalone === true ||
    matchMedia('(display-mode: standalone)').matches`. When not standalone:
    the Thai "Share, then Add to Home Screen" guide, a warning that practice in
    a Safari tab is not kept with the installed app, and the instruction to
    open the installed app once while online.

#### 37. `src/ui/lesson.js` (Create)

*   **Type / Scope**: Screen.
*   **Proposed Changes**: Renders the step's lesson from
    `src/i18n/lessons.th.js`, then a button to learn mode. The Step 3 lesson
    shows the preset rules with one-line Thai explanations and the
    no-hole-card warning.

#### 38. `src/ui/keypad.js` (Create)

*   **Type / Scope**: Screen part.
*   **Proposed Changes**: On-screen keys 0-9, ±, backspace and OK. No system
    keyboard. OK is disabled while empty. Leading zeros are dropped. Returns
    the value as an integer string with ASCII minus.

#### 39. `src/ui/drill.js` (Create)

*   **Type / Scope**: Screen.
*   **Proposed Changes**:
    *   One runner for every drill in learn, test and review modes. Creates the
        session row at Start with its `length`.
    *   Before showing each test question or Step 2 run, writes
        `meta.pendingItem = { attemptId, sessionId, itemKey, expected,
        shownTs }`; answering writes the attempt with that `attemptId` and
        clears it. Recovery (called by `app.js`) writes a leftover pending item
        as `missed` in test mode or `voided` otherwise, clears it, and shows
        "ข้อนี้นับว่าผิดเพราะออกจากแอป" before the next item.
    *   Shows the reference card only in learn mode. Step 2 learn mode shows
        each card's tag and the running total as cards appear. Learn mode
        picks items at random.
    *   After each answer: right or wrong, the expected answer, Next button.
    *   Test and review sessions end at their `length`; learn sessions end on
        Finish.
    *   Calls `requestPersist()` after the first complete session.
    *   At the end: result, whether it met the bar, whether it was today's
        counted session, and an export button that opens `#/backup`.

#### 40. `src/ui/timed.js` (Create)

*   **Type / Scope**: Screen.
*   **Proposed Changes**: Timed run as its own `mode = speed` session: tap to
    show each card, keypad at the end, then elapsed time, right or wrong, the
    30-second target and the last 10 speed results. Leaving the app discards
    the run as `voided`.

#### 41. `src/ui/backup.js` (Create)

*   **Type / Scope**: Screen.
*   **Proposed Changes**: Builds the export text when the screen opens, so the
    Share tap calls `shareFile` directly. Copy-as-text fallback. Import by file
    (with Cancel) or paste box; shows the counts from `planMerge` before
    writing and the result after.

#### 42. `src/ui/diag.js` (Create)

*   **Type / Scope**: Screen.
*   **Proposed Changes**: Fields in Technical Plan, Diagnostics screen, plus
    the start-up time from item 33. `persisted()` and `estimate()` are shown
    as "not supported" when absent. "Copy all" button.

#### 43. `src/ui/reference.js` (Create)

*   **Type / Scope**: Screen part.
*   **Proposed Changes**: Renders the Hi-Lo table and the strategy chart from
    the same data files the grader uses.

#### 44. `src/i18n/th.js` (Create)

*   **Type / Scope**: Strings.
*   **Proposed Changes**: One object of Thai UI strings keyed by ID.
    `t(key, params)` replaces `{name}` with `params.name`; a missing key
    returns the key and logs an error. Fixed terms:

    | Key | Thai |
    | --- | --- |
    | `step.values` | ขั้น 1 ค่าไพ่ |
    | `step.running` | ขั้น 2 นับไพ่ต่อเนื่อง |
    | `step.strategy` | ขั้น 3 กลยุทธ์พื้นฐาน |
    | `action.H` | จั่ว |
    | `action.S` | หยุด |
    | `action.D` | ดับเบิล |
    | `action.P` | แยก |
    | `action.R` | ยอมแพ้ |

    Other strings (error texts, notices, buttons) are written in Phase 3 and
    read by the author before Checkpoint A.

#### 45. `src/i18n/lessons.th.js` (Create)

*   **Type / Scope**: Content.
*   **Proposed Changes**: Three Thai lessons of at most 250 words each: what
    Hi-Lo values are and why; how to keep a running count and that it is only
    a first step; how to read the strategy chart and what each action means.
    Drafted by the implementer, then read and corrected by the author before
    Checkpoint A.

#### 46. `tools/gen-attempts.mjs` (Create)

*   **Type / Scope**: Test data tool.
*   **Proposed Changes**: `node tools/gen-attempts.mjs --count 20000 --seed 1
    --out gen.json` writes a valid export file (sessions and attempts across
    all steps and modes) for the iPhone start-up check. Uses the same
    generator as `tests/helpers/gen.js`.

#### 47. `docs/manual-iphone-checklist.md` (Create)

*   **Type / Scope**: Manual test list.
*   **Proposed Changes**: Record the iPhone model and iOS version. Install from
    Safari; open from the icon online and see "offline ready"; cold start in
    airplane mode from the icon and from a bookmarked URL; import `gen.json`
    and check the start-up time on the diagnostics screen is under 2 seconds;
    finish a test session offline; leave the app mid-question in test mode
    (item missed) and in learn mode (item voided); force-close the app during a
    test question and reopen (item missed); export through Share Sheet and
    through copy; delete and reinstall; import; deploy a new build and see the
    update banner only between sessions.

#### 48. Tests (Create), all under `tests/`

*   `helpers/gen.js`: seeded generator of sessions and attempts.
*   `rng.test.js`: same seed gives the same sequence; values in [0, 1);
    `randInt` bounds inclusive.
*   `cards.test.js`: deck has 52 unique cards; shoe has 312; shuffle with a
    fixed seed is stable; `chartRank` and `displayRank`.
*   `hilo.test.js`: every rank's tag; a full deck counts to 0.
*   `daykey.test.js`: 23:59 and 00:01 Bangkok time map to different days; UTC
    midnight maps to 07:00 the same Bangkok day.
*   `config.test.js`: shipped config passes; each broken rule fails with the
    field named.
*   `chart.test.js`: shipped chart passes `validateChart`; negative cases
    (missing cell, duplicate, unknown code, empty source) fail; every cell
    matches the fixture or is in `overrides` with a reason; an override that
    matches the fixture (stale) fails the test; `Dh`/`Ds` grade as `D` and
    `Rh`/`Rs`/`Rp` as `R`.
*   `drill-values.test.js`, `drill-running.test.js`, `drill-strategy.test.js`:
    stop point inside the range; expected count matches a recount; timed deck
    never has all 52 cards; `withinTarget` needs a correct count; malformed
    input grades as incorrect; every hard row is dealt without pairs or aces,
    soft rows as ace plus card, pair rows as two equal values; uncovered cells
    come first; no repeat within a session until all cells are asked;
    `itemFromKey` round-trips.
*   `session.test.js`: complete exactly at `length`; missed items count
    toward it, voided do not; abandoned after 30 idle minutes, including a
    session with no attempts; resumable within 30 minutes; `dayKey` from
    `startTs`; a session started at 23:58 Bangkok time belongs to that day.
*   `progress.test.js`: 49 of 50 passes Step 1, 48 of 50 fails; 19 of 20 passes
    Step 2, 18 of 20 fails; 48 of 50 passes Step 3, 47 of 50 fails; missed
    items count as wrong; the first started test session is the counted one (a
    failed or abandoned first session followed by a passing second one gives
    no day); 2 days do not pass; 3 non-consecutive days pass; learn, review
    and speed sessions ignored; Step 3 not passed until all cells covered,
    with coverage from uncounted sessions included; `todayCounted`; raising a
    threshold drops a pass and `droppedPasses` reports it; `droppedPasses`
    with `undefined` returns `[]`; best of 5 runs under 100 ms on 20,000
    generated attempts.
*   `review.test.js`: ranking order on hand-built histories, including the
    1-of-1 versus 5-of-5 tie rule; learn-mode answers ignored;
    `pickReview` for `running` returns `[]`.
*   `backup.test.js`: export then import into empty data gives the same
    progress; second import adds 0; importing an export taken mid-session and
    then a later export of the same session gives the same progress as the
    source; each validation rule rejects its bad record only; a rejected
    session rejects its attempts; an attempt with an unknown `sessionId` is
    rejected; `exportFileName` uses the Thailand date.
*   `pending.test.js`: a leftover pending test item becomes `missed`, a learn
    or review one `voided`; recovery twice writes one attempt.
*   `i18n.test.js`: every `t('key')` in `src/` (regex
    `t\('([a-z0-9_.]+)'`) exists in `th.js`; the code never builds keys at run
    time.
*   `stamp.test.js`: runs `stamp.mjs` on a temporary copy without git; build
    ID starts with `local-`; `FILES` includes `./` and `./index.html`, every
    entry exists, none starts with `/`; source files are unchanged.

### Verification Plan

*   **Compilation/Build**: No compile or bundle step. `npm run stamp` writes
    `_site/` and must exit 0; it fails if a placeholder or a file referenced by
    `index.html` is missing.
*   **Unit Tests**: `npm test` (`node --test`, Node 24 in CI), run before
    every deploy.
*   **Static Analysis & Linting**: None in v1, to keep zero dependencies. JSDoc
    types are documentation only.
*   **Test Coverage Requirement**: Every module in `src/core/` has at least one
    test file; no numeric coverage target. Service worker install, cache and
    update behaviour is checked by hand (item 47).
*   **E2E/Integration**: `docs/manual-iphone-checklist.md` on the author's
    iPhone.

### Checkpoint A

The point before the link is shared with anyone. All of these hold:

1.  All unit tests pass in CI.
2.  Every step of `docs/manual-iphone-checklist.md` passes.
3.  The author has read and corrected `lessons.th.js` and `th.js`.
4.  O1 and O2 in Open Questions are answered (done in Phase 0).

*Drafted with EGM*
