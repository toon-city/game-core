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

    let direction = 0b0000;

    window.addEventListener('keydown', (event) => {
        if (event.key == "ArrowDown") {
            direction |= 0b0100;
            walk();
        }
        event.preventDefault();
    });

    window.addEventListener('keyup', (event) => {
        if (event.key == "ArrowDown") {
            direction &= 0b1011;
            walk();
        }
        event.preventDefault();
    });

    window.addEventListener('keydown', (event) => {
        if (event.key == "ArrowLeft") {
            direction |= 0b0010;
            walk();
        }
        event.preventDefault();
    });

    window.addEventListener('keyup', (event) => {
        if (event.key == "ArrowLeft") {
            direction &= 0b1101;
            walk();
        }
        event.preventDefault();
    });

    const walk = () => {
        character.changeDirection(direction);
        if (direction > 0) {
            console.log('walk');
            character.walk();
        } else {
            console.log('stop walk');
            character.stopWalk();
        }
    };

    app.ticker.add((delta) => {
        if (character.isWalking) {
            character.y += 0.8;
        }
    });
};

main();