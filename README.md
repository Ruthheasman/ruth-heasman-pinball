# Ruth Heasman Pinball

**[▶ Play the game here](https://ruthheasman.github.io/ruth-heasman-pinball/)**

A 3D pinball game with 8 tables and 8 published and copyright music tracks from The War for Freedom (lyrics by Dr C S Wright) and Moonlight Dissonance (lyrics by Ruth Heasman).

A pinball jukebox. Eight playable 3D tables, each built around one of Ruth
Heasman's songs: the song's artwork is the playfield, and the song plays while
you play.

Runs in any modern browser. No build step, no server code, no dependencies to
install.

## Tables

| Table | id | Pace | Signature feature |
|---|---|---|---|
| Existential Dread | `dread` | medium | The moon's mouth swallows the ball and spits it out of an eye upstairs |
| The War for Freedom | `war` | medium | A straight lane up the road, and two drones that sweep the upper level |
| Moonlight Dissonance | `moonlight` | fast | The turntable is a spinning disc that flings the ball; a row of gravestones |
| Computer Says No | `computer` | medium | Four numbered forms that only fall in order; the ramp is shut until they are filed |
| Paper Dreams | `paper` | medium | The rat hole rolls two dice; five card targets make the hand |
| Daughter of the Sky | `daughter` | floaty | A channel round the hat brim; M-O-O-N lit in order pays big; a witch crosses the moon |
| Eternal Ones | `eternal` | fast | A horseshoe loop, and a two-ball multiball that scores double as a pair |
| Young, Reckless and Free | `young` | slow | An S-bend lane to the castle, three flying bats, and a kickback |

Every table has two levels, a ramp, drop targets, a lock and a multiball.

## Play it

Play it in your browser at https://ruthheasman.github.io/ruth-heasman-pinball/

To run your own copy, serve the folder with any static web server and open `index.html`:

```
npx serve .
```

(Opening `index.html` straight from disk will not work, because browsers block
the artwork from being drawn into the 3D scene on `file://` pages.)

| Control | Keyboard | Touch |
|---|---|---|
| Flippers | `←` `→` or `Z` `/` | Tap the left or right half of the screen |
| Launch | Hold and release `Space` | Hold and release the eye |
| Nudge | `↑` | Turn on "Shake to nudge" on the start screen, then give the phone a short sharp shove |
| Pause | `P` | Leave the tab |
| Back to the table list | `Esc` | The Tables button |

Nudging shoves every ball in play. Three nudges in quick succession earn a
warning and a fourth tilts the table: the flippers go dead and that ball's bonus
is lost. Shake to nudge reads the phone's motion sensor (a jolt, not a slow
lean), is off until the player
turns it on, and is not offered when the game is embedded in a frame.

Music and pinball effects have separate on/off pill controls in the score bar.
Both default to on; choices are saved independently in this browser. Music
pauses when switched off and resumes from the same position when enabled during
play. Effects can stay on while music is off, or vice versa.

## Hosting and embedding

The game is one static page, so it can be dropped into an `<iframe>`.

| Link | What it does |
|---|---|
| `index.html?table=war` | Opens with that table selected |
| `index.html?table=random` | Opens with a random table |
| `index.html?tables=dread,paper,young` | Opens with one of the listed tables, chosen at random |
| `index.html?debug=1` | Shows a debug overlay (frame rate, state, ball position) |

Add `&autostart=1` to skip the Play button. Browsers only allow sound after the
player presses a key or taps, so an autostarted game is silent until then.

### Events for rewards and leaderboards

The game reports what happens so a host page can pay rewards or record scores.
Each report is sent two ways: as a `pinball` event on `window`, and, when the
game is inside a frame, as a `postMessage` to the parent page.

```js
// on the same page
window.addEventListener('pinball', e => console.log(e.detail));

// on the page that embeds the game in an iframe
window.addEventListener('message', e => {
  if (e.data && e.data.source === 'ruth-heasman-pinball') console.log(e.data);
});
```

