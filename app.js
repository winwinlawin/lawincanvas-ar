/**
 * Lawin Canvas — Milestone 2 (TEMPORARY simplified flow for debugging)
 *
 * The title + "Begin" overlay step is temporarily disabled to isolate
 * the video playback issue. Current flow:
 *  1. Welcome screen shown on load.
 *  2. User taps "Begin AR Experience" -> welcome hides, AR view + camera start.
 *  3. When a known target is detected -> video plays immediately (looped),
 *     anchored on the target. No title/Begin overlay shown.
 *  4. If the target is lost while the video is playing, playback keeps
 *     going for a grace period (LOST_GRACE_MS) in case tracking is only
 *     briefly interrupted. If the target is not found again within that
 *     window, the video is paused/hidden.
 *  5. If the target is found again within the grace period, the pending
 *     stop is cancelled and playback continues uninterrupted.
 *
 * Once video playback is confirmed working, the title + Begin step will
 * be restored (see git history / previous file version).
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
const sceneEl = document.querySelector("#ar-scene");
const targetOverlay = document.querySelector("#target-overlay");
const targetTitleEl = document.querySelector("#target-title");
const beginBtn = document.querySelector("#begin-btn");
const paintingVideoEl = document.querySelector("#painting-video-0");

document.addEventListener("DOMContentLoaded", () => {
  enableDebugConsoleIfRequested();

  loadPaintings();
  bindTargetEvents();

  startBtn.addEventListener("click", handleStart);
});

/**
 * Temporary troubleshooting aid: visiting the site with ?debug=1 in the
 * URL loads an on-screen console (Eruda) so JS errors and logs can be
 * read directly on a phone, without needing USB debugging. Safe to leave
 * in — it only activates when explicitly requested via the URL.
 */
function enableDebugConsoleIfRequested() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("debug") !== "1") return;

  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/eruda";
  script.onload = () => {
    if (window.eruda) {
      window.eruda.init();
      console.log("[LawinCanvas] Debug console enabled.");
    }
  };
  document.body.appendChild(script);
}

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
 * Hide the welcome screen and start the MindAR camera/tracking system.
 * The AR scene has been rendering (invisible, underneath the welcome
 * screen) since page load, so it already has correct canvas dimensions
 * by the time start() is called here.
 */
function handleStart() {
  welcomeScreen.style.display = "none";

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
      // TEMP: play immediately instead of showing title + Begin overlay.
      startExperience();
    }
  });

  targetEl.addEventListener("targetLost", () => {
    if (isExperienceActive) {
      // Video is playing — don't stop immediately, start the grace timer.
      startLostGraceTimer();
    }
  });
}

/**
 * Start playing the current painting's video, looped, anchored on the
 * target. (TEMP: called directly on targetFound, bypassing the
 * title + Begin overlay while debugging playback.)
 */
function startExperience() {
  console.log("[LawinCanvas] startExperience. currentPainting:", currentPainting);

  if (!currentPainting) {
    console.warn("[LawinCanvas] startExperience called with no active painting.");
    return;
  }

  isExperienceActive = true;

  paintingVideoEl.setAttribute("visible", "true");
  console.log("[LawinCanvas] painting-video-0 visible set to true.");

  const videoEl = document.querySelector("#video-LC001");
  if (!videoEl) {
    console.error("[LawinCanvas] #video-LC001 element not found.");
    return;
  }

  videoEl.currentTime = 0;
  videoEl.play()
    .then(() => console.log("[LawinCanvas] Video play() succeeded."))
    .catch((err) => {
      console.error("[LawinCanvas] Video playback failed:", err);
    });
}

/**
 * Start (or restart) the 6-second countdown after the target is lost.
 * If it fires without being cancelled, the video is stopped.
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
}
