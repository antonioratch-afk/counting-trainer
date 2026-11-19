# Manual iPhone checklist

Run before sharing the link (Checkpoint A). Record results and the device:

- iPhone model: ______  iOS version: ______  Build ID (home screen footer): ______

| # | Step | Expected | Pass |
| --- | --- | --- | --- |
| 1 | Open https://antonioratch-afk.github.io/counting-trainer/ in Safari | Install guide shows in Thai | |
| 2 | Share > Add to Home Screen, open from the icon while online | Footer shows "พร้อมใช้แบบออฟไลน์" | |
| 3 | Turn on airplane mode, close the app, open from the icon | App starts, home screen shows | |
| 4 | Airplane mode: open the bookmarked URL in Safari | App starts | |
| 5 | Import `gen.json` (`node tools/gen-attempts.mjs --count 20000 --seed 1 --out gen.json`), close and reopen; check Diagnostics "start-up ms" | Under 2000 ms | |
| 6 | Finish a Step 1 test session offline | Result screen; home shows today's state | |
| 7 | Test mode: leave the app while a question is on screen, come back | "ข้อนี้นับว่าผิดเพราะออกจากแอป" | |
| 8 | Learn mode: same | "ข้อนี้ไม่ถูกนับเพราะออกจากแอป" | |
| 9 | Test mode: force-close the app (swipe up) during a question, reopen | Home shows the missed notice; resume continues the session | |
| 10 | Step 2: answer a negative count with the ± key | Graded correctly | |
| 11 | Backup: Share file through the Share Sheet; Copy as text | Both work; "last backup" updates | |
| 12 | Delete the app, reinstall, import the file | Progress matches before | |
| 13 | Push a new build; reopen the app with no session open | "มีเวอร์ชันใหม่" banner; tapping it reloads into the new build | |
| 14 | Start a test session, push a new build, return to the app | No update banner until the session ends | |
