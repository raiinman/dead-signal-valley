# Copperlight café hero asset

## Current runtime fidelity repair

On 2026-10-14 the user rejected the first conversion's in-world close-up. The runtime now uses `dist/assets/meshy-cafe/copperlight-espresso-faithful.glb`, a byte-for-byte copy of the original Meshy export: 21,027,724 bytes, 485,846 triangles, 276,350 vertices, original normals and UVs, original metalness/roughness and three original 2048×2048 maps. SHA256: `220feef8a9bc2713d66062ad93d045f03f1e405a7ca8d1f49a5130e30b8e23b0`. No additional generation or credits were used.

`prepare-faithful-espresso.mjs` reproduces the copy and audit; `test-espresso-fidelity.mjs` guards geometry, image payloads, material settings and file identity. The old conversion is preserved at `evidence/espresso-previous-22k.glb`. The original Blender preparation files and two old export scripts describe that superseded conversion and are not the current production pipeline.

Browser integration uses a generated local café reflection environment only on the espresso material, removes the global metalness cap, and excludes the prop from receiving the town's coarse sun shadow map. The model still casts a shadow. Three lighting modes and close-up/angled/mobile views were inspected; original maps remain 2K even at Low. Distance culling avoids drawing the detailed geometry outside the café neighborhood. This repair increases asset download and nearby GPU cost; physical-phone performance remains unverified. See `evidence/espresso-repair-verification.json` for measurements and limits.

## Generation record

- Service: Meshy.ai, authenticated existing user workspace.
- Creation date: October 14, 2026 (America/Phoenix).
- Requested asset: original standalone compact espresso machine, cream enamel, copper boiler, teal controls, brass fittings; no brands, logos, lettering, cups, or surrounding scene.
- Generator: Meshy 6, High Detail, Text to 3D, one generation, no split or pose.
- License selection: Private, visibly selected before generation.
- Geometry cost: 20 existing credits (balance 1,250 to 1,230 at submission).
- Texture cost: 10 existing credits, as shown by the PBR texture action (balance 1,280 to 1,270). An unrelated +50 account credit change occurred between those actions; total operation cost is 30 credits, not the net difference between starting and final balance.
- No purchase, subscription change, payment-method update or Community publication was performed.
- Status: generated, downloaded, optimized, visually inspected and ready for integration.
- Source/conversion path IDs visible in the service-provided download: `01a139c5-eb26-7401-8b9d-7b78de90446e` and `01a139c7-6566-729e-9236-8796ebb30f65`. The original file name was `Meshy_AI_An_original_compact_c_1014093851_texture.glb`. Temporary signed download parameters are deliberately omitted.

## Superseded first conversion

- Runtime model: `dist/assets/meshy-cafe/copperlight-espresso.glb`.
- Runtime manifest: `dist/assets/meshy-cafe/asset.json` with `{"model":"copperlight-espresso.glb"}`.
- File size: 1,597,380 bytes (about 1.6 MB), reduced from the 21,027,724-byte service export.
- Geometry: 22,216 triangles across three meshes. Original machine body reduced from 485,846 triangles to 22,000; two fitted teal side rocker switches were authored in Blender.
- Maps: 1,024px base color, metallic-roughness, normal; embedded in the GLB. No external texture files or decoder extensions are needed.
- Orientation: glTF Y-up; front faces positive Z; base sits at Y=0; approximately centered in X and Z.
- Bounds in metres: X `[-0.239322, 0.240837]`, Y `[0, 0.650000]`, Z `[-0.366524, 0.366524]`. Overall dimensions approximately 0.480 × 0.650 × 0.733 m (width × height × depth).
- Metallic map multiplier capped at 0.35 for the textured body, 0.10 for the teal controls, to keep colors readable without an environment map.
- Original full-resolution GLB is preserved outside the deployable folder at `evidence/meshy-cafe-source.glb`. Editable preparation file: `evidence/meshy-cafe-prepared.blend`. Final rendered preview: `evidence/meshy-cafe-final.jpg`.
- Preparation scripts: `optimize_meshy_cafe.py`, then `export_meshy_cafe.py`, using installed Blender 5.2.1 LTS. API usage checked against Context7 official Blender API references and the installed export operator properties.
- Validation: exact GLB file length, accessor triangle count, embedded maps, named runtime manifest and absence of required extensions inspected. Blender render verifies an upright machine with cream housing, copper top, brass fittings and teal side controls. Final WebGL loading/lighting is handled by the scene integration owner.

## Prompt

An original compact countertop espresso machine for a cozy mountain village cafe. Believable assembled industrial design: rounded cream enamel rectangular housing, exposed horizontal copper boiler cylinder on top, small round pressure gauge, two brass group heads with dark wooden portafilter handles, slender curved steam wand, removable ribbed drip tray, four short feet, small teal knobs and switches. Restrained vintage-inspired craftsmanship, clean silhouette, subtle wear. One standalone complete object, front facing, no surrounding counter, no cups, no background. No brand, no logos, no lettering, no text. Game-ready prop, modest geometric detail, physically based cream enamel, aged copper, teal paint and brushed brass materials.

Texturing used Meshy 7 Flagship, Text Input, Generate PBR Maps enabled, 2K selected (later reduced to 1K for deployment), with this prompt:

Original mountain-village cafe espresso machine. Main housing warm cream enamel, exposed upper boiler aged copper, control knobs muted deep teal, group heads and small fittings brushed brass, dark walnut wooden handles, drip tray charcoal iron. Subtle realistic roughness, very gentle edge wear, physically based separate materials, clean cared-for object. No logos, no lettering, no text, no decals, no baked dramatic shadows.

The generated topology interpreted the requested two group heads as one central group head. That original output is retained; this is an intentional prototype hero prop, not a mechanical CAD model.

## License evidence

The creation UI offered Private licensing and it was selected. Meshy's official [ownership help](https://help.meshy.ai/en/articles/10137554-what-is-the-ownership-of-the-generated-models) says paid subscribers retain private ownership of generated assets when they do not publish to Meshy Community and use non-infringing source materials. Its official [commercial-use help](https://intercom.help/meshy/en/articles/16102098-can-i-use-meshy-assets-commercially) explains use in games, applications and client work, and distinguishes paid private ownership from free-plan CC BY 4.0 attribution. This asset uses an original text prompt and no third-party reference images. It has not been published to Meshy Community.

The account displayed an existing-plan payment-method update banner. Generation was permitted and charged existing credits; no payment details were viewed or changed. This record reports the visible asset license selection without asserting a broader legal conclusion.
