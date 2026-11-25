// Keyboard and mouse: WASD or arrows to move, E or a click to use a station,
// Space to start or restart, P or Escape to pause. The game reads a direction vector
// and edge-triggered actions each frame, so holding a key never double-fires.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_INTERACT = 4;

const MOVE_KEYS = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  KeyA: [-1, 0],
  KeyD: [1, 0],
  KeyW: [0, -1],
  KeyS: [0, 1],
};

export function createInput(canvas) {
  const held = new Set();
  let actions = 0;
  let click = null;

  function onKeyDown(event) {
    if (event.repeat) return;
    if (event.code in MOVE_KEYS) {
      held.add(event.code);
      event.preventDefault();
    } else if (event.code === 'KeyE') {
      actions |= ACTION_INTERACT;
      event.preventDefault();
    } else if (event.code === 'Space' || event.code === 'Enter') {
      actions |= ACTION_CONFIRM;
      event.preventDefault();
    } else if (event.code === 'KeyP' || event.code === 'Escape') {
      actions |= ACTION_PAUSE;
      event.preventDefault();
    }
  }

  function onKeyUp(event) {
    held.delete(event.code);
  }

  function onPointerDown(event) {
    const rect = canvas.getBoundingClientRect();
    click = {
      x: ((event.clientX - rect.left) / rect.width) * 1280,
      y: ((event.clientY - rect.top) / rect.height) * 720,
    };
    actions |= ACTION_INTERACT;
  }

  function onBlur() {
    held.clear();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('blur', onBlur);

  /** The movement direction this frame, from the keys held down. */
  function direction() {
    let dx = 0;
    let dy = 0;
    for (const code of held) {
      const move = MOVE_KEYS[code];
      if (move !== undefined) {
        dx += move[0];
        dy += move[1];
      }
    }
    return { dx, dy };
  }

  /** Actions pressed since the last call, then cleared. */
  function takeActions() {
    const taken = actions;
    actions = 0;
    return taken;
  }

  /** The last click's kitchen coordinates (or null), then cleared. */
  function takeClick() {
    const taken = click;
    click = null;
    return taken;
  }

  return { direction, takeActions, takeClick };
}
