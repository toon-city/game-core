// ─── Direction bitmask constants ────────────────────────────────────────────

export const DIR_LEFT  = 0b1000;
export const DIR_RIGHT = 0b0100;
export const DIR_UP    = 0b0010;
export const DIR_DOWN  = 0b0001;

// ─── Configuration ──────────────────────────────────────────────────────────

/**
 * Keyboard key bindings for one player.
 * Values must be valid `KeyboardEvent.code` strings (e.g. `'ArrowUp'`, `'KeyW'`).
 */
export interface KeyConfig {
  up:    string;
  down:  string;
  left:  string;
  right: string;
}

/** Arrow‑key defaults */
export const DEFAULT_KEYS: KeyConfig = {
  up:    'ArrowUp',
  down:  'ArrowDown',
  left:  'ArrowLeft',
  right: 'ArrowRight',
};

/** WASD defaults */
export const WASD_KEYS: KeyConfig = {
  up:    'KeyW',
  down:  'KeyS',
  left:  'KeyA',
  right: 'KeyD',
};

// ─── Internal binding record ─────────────────────────────────────────────────

/**
 * Called whenever the active direction bitmask changes for a player.
 * Receives the new full bitmask (0 = no direction, use to stop walking).
 */
export type DirectionChangedFn = (arrows: number) => void;

interface Binding {
  keys:      KeyConfig;
  onChange:  DirectionChangedFn;
  arrows:    number;
}

// ─── InputController ─────────────────────────────────────────────────────────

/**
 * Handles keyboard input and touch/pointer input for one or more players.
 *
 * - **Keyboard**: `keydown`/`keyup` on `globalThis`.
 * - **Touch / pointer**: tracks the initial contact point on the canvas; any
 *   delta beyond `touchThreshold` pixels activates the corresponding direction.
 *   Diagonals are supported by activating multiple bits simultaneously.
 *   Touch controls the first bound avatar (or whichever is set as
 *   `touchAvatarId`).
 *
 * @example
 * const input = new InputController(app.canvas);
 * input.bind('player1', arrows => {
 *   if (arrows > 0) { avatar.walk(); avatar.changeDirection(arrows); }
 *   else avatar.stopWalk();
 * });
 */
export class InputController {
  /** Avatar currently receiving touch input */
  touchAvatarId: string | null = null;

  /**
   * Minimum pointer‑drag distance (px) before a direction is activated.
   * Increase for joystick‑like "dead zone"; decrease for more sensitivity.
   */
  touchThreshold = 20;

  private bindings: Map<string, Binding> = new Map();

  // Keyboard listeners (stored for removal)
  private readonly keydown: (e: KeyboardEvent) => void;
  private readonly keyup:   (e: KeyboardEvent) => void;

  // Touch state
  private touchOriginX = 0;
  private touchOriginY = 0;
  private touchActive  = false;

  // Touch listeners (stored for removal)
  private readonly onTouchStart: (e: PointerEvent) => void;
  private readonly onTouchMove:  (e: PointerEvent) => void;
  private readonly onTouchEnd:   (e: PointerEvent) => void;

