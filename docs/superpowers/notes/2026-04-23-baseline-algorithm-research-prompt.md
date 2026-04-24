# Research prompt: alternatives to Zhang-Suen for centerline extraction

*A self-contained brief for handing to a research subagent. The output of that research goes back into the improve-centerlines branch as either a follow-on plan or a decision to keep what we have.*

---

Research alternatives to our current centerline-extraction algorithm for font glyphs.

## Current state

We use Zhang-Suen morphological thinning on rasterized glyphs:

1. Rasterize the glyph at 1024×1024 to a binary image (ink = 1)
2. Apply Zhang-Suen iterative thinning until a 1-pixel-wide skeleton remains
3. Trace the skeleton as polylines via `skeleton-tracing-js`
4. Simplify polylines with Douglas-Peucker (tolerance ~0.5)

Implementation: `scripts/generate-skeletons.ts` in this repo.
Stack: TypeScript + Node, using `@napi-rs/canvas` for rasterization, `skeleton-tracing-js` for thinning + tracing, `simplify-js` for the polyline simplification.

## Known defects from this approach

1. **Corner-veer at flat caps** — when a stroke ends in a flat cap (e.g., J's flat top, V/W/A's chiseled corners), the skeleton's endpoint touches an arbitrary corner of the cap (depends on raster bit pattern + thinning iteration order) instead of the geometric center of the cap edge. We currently fix this by trimming the last 1-3 polyline points in the override.

2. **Junction artifacts** — at intersections like the X's center, the medial axis produces a small "junction polygon": visually a `>-<` pattern with several disjoint sub-strokes meeting in a tiny area rather than a clean intersection. We currently fix by stitching the disjoint pieces through one shared crossing point.

3. **Branch confusion** — at letter junctions like `k` (where arm + leg meet the spine) or `A` (where the crossbar crosses the diagonals), the trace for the crossed/joined stroke kinks sideways at the junction. We currently fix by dropping polyline points within ~50 font units of the junction.

4. **Polygonal arcs** — for round letters (O, S, C, e), the polyline approximates curves with many short straight segments. We can post-process to quadratic Beziers but it'd be cleaner to get them directly.

We currently work around all of these via hand-authored overrides. Would prefer to fix the algorithm so overrides become rare.

## Constraints

- **Build-time only** — runs offline once per font upgrade. No latency budget. Memory budget is normal-laptop-friendly (a few GB OK).
- **Tech-neutral** — Python, Rust, C++ all fine. Node not required. We can shell out or precompute and ship JSON/TS data.
- **Input**: an OFL-licensed TTF (Andika by SIL Global) — TrueType outlines (quadratic Beziers).
- **Output**: per-glyph centerline data in font units. Polyline or Beziers — we have a small DSL that supports both (`{type:"line"|"qcurve"}`). Doesn't have to fit our DSL exactly; we can adapt.
- **Open-source preferred** but not strict. License must be permissive enough to use in a free static-hosted web app.

## What we want to know

### 1. Survey of centerline-extraction approaches

Cover at minimum:

- **Other morphological thinning algorithms** (Lee, Hilditch, Guo-Hall) — does any have materially better corner behavior than Zhang-Suen?
- **Distance-transform + ridge-finding** (e.g., scikit-image's `medial_axis` returns the medial axis along with distance values; can post-process for cleaner endpoints)
- **Voronoi-based medial axis** — works on the polygon outline directly (not raster); should give exact endpoints at cap centers
- **Straight skeleton** (Aichholzer et al.) — designed for polygon medial axis; CGAL has an implementation; `straight-skeleton` JS port exists
- **Vector medial axis on Bezier outlines** — mathematically exact; some research code exists (e.g., `mat` Python package, MATLAB implementations)
- **Anything else worth considering** (deep-learning approaches, GeneralLib's centerline extractor, etc.)

### 2. Top 2-3 candidates: evaluation

For each, evaluate:

- Would it fix corner-veer at flat caps? (yes / no / unclear)
- Would it fix junction artifacts? (yes / no / unclear)
- Would it produce smooth curves directly (no polygonal arcs)? (yes / no / unclear)
- Available implementations: library name, language, license, maintenance state (last commit, GitHub stars/issues, etc.)
- Approximate setup effort to integrate into our build (hours to first glyph)
- Output format (raster skeleton vs polygon vs vector curves)
- Robustness to font outlines we haven't tested (degenerate cases, very thin strokes, etc.)

### 3. Recommendation

Which to try first, and why. Include a code sketch (~50 lines) showing how the candidate would be invoked on a single glyph in our pipeline. Pseudocode is fine; doesn't need to compile. Show:

- How to load the glyph from the TTF
- How to extract its outline (or rasterize, or whatever the algorithm wants)
- How to invoke the algorithm
- What the output looks like and how we'd convert it to our DSL (polyline + qcurve segments)

### 4. Anti-recommendation

Anything we should NOT try:
- Known dead-end approaches
- Libraries that look promising but are abandoned / produce poor output
- Algorithms with theoretically nice properties but impractical implementation cost

## Output format

A single markdown doc, ~800–1500 words. Sections matching the four "What we want to know" items above. Cite library URLs where possible. If a candidate has a quick-start tutorial that takes <30 min to verify against our use case, link it.

## What this research is NOT

- Not a request to actually implement the new algorithm. Just survey + recommendation.
- Not a request to deeply benchmark across our 62 glyphs. A representative test on 3-5 glyphs (X for crossings, J for corner-veer, S for curves, k for branching) is enough to inform a decision.
- Not a request to update SKILL.md / defect-taxonomy.md.

## Background context

The improve-centerlines branch has been working through hand-authored overrides per glyph. Done so far: ~25 glyphs across Batches 1 and 2. The defect taxonomy (`skills/improve-centerlines/defect-taxonomy.md`) catalogs the artifact classes; the per-glyph workflow (`skills/improve-centerlines/SKILL.md`) describes our manual fix recipes. If a better algorithm could fix even 60% of the artifacts at the source, our override workload drops dramatically.

The plan and spec for the broader effort are at:
- `docs/superpowers/specs/2026-04-22-improve-centerlines-design.md`
- `docs/superpowers/plans/2026-04-22-improve-centerlines.md`

The research output should help us decide: keep the current approach + manual overrides, or invest in algorithm replacement.
