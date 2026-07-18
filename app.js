/**
 * Lawin Canvas — Milestone 2
 *
 * Flow:
 *  1. Welcome screen shown on load.
 *  2. User taps "Begin AR Experience" -> welcome hides, AR view + camera start.
 *  3. When a known target is detected -> show its title + "Begin" button
 *     in a transparent overlay.
 *  4. User taps "Begin" -> overlay hides, the painting's video starts
 *     playing (looped) anchored on the target.
 *  5. If the target is lost while the video is playing, playback keeps
 *     going for a grace period (LOST_GRACE_MS) in case tracking is only
 *     briefly interrupted. If the target is not found again within that
 *     window, the video is paused/hidden and the target resets, so the
 *     title + Begin overlay will show again next time it's detected.
 *  6. If the target is found again within the grace period, the pending
 *     stop is cancelled and playback continues uninterrupted.
 *
 * Painting data (id, title, targetIndex, video path) is loaded from
 * paintings.json so future targets (LC002, LC003, ...) can be added
 * there without touching this file's core logic.
 */

const LOST_GRACE_MS = 6000;

let paintingsById = {};
let paintingsByTargetIndex = {};
let currentPainting = null;

// Tracks whether the video for the active target is currently playing
// (or in its grace period), so we know whether to resume silently or
// show the title + Begin overlay again.
let isExperienceActive = false;

// Handle for the pending "stop video" timeout during the grace period.
let lostGraceTimer = null;

const welcomeScreen = document.querySelector("#welcome-screen");
const startBtn = document.querySelector("#start-btn");
const arContainer = document.querySelector("#ar-container");
const sceneEl = document.querySelector("#ar-scene");
const targetOverlay = document.querySelector("#target-overlay");
const targetTitleEl = document.querySelector("#target-title");
const beginBtn = document.querySelector("#begin-btn");
const paintingVideoEl = document.querySelector("#painting-video-0");

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
    currentPainting = painting || null;

    if (isExperienceActive) {
      // Came back within the grace period (or video never stopped) —
      // just cancel any pending stop and let playback continue as is.
      cancelLostGraceTimer();
    } else {
      // Fresh detection — show title + Begin, nothing playing yet.
      showTargetOverlay(currentPainting);
    }
  });

  targetEl.addEventListener("targetLost", () => {
    if (isExperienceActive) {
      // Video is playing — don't stop immediately, start the grace timer.
      startLostGraceTimer();
    } else {
      // Overlay was showing but user never pressed Begin — just hide it.
      hideTargetOverlay();
    }
  });
}

/**
 * Show the title + Begin button for the detected painting.
 */
function showTargetOverlay(painting) {
  targetTitleEl.textContent = painting ? painting.title : "";
  targetOverlay.style.display = "flex";
}

/**
 * Hide the title + Begin overlay.
 */
function hideTargetOverlay() {
  targetOverlay.style.display = "none";
}

/**
 * User pressed Begin: hide the overlay and start the painting's video,
 * looped, anchored on the target.
 */
function handleBegin() {
  if (!currentPainting) {
    console.warn("[LawinCanvas] Begin pressed with no active painting.");
    return;
  }

  hideTargetOverlay();
  isExperienceActive = true;

  paintingVideoEl.setAttribute("visible", "true");
  const videoEl = document.querySelector("#video-LC001");
  if (videoEl) {
    videoEl.currentTime = 0;
    videoEl.play().catch((err) => {
      console.error("[LawinCanvas] Video playback failed:", err);
    });
  }
}

/**
 * Start (or restart) the 6-second countdown after the target is lost.
 * If it fires without being cancelled, the video is stopped and the
 * target resets to its "not yet started" state.
 */
function startLostGraceTimer() {
  cancelLostGraceTimer();
  lostGraceTimer = setTimeout(stopExperience, LOST_GRACE_MS);
}

/**
 * Cancel a pending stop — called when the target is found again in time.
 */
function cancelLostGraceTimer() {
  if (lostGraceTimer) {
    clearTimeout(lostGraceTimer);
    lostGraceTimer = null;
  }
}

/**
 * Stop the video and reset state once the grace period has fully elapsed
 * without the target being found again.
 */
function stopExperience() {
  lostGraceTimer = null;
  isExperienceActive = false;

  const videoEl = document.querySelector("#video-LC001");
  if (videoEl) {
    videoEl.pause();
  }
  paintingVideoEl.setAttribute("visible", "false");
  hideTargetOverlay();
}
