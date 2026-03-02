import { Application, Container } from 'pixi.js';
import { Avatar } from './game/avatar/Avatar';
import { AvatarSpawnOptions } from './game/avatar/AvatarManager';
import { HouseView } from './modules/house/HouseView';
import { HouseParser } from './modules/house/HouseParser';
import { BaseTextureLoader } from './game/textures/BaseTextureLoader';
import { GameEvents, GameEventMap } from './GameEvents';
import { InputController, KeyConfig, DEFAULT_KEYS } from './input/InputController';
import { Point } from './core/types/Point';

// ─── Direction constants ─────────────────────────────────────────────────────

const DIR_LEFT  = 0b1000;
const DIR_RIGHT = 0b0100;
const DIR_UP    = 0b0010;
const DIR_DOWN  = 0b0001;

// ─── Options ─────────────────────────────────────────────────────────────────

export interface GameCoreOptions {
  /**
   * Whether the camera should automatically follow the first player-controlled
   * avatar. Default: `true`.
   */
  followCamera?: boolean;

  /**
   * Distance from the screen edge (in px) at which camera scrolling begins.
   * Default: `100`.
   */
  cameraMargin?: number;

  /**
   * Camera interpolation factor per tick (0 = no movement, 1 = instant snap).
   * Default: `0.1`.
   */
  cameraSmoothing?: number;

  /**
   * Avatar movement speed in pixels per tick interval. Default: `10`.
   */
  moveSpeed?: number;
}

// ─── Internal per-avatar input state ─────────────────────────────────────────

interface PlayerState {
  arrows:       number;
  lastMoveTime: number;
  /** Décalage look-ahead lissé en pixels écran (direction de déplacement). */
  lookX: number;
  lookY: number;
}

// ─── GameCore ─────────────────────────────────────────────────────────────────

/**
 * Main entry-point for game-core.
 *
 * The user supplies a PIXI `Application` (already initialised); GameCore
 * handles textures, house loading, avatar management, input and the game loop.
 *
 * @example
 * const app = new PIXI.Application();
 * await app.init({ background: '#1099bb', width: 800, height: 600 });
 * document.body.appendChild(app.canvas);
 *
 * const gc = new GameCore(app);
 * gc.setCameraPosition(400, 300);
 * await gc.loadHouse(xmlString, 'assets/map_jardin.json');
 *
 * const avatar = gc.spawnAvatar('player', 100, 100, { showSocle: true });
 * gc.bindPlayerInput('player');
 *
 * gc.on('furniture:placed', ({ view, position }) =>
 *   console.log('Placed at', position));
 *
 * gc.setEditMode(true); // allow furniture drag & drop
 */
export class GameCore {
  // ─── Public ────────────────────────────────────────────────────────────────

  /** Typed event emitter – use `on`/`off` or listen directly via `events`. */
  public readonly events: GameEvents;

  /** Root PIXI container holding the house and avatars. */
  public readonly gameScene: Container;

  // ─── Private ───────────────────────────────────────────────────────────────

  private readonly input: InputController;
  private readonly opts:  Required<GameCoreOptions>;

  private houseView:      HouseView | null = null;
  private avatarsById:    Map<string, Avatar> = new Map();
  private playerStates:   Map<string, PlayerState> = new Map();
  private followAvatarId: string | null = null;

  private _editMode = false;

  private static readonly MOVE_INTERVAL = 10; // ms between position updates

  constructor(
    private readonly app: Application,
    options: GameCoreOptions = {},
  ) {
    this.opts = {
      followCamera:    true,
      cameraMargin:    100,
      cameraSmoothing: 0.1,
      moveSpeed:       10,
      ...options,
    };

    this.events    = new GameEvents();
    this.gameScene = new Container();
    (this.gameScene as any).sortableChildren = true;
    app.stage.addChild(this.gameScene);

    // PIXI v8: the stage must be 'static' + cover the full canvas so that
    // pointermove / pointerup fire even over empty areas (needed for drag).
    app.stage.eventMode = 'static';
    app.stage.hitArea   = app.screen;

    this.input = new InputController(app.canvas as HTMLElement);

    this.app.ticker.add(this.tick, this);
  }

  // ─── House ──────────────────────────────────────────────────────────────────

