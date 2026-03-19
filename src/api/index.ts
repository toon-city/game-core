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

// ─── Avatar ──────────────────────────────────────────────────────────────────
export { Avatar }                        from '../game/avatar/Avatar';
export { AvatarBubble }                  from '../game/avatar/AvatarBubble';
export type { IAvatar, IAvatarParams }   from '../game/avatar/IAvatar';
export type { AvatarSpawnOptions, AvatarMoveResult } from '../game/avatar/AvatarManager';

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

// ─── Textures ────────────────────────────────────────────────────────────────
export { BaseTextureLoader } from '../game/textures/BaseTextureLoader';

// ─── UI ──────────────────────────────────────────────────────────────────────
export { LoadingView } from '../game/ui/loading/LoadingView';