| `type` | When | Fields |
|---|---|---|
| `start` | A game starts | `table`, `title` |
| `ballend` | A ball drains and its bonus is added | `table`, `score`, `ball`, `bonus` |
| `gameover` | The third ball drains | `table`, `score`, `highScore` |

Scores are computed in the browser, so a player can forge them. Do not pay out
on these events alone if the amounts matter.

## Minting it as an HTML ordinal

`ordinal/build.py` packs the whole game into one self-contained HTML file: code,
three.js, fonts, artwork and music are all inlined, and the file makes no
network requests. That is the form an HTML ordinal needs.

```
python3 ordinal/build.py --tables dread     # one table, about 9 MB
python3 ordinal/build.py --kbps 96          # all eight, music re-encoded, about 42 MB
python3 ordinal/build.py                    # all eight, full-quality music, about 79 MBpython3 ordinal/build.py --each --max-mb 9.5   # one file per table, each under 9.5 MB
```

`--max-mb` keeps each file under a size cap by lowering the music bitrate only
as far as needed. Treechat accepts HTML ordinals up to 10 MB, so the eight
tables are minted as eight ordinals, one per song.

Files are written to `ordinal/dist/`. The songs and artwork inside them stay
copyright; see `LICENSE-MEDIA.md`.

### Inside Treechat

When the ordinal is shown on [Treechat](https://treechat.com/treechat-ordinal),
`src/treechat.js` asks Treechat who created the ordinal and shows a "Tip the
artist" row on the start and game-over screens. A tip is one payment to the
creator's address (or the current owner's, if the creator is unknown), requested
through the viewer's Treechat wallet, which shows its own confirmation.

Outside Treechat the tip row never appears and the game is unchanged.

## How it is put together

```
index.html          the page
src/physics.js      table geometry, ball physics and rules (no DOM; runs in Node)
src/themes.js       the eight tables: artwork, palette, words, pace and layout
src/art.js          playfield, backglass and target textures, drawn to canvas
src/render.js       the 3D cabinet (three.js)
src/audio.js        synthesised sound effects (Web Audio)
src/main.js         table select, input, HUD, music and the frame loop
src/treechat.js     tip-the-artist bridge for when the game is a Treechat ordinal
src/style.css       page styles
art/ thumbs/        table artwork (not open source, see below)
music/              the songs (not open source, see below)
vendor/             three.js r128 and the fonts, self-hosted
ordinal/build.py    packs everything into one HTML file for minting
test/simulate.js    plays simulated games on every table and reports stuck balls
```

To add a table, add an entry to `src/themes.js` with its own artwork, palette,
words and `layout`, and put a 1024×1536 image in `art/`, a 160×240 thumbnail in
`thumbs/` and an MP3 in `music/`, each named after the table's `id`.

Keep the original JPEG artwork and thumbnails as source files. The game serves
WebP copies at the same dimensions to reduce downloads. After adding or updating
JPEGs, run `bash scripts/optimise-images.sh` with ImageMagick (WebP support)
installed, and commit the generated `.webp` files. This is a development-only
step; hosting still needs no build tools. The media licence also covers these
optimised copies.

`node test/simulate.js` runs 15 bot-played games per table and prints how often
each feature fired and whether any ball came to rest where it should not.

## Licence

**Code:** Apache License 2.0. See `LICENSE` and `NOTICE`.

**Songs and artwork:** published and copyright, all rights reserved (recordings
and artwork © Ruth Heasman; lyrics © their credited authors). They are
included so the game can be played, and may only be used as part of this game.
They are not covered by the Apache licence. See `LICENSE-MEDIA.md`.

**Third parties:** three.js (MIT), the Griffy, IM Fell English SC, Orbitron and
Cinzel fonts (SIL Open Font License 1.1) and the Special Elite font (Apache 2.0),
each with its licence in `vendor/`.

## Credits

Made by [Ruth Designs Digital](https://ruthdesignsdigital.com).

Game design, music and artwork by [Ruth Heasman](https://ruthheasman.com).
The eight tracks are taken from the albums *The War for Freedom* (lyrics by
Dr C S Wright) and *Moonlight Dissonance* (lyrics by Ruth Heasman).
Built with Claude.