  /**
   * Parse an XML house description, optionally load furniture from a JSON URL,
   * and mount the resulting `HouseView` into the scene.
   *
   * Textures are loaded automatically before creating views.
   *
   * @param xml              Map XML string (same format as HouseParser).
   * @param furnituresJsonUrl Optional URL to a furniture JSON file.
   */
  async loadHouse(xml: string, furnituresJsonUrl?: string): Promise<HouseView> {
    await BaseTextureLoader.getInstance().load();

    const house = HouseParser.parseStructure(xml);

    if (furnituresJsonUrl) {
      const response   = await fetch(furnituresJsonUrl);
      const jsonString = await response.text();
      await HouseParser.parseFurnitures(house, jsonString);
    }

    // Remove previous house if any
    if (this.houseView) {
      this.gameScene.removeChild(this.houseView);
      this.houseView.destroy({ children: true });
    }

    this.houseView = new HouseView(house, this.events);
    this.gameScene.addChild(this.houseView);
    this.houseView.setEditMode(this._editMode);

    // Re-parent existing avatars into the new houseView
    for (const avatar of this.avatarsById.values()) {
      this.houseView.addChild(avatar);
    }

    return this.houseView;
  }

  // ─── Edit mode ──────────────────────────────────────────────────────────────

  /**
   * Toggle furniture drag & drop mode (edit mode).
   * When disabled, furniture sprites ignore pointer events.
   */
  setEditMode(enabled: boolean): void {
    this._editMode = enabled;
    this.houseView?.setEditMode(enabled);
  }

  get editMode(): boolean {
    return this._editMode;
  }

  // ─── Avatars ────────────────────────────────────────────────────────────────

  /**
   * Spawn a new avatar and add it to the scene.
   *
   * @param id      Unique identifier for this avatar.
   * @param x       Initial X position.
   * @param y       Initial Y position.
   * @param options Appearance options (socle, direction, skin, clothing…).
   */
  spawnAvatar(
    id: string,
    x: number,
    y: number,
    options: AvatarSpawnOptions = {},
  ): Avatar {
    if (this.avatarsById.has(id)) {
      throw new Error(`Avatar '${id}' already exists. Remove it first.`);
    }

    const avatar = new Avatar(this.app, {
      showSocle: options.showSocle ?? true,
      direction: options.direction ?? 1,
    });

    if (options.skinColor !== undefined) avatar.setSkinColor(options.skinColor);
    if (options.clothing) {
      for (const [cat, cId] of Object.entries(options.clothing)) {
        avatar.changeClothing(cat, cId);
      }
    }

    avatar.position.set(x, y);
    avatar.updateZIndex();

    // Username label + cursor pointer
    avatar.setUsername(options.username ?? id);

    // Relay PIXI hover events → GameEvents (interceptable from outside)
    avatar.on('pointerover',  () => this.events.emit('avatar:hover',    { avatar, id }));
    avatar.on('pointerout',   () => this.events.emit('avatar:hoverend', { avatar, id }));

    // Add to houseView for correct z‐ordering vs furniture; fall back to gameScene.
    const container = this.houseView ?? this.gameScene;
    container.addChild(avatar);

    this.avatarsById.set(id, avatar);
    this.events.emit('avatar:spawned', { avatar, id });

    return avatar;
  }

  /**
   * Remove an avatar from the scene and clean up its input binding.
   */
  removeAvatar(id: string): boolean {
    const avatar = this.avatarsById.get(id);
    if (!avatar) return false;

    this.events.emit('avatar:despawned', { id });
    this.unbindPlayerInput(id);

    avatar.parent?.removeChild(avatar);
    avatar.destroy({ children: true });
    this.avatarsById.delete(id);

    if (this.followAvatarId === id) {
      this.followAvatarId = null;
    }

    return true;
  }

  /**
   * Returns the Avatar instance for a given id, or `undefined`.
   */
  getAvatar(id: string): Avatar | undefined {
    return this.avatarsById.get(id);
  }

  /**
   * Returns all spawned avatars as a read-only map.
   */
  getAvatars(): ReadonlyMap<string, Avatar> {
    return this.avatarsById;
  }

  // ─── Input ──────────────────────────────────────────────────────────────────

