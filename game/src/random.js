// A tiny seeded random generator (mulberry32): the same seed always gives the same
// orders, so a screenshot scene and a replayed game are byte-for-byte reproducible.
// Nothing in the game reads Math.random or the clock for game state.

/** Make a generator from a 32-bit seed. */
export function createRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick an element of `list` with the generator. */
export function pick(random, list) {
  return list[Math.floor(random() * list.length)];
}

/** An integer in [min, max] from the generator. */
export function intBetween(random, min, max) {
  return min + Math.floor(random() * (max - min + 1));
}
