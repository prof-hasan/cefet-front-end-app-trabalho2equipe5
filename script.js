const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const modal = document.getElementById("modalSobre");
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

let player, items, particles, score, level, lives, speed, running = false;
let spawnCounter = 0;

function speak(text) {
  if (!synth) return;
  if (!synth.speaking) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "pt-BR";
    synth.speak(utter);
  }
}

function saveGameStorage() {
  localStorage.setItem("eco_score", score);
  localStorage.setItem("eco_level", level);
  localStorage.setItem("eco_lives", lives);
}

function loadGameStorageDefaults() {
  score = parseInt(localStorage.getItem("eco_score")) || 0;
  level = parseInt(localStorage.getItem("eco_level")) || 1;
  lives = parseInt(localStorage.getItem("eco_lives")) || 3;
}

function initGame() {
  player = { x: Math.floor((canvas.width - 40) / 2), y: canvas.height - 70, size: 40 };
  items = [];
  particles = [];
  spawnCounter = 0;
  loadGameStorageDefaults();
  speed = 2 + (level - 1) * 0.6;
  updateHUD();
}

function updateHUD() {
  scoreSpan.textContent = score;
  levelSpan.textContent = level;
  livesSpan.textContent = lives;
}

function drawPlayer() {
  ctx.save();
  ctx.shadowBlur = 20;
  ctx.shadowColor = "#00ff9d";
  ctx.fillStyle = "#00ff9d";
  ctx.beginPath();
  ctx.arc(player.x + 20, player.y + 20, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawItems() {
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
        speak("Bom trabalho!");
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

  if (lives <= 0) {
    endGame();
  }
}

function gameLoop() {
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


function drawBackground(){
 
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

document.addEventListener("keydown", e => {
  if (!running) return;
  if (e.key === "ArrowLeft") player.x = Math.max(0, player.x - 30);
  if (e.key === "ArrowRight") player.x = Math.min(canvas.width - player.size, player.x + 30);
});

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
  speak("Progresso apagado. Reiniciando missão.");
});

sobreBtn.addEventListener("click", () => { modal.style.display = "flex"; });
closeModal.addEventListener("click", () => { modal.style.display = "none"; });

initGame();

function endGame() {
  running = false;
  speak("Jogo encerrado. O planeta precisa de você!");
  finalScoreEl.textContent = score;
  showModal(modalGameOver);
}

function loadRanking() {
  const raw = localStorage.getItem("eco_ranking");
  return raw ? JSON.parse(raw) : [];
}
function saveRanking(rank) {
  localStorage.setItem("eco_ranking", JSON.stringify(rank));
}

saveScoreBtn.addEventListener("click", () => {
  const name = (playerNameInput.value || "Anônimo").trim();
  const rank = loadRanking();
  rank.push({ name, score: score, date: new Date().toISOString() });
  rank.sort((a,b) => b.score - a.score);
  const top = rank.slice(0,5);
  saveRanking(top);
  playerNameInput.value = "";
  closeModalGameOver();
  openRankingModal();
});

closeGameOver.addEventListener("click", () => { closeModalGameOver(); });

function closeModalGameOver(){
  modalGameOver.style.display = "none";
  initGame();
  updateHUD();
}

openRanking.addEventListener("click", openRankingModal);
closeRanking.addEventListener("click", () => { modalRanking.style.display = "none"; });

function openRankingModal(){
  const rank = loadRanking();
  rankingList.innerHTML = "";
  if (rank.length === 0) rankingList.innerHTML = "<li>Nenhum registro ainda</li>";
  else {
    rank.forEach(r => {
      const li = document.createElement("li");
      li.textContent = `${r.name} — ${r.score} pts`;
      rankingList.appendChild(li);
    });
  }
  showModal(modalRanking);
}

function showModal(m){
  m.style.display = "flex";
  const input = m.querySelector("input, button");
  if (input) input.focus();
}
document.addEventListener("click", e => {
  [modal, modalGameOver, modalRanking].forEach(m => {
    if (m.style.display === "flex" && e.target === m) m.style.display = "none";
  });
});

window.addEventListener("beforeunload", () => {
  saveGameStorage();
});
