# 🎮 AllOut Legends - Pokémon-Style RPG Game

A browser-based Pokémon-style game built with **React + Vite**, featuring a tile-based world, 493 Pokémon, turn-based battles, and a built-in map editor.

---

## 🚀 Current Features

### 🗺️ World System

* **4 interconnected realms** (map1, map2, map5, map6)
* Seamless transitions via gate system
* Smooth camera (640×480 viewport)
* 30×30 tile grid per realm

### 🎮 Game Systems

* Keyboard controls (Arrow keys)
* On-screen D-pad (mobile support)
* Collision detection
* Player position persistence
* Realm persistence

### 🌿 Pokémon Encounters

* Random encounters (8% chance in grass)
* Biome-based encounters (grass, snow, cave, water)
* **493 Pokémon (Gen 1–4)** with stats
* Sprites: `/assets/pokemons/001.png` → `/493.png`

---

### ⚔️ Battle System

* Turn-based combat (FIGHT / RUN)
* Type effectiveness (18 types)
* Damage formula with STAB + randomness
* HP bar colors (green/yellow/red)
* Level scaling (2–12 wild Pokémon)
* Valid move sets by level

---

### 🎨 Map Editor (In-Game)

* Toggle with `P`
* Click to paint
* Tile ID selector
* Shift + click → rectangle fill
* Right-click → erase
* LocalStorage save/load/reset
* JSON import/export
* `Ctrl + S` to save
* Tile browser (1083 tiles)

---

### 🧥 Skins Carousel (Profile)

* Full-screen skins modal from the Profile panel
* 3D rotating carousel using PNG card art
* Title banner set to **ALLOUT LEGENDS**
* Images stored in `src/components/panels/images` and loaded by `SkinPanel`
* Styling driven by `src/components/panels/style.css`

---

### 📊 Tile System

* **9 tilesets (1083 tiles total)**

| Tileset     | ID Range  |
| ----------- | --------- |
| crops       | 0–24      |
| ground      | 88–227    |
| houses-snow | 228–395   |
| houses      | 396–720   |
| rock-snow   | 721–752   |
| rocks       | 753–856   |
| trees-snow  | 857–926   |
| trees       | 927–1070  |
| plants      | 1081–1105 |

---

### 🖼️ Tile ID Reference

* `/tile-id-reference.html`
* Visual tile browser
* Click to copy ID
* Search + filter support

---

### 💾 Persistence

| Data            | Storage Key                  |
| --------------- | ---------------------------- |
| Map edits       | `allout_legends_paint_log`   |
| Current map     | `allout_legends_current_map` |
| Player position | `allout_legends_player_pos`  |

---

## 🧱 Tech Stack

| Tech         | Purpose        |
| ------------ | -------------- |
| React 18     | UI             |
| Vite         | Dev/build      |
| CSS Grid     | Tile rendering |
| localStorage | Persistence    |
| Pokémon INI  | Data source    |

---

## 📁 Project Structure

```
pokemon-frontend/
├── public/
│   ├── assets/
│   │   ├── pokemons/
│   │   ├── tiles/
│   │   └── heros/
│   ├── data/
│   │   └── pokemon.ini
│   └── tile-id-reference.html
│
├── src/
│   ├── components/
│   │   ├── Game.jsx
│   │   ├── Sidebar.jsx
│   │   ├── MapEditor.jsx
│   │   ├── Map.jsx
│   │   ├── Tile.jsx
│   │   ├── Battle.jsx
│   │   └── TileViewer.jsx
│   │   └── panels/
│   │       ├── ProfilePanel.jsx
│   │       ├── SkinPanel.jsx
│   │       ├── style.css
│   │       └── images/
│   │           ├── dragon_1.png
│   │           └── ...
│
│   ├── data/
│   │   ├── maps.js
│   │   ├── masterTileset.js
│   │   ├── tileIds.js
│   │   ├── tilesetMeta.js
│   │   ├── tileMap.json
│   │   ├── TILE_REFERENCE.txt
│   │   └── pokemon/
│
│   ├── logic/
│   │   ├── movement.js
│   │   └── encounter.js
│
│   ├── styles/
│   │   ├── style.css
│   │   └── index.css
│
│   ├── App.jsx
│   └── main.jsx
│
├── scripts/
│   ├── extract-tiles.cjs
│   └── parse-pokemon.cjs
│
├── package.json
├── vite.config.js
└── README.md
```

---

## 🎮 Controls

| Action           | Key           |
| ---------------- | ------------- |
| Move             | Arrow Keys    |
| Paint Mode       | P             |
| Save             | Ctrl + S      |
| Increase Tile ID | ]             |
| Decrease Tile ID | [             |
| Paint            | Left Click    |
| Fill             | Shift + Click |
| Erase            | Right Click   |
| Tile Viewer      | T             |

---

## 🧠 Map System

* Maps = **2D tile ID arrays (30×30)**
* Each tile maps to sprite
* Grid movement (64px tiles)

### Gates

* X: 14–15, Y: 14–15
* Connect maps in 4 directions
* Smooth transitions

---

## ⚔️ Battle Formula

```
Damage = ((2 * Level / 5 + 2) * Power * (Attack / Defense) / 50 + 2)
         * STAB * Effectiveness * Random(0.85–1.0)
```

---

## 🛠️ Setup

```
git clone <repo>
cd AllOut-Legends/pokemon-frontend
npm install
npm run dev
```

---

## 📋 Scripts

```
node scripts/parse-pokemon.cjs
node scripts/extract-tiles.cjs
```

---

## 📦 Required Assets

### Pokémon

```
public/assets/pokemons/001.png → 493.png
```

### Tiles

```
public/assets/tiles/*.png
```

### Hero

```
public/assets/heros/Alpha Coder.png
```

---

## ⚠️ Notes

* `public/assets/` is **gitignored**
* localStorage data is **not version-controlled**
* Use export to persist maps into code

---

## 📊 Status

| Feature        | Status |
| -------------- | ------ |
| Map system     | ✅      |
| Movement       | ✅      |
| Transitions    | ✅      |
| Battles        | ✅      |
| Pokémon data   | ✅      |
| Map editor     | ✅      |
| Save/load      | ✅      |
| Capture system | ⏳      |
| Party system   | ⏳      |

---

## 🔮 Roadmap

### Gameplay

* Capture Pokémon
* Party system (6 slots)
* XP & leveling
* Evolution

### World

* NPCs
* Shops / Centers
* Interactions

### Visual

* Animations
* Sound effects
* Music

### Multiplayer

* Backend (Flask)
* Trading
* Online battles

---

## 👨‍💻 Author

Custom Pokémon engine inspired by Deluge RPG.

---

## 📄 License

MIT

---

## 🎉 Version

**V1.0 — Core systems complete, 493 Pokémon integrated**
