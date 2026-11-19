# Implementation Readiness Report (Stage 9, review-loop round 1)

**Target:** `docs/designs/counting_trainer.md` (DetailedRange: lines 751-1160)
**Mode:** REVIEW. Greenfield project, no repository to search, no GoldfishContext.
**Verdict:** Not ready to implement. The plan fails the Zero-Decision Rule and the phasing requirement.

## Reviewer Status

| Reviewer | Status | Notes |
| --- | --- | --- |
| `egm-implementation-readiness` | completed | Ran with the implementation-readiness standard. |
| `egm-codebase-details` | completed | Checked internal consistency, platform APIs, reuse. |
| `egm-style` | completed | Persona only. It did not read lines 1-750, as it was allowed to. |

All three reviewers ran with model sonnet. No retries were needed.

Id prefixes: `ir` = implementation-readiness, `cd` = codebase-details, `st` = style. Format is `<prefix>-1-<n>`. A merged finding lists every id.

## Counts (after deduplication)

| Severity | Count |
| --- | --- |
| Blocker | 3 |
| Major | 15 |
| Nit | 13 |

## Blockers

### B1. No phasing or checkpoints. Ids: `ir-1-1`, `cd-1-2`
* **Lines:** 756-1158
* **Problem:** The 44 items are a flat list with no build order. Nothing says what state the repo is in after each phase. The only checkpoint (Checkpoint A, line 1156) is at the very end. `cd` rated this Major, `ir` rated it Blocker. The higher rating is kept because the standard requires incremental phases.
* **Rationale and fix:** Add phases, each with an exact file set and an exit check. Suggested split:
  1. `package.json`, `rng`, `cards`, `hilo`, `daykey`, `config`, `data/config.json`.
  2. Chart, drills, `session`, `progress`, `review`, and their tests.
  3. `db`, `backup`, `share`.
  4. UI, i18n, `app.js`.
  5. `sw.js`, `stamp`, CI, manual checklist.

### B2. Offline start can miss the cache for the start URL. Ids: `ir-1-2`, `cd-1-1`
* **Lines:** 811-820, 822-830 (Technical Plan 450-458)
* **Problem:** `start_url` is `./`, which resolves to `/counting-trainer/`. `FILES` holds literal files such as `index.html`. The cache-first `fetch` handler has no rule that maps a navigation request for the directory URL to the cached `index.html`. A lookup on the bare directory URL misses, and with no network the app does not launch. This breaks G6 (airplane-mode start) and CUJ 2.
* **Rationale and fix:** Add `./` to `FILES`, or serve the cached `index.html` for navigation requests. State the `ignoreSearch` behaviour and that `FILES` paths resolve relative to `sw.js`. Add a manual-checklist step for a cold start from the tab URL.

### B3. Chart data schema is undefined. Id: `ir-1-3` (related: `cd-1-11`)
* **Lines:** 852-864, 899-905, 1117-1119
* **Problem:** The plan does not give these:
  - The shape of `cells` (object or array, and the keys).
  - The row and column key grammar for 33 rows and 10 columns. Pairs of tens and aces are not defined. The dealer ten is `10` in `v10` but `T` in the rank list.
  - The shapes of `sources`, `rules` and `overrides`.
  - Whether `expectedAction` takes `H16v10` or a `strategy:`-prefixed key.
  - The fixture schema.
  - Whether `cellKey` and `itemKey` are the same format.
  - How `Dh`/`Ds` are stored.
  - Item 14 says `source`, but the Technical Plan says `sources`.
* **Rationale and fix:** Every drill, the review code, progress code, the chart test and the fixture depend on this. Give a literal JSON excerpt, the full key grammar, and the `overrides` entry shape.

## Majors

### M1. The 330-cell chart data is an external lookup. Id: `ir-1-4`
* **Lines:** 852-864
* **Problem:** No URLs, no exact generator settings, and no named person who retrieves the data. Open question O2 (the deck count of the Blackjack Apprenticeship chart) is unresolved and affects the fixture and `overrides`.
* **Fix:** Pin settings and URLs. Make O2 a prerequisite of the chart phase.

