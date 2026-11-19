# Goldfish Annotated Review Report

**Status: resolved** (all PROPOSE FIX items applied on author approval, 2026-11-19; E1 still open)

**Target:** `docs/designs/counting_trainer.md` (DetailedRange 751-1160, plus the Technical Plan lines each fix must keep consistent). Stage 9, round 1.
Source findings: `implementation_readiness_report.md` (3 Blocker, 18 Major, 16 Nit) and three open items from `intermediate_zoom_out_report.md` (Stage 8).
The Stage 7 resolution report is kept as `goldfish_review_report_stage7.md`.

Summary of suggestions: 0 CONTEST, 1 ESCALATE, 24 PROPOSE FIX (3 Blocker, 18 Major, 3 Stage 8 items), 4 Nits PROPOSE FIX, 12 Nits DECLINE.

Fixes marked **[behaviour change]** change what the app does, not only how the document describes it.

## ESCALATE (needs your knowledge)

### [E1] [`egm-implementation-readiness`] M1 part - chart URLs and generator settings
*   **Affected Scope:** lines 852-864
*   **Discrepancy Description:** No URLs or exact generator settings for the two chart sources.
*   ***AI Suggestion:*** ESCALATE
*   ***Justification:*** I cannot see these pages from here, so I cannot write the exact URLs or confirm what the Blackjack Apprenticeship chart covers. The fix below makes them a recorded step in Phase 2 (you fill `sources` when you type the chart). The finding stays open until then.

## Blockers

### [Issue 1] [`ir`, `cd`] B1 - Severity: Blocker - no phases or checkpoints
*   **Affected Scope:** lines 756-1158
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. Also fixes the Stage 8 finding that the build-vs-reuse check (O1) sits after the whole build.
*   ***Proposed Edit:*** Add "### Build phases" at the top of the Implementation Plan. Each phase lists its files and an exit check:
    *   **Phase 0, before any code**: answer O1 (compare 2-3 trainers; stop if one meets all five needs) and O2 (Blackjack Apprenticeship deck count). Create the repository, `.gitignore`, `package.json`, `README.md` skeleton, enable Pages with source "GitHub Actions". Exit: O1 and O2 written into the design; empty repo deploys nothing yet.
    *   **Phase 1, core basics**: `rng`, `cards`, `hilo`, `daykey`, `config`, `data/config.json`, their tests. Exit: `npm test` passes.
    *   **Phase 2, rules**: chart file and fixture (author types both, fills `sources`), `chart`, drills, drill registry, `session`, `progress`, `review`, `backup`, their tests. Exit: `npm test` passes, chart test has no unresolved differences.
    *   **Phase 3, storage and UI**: `db`, `share`, `app.js`, `ui/*`, `i18n/*`, `index.html`, `styles/`, `icons/`. Exit: app runs locally (`python -m http.server` on localhost) through every CUJ in a desktop browser.
    *   **Phase 4, offline and deploy**: `sw.js`, `manifest`, `tools/stamp.mjs`, `tools/gen-attempts.mjs`, `deploy.yml`, manual checklist. Exit: Checkpoint A.

### [Issue 2] [`ir`, `cd`] B2 - Severity: Blocker - offline start misses the cache
*   **Affected Scope:** lines 811-830; Technical Plan 450-458
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. `./` resolves to `/counting-trainer/`, which is not a cached key.
*   ***Proposed Edit:*** `FILES` always includes `./` as well as `./index.html`; all paths are relative to `sw.js`. The `fetch` handler serves navigation requests (`request.mode === 'navigate'`) from the cached `./index.html`, and matches other requests with `ignoreSearch: true`. Checklist adds "cold start in airplane mode from the Home Screen icon and from the bookmarked URL".

### [Issue 3] [`ir`, `cd`] B3 - Severity: Blocker - chart data schema undefined
*   **Affected Scope:** lines 852-864, 899-905, 1117-1119; Technical Plan 362-374
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. Every rule module depends on it.
*   ***Proposed Edit:*** Add a literal schema:
    *   Row keys: `H5`..`H19`, `A2`..`A9` (soft), `P22`..`P99`, `PTT`, `PAA`. Up-card keys: `2`..`9`, `T`, `A`. Ten-value cards are `T` everywhere in data; the screen shows 10, J, Q or K.
    *   `cellKey` = row + `v` + up-card, for example `H16vT`, `A7v9`, `P88vA`. `itemKey` = `strategy:` + `cellKey`. This replaces `H16v10` in the Technical Plan.
    *   Chart file: `{ "version": "1", "rules": {...preset...}, "sources": [{ "name", "url", "retrieved", "settings" }], "cells": { "H16": { "2": "S", ..., "T": "Rh", "A": "Rh" }, ... }, "overrides": [{ "cell": "H16vT", "primary": "Rh", "check": "H", "chosen": "Rh", "reason": "..." }] }`.
    *   Fixture `tests/fixtures/chart-check-bja.json`: same shape, `cells` and `sources` only.
    *   Codes are stored as written in the source (`Dh`, `Ds`, `Rh`, `Rs`, `Rp`); `expectedAction(chart, cellKey)` collapses them to `D` and `R`.

