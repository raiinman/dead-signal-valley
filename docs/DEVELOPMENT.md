# Development and agent handoff

Start with root AGENTS.md, then the contract for the files being changed. Run `npm test` before editing to establish a baseline. `npm run serve` uses only Node's standard library and serves `dist/` on localhost.

## Runtime architecture

`dist/` is both source and deployable output. `app.js` creates the Three.js renderer, world and controls. `world.js` owns procedural town geometry, inhabitants and collisions. `modular-cafe.js` loads the shared café assembly using `building-test/assets.js` and its manifest. `asset-lighting.js` applies the café reflection environment to PBR materials. `simulation.js` owns movement, saved journal recovery and destinations.

The main café's manifest origin is translated to `(-13, 0.12, 9.5)`, placing its front entrance at town z=13. The local walk grid accounts for actual model geometry and furniture. Maintain that connection to the sidewalk. The world keeps a complete procedural café until all detailed assets and navigation are ready. It also uses that fallback at distance. The espresso must have only one visible detailed instance.

`town-explorer.js` derives 22 unique directory entries from 19 premises plus the plaza, bridge and garden. The 15-shop and 7-landmark-premises sets overlap at café/workshop/arcade. The map uses those live positions, and fast travel checks height and collision at each frontage. Editorial character identities are attached to stable resident indices; their live roles and routes remain authoritative.

`studio-widgets.js` owns the Studio & Arcade tabs. Signal Hunt uses a monotonic 30-second deadline, bounded targets and browser-local best scores. Relay is a labeled simulation, not hardware or solver verification. The practice calculator allocates the full selected session between practice, review and breaks. `app.js` notifies activity lifecycle changes, blocks walking while a panel is open and retains the existing game loop and PBR model loading.

## Models

Edit individual GLBs in Blender or another glTF editor. Their PBR textures are embedded. Architectural and furniture transforms live in `dist/building-test/assets.json`; repeated objects share meshes. The original espresso is `dist/assets/meshy-cafe/copperlight-espresso-faithful.glb`. Preserve base color sRGB and linear normal/metallic-roughness data. Avoid destructive global decimation, repainting or material replacement.

`evidence/cafe-source-hashes.json` records accepted model baselines. Updating a GLB requires an explicit asset review, regenerated navigation where needed, and a reviewed baseline update. Refresh `docs/runtime-manifest.json` after intentional runtime changes using `npm run manifest`. `npm run verify:assets` checks the checkout against that manifest.

## Verification

`npm test` checks movement, saved state, espresso source fidelity, café asset hashes, furniture collision and the standalone assembly layout. Browser check scripts are retained as functions accepting a Playwright page, rather than a hidden machine dependency. The historical screenshot destinations in those scripts can be changed to your own evidence directory.

For visual changes, serve locally and check the entrance, seating and counter at each quality and light setting. Walk in and out using real input; verify the workshop, arcade, station and all destinations still work. Test blocked external requests to prove the bundled Three.js fallback and embedded model textures work offline.

## Scope

This repository contains the working current town. Earlier Blender scenes, rejected models, authoring checkpoints and workspace backup archives remain outside it. The runtime GLBs and assembly data are sufficient to edit and reproduce this playable build. There are no runtime credentials or Meshy API dependencies.
