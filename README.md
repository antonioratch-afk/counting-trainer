# Counting Trainer

Offline iPhone web app for practicing Blackjack card counting: Hi-Lo card values, running count, and basic
strategy for one table preset. **Training only: no betting, no real money.**

Live app: https://antonioratch-afk.github.io/counting-trainer/

## Install on iPhone (ติดตั้งบน iPhone)

1. Open the link above in Safari. / เปิดลิงก์ด้านบนใน Safari
2. Tap Share, then "Add to Home Screen". / แตะปุ่มแชร์ แล้วเลือก "เพิ่มไปยังหน้าจอโฮม"
3. Open the app once from the icon **while online** and wait for "พร้อมใช้แบบออฟไลน์". After that it works in airplane mode.
   / เปิดแอปจากไอคอนหนึ่งครั้งตอนมีเน็ต รอจนขึ้นว่าพร้อมใช้แบบออฟไลน์

Practice history is stored only on the phone. Use **สำรอง / กู้คืนข้อมูล** to export a backup file.

**Never rename this repository or the GitHub account.** The web address decides where each phone stores its
data; a new address starts empty. If a rename is ever forced, every user exports first and imports on the new
address.

## Develop

No dependencies and no build step for the app itself.

```sh
npm test                       # node --test (Node 22+)
python -m http.server 8000     # then open http://localhost:8000/
npm run stamp                  # writes _site/ with the build ID and offline file list
node tools/gen-attempts.mjs --count 20000 --seed 1 --out gen.json   # test data for the start-up check
python -I tools/make-icons.py  # redraws icons/*.png
```

The service worker only registers in a stamped build (`_site/`), so local runs from the repository root are
online-only. To try offline locally, run `npm run stamp` and serve `_site/`.

Deploy: every push to `main` runs the tests, stamps `_site/` and publishes it with GitHub Actions.
One-time setup: Settings > Pages > Source = "GitHub Actions".

## Change rules

- Thresholds, item counts, days to pass: `data/config.json`. A change that raises a requirement can remove a
  pass; the app shows a notice when that happens.
- Strategy chart: `data/chart-6d-s17-das-ls.json`. The check chart `tests/fixtures/chart-check-bja.json` must be
  typed separately from a second source and never edited in the same commit. Any difference fails the test
  until it is recorded in `overrides` with a reason.

## Status

- Steps 1-3 are built. See [docs/designs/counting_trainer.md](docs/designs/counting_trainer.md).
- **Chart not yet verified against a second source.** The chart was typed from the standard 6-deck S17 DAS
  late-surrender basic strategy. Its `sources` URL and date, and the check fixture, are still to be filled in
  (design open item E1). Until then the chart cross-check test is reported as TODO.
- Phase 0 questions O1 (compare existing trainers) and O2 (deck count of the check chart) are open.
- Before sharing: [docs/manual-iphone-checklist.md](docs/manual-iphone-checklist.md) (Checkpoint A).

## Chart changes

- v1: first version.

## Docs

- Design: [docs/designs/counting_trainer.md](docs/designs/counting_trainer.md)
- Brainstorm notes: [docs/brainstorm/concepts_brief.md](docs/brainstorm/concepts_brief.md)
- Review reports: [docs/reviews/](docs/reviews/)
