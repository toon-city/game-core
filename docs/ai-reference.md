# game-core — AI Reference Document

> Machine-readable technical reference for `toon-live/game-core`.  
> Stack: **PixiJS v8**, **TypeScript**, **MobX** (observables), **Webpack**, **Bun**.

---

## 1. Module Map

```
src/
├── index.ts                         Entry-point demo (not a library export)
├── GameCore.ts                      Main public API class
├── GameEvents.ts                    Typed event emitter (GameEventMap)
├── api/                             (reserved)
├── core/
│   ├── abstract/Drawable.ts         Interface: draw(): Container
│   ├── manager/FurnitureBaseManager.ts
│   └── models/
│       ├── Area.ts                  Polygon floor area
│       ├── Door.ts                  Door (p1,p2,p1Top,p2Top,zIndex)
│       ├── Furniture.ts             Furniture instance
│       ├── FurnitureBase.ts         Furniture catalogue entry
│       ├── House.ts                 Aggregate: walls, doors, areas, furnitures
│       └── Wall.ts                  Wall (p1,p2,p1Top,p2Top,texture,isBaseBoard,hidden)
│   └── types/Point.ts               { x: number; y: number }
├── game/
│   ├── avatar/
│   │   ├── Avatar.ts                PIXI Container; public API
│   │   ├── IAvatar.ts
│   │   ├── AvatarManager.ts         Factory used internally by GameCore
│   │   └── structure/parts/
│   │       ├── body/                AvatarBodyPart, AvatarAnimatedBodyPart
│   │       └── clothes/             Clothe, Hair, Hat, Tshirt
│   └── textures/
│       ├── BaseTextureLoader.ts     Singleton; preloads all textures
│       └── GameItemManager.ts       Catalogue lookup
├── modules/
│   ├── common/
│   │   ├── abstract/
│   │   │   ├── IHasDepth.ts
│   │   │   ├── IHasDepthCalculator.ts   checkCollision / getDepthAtPointClip
│   │   │   └── IHasPoints.ts
│   │   ├── sprites/PrecisionSprite.ts
│   │   └── ZOrder.ts                ** See §4 **
│   ├── furniture/
│   │   ├── FurnitureView.ts         PIXI Container per furniture
│   │   └── FurnitureController.ts   Drag & drop logic
│   └── house/
│       ├── HouseParser.ts           XML → House model
│       ├── HouseView.ts             PIXI Container (sortableChildren)
│       └── structure/
│           ├── AreaView.ts          MeshPlane per floor polygon
│           ├── WallView.ts          ** slice-based, NOT a Container **
│           └── DoorView.ts          ** slice-based, NOT a Container **
├── input/InputController.ts         Keyboard + touch bindings
└── utils/
    ├── collision.ts                 Polygon helpers + wall polygon builder
    ├── geometry.ts                  rotatePoint, etc.
    └── project.ts                   project(x,y,z) → screen {x,y}
```

---

## 2. GameCore Public API

### Constructor

```typescript
new GameCore(app: PIXI.Application, options?: GameCoreOptions)
```

Registers a PIXI ticker (`tick`), creates `gameScene` Container, wires `InputController`.

### Options

```typescript
interface GameCoreOptions {
  followCamera?:    boolean;     // default true
  cameraMargin?:    number;      // default 100 px
  cameraSmoothing?: number;      // default 0.1  (lerp alpha per tick)
  moveSpeed?:       number;      // default 10   (px per MOVE_INTERVAL)
  cameraMode?:      CameraMode;  // default 'lookahead'
}
type CameraMode = 'lookahead' | 'center';
```

Internal constant: `MOVE_INTERVAL = 10` ms between avatar position updates.

### Methods

| Signature | Return | Notes |
|---|---|---|
| `loadHouse(xml, jsonUrl?)` | `Promise<HouseView>` | Parses XML, optionally fetches furniture JSON, replaces previous HouseView |
| `spawnAvatar(id, x, y, opts?)` | `Avatar` | Throws if id already exists |
| `removeAvatar(id)` | `boolean` | |
| `getAvatar(id)` | `Avatar \| undefined` | |
| `getAvatars()` | `ReadonlyMap<string,Avatar>` | |
| `bindPlayerInput(id, keys?)` | `void` | First call sets `followAvatarId` |
| `unbindPlayerInput(id)` | `void` | |
| `setCameraPosition(x, y)` | `void` | Also syncs `cameraTargetX/Y` |
| `setFollowAvatar(id \| null)` | `void` | |
| `setCameraMode(mode)` | `void` | Resets lookX/Y, syncs cameraTarget |
| `get cameraMode` | `CameraMode` | |
| `setEditMode(bool)` | `void` | Delegates to HouseView |
| `get editMode` | `boolean` | |
| `on(event, cb)` | `this` | Shortcut for `events.on` |
| `off(event, cb)` | `this` | |
| `destroy()` | `void` | Removes ticker; does NOT destroy PIXI app |

