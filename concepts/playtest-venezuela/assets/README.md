# Assets

Exported from the Figma file "UN-Innovation-DPPA-Sprint", page `ui`.

## img
| File | Figma layer | Used for |
| --- | --- | --- |
| `dppa-logo.png` | `dppa-logo` (538×698 source image) | Header logo |
| `scope-what.png` | `notebook` | Scope: "What crisis or issue are you researching?" |
| `scope-when.png` | `stopwatch` | Scope: "When did this occur?" |
| `scope-where.png` | `map-view` | Scope: "Where did this occur?" |
| `scope-who.png` | `stopwatch` in Desktop - 4 (the two figures) | Scope: "Who/which parties are involved?" |

The scope illustrations are the right-hand panel only, 681×1024, exported at 1x.

`img/layers/` holds the pixelated photo layers on their own (exported per layer, clipped to the 1440×1024 frame). The live illustration in `art/scope-art.jsx` stacks them under the animated pixel field.

## icons
Lucide icons as exported from the Figma components: `search`, `calendar`, `chevron-left`, `chevron-right`. `rule.svg` is the reference for the double rule under each scope question, which is drawn in CSS.

## fonts
Geist (sans, four weights), Geist Serif and Geist Mono, copied from the fonts installed on the design machine. Geist is published by Vercel under the SIL Open Font License 1.1 (https://github.com/vercel/geist-font). The licence text should travel with the font files if this repo is shared publicly.

No fonts load from outside the project.