## Majors

### [Issue 4] M1 (rest) - chart retrieval as a phase prerequisite
*   ***AI Suggestion:*** PROPOSE FIX (the URL part is E1)
*   ***Proposed Edit:*** Phase 2 cannot start until O2 is answered. The author types both charts and records `url`, `retrieved` and `settings` in each `sources` entry.

### [Issue 5] M2 - drill contract incomplete
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Proposed Edit:*** Define:
    *   `Card = { rank: '2'..'9'|'T'|'J'|'Q'|'K'|'A', suit: 'S'|'H'|'D'|'C' }`.
    *   `ctx = { config, chart, covered: Set<cellKey> }`; `generate(rng, ctx) -> Item`; `itemFromKey(itemKey, rng, ctx) -> Item` (used by review).
    *   `Item = { itemKey, cards: Card[], dealer?: Card, expected: string }`.
    *   Encodings: values `"+1" | "0" | "-1"`; running counts as integer strings with ASCII minus (`"-3"`); strategy `"H" | "S" | "D" | "P" | "R"`.
    *   `grade(item, given) -> { correct, withinTarget? }`; anything not matching the encoding is incorrect (the keypad cannot produce it).
    *   Timed `itemKey` = `running:timed`. Clock starts when the first card shows and stops on OK. `withinTarget = correct && seconds <= timedTargetSec`. "Last 10 times" = the last 10 `mode = speed` attempts.
    *   New file `src/core/drills/index.js`: registry from `drillId` to module.
    *   `covered` is built by the caller from stored test attempts plus answers in the current session.

### [Issue 6] M3 - strategy dealing **[behaviour change]**
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Proposed Edit:*** Hard rows: two non-ace cards of different value whose sum is the total (so H16 is never 8+8). Soft rows `Ax`: an ace and an `x`. Pairs: two cards of the same value; `PTT` may mix T, J, Q, K. A dealer ten is a random one of T, J, Q, K. `cardValue('A')` is 11 for dealing totals. Within one session no cell repeats until every cell has been asked. Add a test for every row's dealing rule.

### [Issue 7] M4 + Stage 8 - session length and the abandon loophole **[behaviour change]**
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. Stage 8 showed a user can let a bad test session go abandoned and start again, which defeats "first complete session counts".
*   ***Proposed Edit:*** Add `length` to the `sessions` row, written at Start (test: step item count; review: number of items picked, 1 to 20, Step 2 always 10 runs; learn and speed: `null`). Complete = items done (answered or missed) reaches `length`. `dayKey` = Thailand date of `startTs`. **Counted session rule changes to: the first test session of each step *started* on a Thailand day counts. If it is abandoned or fails the bar, that day does not pass.** A session with no attempts has `lastTs = startTs`. Voided answers update `lastTs`. Step 2 review is always allowed.

### [Issue 8] M5 + Stage 8 - config and StageProgress shapes; coverage rule
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Proposed Edit:*** Write `data/config.json` in full:
    `{ "version": "1", "itemsPerTest": { "values": 50, "running": 20, "strategy": 50 }, "reviewItems": { "values": 20, "running": 10, "strategy": 20 }, "thresholdPct": { "values": 98, "running": 95, "strategy": 96 }, "daysToPass": 3, "stopMin": 10, "stopMax": 45, "timedRemovedMin": 1, "timedRemovedMax": 3, "timedTargetSec": 30, "abandonAfterMin": 30, "dayOffsetHours": 7 }`.
    Validation: integers; thresholds 50-100; item counts 1-500; `stopMin < stopMax <= 312`; `timedRemovedMin <= timedRemovedMax < 52`. `StageProgress = { passed, daysCounted, todayCounted (today's counted session exists, pass or fail), todayPassed, lastSession {pct, ts}, bestSession {pct, ts} (complete test sessions only; ties go to the earlier), cellsCovered, cellsTotal }`. Coverage counts any correct test-mode answer, including from sessions that were not counted.

