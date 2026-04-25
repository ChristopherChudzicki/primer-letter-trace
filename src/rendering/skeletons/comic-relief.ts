// Runtime entry point for the Comic Relief skeleton set.
// Mirrors the Andika merge structure (./andika.ts). Currently used only by
// the inspector for centerline-quality comparison against Andika — the
// worksheet path still imports the Andika set exclusively.
import BASELINE from "./comic-relief-baseline";
import OVERRIDES from "./comic-relief-overrides";
import { mergeSkeletons } from "./merge";

const SET = mergeSkeletons(BASELINE, OVERRIDES);

export default SET;