  /**
   * Bind keyboard (and touch) input to an avatar.
   * The first bound avatar is automatically followed by the camera.
   *
   * @param avatarId  Avatar to control.
   * @param keys      Key config (defaults to arrow keys).
   */
  bindPlayerInput(avatarId: string, keys: KeyConfig = DEFAULT_KEYS): void {
    const state: PlayerState = { arrows: 0, lastMoveTime: 0, lookX: 0, lookY: 0 };
    this.playerStates.set(avatarId, state);

    if (this.followAvatarId === null) {
      this.followAvatarId = avatarId;
    }

    this.input.bind(avatarId, (arrows) => {
      const s = this.playerStates.get(avatarId);
      if (!s) return;
      s.arrows = arrows;

      const avatar = this.avatarsById.get(avatarId);
      if (!avatar) return;

      if (arrows > 0) {
        avatar.changeDirection(arrows);
        avatar.walk();
      } else {
        avatar.stopWalk();
      }
    }, keys);
  }

  /**
   * Remove input binding for an avatar.
   */
  unbindPlayerInput(avatarId: string): void {
    this.playerStates.delete(avatarId);
    this.input.unbind(avatarId);
    if (this.followAvatarId === avatarId) {
      // Follow next bound avatar if any
      this.followAvatarId = this.playerStates.size > 0
        ? [...this.playerStates.keys()][0]
        : null;
    }
  }

  // ─── Camera ──────────────────────────────────────────────────────────────────

  /**
   * Manually set the camera (gameScene) position.
   */
  setCameraPosition(x: number, y: number): void {
    this.gameScene.x = x;
    this.gameScene.y = y;
  }

  /** Set which avatar the camera should follow (must be a spawned avatar id). */
  setFollowAvatar(id: string | null): void {
    this.followAvatarId = id;
  }

  // ─── Events shortcut ────────────────────────────────────────────────────────

  on<K extends keyof GameEventMap>(
    event: K,
    cb: (data: GameEventMap[K]) => void,
  ): this {
    this.events.on(event, cb);
    return this;
  }