  constructor(private readonly canvas: HTMLElement) {
    this.keydown = this.handleKeyDown.bind(this);
    this.keyup   = this.handleKeyUp.bind(this);

    globalThis.addEventListener('keydown', this.keydown as EventListener);
    globalThis.addEventListener('keyup',   this.keyup   as EventListener);

    this.onTouchStart = this.handleTouchStart.bind(this);
    this.onTouchMove  = this.handleTouchMove.bind(this);
    this.onTouchEnd   = this.handleTouchEnd.bind(this);

    canvas.addEventListener('pointerdown',   this.onTouchStart as EventListener);
    canvas.addEventListener('pointermove',   this.onTouchMove  as EventListener);
    canvas.addEventListener('pointerup',     this.onTouchEnd   as EventListener);
    canvas.addEventListener('pointercancel', this.onTouchEnd   as EventListener);
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Bind directional input to an avatar.
   * The first avatar bound automatically gets touch input.
   *
   * @param avatarId   Unique avatar identifier.
   * @param onChange   Callback invoked with the new direction bitmask.
   * @param keys       Custom key mapping (defaults to arrow keys).
   */
  bind(avatarId: string, onChange: DirectionChangedFn, keys: KeyConfig = DEFAULT_KEYS): void {
    this.bindings.set(avatarId, { keys, onChange, arrows: 0 });
    if (this.touchAvatarId === null) this.touchAvatarId = avatarId;
  }

  /**
   * Remove all input bindings for an avatar and reset its state.
   */
  unbind(avatarId: string): void {
    const binding = this.bindings.get(avatarId);
    if (binding && binding.arrows !== 0) {
      // Release all active directions
      binding.arrows = 0;
      binding.onChange(0);
    }
    this.bindings.delete(avatarId);
    if (this.touchAvatarId === avatarId) {
      this.touchAvatarId = this.bindings.size > 0
        ? [...this.bindings.keys()][0]
        : null;
    }
  }

  /**
   * Returns the current direction bitmask for an avatar (0 = idle).
   */
  getDirection(avatarId: string): number {
    return this.bindings.get(avatarId)?.arrows ?? 0;
  }

  /**
   * Remove all event listeners and clear all bindings.
   * Call this before destroying the game.
   */
  destroy(): void {
    globalThis.removeEventListener('keydown', this.keydown as EventListener);
    globalThis.removeEventListener('keyup',   this.keyup   as EventListener);
    this.canvas.removeEventListener('pointerdown',   this.onTouchStart as EventListener);
    this.canvas.removeEventListener('pointermove',   this.onTouchMove  as EventListener);
    this.canvas.removeEventListener('pointerup',     this.onTouchEnd   as EventListener);
    this.canvas.removeEventListener('pointercancel', this.onTouchEnd   as EventListener);
    this.bindings.clear();
  }

  // ─── Keyboard ──────────────────────────────────────────────────────────────

  private handleKeyDown(e: KeyboardEvent): void {
    e.preventDefault();
    this.applyKey(e.code, true);
  }

  private handleKeyUp(e: KeyboardEvent): void {
    e.preventDefault();
    this.applyKey(e.code, false);
  }

  private applyKey(code: string, active: boolean): void {
    for (const [avatarId, binding] of this.bindings) {
      let bit = 0;
      if      (code === binding.keys.up)    bit = DIR_UP;
      else if (code === binding.keys.down)  bit = DIR_DOWN;
      else if (code === binding.keys.left)  bit = DIR_LEFT;
      else if (code === binding.keys.right) bit = DIR_RIGHT;

      if (bit === 0) continue;

      const prev = binding.arrows;
      binding.arrows = active
        ? (prev | bit)
        : (prev & ~bit & 0b1111);

      if (binding.arrows !== prev) {
        binding.onChange(binding.arrows);
      }
    }
  }

  // ─── Touch / pointer ───────────────────────────────────────────────────────

  private handleTouchStart(e: PointerEvent): void {
    // Ignore mouse events for touch input (only handle actual touch/pen)
    if (e.pointerType === 'mouse') return;
    if (this.touchAvatarId === null) return;
    this.touchOriginX = e.clientX;
    this.touchOriginY = e.clientY;
    this.touchActive  = true;
  }

  private handleTouchMove(e: PointerEvent): void {
    if (!this.touchActive || this.touchAvatarId === null) return;
    const binding = this.bindings.get(this.touchAvatarId);
    if (!binding) return;

    const th = this.touchThreshold;
    const dx = e.clientX - this.touchOriginX;
    const dy = e.clientY - this.touchOriginY;

    const wanted =
      (dx < -th ? DIR_LEFT  : 0) |
      (dx >  th ? DIR_RIGHT : 0) |
      (dy < -th ? DIR_UP    : 0) |
      (dy >  th ? DIR_DOWN  : 0);

    if (wanted !== binding.arrows) {
      binding.arrows = wanted;
      binding.onChange(wanted);
    }
  }

  private handleTouchEnd(_e: PointerEvent): void {
    if (!this.touchActive || this.touchAvatarId === null) return;
    const binding = this.bindings.get(this.touchAvatarId);
    if (binding && binding.arrows !== 0) {
      binding.arrows = 0;
      binding.onChange(0);
    }
    this.touchActive = false;
  }
}
