[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/airdropcipung-coder/makefun-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/airdropcipung-coder/makefun-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

# Warung Bintang — Dapur Kilat

Satu koki. Satu dapur. Order datang terus — sajikan sebelum pelanggan pergi!

**Bounty:** [best-cooking-game-20261125-0137](https://make.fun/bounty/best-cooking-game-20261125-0137) — $250, top 10 berbagi hadiah.

## Cara main

Buka `game/index.html` di desktop Chrome (atau jalankan `node serve.ts` lalu buka http://localhost:8080). Tanpa instalasi, tanpa network — semua seni digambar prosedural di canvas, semua bunyi dibuat dengan synth WebAudio.

- **WASD / panah:** jalan
- **E / klik:** ambil bahan, cincang, masak, rakit, antar
- **Spasi:** mulai / main lagi
- **P / Esc:** jeda

## Aturannya

1. Ambil bahan di counter kiri (9 bahan: nasi, telur, kecap, mie, ayam, sawi, sate, lontong, bumbu).
2. Olah dulu: cincang di talenan, masak di kompor — jangan sampai gosong!
3. Rakit di Meja Rakit: 3 bahan sesuai resep jadi satu hidangan.
4. Antar ke Jendela Saji sebelum timer order habis.

**3 hidangan:** Nasi Goreng (nasi + telur + kecap, 180 koin), Mie Ayam (mie + ayam + sawi, 220 koin), Sate Ayam (sate + bumbu + lontong, 260 koin). Sajian cepat dapat tip +50% dan menaikkan combo. Shift 3 menit; 60 detik terakhir adalah RUSH — order datang 2× lebih cepat. 3 hati: tiap order hangus mengurangi satu hati. Akhiri shift dengan peringkat bintang 1–3.

## Struktur

- `game/index.html` — canvas + status line
- `game/src/config.js` — tuning, palet, resep, stasiun
- `game/src/random.js` — RNG seeded (deterministik)
- `game/src/world.js` — order, cincang/masak/rakit/antar, skor
- `game/src/input.js` — keyboard + mouse
- `game/src/render.js` — semua gambar canvas
- `game/src/audio.js` — bunyi synth WebAudio
- `game/src/shots.js` — scene screenshot deterministik
- `game/src/main.js` — boot + loop 1/60 detik
- `main.ts` — menyalin `game/` + `screenshots/` ke `/output`, menulis `dossier.json`
- `screenshots/` — 4 render asli dari kode game: cover (play), judul, rush, hasil

## Screenshot cover

Satu frame memperlihatkan seluruh game: papan order dengan 3 tiket + timer, 9 bahan di counter, talenan + kompor aktif, piring mid-assembly di Meja Rakit (2 dari 3 bahan), dan piring Sate Ayam lengkap siap saji di Jendela Saji — plus timer shift, koin, combo, dan hati di HUD. Semua screenshot deterministik (seed tetap) dan diambil ulang byte-identik.

## Uji lokal

Playtest headless Chromium: 14/14 langkah lolos tanpa page/console error (judul → mulai → jalan → order → ambil → cincang → rakit → antar → jeda). `node --check` lolos untuk `main.ts` dan semua file `game/src/`.

## Lisensi

MIT — lihat `LICENSE`.