### Public fields

```typescript
readonly events: GameEvents;
readonly gameScene: Container;   // sortableChildren = true
```

---

## 3. Tick Loop (`private tick`)

Runs every frame via `app.ticker`. Steps in order:

1. **Avatar movement** — for each `playerState` with `arrows !== 0` and elapsed ≥ `MOVE_INTERVAL`:
   - Compute `(newX, newY)` from arrow bitmask + diagonal normaliser (÷1.33).
   - Build hitbox: 40 px wide rect at feet (`feetY = socle.y ?? avatar.height`).
   - `checkCollision(avatar, hitbox)`:
     - `false` → move fully.
     - `true` → binary search (8 iterations, lo/hi in `[0,1]`) along movement vector; place avatar at `origin + lo × delta` if `lo > 0.01`.
   - In mode `'center'`: `cameraTargetX -= dx; cameraTargetY -= dy` (instant delta sync).
   - Emit `avatar:moved`.

2. **Look-ahead update** — per player state:
   - Mode `'lookahead'`: normalise direction vector, lerp `lookX/Y` toward `dir × 150` at `α=0.04`.
   - Mode `'center'`: target is `(0,0)` → `lookX/Y` converge to zero.

3. **Camera update** (`updateCamera`):
   - Mode `'center'`:
     - Snap `cameraTarget` toward perfect-center at `α=0.05`.
     - Lerp `gameScene.x/y` toward `cameraTarget` at `α=0.5`.
   - Mode `'lookahead'`:
     - `refX/Y = avatarCenter + lookX/Y`.
     - `distX/Y = min(refScreen, screenSize - refScreen)`.
     - `t = max(tX, tY)` where `tAxis = (1 - dist/MARGIN)²` if `dist < MARGIN` else `0`.
     - `alpha = SMOOTH × 2 × t`.
     - Lerp `gameScene` toward `(screenW/2 - refX, screenH/2 - refY)` at `alpha`.

4. `app.stage.sortChildren()` + `houseView.sortChildren()`.

---

## 4. ZOrder System (`src/modules/common/ZOrder.ts`)

### Formula

```
depth   = round((y_screen + x_screen × 0.05) × 100)
z_index = layer × 10_000_000 + depth × 10 + offset
```

### Layers (`ZPriority` enum)

| Value | Name | Used for |
|---|---|---|
| `0` | `WALL` | Static background layer (unused in current rendering) |
| `1` | `FLOOR` | Floors, doors, walls-with-door |
| `2` | `SCENE` | Normal walls, baseboards, avatars, furniture |
| `3` | `EFFECT` | Particle effects, UI overlays |

### Offset conventions (within same layer)

| Offset | Element |
|---|---|
| `0` | Wall slice (no door) |
| `1` | Baseboard slice |
| `2` | Door slice (FLOOR layer) |
| `3` | Avatar / furniture |

### Guarantees

- Any `SCENE` z-index (`≥ 20_000_000`) **always** exceeds any `FLOOR` z-index (`< 20_000_000`) for realistic screen coordinates (depth < 5M).
- Avatar uses `y + 0.5` bias: `round((y+0.5)×100) = round(y×100) + 50`, ensuring avatar occupies a higher depth bucket than an object at the same screen Y.

---

## 5. WallView & DoorView — Slice Architecture

Both classes are **NOT** PIXI Containers. They create N thin segments added directly as children of `HouseView`.

### WallView

```typescript
const MAX_SEGMENT_PX = 30;

addToContainer(parent: Container, hasDoor = false): void
destroy(): void  // removes slices, stops MobX autorun
```

Per slice `i` (of N = ceil(len / 30)):
- `t0 = i/N`, `t1 = (i+1)/N`
- Interpolate `sp1, sp2, sp1Top, sp2Top` from wall endpoints.
- Create `MeshPlane` with tiling UV.
- `depthY = hasDoor ? midY - 20 : midY`
- `layer = hasDoor ? ZPriority.FLOOR : ZPriority.SCENE`
- `offset = isBaseBoard ? 1 : 0`

### DoorView

Per slice `i`:
- Interpolate `a, b, at, bt` from door endpoints.
- Draw black fill quad + grey left/right edges + top edge.
- `layer = ZPriority.FLOOR`, `offset = 2`, `y = midY` (no reduction).

### hasDoor detection (HouseView.render)

For each wall, check if all door endpoints project onto the wall segment (dot-product projection, tolerance 10 px, `t ∈ [-0.05, 1.05]`).

---

## 6. HouseParser

```typescript
HouseParser.parseStructure(xmlString: string): House
HouseParser.parseFurnitures(house: House, jsonString: string): Promise<void>
```

### XML → House steps

