# Curated media assets

Action 1 media assets are local, lightweight SVG illustrations. Use lowercase kebab-case names,
keep the primary artwork at a 3:2 ratio (`960 × 640`), and register each asset in
`src/features/media/mediaManifest.js` with useful alt text and its media match type.

The resolver deliberately supports representative coverage plus inheritance and fallbacks. Do not
add a database reference or page-local lookup for an asset.
