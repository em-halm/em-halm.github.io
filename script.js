const pack = document.getElementById("pack");
const seal = document.getElementById("seal");
const contents = document.getElementById("contents");
const promptEl = document.getElementById("prompt");

let startX = 0;
let dragging = false;
let opened = false;

// How far (in px) you need to drag LEFT to "open"
const OPEN_THRESHOLD = 120;

/* 🔊 Crinkle audio */
const crinkle = new Audio("assets/audio/crinkle.mp3");
crinkle.loop = true;
crinkle.volume = 0.0;
crinkle.preload = "auto";

/* 🎵 Reveal song */
const song = new Audio("assets/audio/song.mp3");
song.volume = 0.0;
song.preload = "auto";

let songPrimed = false; 

async function primeSong() {
  if (songPrimed) return;
  try {
    song.volume = 0.0;
    await song.play();   // ✅ happens on pointerdown (user gesture)
    song.pause();
    song.currentTime = 0;
    songPrimed = true;
  } catch (e) {
    console.warn("primeSong failed:", e);
  }
}


function setSealOffset(dx){
  // dx is negative when dragging left
  const clamped = Math.max(-220, Math.min(0, dx));
  seal.style.transform = `translateX(${clamped}px)`;

  const progress = Math.min(1, Math.abs(clamped) / OPEN_THRESHOLD);
  promptEl.style.opacity = String(0.85 - 0.65 * progress);

  /* 🔊 Tie sound volume to drag distance */
  const safeProgress = Math.max(0, Math.min(1, progress));
    crinkle.volume = 0.15 + 0.45 * safeProgress;

}

function openPack(){
  if (opened) return;
  opened = true;

  pack.classList.add("open");
  contents.classList.add("revealed");
  contents.setAttribute("aria-hidden", "false");

  stopCrinkle();
  playSong(); // 🎵 START MUSIC

  seal.style.transform = "";
}


function startCrinkle(){
  if (crinkle.paused){
    crinkle.currentTime = Math.random() * 0.2; // slight variation
    crinkle.play().catch(() => {});
  }
}

function stopCrinkle(){
  crinkle.pause();
  crinkle.currentTime = 0;
}

function onPointerDown(e){
  if (opened) return;
  dragging = true;
  seal.setPointerCapture(e.pointerId);
  startX = e.clientX;

  primeSong();     // ✅ ADD THIS
  startCrinkle();  // existing
}



function onPointerMove(e){
  if (!dragging || opened) return;

  const dx = e.clientX - startX; // positive right, negative left
  setSealOffset(dx);

  if (dx < -OPEN_THRESHOLD){
    dragging = false;
    openPack();
  }
}

function onPointerUp(e){
  if (opened) return;
  dragging = false;

  stopCrinkle();

  // Snap back if not opened
  seal.style.transition = "transform 250ms ease";
  seal.style.transform = "translateX(0px)";
  promptEl.style.opacity = "0.85";

  setTimeout(() => {
    seal.style.transition = "";
  }, 260);
}

function playSong(){
  song.currentTime = 0;
  song.play().catch((err) => console.warn("song.play blocked:", err));

  // fade-in...


  const FADE_TIME = 1200;
  const TARGET_VOL = 0.65;
  const start = performance.now();

  function fade(t){
    const raw = (t - start) / FADE_TIME;
    const progress = Math.max(0, Math.min(1, raw)); // 👈 clamp

    song.volume = TARGET_VOL * progress;

    if (progress < 1) requestAnimationFrame(fade);
    } 

  requestAnimationFrame(fade);
}



seal.addEventListener("pointerdown", onPointerDown);
seal.addEventListener("pointermove", onPointerMove);
seal.addEventListener("pointerup", onPointerUp);
seal.addEventListener("pointercancel", onPointerUp);
