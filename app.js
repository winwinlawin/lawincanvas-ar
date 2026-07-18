/**
 * Lawin Canvas — LC001 Foundation
 *
 * Rebuilt on top of the confirmed-working minimal base (camera +
 * MindAR target detection, no extra layers) to isolate and fix video
 * playback. The welcome screen, title/Begin overlay, and branding are
 * intentionally set aside for now — they are fully preserved in
 * PROJECT_STATUS.md and will be layered back in once this is stable.
 *
 * Flow:
 *  - Camera starts automatically (MindAR default autoStart).
 *  - When the target is found -> video plays, looped, anchored on it.
 *  - When the target is lost -> video keeps playing for a 6-second
 *    grace period (LOST_GRACE_MS) in case tracking is only briefly
 *    interrupted. If not found again within that window, it pauses.
 *  - If found again within the grace period, the pending pause is
 *    cancelled and playback continues uninterrupted.
 */

const LOST_GRACE_MS = 6000;

let lostGraceTimer = null;

document.addEventListener("DOMContentLoaded", () => {
  enableDebugConsoleIfRequested();

  const target = document.querySelector("[mindar-image-target]");
  const videoEl = document.querySelector("#video-LC001");

  if (!target) {
    console.error("[LawinCanvas] Target entity not found.");
    return;
  }
  if (!videoEl) {
    console.error("[LawinCanvas] #video-LC001 not found.");
    return;
  }

  target.addEventListener("targetFound", () => {
    console.log("[LawinCanvas] Target found.");

    // Came back within the grace period — cancel the pending pause and
    // let playback continue as is.
    if (lostGraceTimer) {
      clearTimeout(lostGraceTimer);
      lostGraceTimer = null;
      return;
    }

    videoEl.currentTime = 0;
    videoEl.play()
      .then(() => console.log("[LawinCanvas] Video playing."))
      .catch((err) => console.error("[LawinCanvas] Video play failed:", err));
  });

  target.addEventListener("targetLost", () => {
    console.log("[LawinCanvas] Target lost. Starting 6s grace period.");

    lostGraceTimer = setTimeout(() => {
      lostGraceTimer = null;
      videoEl.pause();
      console.log("[LawinCanvas] Grace period elapsed. Video paused.");
    }, LOST_GRACE_MS);
  });
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