1. Parse all `<P>` → rotate -90° → `project(x, y, 0)` → offset so min(projX/Y) ≥ 0.
2. Parse `<W>` → `Wall` with projected `p1, p2, p1Top, p2Top`. `isBaseBoard = H == 10`.
3. `ENTER="0"` + `D0` → create `Door`. `wallRefY = Math.max(pA.projY, pB.projY)` stored in `Door.zIndex`.
4. Parse `<F>` → `Area` polygon.

### Projection (`src/utils/project.ts`)

```
angle = -PI/4, depthFactor = 1.5
x_screen = x + y × cos(angle) × df   ≈ x + y × 1.06
y_screen = -z + y × sin(angle) × df  ≈ -z - y × 1.06
```

---

## 7. Collision System (`src/utils/collision.ts`)

```typescript
const WALL_THICKNESS = 20; // px

buildWallPolygons(walls: Wall[], doors: Door[]): Point[][]
polygonsIntersect(a: Point[], b: Point[]): boolean
aabbOverlap(a: AABB, b: AABB): boolean
getAABB(polygon: Point[]): AABB
```

`buildWallPolygons` extrudes each wall segment by `WALL_THICKNESS` into a quad, with door-aware cutouts (8 px margin around door opening).

`HouseView.checkCollision(object, points)`:
1. Test against all wall polygons (AABB pre-filter).
2. Test against blocking furniture (type `18`).

---

## 8. Avatar

### Key public methods

```typescript
avatar.x, avatar.y                     // PIXI position
avatar.width, avatar.height            // sprite bounds
avatar.socle                           // PIXI object | null (ring under feet)
avatar.points: Point[]                 // bounding polygon for depth calc
avatar.updateZIndex(): void            // ZOrder.compute({ y: y+feetY+0.5, offset:3 })
avatar.say(text: string, ms: number)   // speech bubble
avatar.changeClothing(cat, id)
avatar.setSkinColor(hex: number)
avatar.changeDirection(arrows: number) // bitmask DIR_*
avatar.walk() / avatar.stopWalk()
avatar.setUsername(name: string)
```

### Direction bitmask

```
DIR_DOWN  = 0b0001
DIR_UP    = 0b0010
DIR_RIGHT = 0b0100
DIR_LEFT  = 0b1000
```

---

## 9. GameEvents

All events are strongly typed via `GameEventMap`:

```typescript
'furniture:moved'    → { view: FurnitureView; from: Point; to: Point }
'furniture:placed'   → { view: FurnitureView; position: Point }
'furniture:rotated'  → { view: FurnitureView; orientation: number }
'furniture:removed'  → { view: FurnitureView }
'avatar:spawned'     → { avatar: Avatar; id: string }
'avatar:despawned'   → { id: string }
'avatar:moved'       → { avatar: Avatar; id: string; from: Point; to: Point }
'avatar:said'        → { avatar: Avatar; id: string; text: string }
'editmode:changed'   → { enabled: boolean }
'avatar:hover'       → { avatar: Avatar; id: string }
'avatar:hoverend'    → { avatar: Avatar; id: string }
```

---

## 10. Invariants & Constraints

- `spawnAvatar` throws if id already exists.
- `loadHouse` tears down the previous `HouseView` and re-parents all existing avatars.
- `WallView` / `DoorView` use a MobX `autorun` to react to model changes; call `destroy()` to stop.
- `HouseView.sortChildren()` must be called after every tick (handled by GameCore).
- `FurnitureView` type `18` = blocking furniture (collision + drag). All other types = floor decoration.
- `cameraTargetX/Y` must be kept in sync with `gameScene.x/y` whenever a direct position assignment occurs (`setCameraPosition`, `setCameraMode`).
- `MOVE_INTERVAL = 10 ms` limits avatar updates independently of frame rate, preventing speed variation across different FPS.

---

## 11. Adding a New Feature — Checklist

### New element type (renders in scene)

- [ ] Add model in `src/core/models/`.
- [ ] Create a View class. If it's a wall-like tall element on a diagonal, use the **slice pattern** (NOT a Container; add slices directly to parent).
- [ ] Assign z-index via `ZOrder.compute`. Pick the correct `ZPriority` layer:
  - Behind avatars/furniture → `FLOOR (1)`
  - Same depth-sort as avatars → `SCENE (2)`
- [ ] Add to `HouseView.render()` and track in array for cleanup via `destroy()`.
- [ ] If collidable, include in `buildWallPolygons` or `checkCollision`.

### New event

- [ ] Add entry to `GameEventMap` in `GameEvents.ts`.
- [ ] Emit in the appropriate place with typed payload.
- [ ] Expose via `gc.on('new:event', handler)`.

### New avatar clothing category

- [ ] Add asset JSON in `assets/clothes/<category>/`.
- [ ] Register in `BaseTextureLoader`.
- [ ] Add a `Clothe` subclass in `src/game/avatar/structure/parts/clothes/parts/`.
- [ ] Wire in`Avatar.changeClothing`.
