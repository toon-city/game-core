/**
 * game-core public API
 *
 * Import from this file when using game-core as a library:
 *
 * @example
 * import { GameCore, GameEvents } from 'game-core';
 */

// ─── Main entry point ────────────────────────────────────────────────────────
export { GameCore }           from '../GameCore';
export type { GameCoreOptions } from '../GameCore';

// ─── Events ──────────────────────────────────────────────────────────────────
export { GameEvents }             from '../GameEvents';
export type { GameEventMap }      from '../GameEvents';

// ─── Input ───────────────────────────────────────────────────────────────────
export { InputController, DEFAULT_KEYS, WASD_KEYS, DIR_LEFT, DIR_RIGHT, DIR_UP, DIR_DOWN } from '../input/InputController';
export type { KeyConfig, DirectionChangedFn } from '../input/InputController';

// ─── Avatar (from @toon-live/game-avatar — re-exported so existing 'game-core'
// consumers, e.g. game-web's game-canvas.component.ts, need no changes) ───────
export { Avatar, AvatarBubble, AvatarManager, ClotheRegistry } from '@toon-live/game-avatar';
export type { IAvatar, IAvatarParams, AvatarSpawnOptions, AvatarMoveResult } from '@toon-live/game-avatar';

// ─── House ───────────────────────────────────────────────────────────────────
export { HouseView }   from '../modules/house/HouseView';
export { HouseParser } from '../modules/house/HouseParser';

// ─── Furniture ───────────────────────────────────────────────────────────────
export { FurnitureView }       from '../modules/furniture/FurnitureView';
export { FurnitureController } from '../modules/furniture/FurnitureController';
export type { FurniturePlacementOptions, FurnitureMoveResult } from '../modules/furniture/FurnitureController';

// ─── Core models ─────────────────────────────────────────────────────────────
export { House }     from '../core/models/House';
export { Wall }      from '../core/models/Wall';
export { Door }      from '../core/models/Door';
export { Area }      from '../core/models/Area';
export { Furniture } from '../core/models/Furniture';
export type { Point } from '../core/types/Point';

// ─── Z-order ─────────────────────────────────────────────────────────────────
export * as ZOrder from '../modules/common/ZOrder';

// ─── Textures / Assets (from @toon-live/game-avatar) ─────────────────────────
export { BaseTextureLoader, AssetBaseUrl } from '@toon-live/game-avatar';

// ─── UI ──────────────────────────────────────────────────────────────────────
export { LoadingView } from '../game/ui/loading/LoadingView';
