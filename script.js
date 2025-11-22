const canvas = document.getElementById("gameCanvas");
const ctx = canvas?.getContext ? canvas.getContext("2d") : null;

const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");

const modalSobre = document.getElementById("modalSobre");
const sobreBtn = document.getElementById("sobreBtn");
const closeModal = document.getElementById("closeModal");

const scoreSpan = document.getElementById("score");
const levelSpan = document.getElementById("level");
const livesSpan = document.getElementById("lives");

const modalGameOver = document.getElementById("modalGameOver");
const finalScoreEl = document.getElementById("finalScore");
const playerNameInput = document.getElementById("playerName");
const saveScoreBtn = document.getElementById("saveScoreBtn");
const closeGameOver = document.getElementById("closeGameOver");

const modalRanking = document.getElementById("modalRanking");
const rankingList = document.getElementById("rankingList");
const openRanking = document.getElementById("openRanking");
const closeRanking = document.getElementById("closeRanking");

const synth = window.speechSynthesis;

let player, items, particles;
let score = 0, level = 1, lives = 3, speed = 2, running = false;
let spawnCounter = 0;

function warnIfMissing(id, el) {
  if (!el) console.warn(`Elemento ausente no HTML: #${id}`);
}

warnIfMissing("gameCanvas", canvas);
warnIfMissing("startBtn", startBtn);
warnIfMissing("resetBtn", resetBtn);
warnIfMissing("modalSobre", modalSobre);
warnIfMissing("sobreBtn", sobreBtn);
warnIfMissing("closeModal", closeModal);
warnIfMissing("score", scoreSpan);
warnIfMissing("level", levelSpan);
warnIfMissing("lives", livesSpan);
warnIfMissing("modalGameOver", modalGameOver);
warnIfMissing("finalScore", finalScoreEl);
warnIfMissing("playerName", playerNameInput);
warnIfMissing("saveScoreBtn", saveScoreBtn);
warnIfMissing("modalRanking", modalRanking);
warnIfMissing("rankingList", rankingList);
warnIfMissing("openRanking", openRanking);
warnIfMissing("closeRanking", closeRanking);

function speak(text) {
  if (!synth) return;
  if (synth.speaking) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "pt-BR";
  synth.speak(u);
}

function saveGameStorage() {
  try {
    localStorage.setItem("eco_score", score);
    localStorage.setItem("eco_level", level);
    localStorage.setItem("eco_lives", lives);
  } catch (e) {
    console.warn("Erro ao salvar em localStorage:", e);
  }
}

function loadGameStorageDefaults() {
  score = parseInt(localStorage.getItem("eco_score")) || 0;
  level = parseInt(localStorage.getItem("eco_level")) || 1;
  lives = parseInt(localStorage.getItem("eco_lives")) || 3;
}


function initGame() {
  if (!canvas) return;
  player = { x: Math.floor((canvas.width - 40) / 2), y: canvas.height - 70, size: 40 };
  items = [];
  particles = [];
  spawnCounter = 0;
  loadGameStorageDefaults();
  speed = 2 + (level - 1) * 0.6;
  updateHUD();
}

function updateHUD() {
  if (scoreSpan) scoreSpan.textContent = score;
  if (levelSpan) levelSpan.textContent = level;
  if (livesSpan) livesSpan.textContent = lives;
}


function drawPlayer() {
  if (!ctx || !player) return;

  const px = player.x + 20;
  const py = player.y + 20;

  ctx.save();
  ctx.shadowBlur = 20;
  ctx.shadowColor = "#00ff9d";
  ctx.fillStyle = "#00ff9d";
  ctx.beginPath();
  ctx.arc(px, py, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();


  drawAccessories(px, py);
}


function drawItems() {
  if (!ctx) return;
  items.forEach(item => {
    ctx.save();
    ctx.fillStyle = item.good ? "#00e5ff" : "#ff1744";
    ctx.beginPath();
    ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawParticles() {
  if (!ctx) return;
  particles.forEach(p => {
    ctx.fillStyle = `rgba(0,255,150,${p.alpha})`;
    ctx.fillRect(p.x, p.y, 3, 3);
  });
}

function addParticle(x, y) {
  for (let i = 0; i < 10; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      alpha: 1
    });
  }
}

function updateParticles() {
  particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.alpha -= 0.03; });
  particles = particles.filter(p => p.alpha > 0);
}


