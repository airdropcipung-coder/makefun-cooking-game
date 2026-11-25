// Every pixel the game shows, drawn on one canvas from the world state: the tiled
// kitchen floor, the counters and stations, the chef, the order board and the HUD.
// The same draw path paints live play and the staged screenshot scenes, so a
// screenshot is always a real frame of the game.

import {
  ASSEMBLY,
  BIN,
  BOARDS,
  CHEF,
  CRATES,
  DISHES,
  FIELD,
  FONT,
  INGREDIENTS,
  PALETTE,
  PLATE_SLOTS,
  PLATE_STACK,
  RUSH_AT,
  STOVES,
  WINDOW,
} from './config.js';
import { dishOf, isReady } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, value, x, y, size, color, weight, align) {
  ctx.fillStyle = color;
  ctx.font = `${weight ?? 700} ${size}px ${FONT}`;
  ctx.textAlign = align ?? 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

/** One ingredient's little picture, centred at (x, y) with radius r. */
export function drawIngredient(ctx, type, x, y, r) {
  const spec = INGREDIENTS[type];
  ctx.save();
  ctx.translate(x, y);
  if (type === 'nasi') {
    ctx.fillStyle = '#e8e0cc';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.25, r, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = spec.dark;
    ctx.lineWidth = r * 0.1;
    ctx.stroke();
    ctx.fillStyle = spec.color;
    ctx.beginPath();
    ctx.arc(0, -r * 0.1, r * 0.85, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = spec.dark;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.arc(-r * 0.5 + i * r * 0.25, -r * 0.35 - (i % 2) * r * 0.15, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === 'telur') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = spec.color;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2a93b';
    ctx.beginPath();
    ctx.arc(r * 0.15, -r * 0.15, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'kecap') {
    ctx.fillStyle = spec.color;
    roundRect(ctx, -r * 0.45, -r * 0.5, r * 0.9, r * 1.3, r * 0.3);
    ctx.fill();
    ctx.fillStyle = '#2a1a0c';
    roundRect(ctx, -r * 0.22, -r, r * 0.44, r * 0.6, r * 0.15);
    ctx.fill();
    ctx.fillStyle = '#e8b13c';
    ctx.fillRect(-r * 0.45, -r * 0.05, r * 0.9, r * 0.4);
  } else if (type === 'mie') {
    ctx.strokeStyle = spec.color;
    ctx.lineWidth = r * 0.22;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.8, -r * 0.5 + i * r * 0.5);
      ctx.quadraticCurveTo(0, -r * 0.9 + i * r * 0.5, r * 0.8, -r * 0.5 + i * r * 0.5);
      ctx.stroke();
    }
    ctx.strokeStyle = spec.dark;
    ctx.lineWidth = r * 0.1;
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, r * 0.1);
    ctx.quadraticCurveTo(0, -r * 0.3, r * 0.8, r * 0.1);
    ctx.stroke();
  } else if (type === 'ayam') {
    ctx.fillStyle = spec.color;
    ctx.beginPath();
    ctx.arc(-r * 0.1, -r * 0.1, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f7ead9';
    ctx.beginPath();
    ctx.arc(r * 0.55, r * 0.55, r * 0.22, 0, Math.PI * 2);
    ctx.arc(r * 0.75, r * 0.3, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f7ead9';
    ctx.lineWidth = r * 0.2;
    ctx.beginPath();
    ctx.moveTo(r * 0.35, r * 0.35);
    ctx.lineTo(r * 0.65, r * 0.5);
    ctx.stroke();
  } else if (type === 'sawi') {
    ctx.fillStyle = spec.color;
    for (let i = 0; i < 3; i += 1) {
      ctx.save();
      ctx.rotate((i - 1) * 0.7);
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.45, r * 0.4, r * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = spec.dark;
    ctx.lineWidth = r * 0.12;
    ctx.beginPath();
    ctx.moveTo(0, r * 0.6);
    ctx.lineTo(0, -r * 0.2);
    ctx.stroke();
  } else if (type === 'sate') {
    ctx.strokeStyle = '#d9b48a';
    ctx.lineWidth = r * 0.14;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.9, i * r * 0.45);
      ctx.lineTo(r * 0.9, i * r * 0.45);
      ctx.stroke();
    }
    ctx.fillStyle = spec.color;
    for (let i = -1; i <= 1; i += 1) {
      for (let j = 0; j < 3; j += 1) {
        roundRect(ctx, -r * 0.55 + j * r * 0.5, i * r * 0.45 - r * 0.2, r * 0.42, r * 0.4, r * 0.1);
        ctx.fill();
      }
    }
  } else if (type === 'lontong') {
    ctx.fillStyle = '#e3d9b8';
    roundRect(ctx, -r * 0.85, -r * 0.45, r * 1.7, r * 0.9, r * 0.45);
    ctx.fill();
    ctx.strokeStyle = spec.dark;
    ctx.lineWidth = r * 0.1;
    ctx.stroke();
    ctx.fillStyle = spec.color;
    roundRect(ctx, -r * 0.7, -r * 0.32, r * 1.4, r * 0.64, r * 0.32);
    ctx.fill();
    ctx.strokeStyle = '#b8a878';
    ctx.lineWidth = r * 0.08;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.4 + i * r * 0.4, -r * 0.32);
      ctx.lineTo(-r * 0.4 + i * r * 0.4, r * 0.32);
      ctx.stroke();
    }
  } else if (type === 'bumbu') {
    ctx.fillStyle = '#f3e2b8';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.1, r, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = spec.color;
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.05, r * 0.8, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a5a1e';
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.arc(-r * 0.4 + i * r * 0.28, -r * 0.1 - (i % 2) * r * 0.12, r * 0.09, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** A plate with its ingredients on it, centred at (x, y) with radius r. */
function drawPlate(ctx, items, x, y, r) {
  ctx.fillStyle = PALETTE.plateRim;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.plate;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.86, 0, Math.PI * 2);
  ctx.fill();
  if (items.length === 1) {
    drawIngredient(ctx, items[0], x, y, r * 0.55);
  } else if (items.length === 2) {
    drawIngredient(ctx, items[0], x - r * 0.32, y, r * 0.42);
    drawIngredient(ctx, items[1], x + r * 0.32, y, r * 0.42);
  } else if (items.length >= 3) {
    drawIngredient(ctx, items[0], x - r * 0.34, y - r * 0.14, r * 0.36);
    drawIngredient(ctx, items[1], x + r * 0.34, y - r * 0.14, r * 0.36);
    drawIngredient(ctx, items[2], x, y + r * 0.34, r * 0.36);
  }
}

/** A progress ring around (x, y): fraction done, red when burning. */
function drawProgressRing(ctx, x, y, r, fraction, color) {
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + fraction * Math.PI * 2);
  ctx.stroke();
}