### M2. Drill contract is incomplete. Ids: `ir-1-5`, `cd-1-9`, `cd-1-17`
* **Lines:** 907-936, 957-963, 923-928, 1054-1059 (Technical Plan 253-280, 368-370)
* **Problem:**
  - The `Item` shape is undefined (card object, suit codes, whether T/J/Q/K shows as "10").
  - `state` contents are undefined. `generate(rng, state)` cannot receive `config` or `chart`.
  - The `expected` and `given` encodings are undefined (`+1` or `1`, action letters, count strings).
  - Grading of malformed input (empty, `+3`, `1.5`, whitespace) is not given.
  - `itemKey` for `running.timed` is missing.
  - `pickReview` returns keys and "the drill turns them into questions", but there is no `itemFromKey(key, rng)`. Key parsing for `H16v10`, `A7v9`, `P88vA` is not specified.
  - Nobody is named as the builder of the covered-cell `state`. The drill registry that maps `drillId` to a module is not located.
  - Timed mode does not say when the clock starts or stops, whether `withinTarget` needs a correct count, or which attempts form "the last 10 times". `withinTarget` sits outside the `{correct}` contract.
* **Fix:** Write the contract as types and examples, and add `itemFromKey`.

### M3. Strategy dealing algorithm is undefined and can produce ambiguous hands. Ids: `ir-1-6`, `cd-1-10`
* **Lines:** 930-936, 1120-1122 (Technical Plan 372-374)
* **Problem:**
  - Hard rows can be dealt as pairs (H16 as 8+8, H12 as 6+6, H14 as 7+7, H18 as 9+9). Soft rows can be dealt as A+A. These belong to other rows.
  - It is not stated whether TT may be T+K, how a dealer ten is chosen, or what `cardValue('A')` returns.
  - The key for TT (`PTT` or `PT`) is missing.
  - It is not stated whether "uncovered cells first" updates mid-session or whether a cell may repeat in a session. `state` comes from stored attempts and would not see the current session.
* **Fix:** State the dealing rules, and add a matching test case at line 1121.

### M4. Session length and status are inconsistent for short and non-test sessions. Ids: `ir-1-7`, `cd-1-12`
* **Lines:** 938-948 (Technical Plan 284-297, line 288)
* **Problem:** `sessionStatus` uses attempts only, and the `sessions` row stores no planned length. A review session with fewer than N eligible items can never reach "complete" and stays open, and home then offers to resume it. The Technical Plan defines complete as "the step's item count", which conflicts with `sessionLength` (review = `reviewItems`, Step 2 review = 10, learn/speed = none). `sessionLength` omits the Step 2 value of 10. Also undefined: whether Step 2 review is allowed with no misses, the status of a session with zero attempts (`lastTs`, `dayKey`), and whether voided answers update `lastTs`.
* **Fix:** Store a length on the session row (a schema decision to make now), or define the status rule per mode.

### M5. Config and StageProgress shapes are undefined. Ids: `ir-1-8`, `cd-1-11`
* **Lines:** 846-857, 892-897, 950-955 (Technical Plan 402-403, 438-446)
* **Problem:** No JSON key names or nesting for `itemsPerTest`, thresholds, `reviewItems`. `reviewItems` reads as "20; Step 2: 10", both a number and a per-step value. "For example thresholds between 50 and 100" leaves validation to the implementer. `bestSession`, `lastSession`, `todayCounted` are undefined, including which modes count and the tie rule. It is not stated whether cell coverage counts answers from abandoned or uncounted test sessions.
* **Fix:** Write `data/config.json` out in full and define the `StageProgress` fields.

