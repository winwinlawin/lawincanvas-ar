/**
 * Lawin Canvas — Milestone 1 (rebuilt)
 *
 * Flow:
 *  1. Welcome screen shown on load.
 *  2. User taps "Open Camera" -> welcome hides, AR view + camera start.
 *  3. When a known target is detected -> show its title + "Begin" button
 *     in a transparent overlay.
 *  4. When the target is lost -> hide the overlay.
 *
 * "Begin" button is wired up but does not play video yet — that is
 * Milestone 2. For now it only confirms the flow is ready to extend.
 *
 * Painting data (id, title, targetIndex, video path) is loaded from
 * paintings.json so future targets (LC002, LC003, ...) can be added
 * there without touching this file's core logic.
 */

let paintingsById = {};
let paintingsByTargetIndex = {};
let currentPainting = null;

const welcomeScreen = document.querySelector("#welcome-screen");
const startBtn = document.querySelector("#start-btn");
const arContainer = document.querySelector("#ar-container");
const sceneEl = document.querySelector("#ar-scene");
const targetOverlay = document.querySelector("#target-overlay");
const targetTitleEl = document.querySelector("#target-title");
const beginBtn = document.querySelector("#begin-btn");

document.addEventListener("DOMContentLoaded", () => {
  loadPaintings();
  bindTargetEvents();

  startBtn.addEventListener("click", handleStart);
  beginBtn.addEventListener("click", handleBegin);
});

/**
 * Load paintings.json and index it by id and by targetIndex
 * for quick lookup when a target is found.
 */
async function loadPaintings() {
  try {
    const res = await fetch("paintings.json");
    const data = await res.json();
    const paintings = data.paintings || [];

    paintings.forEach((p) => {
      paintingsById[p.id] = p;
      paintingsByTargetIndex[p.targetIndex] = p;
    });
  } catch (err) {
    console.error("[LawinCanvas] Failed to load paintings.json:", err);
  }
}

/**
 * Reveal the AR view and start the MindAR camera/tracking system.
 */
function handleStart() {
  welcomeScreen.style.display = "none";
  arContainer.style.display = "block";

  const mindarSystem = sceneEl.systems["mindar-image-system"];
  if (mindarSystem) {
    mindarSystem.start();
  } else {
    console.error("[LawinCanvas] mindar-image-system not found on scene.");
  }
}

/**
 * Attach targetFound / targetLost listeners for every known target entity.
 * Currently only target-0 (LC001) exists; more will be added in later
 * milestones following the same pattern.
 */
function bindTargetEvents() {
  const targetEl = document.querySelector("#target-0");
  if (!targetEl) {
    console.error("[LawinCanvas] #target-0 not found in scene.");
    return;
  }

  targetEl.addEventListener("targetFound", () => {
    const targetIndex = 0;
    const painting = paintingsByTargetIndex[targetIndex];
    showTargetOverlay(painting);
  });

  targetEl.addEventListener("targetLost", () => {
    hideTargetOverlay();
  });
}

/**
 * Show the title + Begin button for the detected painting.
 */
function showTargetOverlay(painting) {
  currentPainting = painting || null;
  targetTitleEl.textContent = painting ? painting.title : "";
  targetOverlay.style.display = "flex";
}

/**
 * Hide the overlay when the target is no longer in view.
 */
function hideTargetOverlay() {
  targetOverlay.style.display = "none";
}

/**
 * Placeholder for Milestone 2: this will trigger video playback
 * for the currently detected painting.
 */
function handleBegin() {
  if (!currentPainting) {
    console.warn("[LawinCanvas] Begin pressed with no active painting.");
    return;
  }
  console.log(`[LawinCanvas] Begin pressed for ${currentPainting.id}. Video playback comes in Milestone 2.`);
}
