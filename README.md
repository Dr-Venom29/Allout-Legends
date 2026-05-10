# AllOut Legends - Pokemon-Style RPG Game

A browser-based Pokemon-style game built with React + Vite, featuring a tile-based world, turn-based battles, and a built-in map editor.

---

## Current Features

### World System

* 4 interconnected realms (map1, map2, map5, map6)
* Seamless transitions via gate system
* Smooth camera with dynamic height and 900px width
* 30x30 tile grid per realm

### Game Systems

* Keyboard controls (Arrow keys)
* On-screen D-pad (mobile support)
* Collision detection
* Player position persistence
* Realm persistence

### Pokemon Encounters

* Random encounters (8% chance in grass)
* Biome-based encounters (grass, snow, cave, water)
* 493 Pokemon (Gen 1-4) with stats
* Sprites: /assets/pokemons/001.png -> /493.png
* Rareness-weighted wild selection

---

### Battle System

* Turn-based combat (FIGHT / BAG / RUN)
* Type effectiveness (18 types)
* Damage formula with STAB + randomness
* HP bar colors (green/yellow/red)
* Level scaling (2–12 wild Pokémon)
* Valid move sets by level
* Capture system with Poké Balls
* HP + rareness-based catch rate formula

---

### Map Editor (In-Game)

* Toggle with P
* Click to paint
* Tile ID selector
* Shift + click for rectangle fill
* Right-click to erase
* localStorage save/load/reset
* JSON import/export
* Ctrl + S to save
* Tile browser
* Per-tile sprite scale

---

### Skins Carousel (Profile)

* Full-screen skins modal from the Profile panel
* 3D rotating carousel using PNG card art
* Title banner set to ALLOUT LEGENDS
* Images stored in src/components/panels/images and loaded by SkinPanel
* Styling driven by src/components/panels/style.css

---

### Tile System

* Tilesets are defined in src/data/masterTileset.js

| Tileset   | ID Range |
| --------- | -------- |
| crops     | 0-24     |
| path      | 25-60    |
| houses2   | 61-276   |
| things    | 277-296  |
| plants2   | 297-300  |
| grassGym  | 301-340  |
| shop      | 341-352  |
| things2   | 353-388  |
| houses    | 396-720  |
| plants    | 1081-1105|

---

### Tile ID Reference

* /tile-id-reference.html
* Visual tile browser
* Click to copy ID
* Search + filter support

---

### Persistence

| Data            | Storage Key                  |
| --------------- | ---------------------------- |
| Map edits       | `allout_legends_paint_log`   |
| Current map     | `allout_legends_current_map` |
| Player position | `allout_legends_player_pos`  |
| Tile scales     | `allout_legends_tile_scales` |
| Inventory       | `allout_legends_inventory`   |
| Party           | `allout_legends_party`       |
| PC storage      | `allout_legends_pc_storage`  |

---

## Tech Stack

| Tech         | Purpose        |
| ------------ | -------------- |
| React 19     | UI             |
| Vite 8       | Dev/build      |
| CSS Grid     | Tile rendering |
| localStorage | Persistence    |
| Pokémon INI  | Data source    |

---

## Project Structure

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
│   │   ├── game/
│   │   │   ├── Game.jsx
│   │   │   ├── Map.jsx
│   │   │   ├── Tile.jsx
│   │   │   └── systems/
│   │   │       ├── keyboard.js
│   │   │       ├── movement.js
│   │   │       ├── paint.js
│   │   │       ├── storage.js
│   │   │       ├── storageHandlers.js
│   │   │       └── uiState.js
│   │   │   └── playerStorage.js
│   │   ├── Sidebar.jsx
│   │   ├── MapEditor.jsx
│   │   ├── battle/
│   │   │   ├── Battle.jsx
│   │   │   ├── battleConstants.js
│   │   │   ├── battleLogic.js
│   │   │   ├── battleUtils.js
│   │   │   ├── captureLogic.js
│   │   │   └── encounterTables.js
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
│   │   ├── tilesetMeta.js
│   │   ├── tileWalkability.js
│   │   └── pokemon/
│
│   ├── logic/
│   │   ├── movement.js
│   │   └── encounter.js
│
│   ├── App.jsx
│   ├── main.jsx
│   ├── style.css
│   └── index.css
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

## Controls

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

---

## Map System

* Maps = 2D tile ID arrays (30x30)
* Each tile maps to sprite
* Grid movement (40px tiles)

### Gates

* X: 14–15, Y: 14–15
* Connect maps in 4 directions
* Smooth transitions

---

## Battle Formula

```
Damage = ((2 * Level / 5 + 2) * Power * (Attack / Defense) / 50 + 2)
         * STAB * Effectiveness * Random(0.85–1.0)
```

---

## Setup

```
git clone <repo>
cd AllOut-Legends/pokemon-frontend
npm install
npm run dev
```

---

## Scripts

```
node scripts/parse-pokemon.cjs
node scripts/extract-tiles.cjs
```

---

## Required Assets

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
public/assets/heros/Alpha_Coder.png
```

---

## Notes

* `public/assets/` is **gitignored**
* localStorage data is **not version-controlled**
* Use export to persist maps into code

---

## Status

| Feature        | Status |
| -------------- | ------ |
| Map system     | ✅      |
| Movement       | ✅      |
| Transitions    | ✅      |
| Battles        | ✅      |
| Pokémon data   | ✅      |
| Map editor     | ✅      |
| Save/load      | ✅      |
| Capture system | ✅      |
| Party system   | ✅      |

---

## Roadmap

### Gameplay

* XP & leveling
* Evolution
* Poké Mart inventory

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

## Author

Custom Pokémon-style engine developed by the AllOut Legends team.

---

## License

MIT

---

## Version

**V1.0 — Core systems complete, 493 Pokémon integrated**
