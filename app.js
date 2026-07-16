/**
 * Lawin Canvas — Milestone 1
 * Detect one image target, show a green plane. Nothing else.
 *
 * Kept intentionally minimal. Structure below leaves room for
 * per-target content driven by paintings.json in later milestones.
 */

document.addEventListener("DOMContentLoaded", () => {
  const sceneEl = document.querySelector("a-scene");
  const targetEl = document.querySelector("#target-0");

  if (!sceneEl || !targetEl) {
    console.error("[LawinCanvas] Required scene/target elements not found.");
    return;
  }

  targetEl.addEventListener("targetFound", () => {
    console.log("[LawinCanvas] Target found.");
  });

  targetEl.addEventListener("targetLost", () => {
    console.log("[LawinCanvas] Target lost.");
  });

  sceneEl.addEventListener("renderstart", () => {
    console.log("[LawinCanvas] Scene ready.");
  });
});
