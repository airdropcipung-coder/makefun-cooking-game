// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps (several in a slow frame, none in a fast one), and the renderer paints what is
// there. The game moves between four screens: title, play, paused and game over.
//
// ?seed=N fixes the order pattern. ?shot=start|play|rush|end (with &seed=N) stages that
// scene instead of running the loop, paints it twice and sets window.__shotReady for a
// screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_BURN, EVENT_EXPIRE, EVENT_NONE, EVENT_OVER, EVENT_SERVE, EVENT_WRONG } from './world.js';
import { ACTION_CONFIRM, ACTION_INTERACT, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';
import { sounds } from './audio.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : 20261125;

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, null);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // A tiny debug handle for local play-testing (state inspection, no gameplay effect).
  window.__warung = { world, get screen() { return screen; } };

  // Screen readers (and anyone watching the page's text) hear the screen changes.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Bermain. Shift 3 menit — sajikan order sebelum waktunya habis.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.coins > best) {
      best = world.state.coins;
      saveBest(best);
    }
    announce(`Shift selesai. Koin ${world.state.coins}, ${world.state.served} hidangan tersaji.`);
  }

  function playSounds(events) {
    if (events & EVENT_SERVE) sounds.coin();
    else if (events & EVENT_EXPIRE) sounds.expire();
    else if (events & EVENT_WRONG) sounds.wrong();
    if (events & EVENT_BURN) sounds.burn();
  }

  function step(actions) {
    const direction = input.direction();
    const click = input.takeClick();
    if (click !== null) sounds.unlock();
    if (actions & ACTION_CONFIRM) sounds.unlock();
    // A click on a station walks the chef toward it, then uses it on arrival.
    let interact = Boolean(actions & ACTION_INTERACT);
    if (click !== null) {
      const chef = world.state.chef;
      const dx = click.x - chef.x;
      const dy = click.y - chef.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 10) {
        // Steer this frame toward the click; the click also counts as interact when close.
        if (distance < 90) interact = true;
        return world.step(STEP, { dx: dx / distance, dy: dy / distance, interact });
      }
      interact = true;
    }
    if (screen === SCREEN_TITLE) {
      if (actions & ACTION_CONFIRM) startGame();
      return EVENT_NONE;
    }
    const events = world.step(STEP, { dx: direction.dx, dy: direction.dy, interact });
    playSounds(events);
    if (events & EVENT_OVER) endGame();
    return events;
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    const actions = input.takeActions();
    if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Jeda.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Bermain.');
    }
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      // Edge-triggered actions fire on the first step only, never twice in one frame.
      let firstStep = true;
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step(firstStep ? actions : 0);
        firstStep = false;
        accumulator -= STEP;
      }
    } else if (screen === SCREEN_OVER && actions & ACTION_CONFIRM) {
      startGame();
    } else {
      accumulator = 0;
    }
    const station = screen === SCREEN_PLAY ? world.nearestStation() : null;
    renderer.draw(world.state, screen, best, station);
  }

  // Leaving the tab pauses a running game rather than letting orders expire unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Jeda.');
    }
  });

  announce('Warung Bintang. Tekan Spasi atau klik untuk mulai.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
