// The kitchen's state and rules: orders, chopping, cooking, plating and serving.
// Nothing here touches the screen or the keyboard; render.js draws this state and
// input.js feeds it movement. Every number comes from config.js; every order from the
// seeded generator, so the same seed plays the same shift.

import {
  ASSEMBLY,
  BIN,
  BOARDS,
  BURN_SECONDS,
  CHEF,
  CHOP_SECONDS,
  COOK_SECONDS,
  CRATES,
  DISHES,
  DISH_IDS,
  FIELD,
  HEARTS,
  INGREDIENTS,
  MAX_ORDERS,
  ORDER_GAP,
  ORDER_GAP_RUSH,
  ORDER_TIME,
  ORDER_TIME_RUSH,
  PLATE_SLOTS,
  PLATE_STACK,
  REACH,
  RUSH_AT,
  SHIFT_SECONDS,
  STARS,
  STOVES,
  TIP_BONUS,
  TIP_FRACTION,
  WINDOW,
} from './config.js';
import { pick } from './random.js';

export const EVENT_NONE = 0;
export const EVENT_SERVE = 1;
export const EVENT_EXPIRE = 2;
export const EVENT_WRONG = 4;
export const EVENT_OVER = 8;
export const EVENT_BURN = 16;
export const EVENT_PICK = 32;

/** Which dish, if any, a plate's ingredients make (order does not matter). */
export function dishOf(items) {
  for (const id of DISH_IDS) {
    const need = DISHES[id].ingredients;
    if (need.length === items.length && need.every((type) => items.includes(type))) return id;
  }
  return null;
}

/** True when an ingredient has finished every stage it needs. */
export function isReady(item) {
  return item !== null && item.done >= INGREDIENTS[item.type].stages.length;
}

/** True when the item's next stage is the named work ('chop' or 'cook'). */
export function needsStage(item, stage) {
  if (item === null) return false;
  const stages = INGREDIENTS[item.type].stages;
  return item.done < stages.length && stages[item.done] === stage;
}

/** A fresh ingredient, straight from its crate. */
export function freshIngredient(type) {
  return { type, done: 0 };
}

/** A fresh empty plate. */
export function freshPlate() {
  return { kind: 'plate', items: [] };
}

/** Solid furniture the chef walks around (crates counter, boards, stoves, table, window, bin). */
function solids() {
  const list = [
    { x: 16, y: 120, w: 196, h: 540 },
    ...BOARDS,
    ...STOVES,
    ASSEMBLY,
    WINDOW,
    BIN,
  ];
  return list;
}

/** Distance from a point to the nearest point of a rectangle. */
function distanceToRect(x, y, rect) {
  const cx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  return Math.hypot(x - cx, y - cy);
}