### [Issue 9] M6 - service worker, stamp and update flow
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Proposed Edit:*** `sw.js` and `src/build.js` hold placeholder lines `const BUILD = 'dev'; // @stamp` and `const FILES = []; // @stamp`, replaced by exact string match. `FILES` = every file in `_site/` except `sw.js`, as `./` relative paths, plus `./`. `src/build.js` exports both `BUILD` and `FILES` so the page can check "offline ready". `stamp.mjs --src . --out _site`; build ID is `<short git hash>-<UTC yyyymmddHHMM>`, or `local-<UTC>` without git. **Drop `.nojekyll`**: artifact deploys do not run Jekyll, and a hidden file dropped from the artifact would fail the install. Registration: `register('./sw.js', { updateViaCache: 'none' })`. On return to the foreground: `registration.update()`. Update banner tap: post `SKIP_WAITING`, wait for `controllerchange`, then reload.

### [Issue 10] M7 - deploy.yml
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Proposed Edit:*** Spell out: triggers `push` to `main` and `pull_request`; `permissions: contents: read, pages: write, id-token: write`; `concurrency: pages`; job `test` (checkout@v4, setup-node@v4 with Node 24, `npm test`); job `deploy` only on push to `main`, `needs: test`, `environment: github-pages`, runs stamp, `upload-pages-artifact@v3` with `path: _site`, `deploy-pages@v4`. Manual one-time setup: public repo, Settings > Pages > Source "GitHub Actions". Add `.gitignore` (`_site/`, `node_modules/`). `engines.node` becomes `>=22`.

### [Issue 11] M8 - backup validation
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Proposed Edit:*** Add a validation table: `id` UUID format; `v` = 1; `stageId`, `drillId`, `mode`, `outcome` from fixed lists and `drillId` matches `stageId`; `outcome = missed` implies `correct = false` and empty `given`; `ts` between 2026-01-01 and now + 1 day; `ms` 0-3,600,000; strings at most 200 characters; file at most 20 MB. A rejected session rejects its attempts. Return shapes: `toAdd = { attempts, sessions }`, `rejected = [{ id, reason }]`. Export file name `counting-trainer-YYYYMMDD.json`, type `application/json`. Import leaves `meta.lastPassed` unchanged; `droppedPasses` treats a missing value as "never saved" and shows nothing.

### [Issue 12] M9 - db.js details
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Proposed Edit:*** `meta` key path `key`; index key paths `['stageId','mode']` and `['itemKey','ts']`; `onupgradeneeded` from 0 creates all three stores and indexes. `indexedDB.open` `VersionError` shows the Thai message "มีข้อมูลจากเวอร์ชันใหม่กว่า กรุณาอัปเดตแอป" on a full-screen error and nothing is written. `app.js` writes `meta.installTs` on first launch.

### [Issue 13] M10 + Stage 8 - "missed" row can be lost on iOS **[behaviour change]**
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. Writing in the hide handler is best-effort on iOS.
*   ***Proposed Edit:*** Before a test question or Step 2 run is shown, write `meta.pendingItem = { attemptId, sessionId, itemKey, expected, shownTs }`. Answering writes the attempt with that `attemptId` and clears it. On launch, or on return to the foreground, a leftover `pendingItem` is written as `outcome = missed` (test) or `voided` (learn, review) and cleared. The attempt store rejects a second write with the same id, so there is no double write. The screen says "ข้อนี้นับว่าผิดเพราะออกจากแอป" and moves to the next item. An interrupted speed run is discarded (`voided`).

### [Issue 14] M11 - UI behaviour **[behaviour change: per-item feedback]**
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Proposed Edit:*** After each answer, all modes show right or wrong and the expected answer, then a Next button. Learn mode picks items at random; Step 2 learn mode shows each card's tag and the running total as cards appear. Routes: `#/home`, `#/lesson/<step>`, `#/drill/<step>/<mode>` (mode `learn | test | review`), `#/timed`, `#/resume/<sessionId>`, `#/backup`, `#/diag`; anything else goes to `#/home`. Standalone check: `navigator.standalone === true || matchMedia('(display-mode: standalone)').matches`. `home.js` mounts `install.js` and owns the pass-drop notice. `h()` attaches handlers with `addEventListener` and sets styles through `element.style` (the CSP blocks inline handlers and inline style attributes).

