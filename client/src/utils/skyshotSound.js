const PLAY_DURATION_MS = 20000;
/** CC0 deep firework blossoms (no rocket whistle) — Rudmer_Rotteveel */
const AUDIO_SRC = "/sounds/blossom-deep.mp3";

let audio = null;
let stopTimer = 0;
let playing = false;
let finishedThisLoad = false;
let playPromise = null;

function clearStopTimer() {
  if (stopTimer) {
    window.clearTimeout(stopTimer);
    stopTimer = 0;
  }
}

function getAudio() {
  if (!audio) {
    audio = new Audio(AUDIO_SRC);
    audio.preload = "auto";
    audio.loop = true;
    audio.volume = 0.7;
  }
  return audio;
}

export function preloadSkyshotSound() {
  try {
    getAudio().load();
  } catch {
    // ignore
  }
}

/** Realistic blossom/explosion only — no launch whistle. */
export async function playSkyshotIntro() {
  if (playing || finishedThisLoad) return playing;
  if (playPromise) return playPromise;

  const el = getAudio();

  playPromise = (async () => {
    try {
      el.loop = true;
      el.volume = 0.7;
      if (el.readyState < 2) el.load();
      el.currentTime = 0;
      await el.play();
      playing = true;

      clearStopTimer();
      stopTimer = window.setTimeout(() => {
        stopSkyshotIntro(true);
      }, PLAY_DURATION_MS);

      return true;
    } catch {
      playing = false;
      return false;
    } finally {
      playPromise = null;
    }
  })();

  return playPromise;
}

export function stopSkyshotIntro(markComplete = false) {
  clearStopTimer();
  playPromise = null;
  if (audio) {
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {
      // ignore
    }
  }
  playing = false;
  if (markComplete) finishedThisLoad = true;
}

export function canPlaySkyshot() {
  return !playing && !finishedThisLoad;
}

export function armSkyshotIntroOnGesture() {
  if (!canPlaySkyshot()) return () => {};

  const tryUnlock = () => {
    if (!canPlaySkyshot()) {
      remove();
      return;
    }
    playSkyshotIntro().then((ok) => {
      if (ok) remove();
    });
  };

  const remove = () => {
    window.removeEventListener("pointerdown", tryUnlock, true);
    window.removeEventListener("touchstart", tryUnlock, true);
    window.removeEventListener("click", tryUnlock, true);
    window.removeEventListener("keydown", tryUnlock, true);
  };

  window.addEventListener("pointerdown", tryUnlock, true);
  window.addEventListener("touchstart", tryUnlock, {
    capture: true,
    passive: true,
  });
  window.addEventListener("click", tryUnlock, true);
  window.addEventListener("keydown", tryUnlock, true);

  return remove;
}
