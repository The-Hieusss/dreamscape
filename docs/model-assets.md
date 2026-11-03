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
