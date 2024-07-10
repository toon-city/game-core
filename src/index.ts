import * as PIXI from 'pixi.js';
import { Character } from './figure/entities/character/Character';
import { BaseTextureLoader } from './figure/textures/BaseTextureLoader';

const main = async () => {
    // Main app
    let app = new PIXI.Application({ background: '#1099bb' });

    const size = 1;

    app.renderer.resize(800, 800);

    document.body.appendChild(app.view as HTMLCanvasElement);

    await BaseTextureLoader.getInstance().load();

    const character: Character = new Character(app, true);
    character.scale.set(size, size);
    app.stage.addChild(character);

    character.interactive = true;

    window.addEventListener('keydown', (event) => {
        if (event.key == "ArrowDown") {
            character.walk();
        }
        event.preventDefault();
    });

    window.addEventListener('keyup', (event) => {
        if (event.key == "ArrowDown") {
            character.stopWalk();
        }
        event.preventDefault();
    });

    app.ticker.add((delta) => {
        if (character.isWalking) {
            character.y += 0.8;
        }
    });
};

main();