function spawnItem() {
  spawnCounter++;
  const spawnRate = Math.max(30 - level * 2, 8);
  if (spawnCounter % spawnRate === 0) {
    const radius = 10 + Math.random() * 6;
    items.push({
      x: Math.random() * (canvas.width - radius * 2) + radius,
      y: -20,
      radius,
      good: Math.random() < 0.65
    });
  }
}

function updateItems() {
  items.forEach(item => item.y += speed);
  items = items.filter(item => {
    const px = player.x + 20;
    const py = player.y + 20;
    const dist = Math.hypot(item.x - px, item.y - py);
    if (dist < item.radius + 18) {
      addParticle(item.x, item.y);
      if (item.good) {
        score += 10;
        speak("Continue limpando o planeta!");
      } else {
        lives--;
        speak("Cuidado! Poluente detectado.");
      }
      updateHUD();
      saveGameStorage();
      return false;
    }
    return item.y < canvas.height + 30;
  });

  if (score >= level * 100) {
    level++;
    speed += 0.6;
    speak(`Nível ${level} alcançado.`);
    localStorage.setItem("eco_level", level);
  }

  if (lives <= 0) endGame();
}


function drawBackground(){
  if (!ctx) return;
  ctx.save();
  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = "rgba(200,255,220,0.02)";
    ctx.beginPath();
    const x = (i * 73 + (level*7 % 100)) % canvas.width;
    const y = (i * 47 + (level*5 % 100)) % canvas.height;
    ctx.arc(x, y, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function gameLoop() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawPlayer();
  drawItems();
  drawParticles();
  spawnItem();
  updateItems();
  updateParticles();
  if (running) requestAnimationFrame(gameLoop);
}


document.addEventListener("keydown", e => {
  if (!running || !player) return;
  if (e.key === "ArrowLeft") player.x = Math.max(0, player.x - 30);
  if (e.key === "ArrowRight") player.x = Math.min(canvas.width - player.size, player.x + 30);
});

if (canvas) {
  canvas.addEventListener("mousemove", e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    player.x = Math.min(Math.max(0, x - player.size / 2), canvas.width - player.size);
  });
  canvas.addEventListener("touchmove", e => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    player.x = Math.min(Math.max(0, x - player.size / 2), canvas.width - player.size);
  });
}


if (startBtn) {
  startBtn.addEventListener("click", () => {
    initGame();
    running = true;
    speak("Iniciando missão de limpeza planetária.");
    gameLoop();
  });
} else console.warn("#startBtn não encontrado");

if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    localStorage.removeItem("eco_score");
    localStorage.removeItem("eco_level");
    localStorage.removeItem("eco_lives");
    initGame();
    updateHUD();
    speak("Progresso apagado. Reiniciando missão.");
  });
} else console.warn("#resetBtn não encontrado");


if (sobreBtn && modalSobre) {
  sobreBtn.addEventListener("click", () => modalSobre.style.display = "flex");
} else if (modalSobre && !sobreBtn) {
  console.info("Modal 'Sobre' presente mas sem botão de abertura (#sobreBtn).");
}
if (closeModal && modalSobre) {
  closeModal.addEventListener("click", () => modalSobre.style.display = "none");
}

function endGame() {
  running = false;
  speak("Jogo encerrado. O planeta precisa de você!");
  if (finalScoreEl) finalScoreEl.textContent = score;
  if (modalGameOver) showModal(modalGameOver);
}

if (closeGameOver) {
  closeGameOver.addEventListener("click", () => {
    if (modalGameOver) modalGameOver.style.display = "none";
    initGame();
    updateHUD();
  });
}

