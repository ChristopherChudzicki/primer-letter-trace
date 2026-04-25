// Runtime entry point for the Andika skeleton set.
// Composes the auto-generated baseline with hand-authored overrides.
// Importers (src/layout/row.ts, scripts/debug-*.ts) consume this module
// unchanged.
import BASELINE from "./andika-baseline";
import OVERRIDES from "./andika-overrides";
import { mergeSkeletons } from "./merge";

const SET = mergeSkeletons(BASELINE, OVERRIDES);

export default SET;
