const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const file = path.join(__dirname, '..', 'index.html');
const html = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const source = html.match(/<script id="game-engine">([\s\S]*?)<\/script>/)?.[1];
const context = vm.createContext({ Math });
if (source) vm.runInContext(source, context);
const engine = context.TetrisEngine;
function game() {
  assert.ok(engine?.Game, 'The playable game engine must exist');
  const g = new engine.Game(() => 0.5);
  g.reset();
  return g;
}
function piece(g, type, matrix, x, y) {
  g.active = { type, matrix, x, y, rotation: 0 };
}

test('starts with an empty playable board and a valid active piece', () => {
  const g = game();
  assert.equal(g.board.length, 20);
  assert.equal(g.board.flat().filter(Boolean).length, 0);
  assert.equal(g.status, 'playing');
  assert.equal(g.collides(g.active.matrix, g.active.x, g.active.y), false);
});
test('seven-piece bags contain each tetromino exactly once', () => {
  const g = game();
  const sequence = [g.active.type];
  for (let i = 0; i < 13; i++) { g.spawn(); sequence.push(g.active.type); }
  assert.equal(new Set(sequence.slice(0, 7)).size, 7);
  assert.equal(new Set(sequence.slice(7, 14)).size, 7);
});
test('movement cannot cross walls, floor or locked cells', () => {
  const g = game();
  piece(g, 'O', [[1,1],[1,1]], 0, 18);
  assert.equal(g.move(-1, 0), false);
  assert.equal(g.move(0, 1), false);
  g.board[18][2] = 'J';
  assert.equal(g.move(1, 0), false);
  assert.equal(g.active.x, 0);
});
test('ghost and hard drop stop at the first obstacle', () => {
  const g = game();
  piece(g, 'O', [[1,1],[1,1]], 4, 0);
  g.board[19][4] = 'J';
  assert.equal(g.ghostY(), 17);
  g.hardDrop();
  assert.equal(g.board[17][4], 'O');
  assert.equal(g.board[18][5], 'O');
  assert.equal(g.board[19][4], 'J');
  assert.equal(g.score, 34);
});
test('soft drop scores once for each successfully traversed cell', () => {
  const g = game();
  piece(g, 'O', [[1,1],[1,1]], 4, 17);
  g.softDrop(); g.softDrop();
  assert.equal(g.score, 1);
  assert.equal(g.active.y, 18);
});
test('four rotations return the original shape', () => {
  const g = game();
  piece(g, 'T', [[0,1,0],[1,1,1],[0,0,0]], 4, 5);
  const original = JSON.stringify(g.active.matrix);
  for (let i = 0; i < 4; i++) assert.equal(g.rotate(1), true);
  assert.equal(JSON.stringify(g.active.matrix), original);
});
test('rotation uses a wall kick rather than crossing the left boundary', () => {
  const g = game();
  piece(g, 'T', [[0,1,0],[0,1,1],[0,1,0]], -1, 5);
  g.active.rotation = 1;
  assert.equal(g.rotate(1), true);
  assert.equal(g.active.x, 0);
  assert.equal(g.collides(g.active.matrix, g.active.x, g.active.y), false);
});
test('a full row clears and the row above falls into its place', () => {
  const g = game();
  g.board[19].fill('J'); g.board[19][4] = 0; g.board[19][5] = 0;
  piece(g, 'O', [[1,1],[1,1]], 4, 18);
  g.hardDrop();
  assert.equal(g.lines, 1);
  assert.equal(g.score, 100);
  assert.equal(g.board[19][4], 'O');
  assert.equal(g.board[19][0], 0);
  assert.equal(g.board.length, 20);
});
test('clearing four rows awards 800 points and advances level at ten lines', () => {
  const g = game();
  g.lines = 6;
  for (let y = 16; y < 20; y++) { g.board[y].fill('J'); g.board[y][4] = 0; }
  piece(g, 'I', [[1],[1],[1],[1]], 4, 16);
  g.hardDrop();
  assert.equal(g.score, 800);
  assert.equal(g.lines, 10);
  assert.equal(g.level, 2);
  assert.equal(g.board.flat().filter(Boolean).length, 0);
});
test('pause freezes movement, rotation, drops and gravity', () => {
  const g = game();
  g.togglePause();
  const before = JSON.stringify([g.board, g.active, g.score]);
  g.move(1,0); g.rotate(1); g.softDrop(); g.hardDrop(); g.tick(5000);
  assert.equal(JSON.stringify([g.board, g.active, g.score]), before);
  g.togglePause();
  assert.equal(g.status, 'playing');
});
test('grounded pieces lock only after a short lock delay', () => {
  const g = game();
  piece(g, 'O', [[1,1],[1,1]], 4, 18);
  g.tick(400);
  assert.equal(g.board[19][4], 0);
  g.tick(101);
  assert.equal(g.board[19][4], 'O');
});
test('gravity advances an airborne piece without awarding drop points', () => {
  const g = game();
  const before = g.active.y;
  g.tick(1000);
  assert.ok(g.active.y > before);
  assert.equal(g.score, 0);
});
test('a blocked spawn ends the game instead of overwriting cells', () => {
  const g = game();
  g.board[0].fill('Z'); g.board[1].fill('Z');
  g.spawn();
  assert.equal(g.status, 'over');
  assert.ok(g.board[0].every(cell => cell === 'Z'));
});
test('restart clears previous board, score, level and paused status', () => {
  const g = game();
  g.hardDrop(); g.lines = 20; g.level = 3; g.togglePause(); g.reset();
  assert.equal(g.score, 0);
  assert.equal(g.lines, 0);
  assert.equal(g.level, 1);
  assert.equal(g.status, 'playing');
  assert.equal(g.board.flat().filter(Boolean).length, 0);
});