export function createWorld(random) {
  const state = {
    time: 0,
    shiftLeft: SHIFT_SECONDS,
    hearts: HEARTS,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    servedWrong: 0,
    orders: [],
    orderSeq: 0,
    nextOrderIn: 2,
    chef: { x: 480, y: 560, carrying: null },
    boards: BOARDS.map(() => ({ item: null, progress: 0 })),
    stoves: STOVES.map(() => ({ item: null, progress: 0, done: false, burnLeft: 0, burnt: false })),
    plates: PLATE_SLOTS.map(() => ({ plate: null })),
    windowDish: null,
    windowTimer: 0,
    message: '',
    messageTimer: 0,
    over: false,
    stars: 0,
  };

  function say(text) {
    state.message = text;
    state.messageTimer = 2.5;
  }

  function spawnOrder() {
    if (state.orders.length >= MAX_ORDERS) return;
    const rush = state.shiftLeft <= RUSH_AT;
    const maxTime = rush ? ORDER_TIME_RUSH : ORDER_TIME;
    state.orderSeq += 1;
    state.orders.push({
      id: state.orderSeq,
      dish: pick(random, DISH_IDS),
      timeLeft: maxTime,
      maxTime,
    });
  }

  function endShift() {
    state.over = true;
    state.stars = STARS.reduce((count, need) => (state.coins >= need ? count + 1 : count), 0);
  }

  /** The station nearest the chef that can be used right now, or null. */
  function nearestStation() {
    const chef = state.chef;
    const candidates = [];
    for (const crate of CRATES) {
      candidates.push({ kind: 'crate', type: crate.type, rect: { x: crate.x - 42, y: crate.y - 42, w: 84, h: 84 } });
    }
    state.boards.forEach((board, index) => {
      candidates.push({ kind: 'board', index, rect: BOARDS[index] });
    });
    state.stoves.forEach((stove, index) => {
      candidates.push({ kind: 'stove', index, rect: STOVES[index] });
    });
    state.plates.forEach((slot, index) => {
      candidates.push({ kind: 'plate', index, rect: { x: PLATE_SLOTS[index].x - 8, y: PLATE_SLOTS[index].y - 8, w: 96, h: 96 } });
    });
    candidates.push({ kind: 'stack', rect: { x: PLATE_STACK.x - 40, y: PLATE_STACK.y - 40, w: 80, h: 80 } });
    candidates.push({ kind: 'window', rect: WINDOW });
    candidates.push({ kind: 'bin', rect: BIN });
    let best = null;
    let bestDistance = Infinity;
    for (const candidate of candidates) {
      const distance = distanceToRect(chef.x, chef.y, candidate.rect);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = candidate;
      }
    }
    return bestDistance <= REACH ? best : null;
  }

  /** Use the nearest station. Returns an event bitmask. */
  function interact() {
    const station = nearestStation();
    const chef = state.chef;
    if (station === null) return EVENT_NONE;
    const carrying = chef.carrying;

    if (station.kind === 'crate') {
      if (carrying !== null) { say('Tangan penuh! Buang dulu atau letakkan.'); return EVENT_NONE; }
      chef.carrying = { kind: 'ingredient', ...freshIngredient(station.type) };
      return EVENT_PICK;
    }

    if (station.kind === 'board') {
      const board = state.boards[station.index];
      if (board.item === null && carrying !== null && carrying.kind === 'ingredient' && needsStage(carrying, 'chop')) {
        board.item = carrying;
        board.progress = 0;
        chef.carrying = null;
        return EVENT_PICK;
      }
      if (board.item !== null && board.progress >= 1 && carrying === null) {
        chef.carrying = { kind: 'ingredient', type: board.item.type, done: board.item.done };
        board.item = null;
        board.progress = 0;
        return EVENT_PICK;
      }
      if (board.item !== null && board.progress < 1) say('Masih dicincang… tunggu sebentar.');
      else if (carrying !== null && carrying.kind === 'ingredient' && !needsStage(carrying, 'chop')) say('Bahan ini tidak perlu dicincang.');
      return EVENT_NONE;
    }

    if (station.kind === 'stove') {
      const stove = state.stoves[station.index];
      if (stove.item === null && carrying !== null && carrying.kind === 'ingredient' && needsStage(carrying, 'cook')) {
        stove.item = carrying;
        stove.progress = 0;
        stove.done = false;
        stove.burnt = false;
        chef.carrying = null;
        return EVENT_PICK;
      }
      if (stove.item !== null && stove.done && carrying === null) {
        chef.carrying = { kind: 'ingredient', type: stove.item.type, done: stove.item.done };
        stove.item = null;
        stove.progress = 0;
        stove.done = false;
        return EVENT_PICK;
      }
      if (stove.item !== null && !stove.done) say('Masih dimasak… tunggu sampai matang.');
      else if (carrying !== null && carrying.kind === 'ingredient' && !needsStage(carrying, 'cook')) say('Bahan ini tidak perlu dimasak.');
      return EVENT_NONE;
    }

    if (station.kind === 'plate') {
      const slot = state.plates[station.index];
      if (slot.plate === null && carrying !== null && carrying.kind === 'plate') {
        slot.plate = carrying;
        chef.carrying = null;
        return EVENT_PICK;
      }
      if (slot.plate !== null && carrying === null) {
        chef.carrying = slot.plate;
        slot.plate = null;
        return EVENT_PICK;
      }
      if (slot.plate !== null && carrying !== null && carrying.kind === 'ingredient' && isReady(carrying)) {
        if (slot.plate.items.includes(carrying.type)) { say('Bahan itu sudah ada di piring.'); return EVENT_NONE; }
        if (slot.plate.items.length >= 3) { say('Piring sudah penuh.'); return EVENT_NONE; }
        slot.plate.items.push(carrying.type);
        chef.carrying = null;
        return EVENT_PICK;
      }
      if (carrying !== null && carrying.kind === 'ingredient' && !isReady(carrying)) say('Olah dulu bahannya (cincang/masak).');
      return EVENT_NONE;
    }

    if (station.kind === 'stack') {
      if (carrying === null) {
        chef.carrying = freshPlate();
        return EVENT_PICK;
      }
      say('Tangan penuh!');
      return EVENT_NONE;
    }

    if (station.kind === 'window') {
      if (carrying === null || carrying.kind !== 'plate') { say('Bawa piring lengkap ke sini.'); return EVENT_NONE; }
      const dish = dishOf(carrying.items);
      if (dish === null) { say('Piring belum lengkap — cek resepnya!'); return EVENT_WRONG; }
      const orderIndex = state.orders.findIndex((order) => order.dish === dish);
      if (orderIndex === -1) { say('Tidak ada yang pesan ' + DISHES[dish].name + ' sekarang.'); return EVENT_WRONG; }
      const order = state.orders[orderIndex];
      state.orders.splice(orderIndex, 1);
      const tip = order.timeLeft > order.maxTime * TIP_FRACTION;
      const pay = DISHES[dish].coins + (tip ? Math.round(DISHES[dish].coins * TIP_BONUS) : 0);
      state.coins += pay;
      state.combo += 1;
      state.bestCombo = Math.max(state.bestCombo, state.combo);
      state.served += 1;
      state.windowDish = dish;
      state.windowTimer = 3;
      chef.carrying = null;
      say(tip ? `Tersaji! +${pay} koin (termasuk tip!)` : `Tersaji! +${pay} koin`);
      return EVENT_SERVE;
    }

    if (station.kind === 'bin') {
      if (carrying !== null) {
        chef.carrying = null;
        return EVENT_PICK;
      }
      return EVENT_NONE;
    }
    return EVENT_NONE;
  }

  /** Move the chef, pushing out of solid furniture. */
  function move(dx, dy) {
    const chef = state.chef;
    const list = solids();
    const next = { x: chef.x + dx, y: chef.y + dy };
    next.x = Math.max(8 + CHEF.radius, Math.min(FIELD.width - 8 - CHEF.radius, next.x));
    next.y = Math.max(FIELD.kitchenTop + 8 + CHEF.radius, Math.min(FIELD.height - 8 - CHEF.radius, next.y));
    for (const rect of list) {
      const left = rect.x - CHEF.radius;
      const right = rect.x + rect.w + CHEF.radius;
      const top = rect.y - CHEF.radius;
      const bottom = rect.y + rect.h + CHEF.radius;
      if (next.x > left && next.x < right && next.y > top && next.y < bottom) {
        const pushLeft = next.x - left;
        const pushRight = right - next.x;
        const pushTop = next.y - top;
        const pushBottom = bottom - next.y;
        const smallest = Math.min(pushLeft, pushRight, pushTop, pushBottom);
        if (smallest === pushLeft) next.x = left;
        else if (smallest === pushRight) next.x = right;
        else if (smallest === pushTop) next.y = top;
        else next.y = bottom;
      }
    }
    chef.x = next.x;
    chef.y = next.y;
  }

  /** Advance the world one fixed step. `input` is {dx, dy, interact}. */
  function step(dt, input) {
    if (state.over) return EVENT_NONE;
    let events = EVENT_NONE;
    state.time += dt;
    state.shiftLeft -= dt;
    if (state.messageTimer > 0) {
      state.messageTimer -= dt;
      if (state.messageTimer <= 0) state.message = '';
    }
    if (state.windowTimer > 0) {
      state.windowTimer -= dt;
      if (state.windowTimer <= 0) state.windowDish = null;
    }

    const speed = CHEF.speed * dt;
    if (input.dx !== 0 || input.dy !== 0) {
      const length = Math.hypot(input.dx, input.dy);
      move((input.dx / length) * speed, (input.dy / length) * speed);
    }
    if (input.interact) events |= interact();

    // Chopping and cooking run on their own once an item is placed.
    for (const board of state.boards) {
      if (board.item !== null && board.progress < 1) {
        board.progress += dt / CHOP_SECONDS;
        if (board.progress >= 1) {
          board.progress = 1;
          board.item.done += 1;
        }
      }
    }
    for (const stove of state.stoves) {
      if (stove.item === null) continue;
      if (!stove.done) {
        stove.progress += dt / COOK_SECONDS;
        if (stove.progress >= 1) {
          stove.progress = 1;
          stove.done = true;
          stove.item.done += 1;
          stove.burnLeft = BURN_SECONDS;
        }
      } else if (!stove.burnt) {
        stove.burnLeft -= dt;
        if (stove.burnLeft <= 0) {
          stove.burnt = true;
          events |= EVENT_BURN;
          say('Gosong! Buang ke tempat sampah.');
        }
      }
    }

    // Orders tick down; an expired ticket costs a heart.
    for (let index = state.orders.length - 1; index >= 0; index -= 1) {
      const order = state.orders[index];
      order.timeLeft -= dt;
      if (order.timeLeft <= 0) {
        state.orders.splice(index, 1);
        state.hearts -= 1;
        state.combo = 0;
        events |= EVENT_EXPIRE;
        say('Pelanggan pergi — order hangus!');
        if (state.hearts <= 0) {
          endShift();
          return events | EVENT_OVER;
        }
      }
    }

    // New orders arrive on schedule; the rush doubles the pace.
    state.nextOrderIn -= dt;
    if (state.nextOrderIn <= 0) {
      spawnOrder();
      state.nextOrderIn = state.shiftLeft <= RUSH_AT ? ORDER_GAP_RUSH : ORDER_GAP;
    }

    if (state.shiftLeft <= 0) {
      state.shiftLeft = 0;
      endShift();
      return events | EVENT_OVER;
    }
    return events;
  }

  function reset() {
    const fresh = createWorld(random);
    for (const key of Object.keys(state)) {
      if (key === 'chef') {
        state.chef.x = fresh.state.chef.x;
        state.chef.y = fresh.state.chef.y;
        state.chef.carrying = null;
      } else {
        state[key] = fresh.state[key];
      }
    }
  }

  return { state, step, reset, interact, nearestStation, spawnOrder, say };
}
