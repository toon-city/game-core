/**
 * Demo entry-point – shows how to use GameCore as a library.
 *
 * Controls
 * --------
 *  Arrow keys   → move the avatar
 *  E            → toggle edit mode (drag & drop furniture)
 *  Space        → avatar says something
 */
import * as PIXI from 'pixi.js';
import {GameCore} from './GameCore';

// ─── Map XML ──────────────────────────────────────────────────────────────────

// const MAP_XML = `
// <MAP>
//     <P YPOS="-440" XPOS="-660"  />
//     <P YPOS="-440" XPOS="2080"  />
//     <P YPOS="1200" XPOS="-660"  />
//     <P YPOS="1200" XPOS="2060"  />
//     <P YPOS="-440" XPOS="3060"  />
//     <P YPOS="1200" XPOS="3060"  />
//     <W HDN="1" SF="20.5"  H="250" PTB="0" PTA="2"  />
//     <W ENTER="0" D0="1580" HDN="1" SF="34.25" H="250" PTB="1" PTA="0"  />
//     <W HDN="1" SF="34"    H="250" PTB="2" PTA="3"  />
//     <W HDN="1" SF="12.25" H="250" PTB="4" PTA="1"  />
//     <W HDN="1" SF="20.5"  H="250" PTB="5" PTA="4"  />
//     <W HDN="1" SF="12.5"  H="250" PTB="3" PTA="5"  />
//     <F PT3="2" PT2="3" PT1="1" PT0="0" SF="1"  />
//     <F PT3="3" PT2="5" PT1="4" PT0="1" SF="1"  />
// </MAP>`;

const MAP_XML = `
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
         <F PT6="1" PT5="14" PT4="15" PT3="2" PT2="13" PT1="12" PT0="11" SF="0" />
        <F PT3="16" PT2="17" PT1="13" PT0="3" SF="0"  />
 </MAP>`;

// ─── Bootstrap ────────────────────────────────────────────────────────────────

const main = async () => {
  const app = new PIXI.Application();
  await app.init({background: '#1099bb', antialias: true, resolution: 1});
  app.renderer.resize(1000, 1000);
  document.body.appendChild(app.canvas);

  // ── Create GameCore ──────────────────────────────────────────────────────
  const gc = new GameCore(app, {
    followCamera: true,
    cameraMargin: 150,
    cameraSmoothing: 0.1,
    moveSpeed: 10,
  });

  gc.setCameraPosition(400, 400);

  // ── Load house + furniture ───────────────────────────────────────────────
  // await gc.loadHouse(MAP_XML, 'assets/map_jardin.json');
  await gc.loadHouse(MAP_XML);

  // ── Spawn player avatar ──────────────────────────────────────────────────
  const avatar = gc.spawnAvatar('player', 100, 100, {
    showSocle: true,
    direction: 1,
    skinColor: 0xf7ceaf,
  });

  // ── Bind keyboard + touch input ──────────────────────────────────────────
  gc.bindPlayerInput('player'); // arrow keys + touch by default

  // ── Listen to game events ────────────────────────────────────────────────
  gc.on('furniture:placed', ({position}) =>
    console.log('[furniture] placed at', position),
  );

  gc.on('furniture:moved', ({from, to}) =>
    console.log('[furniture] moved', from, '→', to),
  );

  gc.on('furniture:rotated', ({orientation}) =>
    console.log('[furniture] rotated to orientation', orientation),
  );

  gc.on('avatar:said', ({id, text}) => console.log(`[${id}] says: ${text}`));

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  globalThis.addEventListener('keydown', (e) => {
    // E → toggle edit mode
    if (e.key === 'e' || e.key === 'E') {
      gc.setEditMode(!gc.editMode);
      console.log('[edit mode]', gc.editMode ? 'ON' : 'OFF');
    }

    // Space → avatar says something
    if (e.key === ' ') {
      e.preventDefault();
      const text =
        'Hello! ejgznoujn gfonqzeo gnjzoqnjl gnfln zelnf leznl ze 👋';
      avatar.say(text, 2500);
      gc.events.emit('avatar:said', {avatar, id: 'player', text});
    }
  });
};

main();
