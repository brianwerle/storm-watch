# Storm Watch — Team Handoff

As of Nov 15, 2026. This file mirrors the team's shared handoff doc. Earlier change notes (Nov 14 judging build, Run 2, Nov 15 judges build) are in this file's git history.

## Summary

Storm Watch is live and playable at [storm-watch-spaceapps.web.app](https://storm-watch-spaceapps.web.app). It is our entry for **Build a Junior Astronaut Mission Trainer**: kids aged 7 to 12 command a 4-person base at the Moon's south pole and keep the crew safe through five rounds of real solar storms from NASA's DONKI records.

The current version includes everyone's work: Sidra's life support, crew, science fixes and south-pole scene; Quan's August 2023 storm and Flare Swarm finale; and six mini-games that open inside the main game.

| What | Where |
| --- | --- |
| Play (public, no sign-in, no expiry) | [storm-watch-spaceapps.web.app](https://storm-watch-spaceapps.web.app) |
| Code | [github.com/brianwerle/storm-watch](https://github.com/brianwerle/storm-watch), branch `main` |
| QR code for the play link | [storm-watch-qr.png](storm-watch-qr.png) |
| Update the live site | `firebase deploy --only hosting` from the repo folder |

## How it fits the challenge

| Challenge element | In the game |
| --- | --- |
| Ages 7 to 12, plain language | Three levels (Cadet 7-9, Pilot 10-12, Commander for older players); tap-to-explain word chips; spoken Mission Control; hints on the easy level |
| Life support | Oxygen, water and food in real kilograms at NASA BVAD rates; oxygen is made by splitting water |
| Radiation shielding | Deeper rooms are safer; powered water-wall shield; radiation vests; dose tracked per astronaut, with NASA's 600 mSv career limit grounding anyone who passes it |
| Power budgeting | 14 kW shared between four machines; less when panels fold or go offline |
| Food production | Greenhouse with a garden that severe storms damage and the Botanist regrows |
| Communication delay | Call Mission Control: the answer takes 2.6 seconds (1.3 each way), with the Mars comparison |
| Every choice costs something | 10-crate packing limit, power sharing, science versus safety; each debrief lists what the choices cost |
| Compounding consequences | Garden damage slows food for days; dose never goes down; panels stay offline until rebooted |
| Real data, attributed in the tool | "Real NASA data" panel, a source on every fact card, live or saved marker on every storm |

The challenge wording here came from Space Data Atlas and a Gemini summary of the official page. Check it against spaceappschallenge.org before submitting.

## How the game plays

A full game takes about 8 to 10 minutes: title screen, crew introductions, packing the rocket (10 crates, so every item costs another), a launch cutscene, then five rounds.

Each round has four beats: **All clear** (collect science, top up supplies), **Storm incoming** (Mission Control radios the real flare; a Storm Tracker shows its class, sunspot and real warning time), **Radiation storm** (share power, fix what breaks), and a **Debrief** (the real story, one quiz question, what the player's choices cost).

| Round | Real storm (NASA DONKI) | Planned repair mini-game |
| --- | --- | --- |
| 1 | Strongest flare of the last 30 days, fetched live | Leak Patrol (water) |
| 2 | M4.2, May 9, 2023 | Scrubber Sprint (oxygen), then Solar Reboot (panels) |
| 3 | X1.5, Aug 7, 2023 | Shield Sync (shield) |
| 4 | X8.2, Sep 10, 2017, followed by the Mars aurora scene | Cosmic Match (grow lights), Greenhouse Guard (plants) |
| Finale | Flare Swarm: X1.0, X2.2, X3.9 and X5.8 from one sunspot, May 8-11, 2024, back to back | Cosmic Match (oxygen), Solar Reboot, Greenhouse Guard |

After the finale the player gets a Flight Readiness Rating and a checklist of 10 badges. Endless mode continues with six more real storms. Fact cards (19, each with its source) and badges are saved on the device in a Cadet Logbook.

**Controls:** drag an astronaut onto a room, or tap the astronaut and then the room. Use + / − for power. Tap a red FIX bubble to send the Engineer and open that machine's mini-game; the base pauses while a mini-game or fact card is open.

## Who built what

| Person | Contribution |
| --- | --- |
| Sidra | Life support in real kilograms at NASA BVAD rates; team crew, avatars and Commander customization; crew introductions; garden health; science-accuracy fixes; 600 mSv career limit; south-pole scene; 23-question quiz bank by level; phone layout; fact cards that pause the game |
| Quan | Launch-prep idea (now "Pack your rocket"); per-storm timers; the August 2023 storm; the back-to-back finale (rebuilt on the real May 2024 flares) |
| Brian | Mini-games: Cosmic Match, Solar Reboot, Greenhouse Guard, Scrubber Sprint, Shield Sync and the lunar-ice Leak Patrol; hosting; integration |

Quan's pull request #3 is still open on GitHub. Its two main ideas are in the game with credit; the rest was written against an older version.

## NASA data used

Every storm loads live from NASA's DONKI API when the game starts, with a saved copy in the code if NASA can't be reached within 7 seconds.

| Source | Used for |
| --- | --- |
| NASA CCMC [DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/) | Flare class, time, sunspot region, particle arrival (the real warning time) and CME speed for every storm |
| NASA Life Support BVAD (NASA/TP-2015-218570 Rev2) | Crew oxygen, water and food use |
| NASA [OSDR](https://osdr.nasa.gov/bio/repo/search) | Bone-loss and radiation biology fact cards (OSD-417, OSD-342, OSD-2) |
| NASA MAVEN and Curiosity RAD | The September 2017 Mars aurora and surface radiation |
| NASA LRO (Diviner, Moon Trek) | South-pole temperature and sunlight facts |
| NASA Artemis I (MARE) | The radiation vest item |
| NASA Deep Space Network | Signal delay |
| Chang'e-4 LND (not NASA) | Background radiation on the lunar surface, 1.369 mSv per day |
| NASA SDO | Sun imagery inside the mini-games |

**Real versus game settings:** flare classes, dates, sunspot regions, warning times and consumption rates are real. Storm strength in play, countdown lengths, tank sizes, the planned breakdowns and the difficulty levels are game settings, and are marked as such in the code.

## Running it and the code

Plain HTML, CSS and JavaScript with no framework. To run locally, start a small web server in the repo folder and open `http://localhost:8123` (add `?speed=4` to fast-forward):

```bash
python -m http.server 8123
```

| File | Purpose |
| --- | --- |
| `game.js` | Rules and flow: NASA loader, levels, packing, storms, repairs, debrief, scoring. Start with `CAMPAIGN` (storms), `LEVELS` (difficulty) and `SHOWCASE` (planned breakdowns) |
| `scene.js` | Everything drawn on the canvas, including the launch and aurora scenes |
| `learn.js` | Word chips, fact cards, quiz bank, badges, Logbook, data sources panel |
| `sfx.js` | Sound effects and radio voices, synthesized in the browser |
| `crew.js` | Team avatars, Commander customization, crew introductions |
| `cosmic-match.*`, `solar-panels.html`, `greenhouse-guard.html`, `scrubber-sprint.html`, `shield-sync.*`, `leak-patrol.html` + `moon-water.*` | The six mini-games, each also playable on its own |
| `build.js`, `firebase.json` | Build and hosting; the build adds a version tag so browsers always load fresh files |

## Status

**Checked:** an automated player finished all five rounds on the Cadet level with every crew member at 100% health, all six mini-games opened, no fact card repeated and no errors. The quiz was simulated over 900 missions with no repeated question. Shield Sync was played through its own controls. All five storms load live from NASA on the public site.

**Not checked:**

- A full game played by a person at normal speed, on the final version
- The audio (voices use the device's own speech voices, so quality varies)
- Pilot and Commander levels since the last balance changes
- A real phone or tablet
- The new lunar-ice Leak Patrol puzzle played by hand inside the main game

## Before we submit

- [ ] Play one full game with sound on, and one on a phone
- [ ] Confirm the challenge wording on spaceappschallenge.org
- [ ] Second-person fact check of the fact cards and quiz in `learn.js`
- [ ] Scan the QR code once to confirm it opens the game
- [ ] Decide what to do with Quan's open pull request #3
- [ ] Record the 2-minute demo: live-data start screen, pack and launch, shelter the crew as a storm hits, one repair mini-game, a debrief card, the Flare Swarm
- [ ] Write the project page, crediting the data sources above
