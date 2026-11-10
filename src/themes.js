/* Tables: one per song. Each has its own art, palette, words, pace and signature feature. */
(function () {
  'use strict';
  const T = [
    { id: 'dread', title: 'Existential Dread', pal: ['#e9e2c8', '#ffb347', '#4fd6e0'], font: 'fell', cropL: [0, 560, 1024, 976],
      w: { meter: 'Dread', plural: 'DREADS', full: 'Full dread. All scores doubled.', mb: 'Moonstruck', saucer: 'Cellar', letters: 'VOID', banks: ['DOUBT', 'REGRET', 'MALAISE'], tip: 'The mouth swallows, the eye spits',
        drain: ['Nothing matters. Next ball.', 'The void thanks you.', 'Entropy wins again.', 'Gravity remains undefeated.'], over: ['It was always going to end.', 'The moon is unimpressed.', 'Meaning not found.'] },
      // signature: the moon's mouth is a hole on the lower level that spits the ball out of an eye upstairs
      layout: { lower: [[6.3, 21.7, 0.95, 'spiral2']], saucers: [{ id: 'mouth', x: 10.7, y: 24.1, label: 'The mouth', points: 3000, hour: true, warp: [7.3, 33.0, 1, 2, -8] }] } },
    { id: 'war', title: 'The War for Freedom', pal: ['#eaf6ff', '#ff3b30', '#35e0ff'], font: 'tech',
      w: { meter: 'Signal', plural: 'SIGNALS', full: 'Signal wide open. All scores doubled.', mb: 'Uprising', saucer: 'Safehouse', letters: 'FREE', banks: ['CURFEW', 'GRID', 'TOWER'], tip: 'Run the road. Shoot the drones.',
        drain: ['The drones saw that.', 'Freedom costs one ball.', 'Checkpoint failed.'], over: ['The war goes on without you.', 'Curfew.'] },
      // signature: a straight lane up the road, and two drones that sweep across the upper level
      layout: { g: 40, noArc: true, upperBank: false, upper: [[9.8, 38.3, 0.9, 'spiral2']], lower: [], drones: [[9.6, 35.4, 3.6, 1.3, 1], [9.6, 33.0, 3.2, -1.7, 1]],
        walls: [[8.5, 18.6, 8.5, 23.0, 0], [10.3, 18.6, 10.3, 23.0, 0]], posts: [[9.9, 24.9]], shots: [{ id: 'road', x: 9.4, y: 21.0, r: 0.7, label: 'Road run', points: 2500, minSpeed: 8, at: [9.4, 20.8, -1.5708] }] } },
    { id: 'moonlight', title: 'Moonlight Dissonance', pal: ['#f4ecd0', '#c8ff3a', '#ff3d8a'], font: 'fell', cropU: [254, 230, 770, 510],
      w: { meter: 'Noise', plural: 'NOISES', full: 'Maximum dissonance. All scores doubled.', mb: 'Dissonance', saucer: 'Crypt', letters: 'GOTH', banks: ['ROSES', 'THORNS', 'GRAVES'], tip: 'The turntable throws the ball',
        drain: ['Needle skipped.', 'Buried it.', 'Dead air.'], over: ['Last track. Lights up.', 'Rest in pieces.'] },
      // signature: the turntable is a spinning disc that flings the ball; a row of gravestones upstairs
      layout: { g: 45, upperBank: false, upper: [[14.4, 37.4, 0.9, 'spiral2'], [13.2, 33.6, 0.85, 'spiral']], lower: [], posts: [[6.4, 20.6]],
        disc: { x: 11.6, y: 21.7, r: 1.8, omega: 9 }, rows: [{ ax: 5.8, ay: 36.6, bx: 10.6, by: 36.6, n: 4, level: 1, bank: 'graves' }] } },
    { id: 'computer', title: 'Computer Says No', pal: ['#e8dcb8', '#ff3b30', '#58d8c8'], font: 'type',
      w: { meter: 'Forms', plural: 'FORMS', full: 'Request approved. All scores doubled.', mb: 'Paperwork', saucer: 'In tray', letters: 'DENY', banks: ['MEMO', 'AUDIT', 'APPEAL'], tip: 'File forms 1 to 4 to open the ramp',
        drain: ['Computer says no.', 'Please take a ticket.', 'Rejected. Wrong form.'], over: ['Your call is important to us.', 'This office is now closed.'] },
      // signature: four numbered forms that only fall in order; the ramp is shut until they are filed
      layout: { noArc: true, upper: [[10.4, 36.9, 1.1, 'spiral2'], [6.3, 33.8, 0.85, 'spiral'], [12.9, 33.2, 0.85, 'spiral']], lower: [[7.5, 22.3, 0.9, 'spiral2'], [11.3, 22.3, 0.9, 'spiral2']],
        rows: [{ ax: 6.4, ay: 19.4, bx: 12.4, by: 19.4, n: 4, level: 0, bank: 'forms', ordered: true }], walls: [[6.2, 19.75, 9.4, 20.5, 0], [9.4, 20.5, 12.6, 19.75, 0]], gate: [18.2, 21.2, 15.9, 21.2] } },
    { id: 'paper', title: 'Paper Dreams', pal: ['#efe4ff', '#c77dff', '#5aa8ff'], font: 'carved', cropU: [130, 330, 770, 510],
      w: { meter: 'Dreams', plural: 'DREAMS', full: 'Wide awake. All scores doubled.', mb: 'Full House', saucer: 'Rat hole', letters: 'AKQJT', set: 'A-K-Q-J-10', banks: ['SPADES', 'HEARTS', 'CLUBS'], tip: 'The rat hole rolls the dice',
        drain: ['Snake eyes.', 'Folded.', 'Torn up.'], over: ['The house always wins.', 'Dealt out.'] },
      // signature: the rat hole rolls two dice; five card targets make the hand; the heads are bumpers
      layout: { upperBank: false, dice: true, letters: ['A', 'K', 'Q', 'J', '10'], upper: [[15.4, 34.0, 0.85, 'spiral'], [9.9, 38.6, 0.8, 'spiral']], lower: [[9.4, 21.6, 0.95, 'spiral2'], [9.4, 14.2, 0.95, 'spiral2']], posts: [[5.3, 19.6], [13.5, 19.6]] } },
    { id: 'daughter', title: 'Daughter of the Sky', pal: ['#f1e6c8', '#e8c16a', '#e58aa0'], font: 'fell', cropU: [0, 230, 770, 510],
      w: { meter: 'Stars', plural: 'STARS', full: 'Sky alight. All scores doubled.', mb: 'Constellation', saucer: 'Cloud', letters: 'MOON', banks: ['LACE', 'STORM', 'VEIL'], tip: 'Loop the brim. M-O-O-N in order pays.',
        drain: ['Fallen star.', 'Gone with the wind.', 'Clouded over.'], over: ['The sky keeps its daughter.', 'Night falls.'] },
      // signature: a channel round the hat brim, a floaty ball, and letters that must be lit in order
      layout: { g: 35, seq: true, flyer: { y: 35.4, x0: 3.0, x1: 16.2, h: 1.7, speed: 0.4, size: 4.4 }, upper: [[6.2, 35.6, 1.0, 'spiral2'], [11.4, 36.0, 0.85, 'spiral'], [9.0, 33.2, 0.85, 'spiral']], lower: [], posts: [[7.4, 20.6], [11.4, 20.6], [9.4, 22.7]],
        arcs: [[10, 32, 7.9, 50, 130, 1]], shots: [{ id: 'brim', x: 10, y: 40.65, r: 0.75, level: 1, label: 'Brim loop', points: 2500, minSpeed: 10 }] } },
    { id: 'eternal', title: 'Eternal Ones', pal: ['#f6e2a8', '#f0b93a', '#e0304a'], font: 'fell',
      w: { meter: 'Roses', plural: 'ROSES', full: 'Midnight waltz. All scores doubled.', mb: 'Masquerade', saucer: 'Carriage', letters: 'LOVE', banks: ['VELVET', 'RAVEN', 'ROSE'], tip: 'Waltz the loop. Two balls score double.',
        drain: ['The dance ends.', 'A petal falls.', 'The candles gutter.'], over: ['Eternity can wait.', 'The last waltz.'] },
      // signature: a horseshoe loop round a centre post, and a two-ball multiball that scores double as a pair
      layout: { g: 45, noArc: true, mbBalls: 2, pairDouble: true, upper: [[7.0, 36.3, 0.95, 'spiral2'], [12.0, 36.3, 0.95, 'spiral2']], lower: [], posts: [[9.4, 21.0]],
        arcs: [[9.4, 21.2, 2.4, 0, 180, 0]], walls: [[7.0, 21.2, 7.0, 19.4, 0], [11.8, 21.2, 11.8, 19.4, 0]], shots: [{ id: 'waltz', x: 9.4, y: 22.75, r: 0.6, label: 'Waltz', points: 2500, minSpeed: 6, at: [9.4, 18.6, 0] }] } },
    { id: 'young', title: 'Young, Reckless and Free', pal: ['#f3e6c0', '#ffb347', '#5a8cff'], font: 'fell',
      w: { meter: 'Miles', plural: 'MILES', full: 'Running wild. All scores doubled.', mb: 'Runaway', saucer: 'Hideout', letters: 'WILD', banks: ['HEART', 'BOOTS', 'BATS'], tip: 'Take the road. Catch the bats.',
        drain: ['Caught at the gate.', 'Tripped on a cobble.', 'Grounded.'], over: ['Home before dawn after all.', 'The road will keep.'] },
      // signature: an S-bend lane up to a castle hole, three flying bats, a slow ball, and a kickback on the left drain
      layout: { g: 31, noArc: true, kickback: true, droneStyle: 'bat', dronePoints: 500, upper: [[7.4, 38.0, 1.0, 'spiral2'], [9.4, 31.8, 0.85, 'spiral']], lower: [],
        drones: [[9.0, 34.3, 1.7, 0.9, 1], [12.0, 39.0, 1.8, -1.1, 1], [9.4, 13.6, 3.0, 1.0, 0]],
        walls: [[8.5, 17.0, 7.3, 19.2, 0], [7.3, 19.2, 9.7, 21.6, 0], [9.7, 21.6, 8.6, 23.4, 0], [10.4, 17.0, 9.2, 19.2, 0], [9.2, 19.2, 11.6, 21.6, 0], [11.6, 21.6, 10.5, 23.4, 0]],
        saucers: [{ id: 'castle', x: 9.55, y: 24.55, label: 'Castle', points: 4000, hour: true, eject: [9, -3] }] } }
  ];
  // typography: gothic tables keep the playful display face; the other three get type that suits their artwork
  const TYPE = {
    fell: { display: '"Griffy", "IM Fell English SC", Georgia, serif', label: '"IM Fell English SC", "Griffy", Georgia, serif', weight: '', scale: 1, apron: '74px' },
    tech: { display: '"Orbitron", "Arial Narrow", Arial, sans-serif', label: '"Orbitron", "Arial Narrow", Arial, sans-serif', weight: '700 ', scale: 0.72, apron: '700 48px' },
    type: { display: '"Special Elite", "Courier New", monospace', label: '"Special Elite", "Courier New", monospace', weight: '', scale: 0.82, apron: '54px' },
    carved: { display: '"Cinzel", "Times New Roman", serif', label: '"Cinzel", "Times New Roman", serif', weight: '700 ', scale: 0.74, apron: '700 52px' }
  };
  for (const t of T) t.type = TYPE[t.font] || TYPE.fell;
  for (const t of T) { t.art = 'art/' + t.id + '.webp'; t.thumb = 'thumbs/' + t.id + '.webp'; t.track = 'music/' + t.id + '.mp3'; if (!t.layout.letters) t.layout.letters = t.w.letters; if (!t.w.set) t.w.set = t.w.letters.split('').join('-'); }
  (typeof window !== 'undefined' ? window : globalThis).WHThemes = T;
})();
