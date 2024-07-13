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

    const character: Character = new Character(app, { showSocle: true, direction: down });
    character.scale.set(size, size);
    character.position.set(600, 0);
    app.stage.addChild(character);

    character.interactive = true;

    let arrows = 0;

    character.changeDirection(9);
    // character.walk();

    window.addEventListener('keydown', (event) => {
        if (event.key == "ArrowDown") {
            changeArrows(down, true);
        }
        event.preventDefault();
    });

    window.addEventListener('keyup', (event) => {
        if (event.key == "ArrowDown") {
            changeArrows(down, false);
        }
        event.preventDefault();
    });

    window.addEventListener('keydown', (event) => {
        if (event.key == "ArrowLeft") {
            changeArrows(left, true);
        }
        event.preventDefault();
    });

    window.addEventListener('keyup', (event) => {
        if (event.key == "ArrowLeft") {
            changeArrows(left, false);
        }
        event.preventDefault();
    });

    window.addEventListener('keydown', (event) => {
        if (event.key == "ArrowRight") {
            changeArrows(right, true);
        }
        event.preventDefault();
    });

    window.addEventListener('keyup', (event) => {
        if (event.key == "ArrowRight") {
            changeArrows(right, false);
        }
        event.preventDefault();
    });

    window.addEventListener('keydown', (event) => {
        if (event.key == "ArrowUp") {
            changeArrows(up, true);
        }
        event.preventDefault();
    });

    window.addEventListener('keyup', (event) => {
        if (event.key == "ArrowUp") {
            changeArrows(up, false);
        }
        event.preventDefault();
    });

    const changeArrows = (direction: number, active: boolean) => {
        let lastArrows = arrows;
        if (active) {
            arrows |= direction;
        } else {
            arrows &= (~direction & 0b1111);
        }

        if (lastArrows != arrows) {
            changeWalk(arrows > 0);
        }
    }

    const changeWalk = (walk: boolean) => {
        if (walk) {
            character.changeDirection(arrows);
            character.walk();
        } else {
            character.stopWalk();
        }
    };

    app.ticker.add((delta) => {
        if (character.isWalking) {
            // let divider = character.direction & (left | right) && character.direction & (up | down) ? 1.4 : 1;
            // if (character.direction & down) character.y += (0.8 / divider);
            // if (character.direction & up) character.y -= (0.8 / divider);
            // if (character.direction & left) character.x -= (0.8 / divider);
            // if (character.direction & right) character.x += (0.8 / divider);
        }
    });
};

main();