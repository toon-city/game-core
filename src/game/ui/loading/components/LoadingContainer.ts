import {Container, Sprite, Texture, Text} from 'pixi.js';

export class LoadingContainer extends Container {
  constructor(private message: string, private progress: number | null) {
    super();

    const sprite = new Sprite(Texture.from('assets/ui/loading.webm'));
    sprite.texture.source.resource.loop = true;

    this.addChild(sprite);

    const text = new Text({text: this.message, style: {fontSize: 12, fill: 0xffffff, fontFamily: 'Brady Bunch Remastered'}});

    text.x = 80;
    text.y = 110;

    this.addChild(text);
  }
}
