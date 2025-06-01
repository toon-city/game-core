import {Container, Sprite, Texture, Text, Graphics} from 'pixi.js';

export class LoadingContainer extends Container {
  private progress: number | null = null;
  private readonly text: Text;
  private readonly loadingBar: Container;

  constructor(message: string, progress: number | null) {
    super();
    this.progress = progress;

    const sprite = new Sprite(Texture.from('assets/ui/loading.webm'));
    sprite.texture.source.resource.loop = true;

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
    this.addChild(barBackground);

    const barFill = new Graphics()
      .roundRect(0, 0, (barWidth - 4) * this.progress, barHeight - 4, cornerRadius)
      .fill(0xe85c43);
    barFill.x = barX + 2;
    barFill.y = barY + 2;
    this.addChild(barFill);
    
    const barBubble = new Graphics()
      .roundRect(0, 0, ((barWidth - 4) * this.progress) - 4, 4, 2)
      .fill(0xffffff);

    barBubble.alpha = 0.33;
    barBubble.x = barX + 4;
    barBubble.y = barY + 5;
    this.addChild(barBubble);
  }
}
