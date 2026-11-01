# Body Atlas

A cinematic, educational 3D anatomy explorer built with Vite, vanilla JavaScript, and Three.js. It combines a named anatomist-reviewed skeleton with BodyParts3D skin and organs, lightweight procedural fallbacks, physiological motion, and a responsive clinical-product interface.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
npm test
npm run build
```

## Interaction

- Drag to orbit, scroll/pinch to zoom, and right-drag to pan.
- Search named organs and bones, or select them directly in the viewport.
- Adjust every layer's opacity; toggle labels; isolate, hide, fade, restore, or smoothly focus a selection.
- Use front/back/left/right presets and restrained breathing/heartbeat controls.
- Keyboard: `/` focuses search, `Space` pauses motion, `R` restores the camera, `1`–`4` select standard views, and `Escape` closes overlays.

## Skeleton asset and derived work

The skeleton at `public/models/overview-skeleton.glb` is **Open3Dmodel — [CC BY-SA 4.0 official legalcode](https://creativecommons.org/licenses/by-sa/4.0/legalcode)**, from the Open Anatomy lineage. Source and attribution: [Open3Dmodel Create](https://anatomytool.org/open3dmodel-create). The deployed copy is [`/licenses/CC-BY-SA-4.0.txt`](/licenses/CC-BY-SA-4.0.txt).

The source asset contains right-side-only nodes for most paired bones. At runtime this application creates corresponding left-side instances by mirroring only node names ending in `.r` (including the source's `.r.` edge case). Midline structures and explicitly left/right bilateral nodes remain unchanged. Generated left-side instances and adaptations of that asset are derivative material and remain subject to CC BY-SA 4.0. Preserve this attribution, license notice, and source link when redistributing the derived skeleton work. Application code and unrelated original UI/procedural geometry are not relicensed by that asset notice.

Draco decoder files are self-hosted in `public/draco/` and copied from the installed Three.js package. If detailed loading or decoding fails, the application reports the fallback state and retains a simplified procedural skeleton.

## BodyParts3D skin and organ assets

`public/models/anatomy-skin.glb` and `public/models/anatomy-organs.glb` are derived from BodyParts3D version 3.0 through the [Kevin-Mattheus-Moerman BodyParts3D mirror](https://github.com/Kevin-Mattheus-Moerman/BodyParts3D). Original archive: [doi:10.18908/lsdba.nbdc00837-000](http://doi.org/10.18908/lsdba.nbdc00837-000).

**BodyParts3D, © The Database Center for Life Science, licensed under [CC Attribution-ShareAlike 2.1 Japan official legalcode](https://creativecommons.org/licenses/by-sa/2.1/jp/legalcode).** A deployed license notice and exact official-page copy are available at [`/licenses/CC-BY-SA-2.1-JP.txt`](/licenses/CC-BY-SA-2.1-JP.txt) and [`/licenses/CC-BY-SA-2.1-JP-legalcode.html`](/licenses/CC-BY-SA-2.1-JP-legalcode.html).

See the deployed [`THIRD_PARTY_NOTICES.md`](/THIRD_PARTY_NOTICES.md) for exact local files, attribution, sources, derivative changes, and ShareAlike redistribution obligations, plus Three.js and Draco notices.

The web-ready Draco GLBs retain semantic `<organId>__<FMAID>` node names. Runtime material, grouping, transparency, and animation changes are adaptations and remain subject to that ShareAlike license. Preserve the exact attribution, source, DOI, and license notice when redistributing these assets or adaptations. When either file cannot load, the atlas independently retains its procedural fallback. When detailed organs load, their cerebellum/brainstem group represents the selectable brain and the procedural cerebrum is hidden with the other fallback organs.

## Architecture and performance

Detailed anatomy registration has one contract in `src/anatomy/alignment.js`. It records the measured BodyParts3D skin bounds, applies one source-to-runtime translation to both skin and organs, and fits the mirrored Open3D skeleton to that exact floor and height. Do not add per-organ offsets or independent target heights. `npm run validate:assets` reads production GLB metadata and guards this contract.

- `src/anatomy/SkeletonAsset.js` loads Draco GLB data, classifies paired nodes, mirrors left-side bones, and centers the complete bilateral result.
- `src/anatomy/AnatomyAsset.js` loads the semantic BodyParts3D Draco assets with the self-hosted decoder.
- `src/anatomy/HumanModel.js` owns layers, procedural anatomy, highlighting, visibility actions, and material reuse.
- `src/anatomy/skeletonNodes.js` and `src/utils/` contain pure, tested search, classification, state, and camera logic.
- `src/ui.js` renders the searchable, accessible desktop browser and mobile drawers/sheets.
- `src/main.js` owns scene setup, progressive loading, raycasting, camera transitions, and the allocation-conscious render loop.

Pixel ratio and shadow resolution are capped more aggressively on mobile. Geometry and physical materials are shared, animation avoids per-frame object creation, postprocessing is intentionally omitted for common-laptop/mobile reliability, and reduced-motion preferences disable cinematic transitions and damping.

## Limitations and disclaimer

Procedural fallbacks, vessels, and physiological motion are simplified educational representations. BodyParts3D geometry is not presented as medical-grade or diagnostic content.

**This visualization is for educational purposes only. It is not medically diagnostic, does not provide medical advice, and must not replace consultation with a qualified healthcare professional.**