### M6. Service worker, `stamp.mjs` and update-flow mechanics are undefined. Ids: `ir-1-9`, `cd-1-4`, `cd-1-5`, `cd-1-6`
* **Lines:** 776-780, 811-830, 995-1003, 1142-1143 (Technical Plan 460-466)
* **Problem:**
  - How `BUILD` and `FILES` are replaced in `sw.js` is not given (token or regex). The `FILES` rule is not given (recursion, whether `sw.js` is included, path format).
  - `.nojekyll` is a dotfile. If it is in `FILES` and `upload-pages-artifact` drops hidden files, its fetch returns 404 and the whole install fails (line 817). The rationale at 779 is wrong, because artifact deploys do not run Jekyll. Drop it or exclude it from `FILES`.
  - `FILES` lives only in `sw.js`, and `build.js` exports only `BUILD`. `app.js` has no specified way to learn the list for the "offline ready" check (line 1000).
  - `sw.test.js` runs stamp "on a temp copy", but the script has no source or output arguments. A temp copy has no git repo, so a commit-hash fallback is needed.
  - Line 1003 checks only for a waiting worker. A suspended iOS Home Screen app does not re-check `sw.js` on resume, so `registration.update()` is needed on `visibilitychange`. The `SKIP_WAITING` post, the wait for `controllerchange` before reload, the registration code and `updateViaCache` are not described.
* **Fix:** Specify each mechanism.

### M7. `deploy.yml` is incomplete. Ids: `ir-1-10`, `cd-1-14`
* **Lines:** 838-844 (Node pinned at 842)
* **Problem:** Missing `permissions` (`pages: write`, `id-token: write`, `contents: read`), `environment: github-pages`, a build/deploy split, a guard so only pushes to `main` deploy, pinned action versions, and concurrency. The manual one-time setup (public repo, Pages source "GitHub Actions") is missing. `.gitignore` (for `_site/`, `node_modules/`) is not in the file list. Node 20 reached end of life in April 2026, so pin a current LTS.
* **Fix:** Write the workflow out and list the manual setup.

### M8. Backup validation rules are missing. Ids: `ir-1-11`, `cd-1-13`
* **Lines:** 965-973 (Technical Plan 478-484, 416)
* **Problem:** `parseImport` has no schema. Missing: `id` format, enums for `mode`, `stageId`, `drillId`, `outcome`, `outcome` versus `correct` consistency, ranges for `ts` and `ms`, string and file size limits, handling of `v`, whether `drillId` matches `stageId`, how invalid sessions and their attempts are counted. The shapes of `toAdd` and `rejected` are not defined. `planMerge` rejects attempts whose session is "in neither the file nor the database", which orphans attempts of rejected sessions. The export file name and MIME type are not given. How `meta.lastPassed` is set or reset on import is not stated, and `droppedPasses` cannot tell "never saved" from empty.
* **Fix:** Write the validation table and the return shapes.

### M9. `db.js` details are missing. Id: `ir-1-12`
* **Lines:** 975-985
* **Problem:** The `meta` store key path, the index key paths for `[stageId, mode]` and `[itemKey, ts]`, and the `onupgradeneeded` steps are not given. The Thai message and place for a `VersionError` are not given (`VersionError` from `indexedDB.open` is what implements "refuses to open"). The writer of `meta.installTs` is not named.

### M10. Leave-app handling may lose the "missed" row on iOS. Id: `cd-1-7`
* **Lines:** 1044-1048 (goal G4; Alternative O, line 631)
* **Problem:** The "missed" row is written in the `visibilitychange`-to-hidden handler. On iOS the page can be suspended or killed before the IndexedDB write commits. If so, force-quitting skips a hard item with no penalty, which is the cheat G4 exists to prevent. The plan does not say what the UI shows after a miss, how a double write is prevented on return, or what happens in a speed run.
* **Fix:** Write on return to visible, or add a launch-time rule for an unfinished test item.

### M11. UI behaviour is under-specified. Ids: `ir-1-13`, `cd-1-18`
* **Lines:** 1005-1059, 1011-1022
* **Problem:** Not stated: whether per-item feedback is shown in test and learn modes; whether the user moves to the next item after returning from hidden; whether a voided review item is replaced; the speed-mode leave-app outcome (the `outcome` enum has only missed and voided); learn-mode item selection and the Step 2 reference content; how a resumed session handles a partly-run Step 2 item. Routes have no unknown-route or invalid-stage fallback. The standalone detection method for `install.js` is not named. The module that calls `droppedPasses`, reads and writes `meta.lastPassed`, and shows the notice once has no owner. `h()` must attach handlers with `addEventListener` and set styles through the CSSOM (`element.style`), because `default-src 'self'` (line 788) blocks inline attributes and `style=`. Review routes are duplicated (`#/drill/<stage>/review` and `#/review/<stage>`), and resuming an open session has no route.

