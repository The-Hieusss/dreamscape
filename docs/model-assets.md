# Model catalog and thumbnails

The app imports `src/config/modelCatalog.json`, never the model binaries. Each entry
contains a model URL, display name, category, and static thumbnail URL. GLBs remain
in `public/models` and are fetched by the scene only when used. Library previews
use lazy-loaded WebP images rather than WebGL canvases.

`npm run dev` and `npm run build` refresh the catalog and animation manifest first.
When adding/replacing GLB assets, also generate thumbnails:

```sh
# One-time Python tooling setup (not required to run or build the app):
python -m pip install -r scripts/requirements-thumbnails.txt
npm run assets:thumbnails
```

Commit the generated JSON files and `public/model-thumbnails/*.webp` alongside the
models. Thumbnails are generated offline with a small CPU renderer for this
project's low-poly GLBs. It frames the model, shades its materials, and samples
palette textures; it is a library preview rather than a full PBR render. No
browser, graphics driver, or extra JavaScript runtime dependency is required.

Thumbnail filenames use the model's content hash. Identical models reuse an image;
replacing a model generates a new URL and bypasses stale browser caches. Existing
images are skipped. Delete an image to regenerate it after changing renderer
settings. A missing thumbnail falls back to the model's name, never a GLB load.

To refresh only metadata after adding or removing files while Vite is running:

```sh
npm run assets:catalog
```

Verify with `node --experimental-strip-types --test tests/*.test.mjs` and
`npm run build`. The output should have model files in `dist/models` and no GLBs
in `dist/assets`.

## Imported nature packs

The downloaded GLBs are organized under:

- `public/models/Nature/Stylized Nature MegaKit/` — 68 assets, library category
  **Nature · MegaKit**.
- `public/models/Nature/Ultimate Stylized Nature Pack/` — 12 assets, library category
  **Nature · Ultimate**. These files contain grouped families (for example, a row
  of birch trees), rather than one separate file per tree variant.

Unmodified source copies are kept outside the repository in
`~/Desktop/3D Assets/Nature Source/`, in matching pack folders. Original download
filenames are preserved; the catalog removes opaque filename suffixes and numbers
variants for display. The two imports add about 114 MB of GLBs. Texture compression
and mesh simplification have not been applied to these originals.

Nature thumbnails support transparent leaf and flower textures. Existing images
remain cached by model content hash; delete an image to rerender it with updated
thumbnail-rendering settings.

## Woodland trail preset

Choose **Woodland trail** in the terrain preset controls. It uses only MegaKit
models, a fixed seeded layout, a winding dirt path, and a low starting camera.
The terrain mesh and placement use the same height function so moved objects
continue to follow the ground. This preset keeps user-added objects when applied.

Repeated grass and clover are batched with instancing. Clicking a plant or
selecting it in the object selector temporarily renders that plant individually
for its existing move, rotation, scale, and remove controls. On deselection it
returns to the shared batch with its edited properties. Leaf materials use a
shared alpha cutout for correct foliage silhouettes and shadows; other presets'
original materials are preserved.

## Connected city streets

City Builder Bits assets are stored in `public/models/City/City Builder Bits/`.
The road collections were split into centered, grounded tiles under
`City/Road Bits/` and `City/Modular Roads/`; only the referenced geometry buffers
are copied into each derived GLB. Originals are preserved outside the repository
in `~/Desktop/3D Assets/City Source/`.

To regenerate these road pieces and their library assets:

```sh
python scripts/prepare-city-assets.py
npm run assets:thumbnails
```

**City skyline** now builds four neighborhood blocks around a connected road loop
and two crossing avenues. It includes crosswalk tiles, raised sidewalk slabs,
streetlights, traffic signals, parked/posed traffic, benches, hydrants, and a
small park. Pavement and road heights are shared with object placement, so moving
objects between streets and sidewalks keeps them grounded. Street fixtures and
cars are individual editable objects; the cars are static rather than simulated
traffic.

## Desert landscape preset

**Desert** uses a shared procedural height field for dunes, a winding dry wash,
and four irregular sandstone mesas. Static shader detail adds wind ripples to
sand and strata to rock faces without moving the terrain or recomputing normals
every frame. Existing cactus and MegaKit rock, deadwood, pebble, and dry-grass
models form seeded clusters around the wash. Scenery remains individually editable.

The editor opens with a view down the basin. **Explore on foot** starts in the
clear wash and uses the same height function as rendering and object placement.
No additional model downloads are needed for this preset.
