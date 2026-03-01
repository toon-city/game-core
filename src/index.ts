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
import { GameCore } from './GameCore';

// ─── Map XML ──────────────────────────────────────────────────────────────────

const MAP_XML = `
<MAP>
    <P YPOS="-440" XPOS="-660"  />
    <P YPOS="-440" XPOS="2080"  />
    <P YPOS="1200" XPOS="-660"  />
    <P YPOS="1200" XPOS="2060"  />
    <P YPOS="-440" XPOS="3060"  />
    <P YPOS="1200" XPOS="3060"  />
    <W HDN="1" SF="20.5"  H="250" PTB="0" PTA="2"  />
    <W ENTER="0" D0="1580" HDN="1" SF="34.25" H="250" PTB="1" PTA="0"  />
    <W HDN="1" SF="34"    H="250" PTB="2" PTA="3"  />
    <W HDN="1" SF="12.25" H="250" PTB="4" PTA="1"  />
    <W HDN="1" SF="20.5"  H="250" PTB="5" PTA="4"  />
    <W HDN="1" SF="12.5"  H="250" PTB="3" PTA="5"  />
    <F PT3="2" PT2="3" PT1="1" PT0="0" SF="1"  />
    <F PT3="3" PT2="5" PT1="4" PT0="1" SF="1"  />
</MAP>`;

// ─── Bootstrap ────────────────────────────────────────────────────────────────

const main = async () => {
  const app = new PIXI.Application();
  await app.init({ background: '#1099bb', antialias: true, resolution: 1 });
  app.renderer.resize(1000, 1000);
  document.body.appendChild(app.canvas);

  // ── Create GameCore ──────────────────────────────────────────────────────
  const gc = new GameCore(app, {
    followCamera:    true,
    cameraMargin:    150,
    cameraSmoothing: 0.1,
    moveSpeed:       10,
  });

  gc.setCameraPosition(400, 400);

  // ── Load house + furniture ───────────────────────────────────────────────
  await gc.loadHouse(MAP_XML, 'assets/map_jardin.json');

  // ── Spawn player avatar ──────────────────────────────────────────────────
  const avatar = gc.spawnAvatar('player', 100, 100, {
    showSocle: true,
    direction: 1,
    skinColor: 0xf7ceaf,
  });

  // ── Bind keyboard + touch input ──────────────────────────────────────────
  gc.bindPlayerInput('player');   // arrow keys + touch by default

  // ── Listen to game events ────────────────────────────────────────────────
  gc.on('furniture:placed',  ({ position }) =>
    console.log('[furniture] placed at', position));

  gc.on('furniture:moved',   ({ from, to }) =>
    console.log('[furniture] moved', from, '→', to));

  gc.on('furniture:rotated', ({ orientation }) =>
    console.log('[furniture] rotated to orientation', orientation));

  gc.on('avatar:said', ({ id, text }) =>
    console.log(`[${id}] says: ${text}`));

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
      const text = 'Hello! 👋';
      avatar.say(text, 2500);
      gc.events.emit('avatar:said', { avatar, id: 'player', text });
    }
  });
};

main();
