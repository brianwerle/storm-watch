# Leak Patrol: Moon Water

A planning puzzle replaces the reaction-based leak repair. The imagined lunar
base stores harvested ice underground. Players dig a transfer channel, melt a
batch of ice, and route water to an underground storage tank without losing it
into a fissure. The protected channel is a simplified sealed transfer route,
not exposed drinking water flowing through regolith.

The map is presented as continuous gray lunar geology, with jagged solid-rock
shelves and rounded excavated caverns. Original vector art depicts the ice
crystal deposit and a buried, ribbed storage tank. A supply riser connects the
tank to the surface habitat; its sight glass fills as collected drops arrive.

Open `leak-patrol.html` (or its alias `moon-water.html`) through the local web
server. `moon-water.js` supplies puzzle and flow logic; `moon-water.css` supplies
the map and effects. Shared styles and NASA media remain unchanged.

- Brown soil can be dug by dragging, tapping, or keyboard Enter/Space.
- Dark rock cannot be dug. Water moves down or sideways, never up.
- There are 18 excavations available, Undo, Clear, and a one-cell hint.
- Melt ice starts a short flow simulation; planning has no countdown.
- Save at least 16 of 24 drops to win. Dead ends trap water; red fissures lose it.
- A failed route remains editable. A successful route can be reviewed or replayed
  as a horizontally mirrored map. Each map has a tested 13-dig safe route.
- Embedded success sends the existing `leak-patrol` completion message. A failure
  does not tell the main game to restore its broken water machine.

The discrete water beads follow a gravity-inspired routing rule: down first,
then unvisited sideways channel cells. At a left/right fork, beads alternate
between the branches. This makes unsafe branching visibly costly. The game is
not a fluid-dynamics, lunar-gravity, extraction, ice-melting, or water-quality
simulation. The storage concept is fictional, not an operating NASA lunar base.
NASA SDO footage is an archived backdrop; see `assets/space/CREDITS.md`.

Browser checks covered safe and mirrored routes (24/24 delivered), no-route
failure, a branch splitting 12 drops to the tank and 12 to a fissure (loss),
editable retry/undo, hints, keyboard controls, mobile layout, and reduced motion.
Age suitability and enjoyment still need playtesting with children.
