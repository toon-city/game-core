import { Container, Graphics, Text, TextStyle } from 'pixi.js';

const PADDING  = 10;
const RADIUS   = 8;
const TAIL_H   = 8;   // height of the triangular tail pointing downward
const MAX_W    = 160; // maximum bubble width before wrapping

/**
 * A speech‑bubble overlay that can be attached as a child of an Avatar.
 *
 * Position the bubble so its tail tip is at (0, 0) of the parent container;
 * the bubble body grows upward. Usually you want to set `bubble.x` to
 * half the avatar width and leave `bubble.y` at 0 (top of avatar).
 *
 * @example
 * const bubble = new AvatarBubble();
 * avatar.addChild(bubble);
 * bubble.x = avatar.width / 2;
 * bubble.show('Hello!', 3000);
 */
export class AvatarBubble extends Container {
  private readonly bg:   Graphics;
  private readonly labelText: Text;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super();

    this.bg = new Graphics();
    this.addChild(this.bg);

    const style = new TextStyle({
      fontSize:      13,
      fill:          0x222222,
      fontFamily:    'Arial, sans-serif',
      wordWrap:      true,
      wordWrapWidth: MAX_W - PADDING * 2,
      align:         'center',
    });
    this.labelText = new Text({ text: '', style });
    this.addChild(this.labelText);

    this.visible = false;
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Display a message.
   *
   * @param text     Message to show.
   * @param duration How long to show the bubble in ms. Pass `0` to keep it
   *                 visible indefinitely (call `hide()` manually).
   */
  show(text: string, duration = 3000): void {
    // Cancel any pending auto‑hide
    this.clearTimer();

    this.labelText.text = text;
    this.redraw();
    this.visible = true;

    if (duration > 0) {
      this.hideTimer = setTimeout(() => this.hide(), duration);
    }
  }

  /** Hide and reset the bubble immediately. */
  hide(): void {
    this.clearTimer();
    this.visible = false;
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private clearTimer(): void {
    if (this.hideTimer !== null) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  private redraw(): void {
    const tw = this.labelText.width;
    const th = this.labelText.height;

    const bubbleW = Math.min(tw + PADDING * 2, MAX_W + PADDING * 2);
    const bubbleH = th + PADDING * 2;

    // Bubble body sits above the tail (tail tip is at y = 0)
    const bodyTopY    = -(bubbleH + TAIL_H);
    const bodyBottomY = -TAIL_H;

    // Centre the text horizontally
    this.labelText.x = -bubbleW / 2 + PADDING;
    this.labelText.y = bodyTopY + PADDING;

    this.bg.clear();

    // ── Body ────────────────────────────────────────────────────────────────
    this.bg
      .roundRect(-bubbleW / 2, bodyTopY, bubbleW, bubbleH, RADIUS)
      .fill({ color: 0xffffff, alpha: 0.93 })
      .stroke({ color: 0xbbbbbb, width: 1.5, alignment: 1 });

    // ── Tail (triangle pointing down to (0, 0)) ───────────────────────────
    this.bg
      .moveTo(-6, bodyBottomY)
      .lineTo(6, bodyBottomY)
      .lineTo(0, 0)
      .closePath()
      .fill({ color: 0xffffff, alpha: 0.93 });
  }
}