function loadRanking() {
  try {
    return JSON.parse(localStorage.getItem("eco_ranking") || "[]");
  } catch (e) {
    console.warn("Formato inválido em eco_ranking; resetando.", e);
    localStorage.removeItem("eco_ranking");
    return [];
  }
}
function saveRanking(rank) {
  try {
    localStorage.setItem("eco_ranking", JSON.stringify(rank));
  } catch (e) {
    console.warn("Erro ao salvar ranking:", e);
  }
}

if (saveScoreBtn && playerNameInput) {
  saveScoreBtn.addEventListener("click", () => {
    const name = (playerNameInput.value || "Anônimo").trim();
    if (!name) {
      alert("Digite um nome para salvar no ranking.");
      return;
    }
    const rank = loadRanking();
    rank.push({ name, score });
    rank.sort((a,b) => b.score - a.score);
    saveRanking(rank.slice(0, 10));
    playerNameInput.value = "";
    if (modalGameOver) modalGameOver.style.display = "none";
    if (openRanking) openRankingModal();
  });
} else {
  if (!saveScoreBtn) console.warn("#saveScoreBtn ausente");
  if (!playerNameInput) console.warn("#playerName ausente");
}

if (openRanking && modalRanking && rankingList) {
  openRanking.addEventListener("click", openRankingModal);
} else {
  if (!openRanking) console.warn("#openRanking ausente");
  if (!modalRanking) console.warn("#modalRanking ausente");
  if (!rankingList) console.warn("#rankingList ausente");
}
if (closeRanking && modalRanking) {
  closeRanking.addEventListener("click", () => modalRanking.style.display = "none");
}

function openRankingModal() {
  if (!rankingList || !modalRanking) return;
  const rank = loadRanking();
  rankingList.innerHTML = "";
  if (rank.length === 0) {
    rankingList.innerHTML = "<li>Nenhum registro ainda</li>";
  } else {
    rank.forEach(r => {
      const li = document.createElement("li");
      li.textContent = `${r.name} — ${r.score} pts`;
      rankingList.appendChild(li);
    });
  }
  showModal(modalRanking);
}

function showModal(m) {
  if (!m) return;
  m.style.display = "flex";
}

document.addEventListener("click", e => {
  [modalSobre, modalRanking, modalGameOver].forEach(mod => {
    if (mod && mod.style.display === "flex" && e.target === mod) {
      mod.style.display = "none";
    }
  });
});

window.addEventListener("beforeunload", saveGameStorage);

initGame();


let skin = {
  ÓCULOS: false,
  CABELO: false,
  CHAPÉU: false,
  COR: false,
  color: "#00ff99"
};

function tryToggle(type) {
  skin[type] = !skin[type];
  document.getElementById("unlockInfo").textContent =
    skin[type] ? `${type} ativado!` : `${type} desativado!`;
}

function changeAccessoryColor(c) {
  skin.color = c;
}

function drawAccessories(px, py) {
  if (!ctx) return;

  ctx.save();
  ctx.strokeStyle = skin.color;
  ctx.fillStyle = skin.color;
  ctx.lineWidth = 3;

  if (skin.ÓCULOS) {
    ctx.beginPath();
    ctx.arc(px - 10, py - 5, 6, 0, Math.PI * 2);
    ctx.arc(px + 10, py - 5, 6, 0, Math.PI * 2);
    ctx.moveTo(px - 4, py - 5);
    ctx.lineTo(px + 4, py - 5);
    ctx.stroke();
  }

  if (skin.CABELO) {
    ctx.beginPath();
    ctx.arc(px, py - 20, 18, Math.PI, Math.PI * 2);
    ctx.stroke();
  }

  if (skin.CHAPÉU) {
    ctx.fillRect(px - 18, py - 32, 36, 6);
    ctx.fillRect(px - 10, py - 48, 20, 18);
  }

  if (skin.COR) {
    ctx.beginPath();
    ctx.strokeStyle = skin.color + "88";
    ctx.lineWidth = 4;
    ctx.arc(px, py, 30, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}
