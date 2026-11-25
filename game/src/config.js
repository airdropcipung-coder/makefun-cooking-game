// Every tuning number, colour, recipe and station in one place. The kitchen is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule below depends on
// the screen size. All art is drawn procedurally on canvas: no image, font or sound file.

export const FIELD = { width: 1280, height: 720, kitchenTop: 92 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** One full shift, in seconds. The last RUSH_AT seconds are the service rush. */
export const SHIFT_SECONDS = 180;
export const RUSH_AT = 60;

/** Order timers: a fresh ticket lives this long; the rush shortens it. */
export const ORDER_TIME = 75;
export const ORDER_TIME_RUSH = 55;

/** How often a new order appears (seconds); the rush halves the gap. */
export const ORDER_GAP = 16;
export const ORDER_GAP_RUSH = 8;

/** At most this many tickets on the board at once. */
export const MAX_ORDERS = 4;

/** Work times, in seconds. */
export const CHOP_SECONDS = 2;
export const COOK_SECONDS = 4;
export const BURN_SECONDS = 8;

/** A ticket that expires costs one heart; three hearts end the shift early. */
export const HEARTS = 3;

/** Coins per served dish, plus a fast-service tip when half its time is left. */
export const TIP_FRACTION = 0.5;
export const TIP_BONUS = 0.5;

/** Star thresholds on final coins. */
export const STARS = [600, 1200, 1800];

export const CHEF = { radius: 20, speed: 270 };

/** How close the chef must be to use a station (pixels, centre to station edge). */
export const REACH = 78;

/** Ingredients. stage lists the work each one needs, in order: 'chop', 'cook', or none. */
export const INGREDIENTS = {
  nasi: { name: 'Nasi', color: '#fff8e7', dark: '#d9c9a3', stages: [] },
  telur: { name: 'Telur', color: '#ffd94d', dark: '#c79a1d', stages: ['cook'] },
  kecap: { name: 'Kecap', color: '#5b3a1e', dark: '#3a2412', stages: [] },
  mie: { name: 'Mie', color: '#f2c14e', dark: '#b98a1e', stages: ['cook'] },
  ayam: { name: 'Ayam', color: '#f2a594', dark: '#b95c48', stages: ['chop', 'cook'] },
  sawi: { name: 'Sawi', color: '#4caf50', dark: '#2d7a31', stages: ['chop'] },
  sate: { name: 'Sate', color: '#8d5a2b', dark: '#5e3a17', stages: ['cook'] },
  lontong: { name: 'Lontong', color: '#f5f0dc', dark: '#cfc39a', stages: [] },
  bumbu: { name: 'Bumbu', color: '#c97b2d', dark: '#8f5212', stages: [] },
};

/** Dishes: the ingredients a finished plate must hold, and the coins it pays. */
export const DISHES = {
  nasgor: {
    name: 'Nasi Goreng',
    short: 'NASGOR',
    coins: 180,
    ingredients: ['nasi', 'telur', 'kecap'],
    color: '#e07840',
  },
  mieayam: {
    name: 'Mie Ayam',
    short: 'MIE AYAM',
    coins: 220,
    ingredients: ['mie', 'ayam', 'sawi'],
    color: '#e0a83c',
  },
  sateayam: {
    name: 'Sate Ayam',
    short: 'SATE',
    coins: 260,
    ingredients: ['sate', 'bumbu', 'lontong'],
    color: '#a8652f',
  },
};

export const DISH_IDS = ['nasgor', 'mieayam', 'sateayam'];

/** Where each ingredient crate sits on the left counter (x, y of its centre). */
export const CRATES = [
  { type: 'nasi', x: 72, y: 192 },
  { type: 'telur', x: 158, y: 192 },
  { type: 'mie', x: 72, y: 288 },
  { type: 'ayam', x: 158, y: 288 },
  { type: 'sawi', x: 72, y: 384 },
  { type: 'sate', x: 158, y: 384 },
  { type: 'kecap', x: 72, y: 480 },
  { type: 'lontong', x: 158, y: 480 },
  { type: 'bumbu', x: 115, y: 584 },
];

/** Chopping boards and stoves (x, y of the top-left corner; w, h in pixels). */
export const BOARDS = [
  { x: 268, y: 210, w: 110, h: 76 },
  { x: 268, y: 380, w: 110, h: 76 },
];
export const STOVES = [
  { x: 448, y: 210, w: 110, h: 76 },
  { x: 448, y: 380, w: 110, h: 76 },
];

/** The assembly table: two plate slots and the plate stack. */
export const ASSEMBLY = { x: 640, y: 210, w: 260, h: 246 };
export const PLATE_SLOTS = [
  { x: 676, y: 246 },
  { x: 796, y: 246 },
];
export const PLATE_STACK = { x: 836, y: 392 };

/** The serving window (top right) and the bin (bottom right). */
export const WINDOW = { x: 960, y: 116, w: 304, h: 140 };
export const BIN = { x: 1160, y: 600, w: 96, h: 84 };

export const PALETTE = {
  floorA: '#e8d5b0',
  floorB: '#dfc89e',
  wall: '#7a4a2b',
  wallTop: '#5e371f',
  counter: '#8b5a2b',
  counterTop: '#a06a35',
  crate: '#b07a3e',
  board: '#d9a066',
  stove: '#3a3f4a',
  stoveTop: '#23262e',
  flame: '#ff9d2e',
  flameCore: '#ffd94d',
  steam: '#ffffff',
  assembly: '#9c6644',
  assemblyTop: '#b57e52',
  plate: '#f7f5ef',
  plateRim: '#cfc9b8',
  windowBg: '#f3e2b8',
  hud: '#2b1d12',
  hudPanel: '#3a2817',
  ticket: '#fff3c4',
  ticketHot: '#ffd9a0',
  text: '#241708',
  textLight: '#fdf6e3',
  muted: '#cbb693',
  good: '#58b368',
  warn: '#e0a83c',
  bad: '#d9534f',
  chefHat: '#f7f5ef',
  chefShirt: '#e07840',
  chefSkin: '#f2c184',
  chefPants: '#3a3f4a',
  highlight: '#ffe08a',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best coins are kept between visits (this browser only). */
export const BEST_KEY = 'warung-bintang.best';