  off<K extends keyof GameEventMap>(
    event: K,
    cb: (data: GameEventMap[K]) => void,
  ): this {
    this.events.off(event, cb);
    return this;
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  /**
   * Destroy all resources: ticker, input, events, scene graph.
   * The PIXI Application itself is NOT destroyed (it was provided externally).
   */
  destroy(): void {
    this.app.ticker.remove(this.tick, this);
    this.input.destroy();
    this.events.removeAllListeners();
    this.gameScene.destroy({ children: true });
    this.avatarsById.clear();
    this.playerStates.clear();
  }

  // ─── Private: game loop ───────────────────────────────────────────────────────

  private tick = (): void => {
    const now = performance.now();

    for (const [avatarId, state] of this.playerStates) {
      if (state.arrows === 0) continue;
      if (now - state.lastMoveTime < GameCore.MOVE_INTERVAL) continue;

      state.lastMoveTime = now;

      const avatar = this.avatarsById.get(avatarId);
      if (!avatar || !this.houseView) continue;

      // Diagonal normalisation
      const diagonal = (state.arrows & (DIR_LEFT | DIR_RIGHT)) &&
                       (state.arrows & (DIR_UP | DIR_DOWN));
      const divider = diagonal ? 1.33 : 1;
      const speed   = this.opts.moveSpeed;

      let newX = avatar.x;
      let newY = avatar.y;
      if (state.arrows & DIR_DOWN)  newY += speed / divider;
      if (state.arrows & DIR_UP)    newY -= speed / divider;
      if (state.arrows & DIR_LEFT)  newX -= speed / divider;
      if (state.arrows & DIR_RIGHT) newX += speed / divider;

      const prevPos: Point = { x: avatar.x, y: avatar.y };

      // Collision hitbox: flat rectangle at the feet, excluding the socle
      const feetY = avatar.socle ? avatar.socle.y : avatar.height;
      const hitW  = 40;
      const hitX  = (avatar.width - hitW) / 2;

      const buildHitbox = (px: number, py: number): Point[] => [
        { x: px + hitX,        y: py + feetY - 2 },
        { x: px + hitX + hitW, y: py + feetY - 2 },
        { x: px + hitX + hitW, y: py + feetY },
        { x: px + hitX,        y: py + feetY },
      ];

      const newPoints = buildHitbox(newX, newY);

      let finalX = avatar.x;
      let finalY = avatar.y;
      let moved  = false;

      if (!this.houseView.checkCollision(avatar, newPoints)) {
        // No collision – move fully
        finalX = newX;
        finalY = newY;
        moved  = true;
      } else {
        // Binary search for the closest valid position along the movement vector
        let lo = 0;
        let hi = 1;
        for (let iter = 0; iter < 8; iter++) {
          const mid   = (lo + hi) / 2;
          const midX  = avatar.x + (newX - avatar.x) * mid;
          const midY  = avatar.y + (newY - avatar.y) * mid;
          if (!this.houseView.checkCollision(avatar, buildHitbox(midX, midY))) {
            lo = mid;
          } else {
            hi = mid;
          }
        }
        if (lo > 0.01) {
          finalX = avatar.x + (newX - avatar.x) * lo;
          finalY = avatar.y + (newY - avatar.y) * lo;
          moved  = true;
        }
      }

      if (moved) {
        avatar.x = finalX;
        avatar.y = finalY;
        avatar.zIndex = this.houseView.getDepthAtPointClip(avatar.points);

        this.events.emit('avatar:moved', {
          avatar,
          id:   avatarId,
          from: prevPos,
          to:   { x: finalX, y: finalY },
        });
      }
    }

    // ── Look-ahead : lerp vers la direction de déplacement, retour à 0 à l'arrêt ──
    const LOOK_DIST   = 150; // décalage max en pixels
    const LOOK_SMOOTH = 0.04; // vitesse de lerp (indépendante du margin)
    for (const state of this.playerStates.values()) {
      let tx = 0, ty = 0;
      if (state.arrows & DIR_RIGHT) tx += 1;
      if (state.arrows & DIR_LEFT)  tx -= 1;
      if (state.arrows & DIR_DOWN)  ty += 1;
      if (state.arrows & DIR_UP)    ty -= 1;
      const len = Math.sqrt(tx * tx + ty * ty);
      if (len > 0) { tx /= len; ty /= len; }
      state.lookX += (tx * LOOK_DIST - state.lookX) * LOOK_SMOOTH;
      state.lookY += (ty * LOOK_DIST - state.lookY) * LOOK_SMOOTH;
    }

    // Mise à jour caméra chaque tick pour garantir un suivi fluide
    // même quand l'avatar vient de s'arrêter près d'un bord.
    if (this.opts.followCamera && this.followAvatarId) {
      const followed = this.avatarsById.get(this.followAvatarId);
      const st = this.playerStates.get(this.followAvatarId);
      if (followed) this.updateCamera(followed, st?.lookX ?? 0, st?.lookY ?? 0);
    }

    this.app.stage.sortChildren();
    this.houseView?.sortChildren();
  };

  private updateCamera(avatar: Avatar, lookX = 0, lookY = 0): void {
    const MARGIN  = this.opts.cameraMargin;
    const SMOOTH  = this.opts.cameraSmoothing;
    const screenW = this.app.screen.width;
    const screenH = this.app.screen.height;

    // Point de référence : centre de l'avatar + décalage look-ahead
    const refX = avatar.x + avatar.width  / 2 + lookX;
    const refY = avatar.y + (avatar.socle ? avatar.socle.y : avatar.height) + lookY;

    // Position écran actuelle du point de référence
    const screenX = refX + this.gameScene.x;
    const screenY = refY + this.gameScene.y;

    // Distance au bord le plus proche sur chaque axe
    const distX = Math.min(screenX, screenW - screenX);
    const distY = Math.min(screenY, screenH - screenY);

    // Facteur d'urgence [0, 1] : 0 = au bord du margin, 1 = sur le bord écran
    // Utiliser easeIn (t²) pour une accélération douce.
    const tX = distX < MARGIN ? Math.pow(1 - distX / MARGIN, 2) : 0;
    const tY = distY < MARGIN ? Math.pow(1 - distY / MARGIN, 2) : 0;
    const t  = Math.max(tX, tY);

    if (t <= 0) return; // avatar dans la zone sûre, pas de mouvement caméra

    // La caméra vise le centrage parfait de l'avatar
    const targetX = screenW / 2 - refX;
    const targetY = screenH / 2 - refY;

    // Vitesse effective : de SMOOTH*0 (bord du margin) à SMOOTH*2 (bord écran)
    const alpha = SMOOTH * 2 * t;

    this.gameScene.x += (targetX - this.gameScene.x) * alpha;
    this.gameScene.y += (targetY - this.gameScene.y) * alpha;
  }
}