### [Issue 15] M12 - number pad **[behaviour change]**
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Proposed Edit:*** New file `src/ui/keypad.js`: on-screen keys 0-9, a ± key, backspace and OK. No system keyboard. OK is disabled when empty. Leading zeros are dropped; the value is stored with ASCII minus.

### [Issue 16] M13 - performance tooling
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Proposed Edit:*** New `tools/gen-attempts.mjs --count 20000 --seed 1 --out gen.json` writes an import file. New `tests/helpers/gen.js` builds the same data in memory. The unit test takes the best of 5 runs and asserts under 100 ms. Manual timing: the app logs `performance.now()` when the home screen first shows step cards; the diagnostics screen shows it.

### [Issue 17] M14 - Thai text and assets
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Proposed Edit:*** Fix the core Thai terms in the doc: Step names "ขั้น 1 ค่าไพ่", "ขั้น 2 นับไพ่ต่อเนื่อง", "ขั้น 3 กลยุทธ์พื้นฐาน"; actions Hit "จั่ว", Stand "หยุด", Double "ดับเบิล", Split "แยก", Surrender "ยอมแพ้". `t(key, params)` replaces `{name}`; a missing key returns the key and logs an error; the test checks keys statically. The author reviews `th.js` as well as the lessons before Checkpoint A. The no-hole-card warning appears in the Step 3 lesson and on the Step 3 screen. Icon: `icons/icon.svg` drawn by hand; the author exports the three PNGs once with any tool and commits them. Colors: theme `#0b6e4f`, background `#ffffff`. Font stack: `-apple-system, "Sukhumvit Set", "Thonburi", sans-serif`. Tags: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style` `default`, `apple-mobile-web-app-title` "Counting".

### [Issue 18] M15 - test gaps
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Proposed Edit:*** Add `rng.test.js`. Split drill tests into `drill-values`, `drill-running`, `drill-strategy`. Add the listed cases: 18/20 fails Step 2, 47/50 fails Step 3, 2 days not a pass, 3 non-consecutive days pass, Bangkok midnight grouping, session started before midnight counts for its start day, `todayCounted`, coverage from uncounted sessions, first started session abandoned means no day, negative `validateChart` cases, `Dh/Ds/Rh/Rs/Rp` collapse, malformed input, `pickReview('running')` returns `[]`, every dealing rule, pending-item recovery. A stale override (matches the fixture) fails the test. `i18n.test.js` scans `src/` for `t('key')` with the regex `t\('([a-z0-9_.]+)'` and the code never builds keys at run time.

### [Issue 19] M16 - test script
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Proposed Edit:*** `"test": "node --test"` (it finds `tests/**/*.test.js`). `engines.node >=22`.

### [Issue 20] M17 - build claim
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Proposed Edit:*** "No compile or bundle step. `npm run stamp` writes `_site/` and must exit 0; it fails if a file referenced by `index.html` is missing."

### [Issue 21] M18 - platform guards
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Proposed Edit:*** Feature-detect `navigator.storage?.persist` and `estimate`; show "not supported" when absent. `share.js`: file name and type from Issue 11; `AbortError` maps to `cancelled`; `copyText` falls back to `document.execCommand('copy')`; `pickFile` resolves on `change`, and the screen keeps a Cancel button so it never waits forever.

### [Issue 22] Stage 8 - "five needs" miscount
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Proposed Edit:*** The "Why build" sentence lists only four needs. Change it to "the five needs listed above" and keep the list in one place.

## Nits

*   **ir-1-18** PROPOSE FIX: README gets "run locally with `python -m http.server 8000` and open `http://localhost:8000/`; iPhone tests use the public URL".
*   **cd-1-21** PROPOSE FIX: the end-of-session export button opens `#/backup` (covered by Issue 14 routes).
*   **cd-1-22** PROPOSE FIX: use mulberry32; `randomSeed()` moves out of `core` into `app.js`.
*   **st-1-12** PROPOSE FIX: Checkpoint A text links to "Open Questions" for O1.
*   DECLINE: `ir-1-19`, `st-1-11` (line wrapping), `ir-1-20` (fixed by Issue 14), `ir-1-21` (fixed by Phase 0), `st-1-4` (`.nojekyll` dropped), `st-1-5`, `st-1-6` (wording), `st-1-7` (fixed by Phase 4 exit), `st-1-9` (Terms section already defines these), `st-1-10`, `st-1-13` (tests restate config values on purpose so a config change is visible), `st-1-14` (footer is the EGM convention).
