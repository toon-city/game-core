import {Container, Sprite, Texture, Text, Graphics} from 'pixi.js';

export class LoadingContainer extends Container {
  private progress: number | null = null;
  private readonly text: Text;
  private readonly loadingBar: Container;

  constructor(message: string, progress: number | null) {
    super();
    this.progress = progress;

    const texture = Texture.from('assets/ui/loading.webm');
    const sprite = new Sprite(texture);
    // La texture vidéo doit être muette pour que l'autoplay navigateur fonctionne.
    const el = sprite.texture.source?.resource as HTMLVideoElement | undefined;
    if (el) {
      el.loop   = true;
      el.muted  = true;
      el.play().catch(() => { /* ignore autoplay refusé */ });
    }

    this.addChild(sprite);

    this.text = new Text({
      text: message,
      style: {fontSize: 11.5, fill: 0xffffff, fontFamily: 'Cute Dino'},
    });

    this.loadingBar = new Container();

    this.updateTextPosition();
    this.addChild(this.text);
    this.addChild(this.loadingBar);
  }

  private updateTextPosition(): void {
    if (this.progress == null) {
      this.text.x = 80;
      this.text.y = 125;
      return;
    }
    this.text.x = 80;
    this.text.y = 115;
  }

  public setMessage(message: string): void {
    this.text.text = message;
    this.updateTextPosition();
  }

  public setProgress(progress: number | null): void {
    this.loadingBar.removeChildren();
    this.progress = progress;


    if (this.progress === null) {
      this.updateTextPosition();
      return;
    }

    this.updateTextPosition();

    const barWidth = 125;
    const barHeight = 12;
    const barX = 80;
    const barY = 135;
    const cornerRadius = barHeight;

    const barBackground = new Graphics()
      .roundRect(0, 0, barWidth, barHeight, cornerRadius)
      .fill(0xfffbda)
      .stroke(0x000000);
    barBackground.x = barX;
    barBackground.y = barY;
    this.loadingBar.addChild(barBackground);

    const barFill = new Graphics()
      .roundRect(0, 0, (barWidth - 4) * this.progress, barHeight - 4, cornerRadius)
      .fill(0xe85c43);
    barFill.x = barX + 2;
    barFill.y = barY + 2;
    this.loadingBar.addChild(barFill);
    
    const barBubble = new Graphics()
      .roundRect(0, 0, ((barWidth - 4) * this.progress) - 4, 4, 2)
      .fill(0xffffff);

    barBubble.alpha = 0.33;
    barBubble.x = barX + 4;
    barBubble.y = barY + 5;
    this.loadingBar.addChild(barBubble);
  }
}
