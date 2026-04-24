# Research: alternatives to Zhang-Suen for centerline extraction

*Companion to `2026-04-23-baseline-algorithm-research-prompt.md`. Surveys candidate algorithms + libraries for extracting centerlines from Andika TTF glyphs, evaluates the top three, makes a recommendation with a code sketch, and flags dead ends. No implementation here.*

---

## 1. Survey of centerline-extraction approaches

Five algorithm families are worth considering for TTF glyph centerlines:

**(a) Morphological thinning variants.** Zhang-Suen (what we use), Guo-Hall, Hilditch, and Lee are all raster-only iterative border-strippers. They differ in small details of the neighborhood rules but share the same fundamental defect: the skeleton is a subset of the raster, and cap/corner/junction behavior is a function of the pixel grid and iteration order, not the underlying geometry. Empirical comparisons find Guo-Hall produces slightly cleaner skeletons than Zhang-Suen for fingerprints and some character strokes ([JATIT comparison, 2016](http://www.jatit.org/volumes/Vol94No2/2Vol94No2.pdf); [Thinning Algorithms Analysis](https://www.iieta.org/download/file/fid/86808)), but none of them structurally fix corner-veer, junction polygons, or polygonal-arc problems.

**(b) Distance-transform + ridge-finding.** scikit-image's `medial_axis` computes the exact discrete medial axis using a distance-transform-based algorithm; the result is still a raster skeleton but comes with a per-pixel distance value, which is useful for pruning and understanding stroke width ([scikit-image skeletonize docs](https://scikit-image.org/docs/stable/auto_examples/edges/plot_skeleton.html)). Strictly better than Zhang-Suen for width-aware post-processing, but shares the raster-grid origin of the corner-veer defect.

**(c) Voronoi-based medial axis.** Computed directly from the polygon outline (linearized Bezier curves become line segments). The medial axis is a subset of the Voronoi diagram of the outline's line segments; at a flat cap the medial axis terminates at the midpoint of the cap edge by construction, which is exactly the "geometric center of the cap edge" we currently hand-fix. Implementations: CGAL's Segment Delaunay Graph + filtering, OpenVoronoi ([aewallin/openvoronoi](https://github.com/aewallin/openvoronoi)), Boost.Polygon.Voronoi + custom MAT filtering ([mesheldrake/Boost-Polygon-Voronoi](https://github.com/mesheldrake/Boost-Polygon-Voronoi)).

**(d) Straight skeleton (Aichholzer et al.).** A polygonal skeleton defined by the "wavefront" process: edges of the polygon move inward at constant speed along their normals. Different structure from the medial axis (bisectors go to *lines* subtending edges, not points), which means it does not follow circular arcs — near a round bowl the straight skeleton is made of straight line segments that are tangent to the true centerline, not a curve. CGAL has the canonical implementation ([CGAL 2D Straight Skeleton](https://doc.cgal.org/latest/Straight_skeleton_2/index.html)); the best JS wrapper is [StrandedKitty/straight-skeleton](https://github.com/StrandedKitty/straight-skeleton) (WASM wrapper of CGAL, MIT, 76★).

**(e) Vector medial axis on Bezier outlines directly.** Exact medial axis of the true Bezier outline, with no linearization. The medial-axis curve segments themselves are (up to cubic) Bezier curves, so round letters produce curves, not polygons. The standout implementation is [FlorisSteenkamp/MAT](https://github.com/FlorisSteenkamp/MAT) ("FloMat"), a TypeScript library that takes SVG-style Bezier loops (linear/quadratic/cubic) and returns a tree of Bezier edges representing the MAT. Academic background in Choi, Choi & Moon (1997) and the Stroke-Based Font Representation literature ([Adobe StrokeStyles](https://research.adobe.com/publication/strokestyles-stroke-based-segmentation-and-stylization-of-fonts/)).

**(f) Deep-learning stroke extraction.** End-to-end models exist ([Learning A Stroke-Based Representation for Fonts, CGF 2018](https://esizikova.github.io/files/CGF18.pdf)) but require training data and produce probabilistic output. Not worth it for 62 glyphs from one font.

---

## 2. Top 3 candidates: evaluation

### Candidate A: FloMat (vector MAT on Bezier outlines) — [`flo-mat`](https://www.npmjs.com/package/flo-mat) / [FlorisSteenkamp/MAT](https://github.com/FlorisSteenkamp/MAT)

- **Language/license:** TypeScript, MIT. 155★, last commit Nov 2025 (3.0.3 release), **actively maintained**.
- **Fixes corner-veer?** **Yes.** The MAT is defined geometrically as the locus of disk centers tangent to ≥2 boundary points. At a flat cap, the terminal disk is tangent to the two corners plus the cap edge, so the MAT endpoint lands at the cap edge's *geometric midpoint* — exactly what we hand-fix today. No raster grid in the pipeline means no bit-pattern-dependent corner selection.
- **Fixes junction artifacts?** **Yes.** Junctions in a true MAT are single branching vertices (points equidistant to 3+ boundary segments). There is no "junction polygon" to stitch because the algorithm never discretizes the neighborhood around the junction; three MAT branches meet at one shared CpNode.
- **Smooth curves directly?** **Yes.** Output edges are `number[][]` Bezier control-point arrays of order 1–3 ([README quickstart](https://github.com/FlorisSteenkamp/MAT)). Round bowls give actual cubic/quadratic MAT curves, not many-segment polylines — so qcurves come out of the algorithm, not a postprocessing fit.
- **Holes:** Yes — multiple loops, non-zero fill rule. Important for O/B/P/Q/e which have inner contours.
- **Spurious branch pruning:** `toScaleAxis(mat, s)` implements the Scale Axis Transform, which removes MAT branches whose maximal-disk radius is below a fraction of the local scale. This is the right tool for the small whiskers that appear where the outline has tiny perturbations or the font's ink-traps. Tunable.
- **Setup effort:** ~2–4 hours to first glyph. We already emit SVG paths from Andika; FloMat's `getPathsFromStr()` parses them into the bezierLoops format.
- **Output format:** Tree of Bezier edges. Flattening to our `{type: "line" | "qcurve"}` DSL is straightforward (cubic MAT edges would need degree reduction or one-step subdivision to quadratic; the library caller controls this via the `precision` param too).
- **Risks:** Library is one-person-maintained; if Floris stops, we own a TypeScript port. 155★ is niche. Numerical edge cases are documented in issues but the `precision` parameter plus SAT pruning seems to handle them.

### Candidate B: scikit-image `medial_axis` + distance-weighted tracing (Python)

- **Language/license:** Python, BSD-3. Extremely active, 6k★.
- **Fixes corner-veer?** **No** (not structurally). Still a raster medial axis. The distance transform gives you width information but the skeleton pixels are still on the raster grid. You *can* post-process: at endpoints, use the distance value to extrapolate inward along the local medial-axis tangent by `r`, landing approximately at the cap-edge center. This works but is a patch, and equivalent to what we do now with manual endpoint trimming.
- **Fixes junction artifacts?** **Partially.** `medial_axis` is more connectivity-preserving than `skeletonize` ([sklearn docs note](https://scikit-image.org/docs/stable/auto_examples/edges/plot_skeleton.html) explicitly: "For a skeleton with fewer branches, `skeletonize` should be preferred"). Junction polygons can be simplified by collapsing pixels whose distance values are within ε of the local maximum. Still raster-origin.
- **Smooth curves directly?** **No.** Raster pixel skeleton; you post-fit qcurves (which is what we already do).
- **Setup effort:** ~1 hour. We already rasterize. `medial_axis(binary, return_distance=True)` is one call.
- **Verdict:** An incremental improvement (distance-weighted pruning is a real tool) but does not eliminate the structural defects. Would reduce but not eliminate overrides.

### Candidate C: CGAL Straight Skeleton via [straight-skeleton](https://github.com/StrandedKitty/straight-skeleton) (WASM, TypeScript)

- **Language/license:** TypeScript + WASM wrapping CGAL C++, MIT. 76★, actively maintained (last activity 2025, few commits but WASM wrapper is small).
- **Fixes corner-veer?** **Yes** for sharp corners (the straight skeleton terminates at the cap-edge midpoint by the angular-bisector construction); at flat caps of round strokes, behavior depends on polygon linearization of the bowl.
- **Fixes junction artifacts?** **Yes.** The straight skeleton is planar and has single-point junctions by definition; no junction polygons.
- **Smooth curves directly?** **No.** Straight skeletons are piecewise-linear by construction. For round letters (O, S, C, e) you still get polylines, and they are *not* medial-axis polylines — they are offset from the true centerline wherever the outline is curved. This is a showstopper for Andika given the number of round letters.
- **Holes:** Yes. Outer CCW + inner CW rings.
- **Verdict:** Would fix defects 1+2+3 from the brief but would make defect 4 worse (polylines that aren't even approximating the medial axis). Not recommended for this font.

**Dropped from Top-3:** Guo-Hall thinning (shares all four defect classes with Zhang-Suen); OpenVoronoi (LGPL, last commit 2020, experimental MAT filter); Boost.Polygon.Voronoi Perl bindings (niche, old, we don't want a Perl step).

---

## 3. Recommendation

**Try FloMat first.** It is the only candidate that structurally addresses all four defect classes — corner-veer, junction artifacts, branch confusion, and polygonal arcs — because it operates on the true Bezier outline and emits Bezier MAT edges directly. The Scale Axis Transform gives us a principled pruning knob for spurious whiskers (replacing our current ad-hoc "drop points within 50 font units of the junction" heuristic). It is in our existing language (TypeScript), so we can keep `scripts/generate-skeletons.ts` in the same runtime. MIT-licensed and actively maintained as of Nov 2025.

Fallback if FloMat has quality problems on a specific glyph: run FloMat for most glyphs, fall back to the current Zhang-Suen pipeline + overrides only for outliers. The pipeline already supports per-glyph overrides, so mixed strategies are cheap.

### Code sketch (~50 lines)

```ts
// scripts/generate-skeletons-flomat.ts  (pseudo-code — not a real build)
import opentype from "opentype.js";
import {
  findMats,
  getPathsFromStr,
  traverseEdges,
  Mat,
  CpNode,
  toScaleAxis,
} from "flo-mat";
import type { Segment, Point } from "../src/rendering/skeletons/types";

const font = opentype.loadSync("assets/Andika-Regular.ttf");

function extractCenterline(char: string): Segment[][] {
  const glyph = font.charToGlyph(char);
  // opentype.js emits SVG "d" with M/L/Q/C commands in font units.
  // y is already baseline-origin, upward-positive (we flip at render time).
  const pathD = glyph.getPath(0, 0, font.unitsPerEm).toPathData(3);

  // FloMat: SVG path -> array of Bezier loops (linear/quadratic/cubic).
  // Each loop is Point[][]; each inner Point[] is 2/3/4 control points.
  const bezierLoops = getPathsFromStr(pathD);

  // MAT precision: samples-per-boundary-bezier. 3 is default, 15 is high-accuracy.
  const mats: Mat[] = findMats(bezierLoops, 5);

  const strokes: Segment[][] = [];
  for (const rawMat of mats) {
    // SAT pruning: drop MAT branches whose maximal-disk radius is below
    // 10% of the local stroke scale. This replaces our "trim whiskers" step.
    const mat = toScaleAxis(rawMat, 1.1);

    // Each MAT is a tree. DFS from the root, emitting a Segment[] per path
    // between terminal nodes / branch points.
    const currentStroke: Segment[] = [];
    traverseEdges(mat.cpNode, (node: CpNode) => {
      const curve = node.matCurveToNextVertex; // number[][], length 2/3/4
      if (!curve) return;
      const last = curve[curve.length - 1] as [number, number];
      if (curve.length === 2) {
        currentStroke.push({ type: "line", to: last });
      } else if (curve.length === 3) {
        currentStroke.push({ type: "qcurve", control: curve[1] as Point, to: last });
      } else {
        // Cubic MAT edge -> split into two qcurves via de Casteljau at t=0.5.
        for (const q of cubicToQuadratics(curve)) {
          currentStroke.push({ type: "qcurve", control: q.control, to: q.to });
        }
      }
    });
    if (currentStroke.length) strokes.push(currentStroke);
  }
  return strokes;
}
```

Integration notes: (1) output feeds the same `Segment[]` DSL already used in `andika-overrides.ts` and `dsl.ts`, so downstream rendering is unchanged; (2) the starting point of each stroke comes from the first CpNode position — emit a separate "moveTo" alongside the stroke; (3) tune `toScaleAxis` factor (1.05–1.3) empirically on X/J/S/k; (4) cubic→quadratic reduction is a known well-behaved subdivision, de Casteljau at t=0.5 usually suffices at font-unit resolution.

**Effort estimate:** one afternoon to get first-glyph output; one to two days to tune SAT pruning and cubic-to-quadratic conversion across all 62 glyphs. If MAT quality is good, we should expect to retire 60–80% of manual overrides.

---

## 4. Anti-recommendations

**Do not try Guo-Hall, Hilditch, or Lee thinning.** These are all raster iterative thinners with the same structural limitations as Zhang-Suen. They would ship us a different flavor of the same four defects. The scikit-image `skeletonize` Lee variant is slightly better on connectivity, but we would still be writing corner-veer overrides.

**Do not try CGAL straight skeleton for this use case.** The piecewise-linear output is fundamentally wrong for round letters: the straight skeleton of a circle approximated as an N-gon is not a point, it is a smaller N-gon, and it tracks the polygon edges, not the true centerline. Good for architectural floor plans, wrong for Andika's bowls.

**Do not try [`mesheldrake/Boost-Polygon-Voronoi`](https://github.com/mesheldrake/Boost-Polygon-Voronoi).** Perl bindings, last meaningful commit ~8 years ago, adds a Perl runtime to our build.

**Do not try [`aewallin/openvoronoi`](https://github.com/aewallin/openvoronoi).** LGPL (permissive enough for a build-time dep, fine), but its MAT filter is labelled "experimental" in the repo's own TODO, and the repo has been dormant since ~2020. OK as a backup if FloMat fails, not as a first pick.

**Do not train a deep-learning stroke-extraction model.** Papers like Adobe's StrokeStyles and the 2018 CGF stroke representation exist, but: we have 62 glyphs, not 62 fonts; no training set; no latency budget that would justify model inference over a one-shot geometric algorithm; and the outputs are probabilistic and still need cleanup. Overwhelmingly wrong tradeoff.

**Do not rebuild MAT from scratch in Rust/C++.** FloMat is already MIT TypeScript in our stack. Rewriting for "performance" is pointless — this is a build-time script that runs once per font upgrade on 62 glyphs. Stick with the library.

---

## Sources

- [FlorisSteenkamp/MAT (FloMat)](https://github.com/FlorisSteenkamp/MAT)
- [flo-mat on npm](https://www.npmjs.com/package/flo-mat)
- [FloMat live demo](https://mat-demo.appspot.com/docs/index.html)
- [scikit-image skeletonize / medial_axis docs](https://scikit-image.org/docs/stable/auto_examples/edges/plot_skeleton.html)
- [CGAL 2D Straight Skeleton and Polygon Offsetting](https://doc.cgal.org/latest/Straight_skeleton_2/index.html)
- [StrandedKitty/straight-skeleton (WASM CGAL wrapper)](https://github.com/StrandedKitty/straight-skeleton)
- [aewallin/openvoronoi](https://github.com/aewallin/openvoronoi)
- [mesheldrake/Boost-Polygon-Voronoi](https://github.com/mesheldrake/Boost-Polygon-Voronoi)
- [snoyer/polygonskeletons (CGAL via Python)](https://github.com/snoyer/polygonskeletons)
- [scikit-geometry — CGAL Python bindings](https://github.com/scikit-geometry/scikit-geometry)
- [fontTools documentation](https://fonttools.readthedocs.io/)
- [JATIT thinning algorithm comparison (Vol 94 No 2)](http://www.jatit.org/volumes/Vol94No2/2Vol94No2.pdf)
- [IIETA Thinning Algorithms Analysis](https://www.iieta.org/download/file/fid/86808)
- [Adobe StrokeStyles](https://research.adobe.com/publication/strokestyles-stroke-based-segmentation-and-stylization-of-fonts/)
- [Learning A Stroke-Based Representation for Fonts (CGF 2018)](https://esizikova.github.io/files/CGF18.pdf)