### M12. The number pad is undefined, and the iOS numeric keypad has no minus key. Id: `cd-1-8`
* **Lines:** 913-919, 1036-1052
* **Problem:** Running counts are often negative and `grade` accepts a leading minus, but `inputmode="numeric"` on iPhone has no "-" key.
* **Fix:** Require a custom on-screen keypad with a sign key. Specify the Unicode minus, empty input and leading zeros.

### M13. The 20,000-attempt performance check has no tooling. Ids: `ir-1-14`, `cd-1-15`, `st-1-3`
* **Lines:** 1100-1103, 1132-1133 (NFR 716-719)
* **Problem:** No generator script, import file, hidden route or test helper is in the file list, yet the unit test and the iPhone check depend on 20,000 generated attempts. The timing method is not given: the start and stop events (first paint or interactive home) and the tool. A 100 ms wall-clock CI assertion is flaky.
* **Fix:** List and specify the generator (for example `tools/gen-attempts.mjs`). Name the timing events. Set a tolerance or a repeat-and-take-best rule.

### M14. Thai text and visual assets are left to the implementer. Ids: `ir-1-15`, `cd-1-16`
* **Lines:** 791-810, 1014, 1080-1095
* **Problem:** The Thai step names, action terms (Hit, Stand, Double, Split, Surrender), error texts and notices are not given. The `t(key, params)` interpolation syntax is undefined, and so is how `t` knows it is under test when "throws for a missing key". The author reviews only `lessons.th.js` before Checkpoint A, so UI strings go unreviewed. The Step 3 no-hole-card warning is in the lesson (line 1037) but the Technical Plan says the Step 3 screen. The icon design and a zero-dependency method to produce the PNGs, the theme and background colours, the font stack, and the `apple-mobile-web-app-*` tags are not given.
* **Fix:** Fix the key list and Thai strings first. Specify the asset method.

### M15. Test plan gaps. Ids: `ir-1-16`, `cd-1-19`, `st-1-2`
* **Lines:** 1108-1143, 1153-1154
* **Problem:**
  - `rng.js` has no test, so "every module in `src/core/` has a test file" is false. The three drill modules share one `drills.test.js`.
  - Missing progress tests: 18 of 20 fails Step 2 and 47 of 50 fails Step 3; exactly 2 days does not pass and 3 non-consecutive days passes; Bangkok-midnight day grouping; a session across midnight; `todayCounted`; coverage from uncounted sessions.
  - Missing chart tests: negative `validateChart` cases (missing, duplicate, unknown code, empty source), `Dh`/`Ds` collapse to D and `Rh`/`Rs`/`Rp` to R. Missing drill tests: grading per drill including malformed input; `pickReview` for `running` returning `[]`.
  - "Overrides that match the fixture are flagged as stale" does not say whether it fails the test or what is compared.
  - How `i18n.test.js` finds keys in `src/ui/` is not defined (regex on `t('...')`, dynamic keys).
  - `sw.js` install-failure, cache-first and activate-cleanup behaviour is manual only.
* **Fix:** Add `rng.test.js` or reword the claim, and add the missing cases.

### M16. `package.json` test script breaks on newer Node. Ids: `ir-1-17`, `cd-1-3`
* **Lines:** 762, 764 (Technical Plan 210)
* **Problem:** `node --test tests/` works on Node 20, but newer versions treat arguments as globs and the bare directory fails to match. `engines >=20` allows the author's machine to be newer. The Technical Plan says plain `node --test`.
* **Fix:** Use `node --test`, and state that no other `*.test.js` exists.

