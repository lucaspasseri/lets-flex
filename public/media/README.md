# Curated media assets

Curated media assets are local, lightweight SVG illustrations. Use lowercase kebab-case names,
keep primary artwork at a 3:2 ratio (`960 × 640`), and register each asset in
`src/features/media/mediaManifest.js` with useful alt text and its media match type.

The resolver deliberately supports representative coverage plus inheritance and fallbacks. It uses
an initial-based presentation when no suitable entity, movement, environment, or category artwork
exists; do not add a generic image merely to fill the frame. Do not add a database reference or
page-local lookup for an asset.
