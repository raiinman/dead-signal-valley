# Copperlight route materials

The generated town materials below are separate from the Meshy espresso material. The repaired espresso keeps its original 2K PBR maps and metallic values, with a model-local café reflection environment from `dist/asset-lighting.js`; the rest of the town has no global reflection environment. Low quality retains the espresso's full nearby detail. See `MESHY-ASSET.md` and `evidence/espresso-repair-verification.json`.

`dist/materials.js` exports `createMaterials(THREE)` for Three.js r128. It returns the 33 agreed named `MeshStandardMaterial` objects. Canvas-generated base-color, normal, and roughness maps use 256×256 power-of-two tiles; no assets are downloaded. Base-color maps use `sRGBEncoding`; data maps use `LinearEncoding`.

The palette uses cream lime plaster, honey timber, terracotta, restrained weathered copper, muted teal, limestone, and pale pink blossoms. Textures carry material structure: long wood grain and board seams, staggered masonry joints, rounded gravel cells, patina islands, woven canvas, rippled water, and multiscale plaster/stone relief. Normals derive from the same periodic height fields as the color and roughness patterns. Seeds are stable across reloads. Cloned variants share map storage.

One texture tile is intended to cover approximately one metre. Default box UVs cover one tile per face; scale mesh UVs by physical face dimensions before batching large walls, paving, and bridge decks. Keep shared material texture repeats at 1; changing them affects every mesh using that material. Normal maps do not change collision geometry.

Use `materials.glow.emissiveIntensity` to change lamp/window appearance by time of day. Scene point lights must provide actual light on neighboring surfaces. Glass uses opacity 0.15 with depth writes off. Water is translucent turquoise with wave normals and modest roughness. Modest metalness keeps copper/brass legible without reflection maps. Foliage and residents use flat colors to keep cost modest.

Renderer integration: `renderer.outputEncoding = THREE.sRGBEncoding`; use appropriate exposure with the scene's selected tone mapping. The module leaves renderer configuration to its caller. Texture anisotropy is 4; the renderer clamps it to supported hardware limits. Quality settings may disable normal maps or reduce renderer pixel ratio while retaining base-color and roughness maps.

API checks used Context7 Three.js documentation plus the official r128 `MeshStandardMaterial.js` and `Texture.js` sources. A Node self-check loaded the exact cdnjs r128 UMD build, imported this module, generated every material with a Canvas-compatible pixel buffer, and verified all 33 names, material types, map encodings, non-flat normal data, deterministic timber pixels, and glass transparency. There are 18 mapped material variants sharing 14 map sets. Final lighting and in-scene appearance require browser verification.