function drawFloor(ctx) {
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 16; col += 1) {
      ctx.fillStyle = (row + col) % 2 === 0 ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(col * 80, FIELD.kitchenTop + row * 70, 80, 70);
    }
  }
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, FIELD.kitchenTop, FIELD.width, 10);
  // A woven rug in the middle of the kitchen, where the chef runs.
  ctx.fillStyle = '#b8452f';
  roundRect(ctx, 560, 560, 220, 110, 14);
  ctx.fill();
  ctx.fillStyle = '#d96b4a';
  roundRect(ctx, 572, 572, 196, 86, 10);
  ctx.fill();
  ctx.fillStyle = '#b8452f';
  roundRect(ctx, 584, 584, 172, 62, 8);
  ctx.fill();
}

function drawCrates(ctx) {
  ctx.fillStyle = PALETTE.counter;
  roundRect(ctx, 16, 120, 196, 540, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.counterTop;
  roundRect(ctx, 16, 120, 196, 18, 9);
  ctx.fill();
  text(ctx, 'BAHAN', 114, 142, 15, PALETTE.textLight, 800, 'center');
  for (const crate of CRATES) {
    ctx.fillStyle = PALETTE.crate;
    roundRect(ctx, crate.x - 38, crate.y - 38, 76, 76, 10);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    roundRect(ctx, crate.x - 38, crate.y + 22, 76, 16, 8);
    ctx.fill();
    drawIngredient(ctx, crate.type, crate.x, crate.y - 6, 22);
    text(ctx, INGREDIENTS[crate.type].name.toUpperCase(), crate.x, crate.y + 28, 11, '#fff3d6', 800, 'center');
  }
}

function drawBoards(ctx, state) {
  BOARDS.forEach((board, index) => {
    const slot = state.boards[index];
    ctx.fillStyle = '#6b4423';
    roundRect(ctx, board.x - 4, board.y - 4, board.w + 8, board.h + 8, 10);
    ctx.fill();
    ctx.fillStyle = PALETTE.board;
    roundRect(ctx, board.x, board.y, board.w, board.h, 8);
    ctx.fill();
    if (slot.item === null) {
      text(ctx, 'TALENAN', board.x + board.w / 2, board.y + 12, 10, '#7a4a21', 800, 'center');
    }
    if (slot.item !== null) {
      drawIngredient(ctx, slot.item.type, board.x + board.w / 2, board.y + board.h / 2 + 6, 24);
      if (slot.progress < 1) {
        drawProgressRing(ctx, board.x + board.w / 2, board.y + board.h / 2 + 6, 32, slot.progress, PALETTE.warn);
        text(ctx, 'CINCANG…', board.x + board.w / 2, board.y + board.h - 6, 10, '#7a4a21', 800, 'center');
      } else {
        text(ctx, 'SIAP!', board.x + board.w / 2, board.y + board.h - 6, 11, PALETTE.good, 800, 'center');
      }
    } else {
      // A knife resting diagonally on the empty board.
      ctx.save();
      ctx.translate(board.x + board.w / 2, board.y + board.h / 2 + 4);
      ctx.rotate(-0.35);
      ctx.fillStyle = '#cfd6dd';
      roundRect(ctx, -34, -4, 48, 8, 4);
      ctx.fill();
      ctx.fillStyle = '#5e371f';
      roundRect(ctx, 14, -4, 22, 8, 4);
      ctx.fill();
      ctx.restore();
    }
  });
}

function drawStoves(ctx, state) {
  STOVES.forEach((stoveRect, index) => {
    const stove = state.stoves[index];
    ctx.fillStyle = PALETTE.stove;
    roundRect(ctx, stoveRect.x - 4, stoveRect.y - 4, stoveRect.w + 8, stoveRect.h + 8, 10);
    ctx.fill();
    ctx.fillStyle = PALETTE.stoveTop;
    roundRect(ctx, stoveRect.x, stoveRect.y, stoveRect.w, stoveRect.h, 8);
    ctx.fill();
    const cx = stoveRect.x + stoveRect.w / 2;
    const cy = stoveRect.y + stoveRect.h / 2 + 4;
    if (stove.item !== null) {
      // Flame under the pan, brighter while cooking.
      const flame = stove.done ? 0.45 : 1;
      ctx.fillStyle = PALETTE.flame;
      ctx.beginPath();
      ctx.moveTo(cx - 26, cy + 16);
      ctx.quadraticCurveTo(cx - 30, cy - 6 * flame, cx, cy - 22 * flame);
      ctx.quadraticCurveTo(cx + 30, cy - 6 * flame, cx + 26, cy + 16);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = PALETTE.flameCore;
      ctx.beginPath();
      ctx.arc(cx, cy + 8, 10 * flame + 4, 0, Math.PI * 2);
      ctx.fill();
      // The pan.
      ctx.fillStyle = '#22252c';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 2, 34, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a3f4a';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 2, 34, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      drawIngredient(ctx, stove.item.type, cx, cy - 4, 17);
      if (!stove.done) {
        drawProgressRing(ctx, cx, cy - 2, 40, stove.progress, PALETTE.flame);
      } else if (stove.burnt) {
        text(ctx, 'GOSONG!', cx, stoveRect.y + stoveRect.h - 8, 11, PALETTE.bad, 800, 'center');
      } else {
        text(ctx, 'MATANG!', cx, stoveRect.y + stoveRect.h - 8, 11, PALETTE.good, 800, 'center');
        drawProgressRing(ctx, cx, cy - 2, 40, stove.burnLeft / 8, PALETTE.bad);
      }
      if (stove.burnt) {
        ctx.fillStyle = 'rgba(120,120,120,0.55)';
        ctx.beginPath();
        ctx.arc(cx - 8, cy - 34, 10, 0, Math.PI * 2);
        ctx.arc(cx + 6, cy - 46, 13, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.strokeStyle = '#565d6b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.stroke();
    }
    text(ctx, 'KOMPOR', cx, stoveRect.y + 12, 10, '#9aa1ad', 800, 'center');
  });
}

function drawAssembly(ctx, state) {
  ctx.fillStyle = '#6b4423';
  roundRect(ctx, ASSEMBLY.x - 4, ASSEMBLY.y - 4, ASSEMBLY.w + 8, ASSEMBLY.h + 8, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.assemblyTop;
  roundRect(ctx, ASSEMBLY.x, ASSEMBLY.y, ASSEMBLY.w, ASSEMBLY.h, 10);
  ctx.fill();
  text(ctx, 'MEJA RAKIT', ASSEMBLY.x + ASSEMBLY.w / 2, ASSEMBLY.y + 16, 13, '#fff3d6', 800, 'center');
  PLATE_SLOTS.forEach((slot, index) => {
    const held = state.plates[index].plate;
    const cx = slot.x + 40;
    const cy = slot.y + 40;
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 26, 46, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    if (held !== null) {
      drawPlate(ctx, held.items, cx, cy, 38);
      const dish = dishOf(held.items);
      if (dish !== null) {
        text(ctx, DISHES[dish].short + ' ✓', cx, cy + 56, 13, PALETTE.good, 800, 'center');
      } else if (held.items.length > 0) {
        text(ctx, `${held.items.length}/3 BAHAN`, cx, cy + 56, 11, '#fff3d6', 800, 'center');
      }
    } else {
      ctx.strokeStyle = 'rgba(255,243,214,0.7)';
      ctx.setLineDash([6, 5]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 36, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'PIRING', cx, cy, 11, 'rgba(255,243,214,0.9)', 800, 'center');
    }
  });
  // The stack of clean plates.
  ctx.fillStyle = '#d8d2c2';
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.ellipse(PLATE_STACK.x, PLATE_STACK.y - i * 6, 30, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  text(ctx, 'PIRING BERSIH', PLATE_STACK.x, PLATE_STACK.y + 24, 11, '#fff3d6', 800, 'center');
  // A recipe card pinned to the floor just below the table, so the player can check
  // the dishes without it hiding the plate stack.
  ctx.fillStyle = '#fff8e1';
  roundRect(ctx, ASSEMBLY.x + 16, ASSEMBLY.y + 262, ASSEMBLY.w - 32, 44, 8);
  ctx.fill();
  text(ctx, 'NASGOR: nasi+telur+kecap   •   MIE AYAM: mie+ayam+sawi', ASSEMBLY.x + ASSEMBLY.w / 2, ASSEMBLY.y + 278, 10, PALETTE.text, 700, 'center');
  text(ctx, 'SATE: sate+bumbu+lontong', ASSEMBLY.x + ASSEMBLY.w / 2, ASSEMBLY.y + 294, 10, PALETTE.text, 700, 'center');
}

function drawWindow(ctx, state) {
  ctx.fillStyle = '#6b4423';
  roundRect(ctx, WINDOW.x - 4, WINDOW.y - 4, WINDOW.w + 8, WINDOW.h + 8, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.windowBg;
  roundRect(ctx, WINDOW.x, WINDOW.y, WINDOW.w, WINDOW.h, 10);
  ctx.fill();
  text(ctx, 'JENDELA SAJI', WINDOW.x + 14, WINDOW.y + 18, 14, PALETTE.text, 800, 'left');
  // The service bell.
  ctx.fillStyle = '#e0a83c';
  ctx.beginPath();
  ctx.arc(WINDOW.x + 52, WINDOW.y + 62, 18, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(WINDOW.x + 30, WINDOW.y + 62, 44, 6);
  ctx.fillStyle = '#8a6d1f';
  ctx.beginPath();
  ctx.arc(WINDOW.x + 52, WINDOW.y + 40, 4, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, 'ANTAR DI SINI', WINDOW.x + 52, WINDOW.y + 96, 11, PALETTE.text, 800, 'center');
  if (state.windowDish !== null) {
    const dish = DISHES[state.windowDish];
    drawPlate(ctx, dish.ingredients, WINDOW.x + 200, WINDOW.y + 66, 44);
    text(ctx, dish.name.toUpperCase() + ' ✓', WINDOW.x + 200, WINDOW.y + 122, 13, PALETTE.good, 800, 'center');
  } else {
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(WINDOW.x + 200, WINDOW.y + 66, 42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, '—', WINDOW.x + 200, WINDOW.y + 66, 20, 'rgba(0,0,0,0.3)', 800, 'center');
  }
}

function drawBin(ctx) {
  ctx.fillStyle = '#4a4f58';
  roundRect(ctx, BIN.x, BIN.y, BIN.w, BIN.h, 10);
  ctx.fill();
  ctx.fillStyle = '#5d636e';
  roundRect(ctx, BIN.x, BIN.y, BIN.w, 14, 7);
  ctx.fill();
  text(ctx, 'SAMPAH', BIN.x + BIN.w / 2, BIN.y + BIN.h / 2 + 6, 13, '#dfe3e8', 800, 'center');
}

function drawChef(ctx, state) {
  const chef = state.chef;
  const carrying = chef.carrying;
  ctx.save();
  ctx.translate(chef.x, chef.y);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(0, CHEF.radius * 0.85, CHEF.radius, CHEF.radius * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body (apron) and head.
  ctx.fillStyle = PALETTE.chefShirt;
  ctx.beginPath();
  ctx.arc(0, 6, CHEF.radius * 0.85, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.plate;
  ctx.beginPath();
  ctx.ellipse(0, 10, CHEF.radius * 0.55, CHEF.radius * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.chefSkin;
  ctx.beginPath();
  ctx.arc(0, -8, CHEF.radius * 0.62, 0, Math.PI * 2);
  ctx.fill();
  // Chef's hat.
  ctx.fillStyle = PALETTE.chefHat;
  ctx.beginPath();
  ctx.arc(-8, -20, 8, 0, Math.PI * 2);
  ctx.arc(0, -24, 9, 0, Math.PI * 2);
  ctx.arc(8, -20, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-12, -22, 24, 6);
  // Eyes.
  ctx.fillStyle = '#241708';
  ctx.beginPath();
  ctx.arc(-5, -9, 1.8, 0, Math.PI * 2);
  ctx.arc(5, -9, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // What the chef carries, held high above the hat.
  if (carrying !== null) {
    if (carrying.kind === 'ingredient') {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(0, -48, 20, 0, Math.PI * 2);
      ctx.fill();
      drawIngredient(ctx, carrying.type, 0, -48, 13);
      if (!isReady(carrying)) {
        text(ctx, 'OLAH DULU', 0, -70, 10, '#7a4a21', 800, 'center');
      }
    } else {
      drawPlate(ctx, carrying.items, 0, -48, 20);
      const dish = dishOf(carrying.items);
      if (dish !== null) text(ctx, DISHES[dish].short, 0, -72, 11, PALETTE.good, 800, 'center');
    }
  }
  ctx.restore();
}

function drawHighlight(ctx, station) {
  if (station === null) return;
  const rect = station.rect;
  ctx.strokeStyle = PALETTE.highlight;
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  roundRect(ctx, rect.x - 6, rect.y - 6, rect.w + 12, rect.h + 12, 12);
  ctx.stroke();
  ctx.setLineDash([]);
  const labels = {
    crate: 'AMBIL: E',
    board: 'CINCANG: E',
    stove: 'MASAK: E',
    plate: 'PIRING: E',
    stack: 'AMBIL PIRING: E',
    window: 'ANTAR: E',
    bin: 'BUANG: E',
  };
  text(ctx, labels[station.kind] ?? 'E', rect.x + rect.w / 2, rect.y - 12, 12, PALETTE.highlight, 800, 'center');
}

function drawTicket(ctx, order, x, y, w, h) {
  const dish = DISHES[order.dish];
  const fraction = Math.max(0, order.timeLeft / order.maxTime);
  const hot = fraction < 0.33;
  ctx.fillStyle = hot ? PALETTE.ticketHot : PALETTE.ticket;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.fillStyle = dish.color;
  roundRect(ctx, x, y, 6, h, 3);
  ctx.fill();
  text(ctx, dish.name.toUpperCase(), x + 14, y + 14, 13, PALETTE.text, 800, 'left');
  text(ctx, `${dish.coins} koin`, x + w - 10, y + 14, 12, '#8a6d1f', 800, 'right');
  // The dish's ingredients, as little pictures in a row.
  dish.ingredients.forEach((type, index) => {
    drawIngredient(ctx, type, x + 24 + index * 30, y + 36, 11);
  });
  // The ticket's own countdown bar.
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  roundRect(ctx, x + 12, y + h - 14, w - 24, 8, 4);
  ctx.fill();
  ctx.fillStyle = fraction > 0.5 ? PALETTE.good : fraction > 0.33 ? PALETTE.warn : PALETTE.bad;
  roundRect(ctx, x + 12, y + h - 14, (w - 24) * fraction, 8, 4);
  ctx.fill();
  text(ctx, `${Math.ceil(order.timeLeft)} dtk`, x + w - 10, y + h - 26, 11, hot ? PALETTE.bad : '#7a5a2a', 800, 'right');
}

function drawHud(ctx, state) {
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, 0, FIELD.width, FIELD.kitchenTop);
  ctx.fillStyle = PALETTE.hudPanel;
  ctx.fillRect(0, FIELD.kitchenTop - 4, FIELD.width, 4);
  text(ctx, 'WARUNG BINTANG', 16, 22, 20, PALETTE.textLight, 800, 'left');
  text(ctx, 'DAPUR KILAT', 16, 44, 11, PALETTE.muted, 700, 'left');
  // Order board: the tickets.
  text(ctx, 'ORDER', 232, 16, 11, PALETTE.muted, 800, 'left');
  if (state.orders.length === 0) {
    ctx.fillStyle = 'rgba(255,243,196,0.25)';
    roundRect(ctx, 232, 26, 176, 56, 8);
    ctx.fill();
    text(ctx, 'Belum ada order…', 320, 54, 12, PALETTE.muted, 700, 'center');
  } else {
    state.orders.forEach((order, index) => {
      drawTicket(ctx, order, 232 + index * 184, 26, 176, 56);
    });
  }
  // Shift timer, coins, combo, hearts — the right-hand cluster.
  const rush = state.shiftLeft <= RUSH_AT && !state.over;
  text(ctx, 'SHIFT', 1000, 16, 11, PALETTE.muted, 800, 'center');
  text(ctx, formatTime(state.shiftLeft), 1000, 46, 30, rush ? '#ff8a7a' : PALETTE.textLight, 800, 'center');
  if (rush) text(ctx, 'RUSH!', 1000, 74, 12, '#ff8a7a', 800, 'center');
  text(ctx, `KOIN ${state.coins}`, 1120, 30, 20, '#ffd94d', 800, 'left');
  text(ctx, state.combo > 1 ? `COMBO ×${state.combo}` : 'COMBO —', 1120, 56, 13, state.combo > 1 ? '#7ddb8a' : PALETTE.muted, 800, 'left');
  let hearts = '';
  for (let i = 0; i < 3; i += 1) hearts += i < state.hearts ? '♥' : '♡';
  text(ctx, hearts, 1120, 78, 18, '#ff6b6b', 800, 'left');
  // A one-line message under the board (served, expired, hints), on a dark pill
  // so it reads over the light floor.
  if (state.message !== '') {
    ctx.font = `800 15px ${FONT}`;
    const width = ctx.measureText(state.message).width;
    ctx.fillStyle = 'rgba(43,29,18,0.88)';
    roundRect(ctx, FIELD.width / 2 - width / 2 - 14, FIELD.kitchenTop + 8, width + 28, 28, 14);
    ctx.fill();
    text(ctx, state.message, FIELD.width / 2, FIELD.kitchenTop + 22, 15, '#ffe08a', 800, 'center');
  }
}

function drawTitle(ctx, state, best) {
  ctx.fillStyle = 'rgba(24,14,6,0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  text(ctx, 'WARUNG BINTANG', FIELD.width / 2, 150, 64, '#ffd94d', 800, 'center');
  text(ctx, '— DAPUR KILAT —', FIELD.width / 2, 205, 24, PALETTE.textLight, 700, 'center');
  text(ctx, 'Satu koki. Satu dapur. Order datang terus — sajikan sebelum pelanggan pergi!', FIELD.width / 2, 245, 17, '#ffe9b8', 700, 'center');
  // The three recipe cards.
  const cards = [
    { dish: DISHES.nasgor, x: 250 },
    { dish: DISHES.mieayam, x: 540 },
    { dish: DISHES.sateayam, x: 830 },
  ];
  for (const card of cards) {
    ctx.fillStyle = PALETTE.ticket;
    roundRect(ctx, card.x, 290, 200, 150, 12);
    ctx.fill();
    ctx.fillStyle = card.dish.color;
    roundRect(ctx, card.x, 290, 200, 34, 12);
    ctx.fill();
    text(ctx, card.dish.name.toUpperCase(), card.x + 100, 308, 16, '#ffffff', 800, 'center');
    card.dish.ingredients.forEach((type, index) => {
      drawIngredient(ctx, type, card.x + 50 + index * 50, 370, 20);
    });
    text(ctx, `${card.dish.coins} koin`, card.x + 100, 414, 15, '#8a6d1f', 800, 'center');
  }
  text(ctx, 'WASD / Panah: jalan      E / Klik: ambil • cincang • masak • rakit • antar', FIELD.width / 2, 490, 16, PALETTE.textLight, 700, 'center');
  text(ctx, '3 hidangan  •  9 bahan  •  5 stasiun  •  Shift 3 menit  •  Jangan sampai gosong!', FIELD.width / 2, 520, 14, PALETTE.muted, 700, 'center');
  text(ctx, 'TEKAN SPASI UNTUK MULAI', FIELD.width / 2, 580, 22, '#ffd94d', 800, 'center');
  if (best > 0) text(ctx, `Rekor koin: ${best}`, FIELD.width / 2, 620, 15, PALETTE.textLight, 700, 'center');
  void state;
}

function drawResults(ctx, state, best) {
  ctx.fillStyle = 'rgba(24,14,6,0.78)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  text(ctx, 'SHIFT SELESAI!', FIELD.width / 2, 150, 52, '#ffd94d', 800, 'center');
  // Stars.
  for (let i = 0; i < 3; i += 1) {
    const x = FIELD.width / 2 + (i - 1) * 90;
    ctx.fillStyle = i < state.stars ? '#ffd94d' : 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.arc(x, 230, 34, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, '★', x, 232, 40, i < state.stars ? '#8a6d1f' : 'rgba(255,255,255,0.35)', 800, 'center');
  }
  text(ctx, `Koin: ${state.coins}`, FIELD.width / 2, 320, 30, PALETTE.textLight, 800, 'center');
  text(ctx, `Hidangan tersaji: ${state.served}     Combo terbaik: ×${state.bestCombo}`, FIELD.width / 2, 365, 18, '#ffe9b8', 700, 'center');
  text(ctx, state.hearts > 0 ? 'Semua pelanggan pulang kenyang. Warung Bintang tutup dengan senyum!' : 'Hati pelanggan habis — besok coba lagi, Koki!', FIELD.width / 2, 400, 16, PALETTE.muted, 700, 'center');
  if (state.coins > best) text(ctx, 'REKOR BARU!', FIELD.width / 2, 440, 20, '#7ddb8a', 800, 'center');
  text(ctx, 'TEKAN SPASI UNTUK MAIN LAGI', FIELD.width / 2, 500, 20, '#ffd94d', 800, 'center');
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(24,14,6,0.6)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  text(ctx, 'JEDA', FIELD.width / 2, FIELD.height / 2 - 10, 48, PALETTE.textLight, 800, 'center');
  text(ctx, 'Tekan P atau Spasi untuk lanjut', FIELD.width / 2, FIELD.height / 2 + 40, 17, '#ffe9b8', 700, 'center');
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  /** Paint one frame: `screen` is title / play / paused / over. */
  function draw(state, screen, best, station) {
    const scaleX = canvas.width / FIELD.width;
    const scaleY = canvas.height / FIELD.height;
    ctx.save();
    ctx.scale(scaleX, scaleY);
    ctx.fillStyle = PALETTE.floorA;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    drawFloor(ctx);
    drawCrates(ctx);
    drawBoards(ctx, state);
    drawStoves(ctx, state);
    drawAssembly(ctx, state);
    drawWindow(ctx, state);
    drawBin(ctx);
    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) drawHighlight(ctx, station ?? null);
    drawChef(ctx, state);
    drawHud(ctx, state);
    if (screen === SCREEN_TITLE) drawTitle(ctx, state, best);
    else if (screen === SCREEN_PAUSED) drawPaused(ctx);
    else if (screen === SCREEN_OVER) drawResults(ctx, state, best);
    ctx.restore();
  }

  return { draw };
}
