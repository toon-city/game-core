import { Point } from './core/types/Point';

// Forward declarations to avoid circular imports at event‑definition level.
// The actual Avatar / FurnitureView classes are only used as type parameters.
import type { Avatar } from './game/avatar/Avatar';
import type { FurnitureView } from './modules/furniture/FurnitureView';

// ─── Event payload types ─────────────────────────────────────────────────────

export interface GameEventMap {
  /** Furniture was dragged to a new position (after a successful drag) */
  'furniture:moved':    { view: FurnitureView; from: Point; to: Point };
  /** Furniture drag ended and the piece was placed */
  'furniture:placed':   { view: FurnitureView; position: Point };
  /** Furniture orientation changed */
  'furniture:rotated':  { view: FurnitureView; orientation: number };
  /** Furniture was removed from the scene */
  'furniture:removed':  { view: FurnitureView };
  /** A new avatar was added to the scene */
  'avatar:spawned':     { avatar: Avatar; id: string };
  /** An avatar was removed from the scene */
  'avatar:despawned':   { id: string };
  /** An avatar changed position during this tick */
  'avatar:moved':       { avatar: Avatar; id: string; from: Point; to: Point };
  /** An avatar has movement keys held (emitted every tick, even if blocked by collision) */
  'avatar:walking':     { avatar: Avatar; id: string; direction: number };
  /** An avatar just released all movement keys (emitted once, on the transition) */
  'avatar:stopped':     { avatar: Avatar; id: string };
  /** An avatar displayed a speech bubble */
  'avatar:said':        { avatar: Avatar; id: string; text: string };
  /** Edit mode was toggled */
  'editmode:changed':   { enabled: boolean };
  /** Mouse entered an avatar's hitbox */
  'avatar:hover':       { avatar: Avatar; id: string };
  /** Mouse left an avatar's hitbox */
  'avatar:hoverend':    { avatar: Avatar; id: string };
}

// ─── Typed callback ──────────────────────────────────────────────────────────

type Listener<T> = (data: T) => void;

type ListenerMap = {
  [K in keyof GameEventMap]?: Listener<GameEventMap[K]>[];
};

// ─── GameEvents ──────────────────────────────────────────────────────────────

/**
 * Simple typed event‑emitter used throughout game‑core.
 *
 * @example
 * events.on('furniture:placed', ({ view, position }) => console.log(position));
 * events.emit('furniture:placed', { view, position: { x: 0, y: 0 } });
 */
export class GameEvents {
  private listeners: ListenerMap = {};

  on<K extends keyof GameEventMap>(event: K, cb: Listener<GameEventMap[K]>): this {
    if (!this.listeners[event]) this.listeners[event] = [];
    (this.listeners[event] as Listener<GameEventMap[K]>[]).push(cb);
    return this;
  }

  off<K extends keyof GameEventMap>(event: K, cb: Listener<GameEventMap[K]>): this {
    const arr = this.listeners[event] as Listener<GameEventMap[K]>[] | undefined;
    if (arr) {
      const idx = arr.indexOf(cb);
      if (idx !== -1) arr.splice(idx, 1);
    }
    return this;
  }

  emit<K extends keyof GameEventMap>(event: K, data: GameEventMap[K]): void {
    const arr = this.listeners[event] as Listener<GameEventMap[K]>[] | undefined;
    if (arr) arr.slice().forEach(cb => cb(data));
  }

  removeAllListeners(event?: keyof GameEventMap): void {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }
}
