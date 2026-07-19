/**
 * Lawin Canvas — Foundation (currently LC001 only)
 *
 * Flow:
 *  1. Welcome screen shown on load (camera NOT started yet, so no
 *     permission prompt appears until the user is ready).
 *  2. User taps "Begin AR Experience" -> welcome screen hides, eagle
 *     sound plays, and the MindAR camera/tracking system starts.
 *  3. When the target (LC001) is found -> video plays, looped,
 *     anchored on it.
 *  4. When the target is lost -> video keeps playing for a 6-second
 *     grace period (LOST_GRACE_MS) in case tracking is only briefly
 *     interrupted. If not found again within that window, it pauses.
 *     If found again within the grace period, the pending pause is
 *     cancelled and playback continues uninterrupted.
 *
 * TEMPORARILY reverted from a 33-painting version: targets.mind hadn't
 * been recompiled yet with all 33 images, so the code expected targets
 * that didn't exist in the compiled file, which broke the camera.
 *
 * To re-expand once ready (all 33 images/videos prepared and
 * targets.mind recompiled with all of them):
 *  1. Add each painting's <video> to <a-assets> and its
 *     <a-entity>/<a-video> pair in index.html (targetIndex matching
 *     its position in the compiled .mind file).
 *  2. Add one entry per painting to the PAINTINGS array below — no
 *     other code changes needed, tracking/playback/grace period are
 *     generic and loop over this array automatically.
 */

const LOST_GRACE_MS = 6000;

const PAINTINGS = [
  { id: "LC001", targetIndex: 0, videoElId: "video-LC001" },
];

document.addEventListener("DOMContentLoaded", () => {
  enableDebugConsoleIfRequested();

  const welcomeScreen = document.querySelector("#welcome-screen");
  const startBtn = document.querySelector("#start-btn");
  const sceneEl = document.querySelector("#ar-scene");

  if (!welcomeScreen || !startBtn || !sceneEl) {
    console.error("[LawinCanvas] Welcome screen elements not found.");
    return;
  }

  startBtn.addEventListener("click", () => {
    welcomeScreen.style.display = "none";

    const eagleSound = new Audio("assets/audio/eagle-sound.mp3");
    eagleSound.play().catch((err) => {
      console.error("[LawinCanvas] Eagle sound playback failed:", err);
    });

    const mindarSystem = sceneEl.systems["mindar-image-system"];
    if (mindarSystem) {
      mindarSystem.start();
    } else {
      console.error("[LawinCanvas] mindar-image-system not found on scene.");
    }
  });

  PAINTINGS.forEach(setupPaintingTracking);
});

/**
 * Wire up targetFound/targetLost handling for a single painting. Each
 * painting gets its own independent grace-period timer (via closure),
 * so multiple paintings' videos can be mid-playback/mid-grace-period
 * at the same time without interfering with each other, once more
 * paintings are added back.
 */
function setupPaintingTracking(painting) {
  const targetEl = document.querySelector(`#target-${painting.targetIndex}`);
  const videoEl = document.querySelector(`#${painting.videoElId}`);

  if (!targetEl) {
    console.error(`[LawinCanvas] Target entity not found for ${painting.id} (targetIndex ${painting.targetIndex}).`);
    return;
  }
  if (!videoEl) {
    console.error(`[LawinCanvas] Video element #${painting.videoElId} not found for ${painting.id}.`);
    return;
  }

  let lostGraceTimer = null;

  targetEl.addEventListener("targetFound", () => {
    console.log(`[LawinCanvas] ${painting.id} found.`);

    if (lostGraceTimer) {
      clearTimeout(lostGraceTimer);
      lostGraceTimer = null;
      return;
    }

    videoEl.currentTime = 0;
    videoEl.play()
      .then(() => console.log(`[LawinCanvas] ${painting.id} video playing.`))
      .catch((err) => console.error(`[LawinCanvas] ${painting.id} video play failed:`, err));
  });

  targetEl.addEventListener("targetLost", () => {
    console.log(`[LawinCanvas] ${painting.id} lost. Starting 6s grace period.`);

    lostGraceTimer = setTimeout(() => {
      lostGraceTimer = null;
      videoEl.pause();
      console.log(`[LawinCanvas] ${painting.id} grace period elapsed. Video paused.`);
    }, LOST_GRACE_MS);
  });
}

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
