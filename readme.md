# svGL Core
[WIP] render 3D meshes in SVG (the core of it)

# TODO
- FIX mesh rotation
- FIX OBJ parser
- ADD triangle rendering
  - display triangle faces
  - create point light model
  - compute per-face normal (rather than vertex normal + interpolation like in "regular tessalation")
  - find a CSS colors lookup to have actual values of CSS colors
  - write a light color blending model
  - sort faces by distance to camera
  - render