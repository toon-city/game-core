# game-core — Guide utilisateur

> Bibliothèque de rendu isométrique 2.5D basée sur **PixiJS v8** et **TypeScript**.  
> Elle gère le chargement d'une maison, les avatars, les meubles, les collisions et la caméra.

---

## Table des matières

1. [Installation](#installation)
2. [Démarrage rapide](#démarrage-rapide)
3. [Chargement d'une maison](#chargement-dune-maison)
4. [Avatars](#avatars)
5. [Caméra](#caméra)
6. [Mode édition (meubles)](#mode-édition-meubles)
7. [Événements](#événements)
8. [Référence des options](#référence-des-options)
9. [Format XML de carte](#format-xml-de-carte)
10. [Architecture technique (résumé)](#architecture-technique-résumé)

---

## Installation

```bash
bun install   # ou npm install
bun run dev   # serveur de développement webpack
```

---

## Démarrage rapide

```typescript
import * as PIXI from 'pixi.js';
import { GameCore } from './GameCore';

const app = new PIXI.Application();
await app.init({ background: '#1099bb', antialias: true, resolution: 1 });
app.renderer.resize(1000, 1000);
document.body.appendChild(app.canvas);

const gc = new GameCore(app, {
  followCamera: true,
  cameraMargin: 150,
  cameraSmoothing: 0.1,
  moveSpeed: 10,
  cameraMode: 'lookahead', // ou 'center'
});

gc.setCameraPosition(400, 400);
await gc.loadHouse(MAP_XML);

const avatar = gc.spawnAvatar('player', 100, 100, {
  showSocle: true,
  direction: 1,
  skinColor: 0xf7ceaf,
});

gc.bindPlayerInput('player');
```

---

## Chargement d'une maison

```typescript
// Maison seule
await gc.loadHouse(xmlString);

// Maison + meubles depuis un fichier JSON
await gc.loadHouse(xmlString, 'assets/map_jardin.json');
```

Recharger `loadHouse` remplace la maison précédente et ré-attache les avatars existants.

---

## Avatars

### Créer un avatar

```typescript
const avatar = gc.spawnAvatar('player', x, y, {
  showSocle: true,        // anneau au sol
  direction: 1,           // direction initiale (bitmask)
  skinColor: 0xf7ceaf,    // couleur de peau hex
  username: 'Alice',      // pseudo affiché au survol
  clothing: {
    hair: 'hair7',
    hat:  'chapeau_paques4',
    tshirt: 'tshirt_april7',
  },
});
```

### Récupérer / supprimer

```typescript
const a = gc.getAvatar('player');     // Avatar | undefined
gc.getAvatars();                       // ReadonlyMap<string, Avatar>
gc.removeAvatar('player');             // boolean
```

### Méthodes sur Avatar

```typescript
avatar.say('Bonjour !', 2500);        // bulle de dialogue (ms)
avatar.changeClothing('hat', 'hat_april1');
avatar.setSkinColor(0xffe0bd);
avatar.changeDirection(0b0001);       // bas
avatar.walk();
avatar.stopWalk();
```

### Lier / délier le clavier

```typescript
gc.bindPlayerInput('player');         // flèches par défaut
gc.unbindPlayerInput('player');
```

---

## Caméra

### Options au démarrage

| Option | Type | Défaut | Description |
|---|---|---|---|
| `followCamera` | `boolean` | `true` | Suivi automatique du premier joueur |
| `cameraMargin` | `number` | `100` | Distance px du bord déclenchant le scroll |
| `cameraSmoothing` | `number` | `0.1` | Facteur de lerp (0 = immobile, 1 = instantané) |
| `cameraMode` | `'lookahead' \| 'center'` | `'lookahead'` | Mode de suivi |

### Modes de caméra

**`lookahead`** (défaut) — la caméra reste libre tant que l'avatar est dans la zone sûre. Quand il approche du bord (`cameraMargin`), elle se déplace et anticipe la direction de marche (décalage de 150 px devant l'avatar).

**`center`** — l'avatar est toujours centré à l'écran. Le mouvement de la caméra est synchronisé pixel-pour-pixel avec l'avatar pour éviter tout saccade.

### Changer de mode à la volée

```typescript
gc.setCameraMode('center');
gc.setCameraMode('lookahead');
console.log(gc.cameraMode); // 'center' | 'lookahead'
```

### Position manuelle

```typescript
gc.setCameraPosition(400, 400);
```

### Changer l'avatar suivi

```typescript
gc.setFollowAvatar('player2');
gc.setFollowAvatar(null); // désactive le suivi
```

---

## Mode édition (meubles)

```typescript
gc.setEditMode(true);   // drag & drop activé
gc.setEditMode(false);  // drag & drop désactivé
console.log(gc.editMode); // boolean
```

En mode édition, chaque meuble de type `18` peut être glissé-déposé. Une couleur rouge indique une collision.

---

## Événements

```typescript
gc.on('avatar:moved',      ({ avatar, id, from, to }) => { });
gc.on('avatar:spawned',    ({ avatar, id }) => { });
gc.on('avatar:despawned',  ({ id }) => { });
gc.on('avatar:said',       ({ avatar, id, text }) => { });
gc.on('avatar:hover',      ({ avatar, id }) => { });
gc.on('avatar:hoverend',   ({ avatar, id }) => { });

gc.on('furniture:moved',   ({ view, from, to }) => { });
gc.on('furniture:placed',  ({ view, position }) => { });
gc.on('furniture:rotated', ({ view, orientation }) => { });
gc.on('furniture:removed', ({ view }) => { });

gc.on('editmode:changed',  ({ enabled }) => { });

// Désabonnement
gc.off('avatar:moved', monHandler);

// Accès direct à l'émetteur
gc.events.on('avatar:moved', handler);
```

---

## Référence des options

### `GameCoreOptions`

```typescript
interface GameCoreOptions {
  followCamera?:    boolean;      // défaut: true
  cameraMargin?:    number;       // défaut: 100  (px)
  cameraSmoothing?: number;       // défaut: 0.1
  moveSpeed?:       number;       // défaut: 10   (px/tick)
  cameraMode?:      CameraMode;   // défaut: 'lookahead'
}
```

### `AvatarSpawnOptions`

```typescript
interface AvatarSpawnOptions {
  showSocle?: boolean;
  direction?: number;
  skinColor?: number;
  username?:  string;
  clothing?:  { [category: string]: string };
}
```

### Catégories de vêtements disponibles

| Catégorie | Exemple d'identifiant |
|---|---|
| `hair` | `hair7` |
| `hat` | `chapeau_paques4`, `hat_april1` |
| `tshirt` | `tshirt_april7` |
| `pant` | *(à compléter)* |

---

## Format XML de carte

```xml
<MAP>
  <!-- Points 3D (YPOS = axe monde X, XPOS = axe monde Y) -->
  <P YPOS="-340" XPOS="-780" />
  <P YPOS="-340" XPOS="-40"  />

  <!-- Mur : PTB/PTA = indices de points, H = hauteur, SF = scale texture -->
  <W SF="2.25" H="250" PTB="0" PTA="1" />

  <!-- Mur avec porte : ENTER="0" + D0=largeur de la porte -->
  <W ENTER="0" D0="192" SF="4.75" H="250" PTB="3" PTA="0" />

  <!-- Plinthe : H="10" -->
  <W SF="0.03" H="10" PTB="4" PTA="0" />

  <!-- Sol : liste de points (PT0 … PT6) -->
  <F PT3="3" PT2="2" PT1="1" PT0="0" SF="0" />
</MAP>
```

> Les coordonnées `YPOS`/`XPOS` sont en espace monde. Le parser applique une rotation de -90° puis une projection isométrique automatiquement.

---

## Architecture technique (résumé)

```
GameCore
├── HouseView              ← conteneur principal (sortableChildren)
│   ├── AreaView           ← sols (MeshPlane)
│   ├── WallView ×N        ← murs en slices de 30 px (chacun son z-index)
│   ├── DoorView ×N        ← portes en slices de 30 px
│   ├── FurnitureView ×N   ← meubles
│   └── Avatar ×N          ← avatars
└── InputController        ← clavier + touch
```

### Ordre de rendu (z-index)

| Couche | Élément | Layer |
|---|---|---|
| 1 | `WALL` (fond fixe) | `ZPriority.WALL = 0` |
| 2 | Sols, murs-avec-porte, portes | `ZPriority.FLOOR = 1` |
| 3 | Murs normaux, plinthes, avatars, meubles | `ZPriority.SCENE = 2` |
| 4 | Effets | `ZPriority.EFFECT = 3` |

Au sein d'un même layer, le tri est **isométrique** : `z = layer×10M + round((y + x×0.05)×100)×10 + offset`.

### Collision

- Polygones générés à partir des murs au chargement (`buildWallPolygons`).
- Avatar : hitbox rectangulaire de 40 px aux pieds.
- Mouvement bloqué : recherche binaire (8 itérations) pour placer l'avatar exactement au bord de la collision.

---

## Cycle de vie

```typescript
// Nettoyage complet (ne détruit PAS l'Application PIXI)
gc.destroy();
```
