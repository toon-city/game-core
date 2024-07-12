import * as PIXI from 'pixi.js';
import { Character } from './character/Character';
import { BaseTextureLoader } from './character/textures/BaseTextureLoader';

const left = 0b1000;
const right = 0b0100;
const up = 0b0010;
const down = 0b0001;

const main = async () => {
    // Main app
    let app = new PIXI.Application();
    
    await app.init({ background: '#1099bb' });

    const size = 1;

    app.renderer.resize(800, 800);

    document.body.appendChild(app.canvas);

    await BaseTextureLoader.getInstance().load();

    const character: Character = new Character(app, {showSocle: true, direction: down});
    character.scale.set(size, size);
    app.stage.addChild(character);

    character.interactive = true;

    let direction = down;

    window.addEventListener('keydown', (event) => {
        if (event.key == "ArrowDown") {
            direction |= down;
            walk();
        }
        event.preventDefault();
    });

    window.addEventListener('keyup', (event) => {
        if (event.key == "ArrowDown") {
            direction &= (~down & 0b1111);
            walk();
        }
        event.preventDefault();
    });

    window.addEventListener('keydown', (event) => {
        if (event.key == "ArrowLeft") {

            direction |= left;
            walk();
        }
        event.preventDefault();
    });

    window.addEventListener('keyup', (event) => {
        if (event.key == "ArrowLeft") {
            direction &= (~left & 0b1111);
            walk();
        }
        event.preventDefault();
    });

    const walk = () => {
        character.changeDirection(direction);
        // if (direction > 0) {
        //     console.log('walk');
        //     character.walk();
        // } else {
        //     console.log('stop walk');
        //     character.stopWalk();
        // }
    };

    app.ticker.add((delta) => {
        if (character.isWalking) {
            character.y += 0.8;
        }
    });
};

main();