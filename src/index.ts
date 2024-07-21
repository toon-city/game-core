import * as PIXI from 'pixi.js';
import {BaseTextureLoader} from './game/textures/BaseTextureLoader';
import {Avatar} from './game/avatar/Avatar';

const left = 0b1000;
const right = 0b0100;
const up = 0b0010;
const down = 0b0001;

const main = async () => {
  // Main app
  let app = new PIXI.Application();

  await app.init({background: '#1099bb'});

  const size = 1;

  app.renderer.resize(800, 800);

  document.body.appendChild(app.canvas);

  await BaseTextureLoader.getInstance().load();

  var avatar: Avatar = new Avatar(app, {showSocle: true, direction: down});
  avatar.scale.set(size, size);
  avatar.position.set(20, 40);
  app.stage.addChild(avatar);
  avatar.changeDirection(1);

  [2, 4, 5, 6, 8, 9, 10].forEach((direction, index) => {
    let newAvatar = new Avatar(app, {showSocle: true, direction: down});
    newAvatar.scale.set(size, size);
    newAvatar.position.set(80 + 80 * index, 40);
    app.stage.addChild(newAvatar);
    newAvatar.changeDirection(direction);
  });

  avatar.interactive = true;

  let arrows = 0;

  avatar.scale.set(1);

  window.addEventListener('keydown', (event) => {
    if (event.key == 'ArrowDown') {
      changeArrows(down, true);
    }
    event.preventDefault();
  });

  window.addEventListener('keyup', (event) => {
    if (event.key == 'ArrowDown') {
      changeArrows(down, false);
    }
    event.preventDefault();
  });

  window.addEventListener('keydown', (event) => {
    if (event.key == 'ArrowLeft') {
      changeArrows(left, true);
    }
    event.preventDefault();
  });

  window.addEventListener('keyup', (event) => {
    if (event.key == 'ArrowLeft') {
      changeArrows(left, false);
    }
    event.preventDefault();
  });

  window.addEventListener('keydown', (event) => {
    if (event.key == 'ArrowRight') {
      changeArrows(right, true);
    }
    event.preventDefault();
  });

  window.addEventListener('keyup', (event) => {
    if (event.key == 'ArrowRight') {
      changeArrows(right, false);
    }
    event.preventDefault();
  });

  window.addEventListener('keydown', (event) => {
    if (event.key == 'ArrowUp') {
      changeArrows(up, true);
    }
    event.preventDefault();
  });

  window.addEventListener('keyup', (event) => {
    if (event.key == 'ArrowUp') {
      changeArrows(up, false);
    }
    event.preventDefault();
  });

  const changeArrows = (direction: number, active: boolean) => {
    let lastArrows = arrows;
    if (active) {
      arrows |= direction;
    } else {
      arrows &= ~direction & 0b1111;
    }

    if (lastArrows != arrows) {
      changeWalk(arrows > 0);
    }
  };

  const changeWalk = (walk: boolean) => {
    if (walk) {
      avatar.changeDirection(arrows);
      avatar.walk();
    } else {
      avatar.stopWalk();
    }
  };

  app.ticker.add((delta) => {
    if (avatar.isWalking) {
      let divider =
        avatar.direction & (left | right) && avatar.direction & (up | down)
          ? 1.4
          : 1;
      if (avatar.direction & down) avatar.y += 0.8 / divider;
      if (avatar.direction & up) avatar.y -= 0.8 / divider;
      if (avatar.direction & left) avatar.x -= 0.8 / divider;
      if (avatar.direction & right) avatar.x += 0.8 / divider;
    }
  });
};

main();
