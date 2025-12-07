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
    console.warn("Erro ao salvar:", e);
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

  previewPlayer();
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
  ctx.fillStyle = skin.COR ? skin.color : "#00ff9d";

  ctx.beginPath();
  ctx.arc(px, py - 15, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillRect(px - 6, py - 5, 12, 25);

  ctx.fillRect(px - 16, py - 2, 10, 6);
  ctx.fillRect(px + 6, py - 2, 10, 6);

  ctx.fillRect(px - 6, py + 20, 5, 15);
  ctx.fillRect(px + 1, py + 20, 5, 15);

  ctx.restore();
}

function drawAccessories(px, py) {
  if (!ctx) return;

  ctx.save();

  if (skin.ÓCULOS) {
    ctx.font = "22px Arial";
    ctx.textAlign = "center";
    ctx.fillText("👓", px, py - 1);
  }

  if (skin.CHAPÉU) {
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🎩", px, py - 20);
  }

  ctx.restore();
}

function previewPlayer() {
  if (!ctx || !player) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawPlayer();
  drawAccessories(player.x + 20, player.y + 5);
}


function drawItems() {
  if (!ctx) return;

  ctx.font = "28px Arial";
  ctx.textAlign = "center";

  items.forEach(item => {
    ctx.save();
    ctx.fillText(item.good ? "🌳" : "☠︎", item.x, item.y);
    ctx.restore();
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

function drawParticles() {
  if (!ctx) return;
  particles.forEach(p => {
    ctx.fillStyle = `rgba(0,255,150,${p.alpha})`;
    ctx.fillRect(p.x, p.y, 3, 3);
  });
}

function updateParticles() {
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.03;
  });
  particles = particles.filter(p => p.alpha > 0);
}

function spawnItem() {
  spawnCounter++;
  const spawnRate = Math.max(30 - level * 2, 8);
  if (spawnCounter % spawnRate === 0) {
    items.push({
      x: Math.random() * canvas.width,
      y: -20,
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

    if (dist < 35) {
      addParticle(item.x, item.y);

      if (item.good) {
        score += 10;
        speak("Continue cuidando do planeta!");
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
    localStorage.setItem("eco_level", level);
    speak("Nível " + level);
  }

  if (lives <= 0) endGame();
}

function drawBackground() {
  if (!ctx) return;

  ctx.save();
  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = "rgba(200,255,220,0.03)";
    ctx.beginPath();
    const x = (i * 73 + (level * 7 % 100)) % canvas.width;
    const y = (i * 47 + (level * 5 % 100)) % canvas.height;
    ctx.arc(x, y, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}


function gameLoop() {
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawPlayer();
  drawAccessories(player.x + 20, player.y + 5);
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

canvas.addEventListener("mousemove", e => {
  if (!player) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  player.x = Math.min(Math.max(0, x - player.size / 2), canvas.width - player.size);
  if (!running) previewPlayer();
});


startBtn.addEventListener("click", () => {
  initGame();
  running = true;
  speak("Iniciando missão de limpeza planetária.");
  gameLoop();
});

resetBtn.addEventListener("click", () => {
  localStorage.removeItem("eco_score");
  localStorage.removeItem("eco_level");
  localStorage.removeItem("eco_lives");
  initGame();
  updateHUD();
  speak("Progresso apagado.");
});


function endGame() {
  running = false;
  speak("Jogo encerrado!");
  finalScoreEl.textContent = score;
  modalGameOver.style.display = "flex";
}

closeGameOver.addEventListener("click", () => {
  modalGameOver.style.display = "none";
  initGame();
  updateHUD();
});


function loadRanking() {
  return JSON.parse(localStorage.getItem("eco_ranking") || "[]");
}

function saveRanking(rank) {
  localStorage.setItem("eco_ranking", JSON.stringify(rank));
}

saveScoreBtn.addEventListener("click", () => {
  const name = (playerNameInput.value || "Anônimo").trim();
  const rank = loadRanking();
  rank.push({ name, score });
  rank.sort((a, b) => b.score - a.score);
  saveRanking(rank.slice(0, 10));

  playerNameInput.value = "";
  modalGameOver.style.display = "none";

  openRankingModal();
});

openRanking.addEventListener("click", openRankingModal);

closeRanking.addEventListener("click", () => {
  modalRanking.style.display = "none";
});

function openRankingModal() {
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

  modalRanking.style.display = "flex";
}

window.addEventListener("beforeunload", saveGameStorage);

let skin = {
  ÓCULOS: false,
  CHAPÉU: false,
  COR: false,
  color: "#00ff99"
};

function tryToggle(type) {
  skin[type] = !skin[type];

  document.getElementById("unlockInfo").textContent =
    skin[type] ? `${type} ativado!` : `${type} desativado!`;

  previewPlayer();
}

function changeAccessoryColor(c) {
  skin.color = c;
  previewPlayer(); 
}

initGame();
previewPlayer();
