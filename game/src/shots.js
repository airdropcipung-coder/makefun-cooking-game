// The screenshot scenes behind ?shot=start|play|rush|end. Each one stages a real,
// reachable game state through the world's own fields — orders on the board, food
// on the stove and the board, a plate mid-assembly and one ready to serve — then the
// renderer paints it, so the frame is what the game really looks like at that
// moment. The same seed always gives the same frame.

import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

/** Put a ticket for `dish` on the board with `timeLeft` seconds remaining. */
function addOrder(world, dish, timeLeft, maxTime) {
  const state = world.state;
  state.orderSeq += 1;
  state.orders.push({ id: state.orderSeq, dish, timeLeft, maxTime });
}

/** Put an ingredient on a board: `done` stages finished, `progress` into the next. */
function boardItem(world, index, type, done, progress) {
  world.state.boards[index] = { item: { type, done }, progress };
}

/** Put an ingredient on a stove: progress 0..1, `done` when cooked, `burnt` when ruined. */
function stoveItem(world, index, type, done, progress, isDone, burnt, burnLeft) {
  world.state.stoves[index] = {
    item: { type, done },
    progress,
    done: isDone,
    burnLeft: burnLeft ?? 0,
    burnt: burnt ?? false,
  };
}

/** Put a plate with `items` on an assembly slot. */
function plateOnTable(world, index, items) {
  world.state.plates[index] = { plate: { kind: 'plate', items: [...items] } };
}

/**
 * Set `world` to the named scene (start, play, rush or end; any other name is start)
 * and return the screen to draw over it and the best coins to show.
 */
export function stageShot(name, world) {
  const state = world.state;
  world.reset();
  if (name === 'play') {
    state.shiftLeft = 107;
    state.time = 73;
    state.coins = 840;
    state.combo = 2;
    state.bestCombo = 3;
    state.served = 6;
    state.hearts = 3;
    addOrder(world, 'nasgor', 40, 75);
    addOrder(world, 'mieayam', 18, 75);
    addOrder(world, 'sateayam', 55, 75);
    state.chef.x = 520;
    state.chef.y = 540;
    state.chef.carrying = { kind: 'ingredient', type: 'ayam', done: 2 };
    boardItem(world, 0, 'sawi', 1, 1);
    stoveItem(world, 0, 'mie', 0, 0.6, false, false, 0);
    stoveItem(world, 1, 'telur', 0, 0.85, false, false, 0);
    plateOnTable(world, 0, ['nasi', 'telur']);
    state.windowDish = 'sateayam';
    state.windowTimer = 3;
    state.message = 'Tersaji! +260 koin';
    state.messageTimer = 2.5;
    return { screen: SCREEN_PLAY, best: 1240 };
  }
  if (name === 'rush') {
    state.shiftLeft = 42;
    state.time = 138;
    state.coins = 1420;
    state.combo = 3;
    state.bestCombo = 4;
    state.served = 10;
    state.hearts = 2;
    addOrder(world, 'nasgor', 12, 55);
    addOrder(world, 'mieayam', 9, 55);
    addOrder(world, 'sateayam', 38, 55);
    addOrder(world, 'nasgor', 48, 55);
    state.chef.x = 340;
    state.chef.y = 345;
    state.chef.carrying = null;
    boardItem(world, 0, 'ayam', 0, 0.5);
    boardItem(world, 1, 'sawi', 1, 1);
    stoveItem(world, 0, 'sate', 1, 1, true, true, 0);
    stoveItem(world, 1, 'mie', 0, 0.8, false, false, 0);
    plateOnTable(world, 0, ['mie', 'ayam']);
    state.message = 'RUSH! Order datang 2x lebih cepat!';
    state.messageTimer = 2.5;
    return { screen: SCREEN_PLAY, best: 1680 };
  }
  if (name === 'end') {
    state.shiftLeft = 0;
    state.time = 180;
    state.coins = 2140;
    state.combo = 0;
    state.bestCombo = 4;
    state.served = 14;
    state.hearts = 2;
    state.over = true;
    state.stars = 3;
    state.windowDish = 'mieayam';
    state.windowTimer = 3;
    return { screen: SCREEN_OVER, best: 1890 };
  }
  // The title scene: a quiet kitchen behind the title card, one order waiting.
  addOrder(world, 'nasgor', 70, 75);
  return { screen: SCREEN_TITLE, best: 1890 };
}
