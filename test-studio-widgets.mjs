import assert from 'node:assert/strict';
import { createSignalHunt, practiceRhythm } from './dist/studio-widgets.js';

// A delayed render must not allow scoring after the real transmission deadline.
{
  const game = createSignalHunt(125);
  game.start(1000);
  const amber = game.spawn(1000);
  assert.equal(game.hit(amber.id, 1200), 10);
  assert.equal(game.hit(amber.id, 1201), 0, 'a signal scores once');
  const blue = game.spawn(1250, true);
  assert.equal(game.hit(blue.id, 1400), 50, 'blue signals use the earned multiplier');
  const late = game.spawn(30000, true);
  assert.equal(game.hit(late.id, 31000), 0, 'deadline wins even before the interval runs');
  assert.equal(game.snapshot().score, 60);
  assert.equal(game.snapshot().best, 125, 'a lower score preserves the stored best');
  assert.equal(game.snapshot().running, false);
  assert.equal(game.snapshot().targets.length, 0);
}

// Expiry resets the streak, active targets stay bounded and restart invalidates old controls.
{
  const game = createSignalHunt();
  game.start(0);
  const first = game.spawn(0);
  game.hit(first.id, 100);
  const stale = game.spawn(100);
  game.spawn(100); game.spawn(100);
  assert.equal(game.spawn(100), null, 'at most three simultaneous targets');
  assert.equal(game.hit(stale.id, 1450), 0, 'expired targets cannot score');
  assert.equal(game.snapshot().streak, 1);
  const fresh = game.spawn(1450);
  assert.equal(game.hit(fresh.id, 1500), 10);
  const oldRound = game.spawn(1500);
  game.start(2000);
  assert.equal(game.hit(oldRound.id, 2001), 0);
  assert.equal(game.snapshot().score, 0);
  const current = game.spawn(2001);
  game.stop();
  assert.equal(game.hit(current.id, 2002), 0, 'closed or hidden games stop accepting input');
  assert.equal(game.snapshot().targets.length, 0);
  assert.equal(game.snapshot().best, 20, 'restart and stop preserve the best');
}

{
  const game = createSignalHunt(Number.MAX_VALUE);
  game.start(0);
  for (let i = 0; i < 10; i++) game.hit(game.spawn(i).id, i);
  assert.equal(game.snapshot().streak, 5, 'streak has a readable five-times cap');
  assert.equal(game.snapshot().score, 400);
  assert.equal(game.snapshot().best, 400, 'invalid stored best does not poison a new score');
}

// Every selectable session allocates the full time, including rounding at five-minute steps.
for (let total = 30; total <= 120; total += 5) {
  const plan = practiceRhythm(total);
  assert.equal(plan.total, total);
  assert.equal(plan.practice + plan.review + plan.breaks, total);
  assert.ok(plan.practice > plan.review && plan.review >= plan.breaks && plan.breaks > 0);
}
assert.deepEqual(practiceRhythm(60), { total: 60, practice: 36, review: 15, breaks: 9 });
assert.equal(practiceRhythm(-10).total, 30);
assert.equal(practiceRhythm(1000).total, 120);
assert.equal(practiceRhythm('invalid').total, 60);
console.log('Studio widget scoring, lifecycle and practice allocation checks passed.');