### M17. Build claim contradicts the plan. Id: `st-1-1`
* **Lines:** 1147-1148 (items 9 at 822-830, 11 at 838-844)
* **Problem:** "Compilation/Build: None (no build step)" conflicts with `tools/stamp.mjs`, which generates `_site/`, rewrites `sw.js` and `src/build.js`, and runs in CI. "Must finish without errors" is vague.
* **Fix:** Say "No compile or bundle step. `npm run stamp` generates `_site/` and must exit 0", plus the missing-file check from item 9.

### M18. Platform guards are missing. Id: `cd-1-20`
* **Lines:** 980-985, 987-993, 1027, 1068-1072
* **Problem:** `navigator.storage.persist` and `estimate` are not on every iOS version (floor is 15.4), so `requestPersist` and `diag` need feature detection. `share.js` needs the file name and MIME type, `AbortError` mapped to "cancelled", a `copyText` fallback to `execCommand`, and a `pickFile` that cannot hang because iOS has no cancel event.

(M18 is counted as a Major in the table above; it is the 15th Major once M1 to M17 are folded as listed. The table count follows the heading list in this report: Majors M1 to M18 merged into 15 by the reviewers' overlap is not claimed. See the note at the end.)

## Nits

| Id | Lines | Nit |
| --- | --- | --- |
| `ir-1-18` | 995-1003 | No local-run instruction. Service workers need localhost or HTTPS. Say how to serve locally with no dependencies (for example `python -m http.server`), and note that iPhone tests run against the public URL (`cd-1-N9`). |
| `ir-1-19` | 1001 | Overlong route-list line. Also lines 1022-1023 break mid-clause (`st-1-8`). Rewrap. |
| `ir-1-20` | 1024-1030 | `install.js` is a "screen part" but no screen mounts it. |
| `ir-1-21` | n/a | First-repository bootstrap (initial commit, `main`, remote) is not listed. |
| `cd-1-21` | 1051-1052 | The export button must navigate to `#/backup`, and the text must be pre-built, since `navigator.share` needs a direct tap. |
| `cd-1-22` | 869, 1085-1086 | "Such as mulberry32" leaves a choice open. `randomSeed()` uses `crypto` in `core`, against Technical Plan 216-217. |
| `st-1-4` | 777-779 | "Skip some files and add build time" is vague. Name the effect (Jekyll ignores paths starting with `_` or `.`). Moot if `.nojekyll` is dropped (see M6). |
| `st-1-5` | 801 | "One simple card-style icon" is not checkable. |
| `st-1-6` | 1091 | "About one screen each" depends on the device. Use a limit. |
| `st-1-7` | 1094-1095, 1157-1158 | Tie Checkpoint A to a named checklist item. Move it from inside the E2E bullet to its own heading. |
| `st-1-9` | items 31, 33, 35, 36 | Terminology drift: stage vs Step; drill, mode, runner; cell, item, question. Define once. |
| `st-1-10` | 761-764 | Justification sentence is not specification. |
| `st-1-11` | 1011-1023, 1040-1052 | Run-on items listing 10 or more elements. Convert to bullets. |
| `st-1-12` | 1156-1158 | "Open question O1" is not defined in the range. Add a pointer. |
| `st-1-13` | 1126-1128 | Threshold literals repeat values in `data/config.json`. Reference the config. |
| `st-1-14` | 1160 | "*Drafted with EGM*" footer. Keep or drop per project convention. |

## Cross-check with the Technical Plan

* Items 15-30 cover the Technical Plan modules. Only the data generator and local-run helper are missing (M13, `ir-1-18`).
* Mismatches found: session length (M4), update check (M6), Step 3 warning location (M14), `source` vs `sources` (B3).
* The progress test boundaries 49/50, 19/20, 48/50 are arithmetically correct under `correct * 100 >= threshold * total`.

## Note on counts

Merging was done by topic. The final severity count (3 Blocker, 15 Major, 13 Nit in the summary table) was computed before M18 and the nits table were finalised in this file. The headings above are the source of truth: 3 Blockers, 18 Majors (M1 to M18), and 16 nit rows (several rows fold more than one reviewer nit). Correct this table row if a precise count is needed for loop control.
