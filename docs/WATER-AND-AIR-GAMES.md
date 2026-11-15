# Water and air mini-games

Two standalone arcade games, in the same cinematic style as the other
Storm Watch mini-games. Scrubber Sprint uses `life-support-arcade.js`.
Leak Patrol uses `moon-water.js` and `moon-water.css`; both use the shared
`life-support-arcade.css` and NASA media in `assets/space/`.
Neither page loads the main game's code.

Run `python -m http.server 8123` from the repository root, then open:

- `http://localhost:8123/leak-patrol.html` for **Leak Patrol** (H₂O).
- `http://localhost:8123/scrubber-sprint.html` for **Scrubber Sprint** (air).

## Leak Patrol

The current version is **Moon Water**, a route-planning puzzle. Dig through soil
around rock barriers, then melt underground stored ice and guide at least 16 of
24 water drops to the base's underground tank. Red fissures spill water and dead
ends trap it. There is no planning countdown and a pour takes only a few seconds.
Undo, Clear, hints, editable retries, and mirrored replay maps are included.
See [MOON-WATER.md](MOON-WATER.md) for rules and science boundaries. Losing does
not restore the main game's broken water system.

## Scrubber Sprint

Tap moving orange CO₂ molecules to trap them. Let blue O₂ flow back to the crew.
Three-versus-two circles, formula labels, and colors distinguish the gases.
Capturing O₂ costs cabin-air points; uncaptured CO₂ returning to the crew also
lowers the game meter. After six CO₂ captures the filter cleans itself
automatically, without interrupting captures. Optional Vacuum Boost sweeps up
the remaining on-screen CO₂ for a combo, with a six-second cooldown.
Airflow speeds up across three waves.

## Shared behavior

Both games include replay, a mission debrief, mute, motion controls, and mobile
input. Water flow pauses while the browser is hidden. Scrubber Sprint retains its
12-second scoring rounds and local best score; Leak Patrol has binary win/loss.
Decorative effects can be stopped while essential gameplay continues.

Browser verification covered actual pointer hits on moving molecules, seal taps,
resource changes, filter capacity, emergency abilities, pause, full simulated
12-second missions, score, replay, offline assets, mobile layout, and reduced
motion. Intended for ages 7–12; engagement and difficulty need child playtesting.
Both games are standalone prototypes; no public hosting is configured for them yet.

## NASA context and boundaries

[NASA ECLSS](https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/)
describes water recovery, air revitalization, and oxygen generation as distinct
life-support functions. [NASA JSC life-support research](https://www.nasa.gov/reference/jsc-life-support-subsystems/)
covers water recovery, CO₂ removal, and oxygen generation. The air game removes
CO₂; it does not turn CO₂ into oxygen.

The cinematic background reuses the archived September 10, 2017 SDO flare footage.
The linked DONKI record identifies the real flare. Controller failures, visible
gas bubbles, instantaneous sealing, percentages, filter capacity, cooldowns, and
game timing are fictional mechanics, not NASA measurements or documented damage
from that event. Media sources and preparation are in `assets/space/CREDITS.md`.

## Inside the main game

Both games also open inside Storm Watch (`?embed=1`): **Leak Patrol** repairs a broken
water recycler, and **Scrubber Sprint** takes turns with Cosmic Match to repair the
oxygen machine. Embedded, the page hides its header, cinema panel, notes and links,
the results button reads **Continue →**, and the result is posted to the main game
(`{source, ok, finished, resource, score}`) when the round ends and again on Continue.
A sloppy round wastes a little of that supply in the base's tank: up to 3 kg of water
or 1 kg of oxygen (game settings, not NASA numbers). The standalone pages are unchanged.
