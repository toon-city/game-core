import * as PIXI from 'pixi.js';
import {BaseTextureLoader} from './game/textures/BaseTextureLoader';
import {Avatar} from './game/avatar/Avatar';
import { parseHouseXML } from './game/maison/OldHouse';

const left = 0b1000;
const right = 0b0100;
const up = 0b0010;
const down = 0b0001;

const main = async () => {
  // Main app
  let app = new PIXI.Application();

  await app.init({background: '#1099bb', antialias: true, resolution: 1});

  const size = 1;

  app.renderer.resize(5000, 5000);

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

  let xmlString = `
    <MAP>
        <P YPOS="-340" XPOS="-780"  />
        <P YPOS="-340" XPOS="-40"  />
        <P YPOS="40" XPOS="-40"  />
        <P YPOS="40" XPOS="-780"  />
        <P YPOS="-340" XPOS="-720"  />
        <P YPOS="-340" XPOS="-620"  />
        <P YPOS="-340" XPOS="-560"  />
        <P YPOS="-340" XPOS="-500"  />
        <P YPOS="-340" XPOS="-400"  />
        <P YPOS="-520" XPOS="-780"  />
        <P YPOS="-520" XPOS="-560"  />
        <P YPOS="-520" XPOS="-40"  />
        <P YPOS="-520" XPOS="560"  />
        <P YPOS="40" XPOS="560"  />
        <P YPOS="-200" XPOS="-40"  />
        <P YPOS="-100" XPOS="-40"  />
        <P YPOS="440" XPOS="-780"  />
        <P YPOS="440" XPOS="560"  />
        <P YPOS="40" XPOS="-500"  />
        <P YPOS="40" XPOS="-400"  />
        <P YPOS="40" XPOS="220"  />
        <P YPOS="40" XPOS="320"  />
        <W SF="2.25" H="250" PTB="0" PTA="9"  />
        <W SF="0.03" H="10" PTB="4" PTA="0"  />
        <W SF="2.75" H="250" PTB="10" PTA="9"  />
        <W SF="0.09" H="10" PTB="6" PTA="10"  />
        <W SF="0.03" H="10" PTB="5" PTA="6"  />
        <W SF="0.03" H="10" PTB="7" PTA="6"  />
        <W SF="0.09" H="10" PTB="11" PTA="1"  />
        <W SF="0.18" H="10" PTB="8" PTA="1"  />
        <W SF="6.5" H="250" PTB="11" PTA="10"  />
        <W ENTER="0" D0="192" SF="4.75" H="250" PTB="3" PTA="0"  />
        <W SF="7.5" H="250" PTB="12" PTA="11"  />
        <W SF="0.28" H="10" PTB="13" PTA="12"  />
        <W SF="0.07" H="10" PTB="14" PTA="1"  />
        <W SF="0.07" H="10" PTB="15" PTA="2"  />
        <W SF="2" H="10" PTB="17" PTA="13"  />
        <W SF="6.7" H="10" PTB="16" PTA="17"  />
        <W SF="5" H="250" PTB="3" PTA="16"  />
        <W SF="1.4" H="10" PTB="18" PTA="3"  />
        <W SF="1.8" H="10" PTB="2" PTA="19"  />
        <W SF="1.3" H="10" PTB="20" PTA="2"  />
        <W SF="1.2" H="10" PTB="13" PTA="21"  />
        <F PT3="3" PT2="2" PT1="1" PT0="0" SF="0"  />
        <F PT5="0" PT4="4" PT3="5" PT2="6" PT1="10" PT0="9" SF="0"  />
        <F PT5="6" PT4="7" PT3="8" PT2="1" PT1="11" PT0="10" SF="0"  />
        <F PT6="1" PT5="14" PT4="15" PT3="2" PT2="13" PT1="12" PT0="11" SF="0"  />
        <F PT3="16" PT2="17" PT1="13" PT0="3" SF="0"  />
    </MAP>
    `;

    xmlString = `
    <MAP>
        <P YPOS="-200" XPOS="-1040"  />
        <P YPOS="-200" XPOS="-100"  />
        <P YPOS="520" XPOS="-1040"  />
        <P YPOS="520" XPOS="-620"  />
        <P YPOS="240" XPOS="-620"  />
        <P YPOS="520" XPOS="-100"  />
        <P YPOS="240" XPOS="-480"  />
        <P YPOS="240" XPOS="-100"  />
        <P YPOS="40" XPOS="-380"  />
        <P YPOS="240" XPOS="-380"  />
        <P YPOS="120" XPOS="-380"  />
        <P YPOS="40" XPOS="-100"  />
        <P YPOS="240" XPOS="-580"  />
        <W ENTER="0" D0="224" SF="14.1" H="250" PTB="1" PTA="0"  />
        <W SF="0.21" H="10" PTB="3" PTA="2"  />
        <W SF="0.14" H="10" PTB="4" PTA="3"  />
        <W SF="10.8" H="250" PTB="2" PTA="0"  />
        <W SF="0.22" H="10" PTB="7" PTA="1"  />
        <W SF="0.14" H="10" PTB="5" PTA="7"  />
        <W SF="0.26" H="10" PTB="5" PTA="3"  />
        <W SF="0.19" H="10" PTB="7" PTA="6"  />
        <W SF="0.14" H="10" PTB="8" PTA="11"  />
        <W SF="0.06" H="10" PTB="10" PTA="9"  />
        <W SF="0.5" H="10" PTB="12" PTA="4"  />
        <F PT7="3" PT6="4" PT5="9" PT4="8" PT3="11" PT2="1" PT1="0" PT0="2" SF="0"  />
        <F PT3="8" PT2="9" PT1="7" PT0="11" SF="0"  />
        <F PT3="7" PT2="5" PT1="3" PT0="4" SF="0"  />
    </MAP>`;

    xmlString = `
    <MAP>
        <P YPOS="-220" XPOS="-1040" />
        <P YPOS="280" XPOS="-1040" />
        <P YPOS="280" XPOS="-180" />
        <P YPOS="-220" XPOS="-180" />
        <W ENTER="0" D0="64" SF="6.25" H="250" PTB="0" PTA="1" />
        <W SF="10.75" H="250" PTB="3" PTA="0" />
        <F PT3="2" PT2="3" PT1="0" PT0="1" SF="40" />
    </MAP>`;

//     xmlString = `
//     <MAP>
//       <P YPOS="-340" XPOS="-40"  />
//       <P YPOS="40" XPOS="-40"  />
//       <P YPOS="40" XPOS="-780"  />
//       <P YPOS="-520" XPOS="-40"  />
//       <P YPOS="-520" XPOS="560"  />
//       <P YPOS="40" XPOS="560"  />
//       <P YPOS="440" XPOS="-780"  />
//       <P YPOS="440" XPOS="560"  />
//       <P YPOS="40" XPOS="-500"  />
//       <P YPOS="40" XPOS="-400"  />
//       <P YPOS="40" XPOS="220"  />
//       <P YPOS="40" XPOS="320"  />
//       <P YPOS="-240" XPOS="-40"  />
//       <P YPOS="-340" XPOS="-340"  />
//       <P YPOS="-340" XPOS="-440"  />
//       <P YPOS="-240" XPOS="-340"  />
//       <P YPOS="-240" XPOS="-440"  />
//       <P YPOS="-720" XPOS="-40"  />
//       <P YPOS="-720" XPOS="-620"  />
//       <P YPOS="-340" XPOS="-620"  />
//       <P YPOS="40" XPOS="-620"  />
//       <P YPOS="-240" XPOS="-620"  />
//       <P YPOS="-720" XPOS="-1400"  />
//       <P YPOS="40" XPOS="-1400"  />
//       <P YPOS="440" XPOS="-1000"  />
//       <P YPOS="40" XPOS="-1000"  />
//       <P YPOS="200" XPOS="-780"  />
//       <P YPOS="280" XPOS="-780"  />
//       <P YPOS="-340" XPOS="-1000"  />
//       <P YPOS="-520" XPOS="-1000"  />
//       <P YPOS="-520" XPOS="-1400"  />
//       <P YPOS="-340" XPOS="-860"  />
//       <P YPOS="-340" XPOS="-740"  />
//       <W SF="0.09" H="10" PTB="3" PTA="0"  />
//       <W ENTER="0" D0="280" SF="0.3" H="10" PTB="4" PTA="3"  />
//       <W SF="0.28" H="10" PTB="5" PTA="4"  />
//       <W SF="0.2" H="10" PTB="7" PTA="5"  />
//       <W SF="0.67" H="10" PTB="6" PTA="7"  />
//       <W SF="0.14" H="10" PTB="8" PTA="2"  />
//       <W SF="0.18" H="10" PTB="1" PTA="9"  />
//       <W SF="0.13" H="10" PTB="10" PTA="1"  />
//       <W SF="0.12" H="10" PTB="5" PTA="11"  />
//       <W SF="0.14" H="10" PTB="12" PTA="1"  />
//       <W SF="0.15" H="10" PTB="12" PTA="15"  />
//       <W SF="0.15" H="10" PTB="0" PTA="13"  />
//       <W SF="0.1" H="10" PTB="17" PTA="3"  />
//       <W SF="7.25" H="250" PTB="18" PTA="17"  />
//       <W SF="0.19" H="10" PTB="19" PTA="18"  />
//       <W SF="0.09" H="10" PTB="14" PTA="19"  />
//       <W SF="0.09" H="10" PTB="21" PTA="16"  />
//       <W SF="0.14" H="10" PTB="20" PTA="21"  />
//       <W SF="9.75" H="250" PTB="22" PTA="18"  />
//       <W SF="0.11" H="10" PTB="24" PTA="6"  />
//       <W SF="0.2" H="10" PTB="25" PTA="24"  />
//       <W SF="0.2" H="10" PTB="25" PTA="23"  />
//       <W SF="1.1" H="10" PTB="2" PTA="25"  />
//       <W SF="0.8" H="10" PTB="2" PTA="26"  />
//       <W SF="0.8" H="10" PTB="27" PTA="6"  />
//       <W SF="0.9" H="10" PTB="29" PTA="28"  />
//       <W SF="2" H="10" PTB="29" PTA="30"  />
//       <W SF="2.5" H="250" PTB="30" PTA="22"  />
//       <W SF="7" H="250" PTB="23" PTA="30"  />
//       <W SF="0.7" H="10" PTB="31" PTA="28"  />
//       <W SF="0.6" H="10" PTB="19" PTA="32"  />
//       <F PT3="6" PT2="7" PT1="5" PT0="2" SF="0"  />
//       <F PT3="19" PT2="0" PT1="17" PT0="18" SF="0"  />
//       <F PT3="20" PT2="1" PT1="12" PT0="21" SF="0"  />
//       <F PT3="1" PT2="5" PT1="4" PT0="3" SF="0"  />
//       <F PT3="21" PT2="12" PT1="0" PT0="19" SF="0"  />
//       <F PT3="2" PT2="25" PT1="24" PT0="6" SF="0"  />
//       <F PT5="30" PT4="29" PT3="28" PT2="19" PT1="18" PT0="22" SF="0"  />
//       <F PT5="23" PT4="20" PT3="19" PT2="28" PT1="29" PT0="30" SF="0"  />
//   </MAP>`;

//     xmlString = `
//       <MAP>
//       <P YPOS="-340" XPOS="-780"  />
//       <P YPOS="-340" XPOS="-40"  />
//       <P YPOS="40" XPOS="-40"  />
//       <P YPOS="40" XPOS="-780"  />
//       <P YPOS="-340" XPOS="-720"  />
//       <P YPOS="-340" XPOS="-620"  />
//       <P YPOS="-340" XPOS="-560"  />
//       <P YPOS="-340" XPOS="-500"  />
//       <P YPOS="-340" XPOS="-400"  />
//       <P YPOS="-520" XPOS="-780"  />
//       <P YPOS="-520" XPOS="-560"  />
//       <P YPOS="-520" XPOS="-40"  />
//       <P YPOS="-520" XPOS="560"  />
//       <P YPOS="40" XPOS="560"  />
//       <P YPOS="-200" XPOS="-40"  />
//       <P YPOS="-100" XPOS="-40"  />
//       <P YPOS="440" XPOS="-780"  />
//       <P YPOS="440" XPOS="560"  />
//       <P YPOS="40" XPOS="-500"  />
//       <P YPOS="40" XPOS="-400"  />
//       <P YPOS="40" XPOS="220"  />
//       <P YPOS="40" XPOS="320"  />
//       <W SF="2.25" H="250" PTB="0" PTA="9"  />
//       <W SF="0.03" H="10" PTB="4" PTA="0"  />
//       <W SF="2.75" H="250" PTB="10" PTA="9"  />
//       <W SF="0.09" H="10" PTB="6" PTA="10"  />
//       <W SF="0.03" H="10" PTB="5" PTA="6"  />
//       <W SF="0.03" H="10" PTB="7" PTA="6"  />
//       <W SF="0.09" H="10" PTB="11" PTA="1"  />
//       <W SF="0.18" H="10" PTB="8" PTA="1"  />
//       <W SF="6.5" H="250" PTB="11" PTA="10"  />
//       <W ENTER="0" D0="192" SF="4.75" H="250" PTB="3" PTA="0"  />
//       <W SF="7.5" H="250" PTB="12" PTA="11"  />
//       <W SF="0.28" H="10" PTB="13" PTA="12"  />
//       <W SF="0.07" H="10" PTB="14" PTA="1"  />
//       <W SF="0.07" H="10" PTB="15" PTA="2"  />
//       <W SF="2" H="10" PTB="17" PTA="13"  />
//       <W SF="6.7" H="10" PTB="16" PTA="17"  />
//       <W SF="5" H="250" PTB="3" PTA="16"  />
//       <W SF="1.4" H="10" PTB="18" PTA="3"  />
//       <W SF="1.8" H="10" PTB="2" PTA="19"  />
//       <W SF="1.3" H="10" PTB="20" PTA="2"  />
//       <W SF="1.2" H="10" PTB="13" PTA="21"  />
//       <F PT3="3" PT2="2" PT1="1" PT0="0" SF="0"  />
//       <F PT5="0" PT4="4" PT3="5" PT2="6" PT1="10" PT0="9" SF="0"  />
//       <F PT5="6" PT4="7" PT3="8" PT2="1" PT1="11" PT0="10" SF="0"  />
//       <F PT6="1" PT5="14" PT4="15" PT3="2" PT2="13" PT1="12" PT0="11" SF="0"  />
//       <F PT3="16" PT2="17" PT1="13" PT0="3" SF="0"  />
//   </MAP>`;

    xmlString = `
    <MAP>
    <P YPOS="-340" XPOS="-780"  />
    <P YPOS="-340" XPOS="-40"  />
    <P YPOS="40" XPOS="-40"  />
    <P YPOS="40" XPOS="-780"  />
    <P YPOS="-340" XPOS="-720"  />
    <P YPOS="-340" XPOS="-620"  />
    <P YPOS="-340" XPOS="-560"  />
    <P YPOS="-340" XPOS="-500"  />
    <P YPOS="-340" XPOS="-400"  />
    <P YPOS="-520" XPOS="-780"  />
    <P YPOS="-520" XPOS="-560"  />
    <P YPOS="-520" XPOS="-40"  />
    <P YPOS="-520" XPOS="560"  />
    <P YPOS="40" XPOS="560"  />
    <P YPOS="-240" XPOS="-40"  />
    <P YPOS="-100" XPOS="-40"  />
    <P YPOS="500" XPOS="-780"  />
    <P YPOS="500" XPOS="560"  />
    <P YPOS="40" XPOS="-500"  />
    <P YPOS="40" XPOS="-400"  />
    <P YPOS="40" XPOS="220"  />
    <P YPOS="40" XPOS="320"  />
    <P YPOS="-920" XPOS="220"  />
    <P YPOS="-920" XPOS="320"  />
    <P YPOS="-920" XPOS="-780"  />
    <P YPOS="-920" XPOS="560"  />
    <P YPOS="-1540" XPOS="-780"  />
    <P YPOS="-1540" XPOS="560"  />
    <P YPOS="-1340" XPOS="-520"  />
    <P YPOS="-1340" XPOS="-480"  />
    <P YPOS="-1320" XPOS="-520"  />
    <P YPOS="-1320" XPOS="-480"  />
    <P YPOS="-1100" XPOS="-520"  />
    <P YPOS="-1100" XPOS="-480"  />
    <P YPOS="-1080" XPOS="-520"  />
    <P YPOS="-1080" XPOS="-480"  />
    <P YPOS="-1320" XPOS="300"  />
    <P YPOS="-1340" XPOS="300"  />
    <P YPOS="-1340" XPOS="260"  />
    <P YPOS="-1320" XPOS="260"  />
    <P YPOS="-1080" XPOS="260"  />
    <P YPOS="-1080" XPOS="300"  />
    <P YPOS="-1100" XPOS="300"  />
    <P YPOS="-1100" XPOS="260"  />
    <P YPOS="-520" XPOS="320"  />
    <P YPOS="-520" XPOS="220"  />
    <P YPOS="40" XPOS="-140"  />
    <P YPOS="500" XPOS="-140"  />
    <P YPOS="500" XPOS="-380"  />
    <P YPOS="320" XPOS="-380"  />
    <P YPOS="320" XPOS="-140"  />
    <P YPOS="380" XPOS="-380"  />
    <P YPOS="440" XPOS="-380"  />
    <P YPOS="-520" XPOS="1320"  />
    <P YPOS="-840" XPOS="560"  />
    <P YPOS="-700" XPOS="560"  />
    <P YPOS="-700" XPOS="320"  />
    <P YPOS="-840" XPOS="320"  />
    <P YPOS="-800" XPOS="320"  />
    <P YPOS="-740" XPOS="320"  />
    <P YPOS="-180" XPOS="1320"  />
    <P YPOS="-180" XPOS="860"  />
    <P YPOS="-60" XPOS="560"  />
    <P YPOS="-60" XPOS="860"  />
    <P YPOS="360" XPOS="560"  />
    <P YPOS="360" XPOS="1320"  />
    <P YPOS="500" XPOS="920"  />
    <P YPOS="360" XPOS="920"  />
    <P YPOS="500" XPOS="1320"  />
    <P YPOS="360" XPOS="820"  />
    <P YPOS="360" XPOS="1020"  />
    <P YPOS="-240" XPOS="560"  />
    <P YPOS="-340" XPOS="560"  />
    <W SF="2.25" H="250" PTB="0" PTA="9"  />
    <W SF="0.03" H="10" PTB="4" PTA="0"  />
    <W SF="2.75" H="250" PTB="10" PTA="9"  />
    <W SF="0.09" H="10" PTB="6" PTA="10"  />
    <W SF="0.03" H="10" PTB="5" PTA="6"  />
    <W SF="0.03" H="10" PTB="7" PTA="6"  />
    <W SF="0.09" H="10" PTB="11" PTA="1"  />
    <W SF="0.18" H="10" PTB="8" PTA="1"  />
    <W ENTER="0" D0="192" SF="4.75" H="250" PTB="3" PTA="0"  />
    <W SF="0.05" H="10" PTB="14" PTA="1"  />
    <W SF="0.07" H="10" PTB="15" PTA="2"  />
    <W SF="5.75" H="250" PTB="3" PTA="16"  />
    <W SF="0.14" H="10" PTB="18" PTA="3"  />
    <W SF="16.75" H="250" PTB="27" PTA="26"  />
    <W SF="0.31" H="10" PTB="27" PTA="25"  />
    <W SF="7.75" H="250" PTB="24" PTA="26"  />
    <W SF="0.5" H="10" PTB="22" PTA="24"  />
    <W SF="0.12" H="10" PTB="25" PTA="23"  />
    <W SF="0.25" H="250" PTB="28" PTA="30"  />
    <W SF="0.5" H="250" PTB="29" PTA="28"  />
    <W SF="0.25" H="250" PTB="31" PTA="29"  />
    <W SF="0.5" H="250" PTB="30" PTA="31"  />
    <W SF="0.5" H="250" PTB="33" PTA="32"  />
    <W SF="0.25" H="250" PTB="32" PTA="34"  />
    <W SF="0.25" H="250" PTB="33" PTA="35"  />
    <W SF="0.5" H="250" PTB="35" PTA="34"  />
    <W SF="0.25" H="250" PTB="37" PTA="36"  />
    <W SF="0.5" H="250" PTB="38" PTA="37"  />
    <W SF="0.25" H="250" PTB="39" PTA="38"  />
    <W SF="0.5" H="250" PTB="39" PTA="36"  />
    <W SF="0.5" H="250" PTB="41" PTA="40"  />
    <W SF="0.25" H="250" PTB="42" PTA="41"  />
    <W SF="0.5" H="250" PTB="43" PTA="42"  />
    <W SF="0.25" H="250" PTB="40" PTA="43"  />
    <W SF="6.5" H="250" PTB="11" PTA="10"  />
    <W SF="3.25" H="250" PTB="45" PTA="11"  />
    <W SF="1.2" H="10" PTB="12" PTA="44"  />
    <W SF="0.2" H="10" PTB="22" PTA="45"  />
    <W SF="0.13" H="10" PTB="46" PTA="19"  />
    <W SF="0.14" H="10" PTB="50" PTA="46"  />
    <W SF="0.12" H="10" PTB="48" PTA="47"  />
    <W SF="0.09" H="10" PTB="47" PTA="50"  />
    <W SF="0.12" H="10" PTB="49" PTA="50"  />
    <W SF="0.03" H="10" PTB="48" PTA="52"  />
    <W SF="0.03" H="10" PTB="49" PTA="51"  />
    <W SF="0.2" H="10" PTB="48" PTA="16"  />
    <W SF="0.12" H="10" PTB="21" PTA="13"  />
    <W SF="0.13" H="10" PTB="2" PTA="20"  />
    <W SF="0.05" H="10" PTB="2" PTA="46"  />
    <W SF="3.5" H="10" PTB="17" PTA="47"  />
    <W SF="0.04" H="10" PTB="57" PTA="23"  />
    <W SF="0.2" H="10" PTB="58" PTA="57"  />
    <W SF="0.2" H="10" PTB="56" PTA="59"  />
    <W SF="0.09" H="10" PTB="44" PTA="56"  />
    <W SF="0.12" H="10" PTB="55" PTA="56"  />
    <W SF="0.07" H="10" PTB="54" PTA="55"  />
    <W SF="0.12" H="10" PTB="57" PTA="54"  />
    <W SF="0.38" H="10" PTB="53" PTA="12"  />
    <W SF="0.17" H="10" PTB="60" PTA="53"  />
    <W SF="0.27" H="10" PTB="65" PTA="60"  />
    <W SF="0.07" H="10" PTB="68" PTA="65"  />
    <W SF="0.07" H="10" PTB="64" PTA="17"  />
    <W SF="0.16" H="10" PTB="13" PTA="64"  />
    <W SF="0.18" H="10" PTB="66" PTA="17"  />
    <W SF="0.2" H="10" PTB="68" PTA="66"  />
    <W SF="0.07" H="10" PTB="67" PTA="66"  />
    <W SF="0.13" H="10" PTB="69" PTA="64"  />
    <W SF="0.15" H="10" PTB="65" PTA="70"  />
    <W SF="0.15" H="10" PTB="63" PTA="62"  />
    <W SF="0.06" H="10" PTB="61" PTA="63"  />
    <W SF="0.23" H="10" PTB="61" PTA="60"  />
    <W SF="0.09" H="10" PTB="71" PTA="62"  />
    <W SF="0.09" H="10" PTB="12" PTA="72"  />
    <F PT3="3" PT2="2" PT1="1" PT0="0" SF="0"  />
    <F PT5="0" PT4="4" PT3="5" PT2="6" PT1="10" PT0="9" SF="0"  />
    <F PT5="6" PT4="7" PT3="8" PT2="1" PT1="11" PT0="10" SF="0"  />
    <F PT3="25" PT2="27" PT1="26" PT0="24" SF="0"  />
    <F PT3="45" PT2="44" PT1="23" PT0="22" SF="0"  />
    <F PT3="56" PT2="55" PT1="54" PT0="57" SF="0"  />
    <F PT3="13" PT2="12" PT1="11" PT0="2" SF="0"  />
    <F PT5="62" PT4="63" PT3="61" PT2="60" PT1="53" PT0="12" SF="0"  />
    <F PT5="63" PT4="61" PT3="60" PT2="65" PT1="64" PT0="62" SF="0"  />
    <F PT3="66" PT2="67" PT1="64" PT0="17" SF="0"  />
    <F PT3="66" PT2="68" PT1="65" PT0="67" SF="0"  />
    <F PT3="47" PT2="50" PT1="49" PT0="48" SF="0"  />
    <F PT3="13" PT2="17" PT1="47" PT0="46" SF="0"  />
    <F PT5="46" PT4="50" PT3="49" PT2="48" PT1="16" PT0="3" SF="0"  />
</MAP>`;

xmlString = `
<MAP>
    <P YPOS="300" XPOS="-200" />
    <P YPOS="700" XPOS="-200" />
    <P YPOS="700" XPOS="680" />
    <P YPOS="-160" XPOS="680" />
    <P YPOS="-160" XPOS="140" />
    <P YPOS="120" XPOS="140" />
    <P YPOS="300" XPOS="140" />
    <P YPOS="-160" XPOS="140" />
    <P YPOS="-680" XPOS="140" />
    <P YPOS="-680" XPOS="-300" />
    <P YPOS="-680" XPOS="-500" />
    <P YPOS="-680" XPOS="-880" />
    <P YPOS="120" XPOS="-880" />
    <P YPOS="120" XPOS="140" />
    <P YPOS="-740" XPOS="-880" />
    <P YPOS="-840" XPOS="-880" />
    <P YPOS="-840" XPOS="-920" />
    <P YPOS="-740" XPOS="140" />
    <P YPOS="-1920" XPOS="140" />
    <P YPOS="-1920" XPOS="-880" />
    <P YPOS="-1060" XPOS="-880" />
    <P YPOS="-1060" XPOS="-920" />
    <P YPOS="-1500" XPOS="-920" />
    <P YPOS="-1500" XPOS="-880" />
    <P YPOS="-1720" XPOS="-880" />
    <P YPOS="-1720" XPOS="-920" />
    <P YPOS="-1920" XPOS="-920" />
    <P YPOS="-1920" XPOS="-2140" />
    <P YPOS="-740" XPOS="-2140" />
    <P YPOS="-740" XPOS="-1720" />
    <P YPOS="-680" XPOS="-1720" />
    <P YPOS="-680" XPOS="-1340" />
    <P YPOS="-740" XPOS="-1340" />
    <P YPOS="-740" XPOS="-920" />
    <P YPOS="-1360" XPOS="-2140" />
    <P YPOS="-1360" XPOS="-920" />
    <P YPOS="-680" XPOS="-2480" />
    <P YPOS="-740" XPOS="-2480" />
    <P YPOS="-740" XPOS="-2880" />
    <P YPOS="-680" XPOS="-2880" />
    <P YPOS="-680" XPOS="-3220" />
    <P YPOS="120" XPOS="-3220" />
    <P YPOS="120" XPOS="-920" />
    <P YPOS="-680" XPOS="-920" />
    <P YPOS="-740" XPOS="-2180" />
    <P YPOS="-1920" XPOS="-2180" />
    <P YPOS="-1920" XPOS="-2480" />
    <P YPOS="-1920" XPOS="-2840" />
    <P YPOS="-1920" XPOS="-3220" />
    <P YPOS="-740" XPOS="-3220" />
    <P YPOS="-1960" XPOS="-2840" />
    <P YPOS="-1960" XPOS="-2480" />
    <P YPOS="-1960" XPOS="-920" />
    <P YPOS="-2780" XPOS="-920" />
    <P YPOS="-2780" XPOS="-3220" />
    <P YPOS="-1960" XPOS="-3220" />
    <P YPOS="-740" XPOS="-500" />
    <P YPOS="-740" XPOS="-300" />
    <W SF="0.2" H="10" PTB="1" PTA="0" />
    <W SF="0.44" H="10" PTB="2" PTA="1" />
    <W SF="0.43" H="10" PTB="3" PTA="2" />
    <W SF="0.27" H="10" PTB="4" PTA="3" />
    <W SF="0.09" H="10" PTB="6" PTA="5" />
    <W SF="0.17" H="10" PTB="0" PTA="6" />
    <W SF="0.26" H="10" PTB="8" PTA="7" />
    <W SF="0.22" H="10" PTB="9" PTA="8" />
    <W SF="0.19" H="10" PTB="11" PTA="10" />
    <W SF="0.4" H="10" PTB="12" PTA="11" />
    <W SF="0.51" H="10" PTB="13" PTA="12" />
    <W SF="0.05" H="10" PTB="15" PTA="14" />
    <W SF="0.02" H="10" PTB="16" PTA="15" />
    <W SF="0.02" H="10" PTB="20" PTA="21" />
    <W SF="0.22" H="10" PTB="23" PTA="20" />
    <W SF="0.02" H="10" PTB="22" PTA="23" />
    <W SF="0.22" H="10" PTB="21" PTA="22" />
    <W SF="0.02" H="10" PTB="24" PTA="25" />
    <W SF="0.1" H="10" PTB="24" PTA="19" />
    <W SF="0.59" H="10" PTB="17" PTA="18" />
    <W SF="0.05" H="10" PTB="16" PTA="33" />
    <W SF="0.21" H="10" PTB="32" PTA="33" />
    <W SF="0.03" H="10" PTB="31" PTA="32" />
    <W SF="0.03" H="10" PTB="29" PTA="30" />
    <W SF="0.21" H="10" PTB="28" PTA="29" />
    <W SF="0.59" H="10" PTB="27" PTA="28" />
    <W SF="6.1" H="10" PTB="26" PTA="27" />
    <W SF="0.1" H="10" PTB="25" PTA="26" />
    <W D0="620" SF="0.61" H="10" PTB="35" PTA="34" />
    <W SF="0.38" H="10" PTB="36" PTA="30" />
    <W SF="0.17" H="10" PTB="40" PTA="39" />
    <W SF="8" H="200" PTB="41" PTA="40" />
    <W SF="1.15" H="10" PTB="42" PTA="41" />
    <W SF="0.4" H="10" PTB="43" PTA="42" />
    <W SF="0.21" H="10" PTB="31" PTA="43" />
    <W SF="0.17" H="10" PTB="49" PTA="38" />
    <W ENTER="0" D0="892" SF="11.8" H="200" PTB="48" PTA="49" />
    <W SF="1.9" H="10" PTB="47" PTA="48" />
    <W SF="1.5" H="10" PTB="45" PTA="46" />
    <W SF="0.59" H="10" PTB="44" PTA="45" />
    <W SF="0.15" H="10" PTB="37" PTA="44" />
    <W SF="0.02" H="10" PTB="50" PTA="47" />
    <W SF="0.02" H="10" PTB="51" PTA="46" />
    <W SF="5.1" H="10" PTB="18" PTA="19" />
    <W SF="0.19" H="10" PTB="56" PTA="14" />
    <W SF="0.22" H="10" PTB="17" PTA="57" />
    <W SF="0.03" H="10" PTB="56" PTA="10" />
    <W SF="0.03" H="10" PTB="57" PTA="9" />
    <W SF="0.03" H="10" PTB="38" PTA="39" />
    <W SF="0.03" H="10" PTB="37" PTA="36" />
    <F PT6="5" PT5="6" PT4="0" PT3="1" PT2="2" PT1="3" PT0="4" SF="0" />
    <F PT6="12" PT5="13" PT4="7" PT3="8" PT2="9" PT1="10" PT0="11" SF="0" />
    <F PT7="36" PT6="30" PT5="31" PT4="43" PT3="42" PT2="41" PT1="40" PT0="39" SF="0" />
    <F PT7="14" PT6="56" PT5="10" PT4="9" PT3="57" PT2="17" PT1="18" PT0="19" SF="0" />
    <F PT11="28" PT10="29" PT9="30" PT8="31" PT7="32" PT6="33" PT5="16" PT4="15" PT3="20" PT2="21"
        PT1="35" PT0="34" SF="0" />
    <F PT7="34" PT6="35" PT5="22" PT4="23" PT3="24" PT2="25" PT1="26" PT0="27" SF="0" />
    <F PT9="36" PT8="37" PT7="44" PT6="45" PT5="46" PT4="47" PT3="48" PT2="49" PT1="38" PT0="39"
        SF="0" />
    <F PT7="50" PT6="47" PT5="46" PT4="51" PT3="52" PT2="53" PT1="54" PT0="55" SF="0" />
</MAP>`;


// xmlString = `
// <MAP>
//     <P YPOS="-440" XPOS="-660"  />
//     <P YPOS="-440" XPOS="2080"  />
//     <P YPOS="1200" XPOS="-660"  />
//     <P YPOS="1200" XPOS="2060"  />
//     <P YPOS="-440" XPOS="3060"  />
//     <P YPOS="1200" XPOS="3060"  />
//     <W HDN="1" SF="20.5" H="250" PTB="0" PTA="2"  />
//     <W ENTER="0" D0="1580" HDN="1" SF="34.25" H="250" PTB="1" PTA="0"  />
//     <W HDN="1" SF="34" H="250" PTB="2" PTA="3"  />
//     <W HDN="1" SF="12.25" H="250" PTB="4" PTA="1"  />
//     <W HDN="1" SF="20.5" H="250" PTB="5" PTA="4"  />
//     <W HDN="1" SF="12.5" H="250" PTB="3" PTA="5"  />
//     <F PT3="2" PT2="3" PT1="1" PT0="0" SF="1"  />
//     <F PT3="3" PT2="5" PT1="4" PT0="1" SF="1"  />
// </MAP>`;

    // Créer une maison à partir du fichier XML
    const house = parseHouseXML(xmlString);

    // Dessiner la maison
    let houseContainer = house.draw();
    houseContainer.x = 2500;
    houseContainer.y = 2500;
    app.stage.addChild(houseContainer);
};

main();
