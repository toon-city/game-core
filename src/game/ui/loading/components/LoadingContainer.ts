import {Container, Sprite, Texture, Text, Graphics} from 'pixi.js';

export class LoadingContainer extends Container {
  constructor(private message: string, private progress: number | null) {
    super();

    const sprite = new Sprite(Texture.from('assets/ui/loading.webm'));
    sprite.texture.source.resource.loop = true;

    this.addChild(sprite);

    const text = new Text({
      text: this.message,
      style: {fontSize: 11.5, fill: 0xffffff, fontFamily: 'Cute Dino'},
    });

    text.x = 80;
    text.y = 115;

    this.addChild(text);

    // 2. Paramètres de la barre de chargement
    const barWidth = 125;
    const barHeight = 12;
    const barX = 80;
    const barY = 135;
    // Rayon de courbure pour les coins (ici, la moitié de la hauteur → forme “pill”)
    const cornerRadius = barHeight;

    // 3. Création du Graphics pour le fond (orange) avec coins arrondis
    const barBackground = new Graphics()
      .roundRect(0, 0, barWidth, barHeight, cornerRadius)
      .fill(0xFFFBDA)
      .stroke(0x000000);
    barBackground.x = barX;
    barBackground.y = barY;
    this.addChild(barBackground);

    // 4. Création du Graphics pour le remplissage (rouge) avec coins arrondis
    const barFill = new Graphics()
      .roundRect(0, 0, ((barWidth - 4) * 1), barHeight - 4, cornerRadius)
      .fill(0xE85C43);
    barFill.x = barX + 2;
    barFill.y = barY + 2;
    this.addChild(barFill);
  }
}
