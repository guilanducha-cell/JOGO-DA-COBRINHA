const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const messageEl = document.getElementById('message');
const restartBtn = document.getElementById('restartBtn');

const box = 20;
const cols = canvas.width / box;
const rows = canvas.height / box;

let snake, direction, nextDirection, food, score, best, gameOver, loop;
let animProgress = 1;
let prevSnake = [];

best = parseInt(localStorage.getItem('snakeBest') || '0', 10);
bestEl.textContent = best;

function init() {
  snake = [
    { x: 8, y: 8 },
    { x: 7, y: 8 },
    { x: 6, y: 8 }
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  gameOver = false;
  animProgress = 1;
  messageEl.textContent = '';
  placeFood();
  updateScore();
  if (loop) clearInterval(loop);
  loop = setInterval(tick, 110);
  requestAnimationFrame(render);
}

function placeFood() {
  let valid = false;
  while (!valid) {
    food = {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows)
    };
    valid = !snake.some(s => s.x === food.x && s.y === food.y);
  }
}

function updateScore() {
  scoreEl.textContent = score;
  if (score > best) {
    best = score;
    bestEl.textContent = best;
    localStorage.setItem('snakeBest', best);
  }
}

function tick() {
  if (gameOver) return;
  direction = nextDirection;
  prevSnake = snake.map(s => ({ ...s }));

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
    return endGame();
  }
  if (snake.some(s => s.x === head.x && s.y === head.y)) {
    return endGame();
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    updateScore();
    placeFood();
  } else {
    snake.pop();
    prevSnake.pop();
  }

  animProgress = 0;
}

function lerp(a, b, t) { return a + (b - a) * t; }

function render() {
  animProgress = Math.min(1, animProgress + 0.18);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawFood();
  drawSnake();

  requestAnimationFrame(render);
}

function drawFood() {
  const cx = food.x * box + box / 2;
  const cy = food.y * box + box / 2;
  const r = box / 2 - 2;

  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.7, r * 0.8, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fill();

  const grad = ctx.createRadialGradient(cx - r*0.3, cy - r*0.3, 1, cx, cy, r);
  grad.addColorStop(0, '#ff8a8a');
  grad.addColorStop(0.5, '#ff4d4d');
  grad.addColorStop(1, '#c92a2a');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.strokeStyle = '#5a3b1e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + 2, cy - r - 6);
  ctx.stroke();

  ctx.fillStyle = '#4caf50';
  ctx.beginPath();
  ctx.ellipse(cx + 5, cy - r - 4, 5, 3, -0.6, 0, Math.PI * 2);
  ctx.fill();
}

function getInterpolated(i) {
  const cur = snake[i];
  const prev = prevSnake[i] || cur;
  return {
    x: lerp(prev.x, cur.x, animProgress),
    y: lerp(prev.y, cur.y, animProgress)
  };
}

function drawSnake() {
  const points = snake.map((_, i) => getInterpolated(i));

  ctx.save();
  ctx.translate(2, 4);
  ctx.globalAlpha = 0.2;
  drawSnakeBody(points, '#000');
  ctx.restore();

  drawSnakeBody(points, null);
  drawHead(points[0]);
}

function drawSnakeBody(points, forceColor) {
  for (let i = points.length - 1; i >= 0; i--) {
    const p = points[i];
    const cx = p.x * box + box / 2;
    const cy = p.y * box + box / 2;
    const size = box - 3 - (i === 0 ? 0 : 1);
    const t = i / points.length;

    let fill;
    if (forceColor) {
      fill = forceColor;
    } else {
      const g = Math.round(lerp(200, 100, t));
      fill = i === 0 ? '#facc15' : `rgb(30, ${g}, 90)`;
    }

    ctx.beginPath();
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();

    if (!forceColor && i > 0) {
      ctx.beginPath();
      ctx.arc(cx - size*0.15, cy - size*0.15, size*0.18, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fill();
    }
  }
}

function drawHead(headPoint) {
  const cx = headPoint.x * box + box / 2;
  const cy = headPoint.y * box + box / 2;
  const r = box / 2 - 2;

  const dx = direction.x;
  const dy = direction.y;
  const eyeOffsetX = dx !== 0 ? dx * r * 0.35 : r * 0.35;
  const eyeOffsetY = dy !== 0 ? dy * r * 0.35 : -r * 0.35;

  const perpX = dy !== 0 ? r * 0.35 : 0;
  const perpY = dx !== 0 ? r * 0.35 : 0;

  [-1, 1].forEach(sign => {
    const ex = cx + eyeOffsetX + perpX * sign;
    const ey = cy + eyeOffsetY + perpY * sign;

    ctx.beginPath();
    ctx.arc(ex, ey, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(ex + dx * 1, ey + dy * 1, 1.4, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();
  });

  if (Math.floor(Date.now() / 400) % 2 === 0) {
    ctx.strokeStyle = '#ff3b3b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const tongueX = cx + dx * r;
    const tongueY = cy + dy * r;
    ctx.moveTo(tongueX, tongueY);
    ctx.lineTo(tongueX + dx * 8, tongueY + dy * 8);
    ctx.stroke();
  }
}

function endGame() {
  clearInterval(loop);
  gameOver = true;
  messageEl.textContent = 'Fim de jogo! Pontuação final: ' + score;
}

document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowUp':
      if (direction.y === 0) nextDirection = { x: 0, y: -1 };
      break;
    case 'ArrowDown':
      if (direction.y === 0) nextDirection = { x: 0, y: 1 };
      break;
    case 'ArrowLeft':
      if (direction.x === 0) nextDirection = { x: -1, y: 0 };
      break;
    case 'ArrowRight':
      if (direction.x === 0) nextDirection = { x: 1, y: 0 };
      break;
  }
});

restartBtn.addEventListener('click', init);

init();
// Controles por botão (celular)
function setDirection(x, y) {
  if (x !== 0 && direction.x === 0) nextDirection = { x, y: 0 };
  if (y !== 0 && direction.y === 0) nextDirection = { x: 0, y };
}

document.getElementById('btnUp').addEventListener('click', () => setDirection(0, -1));
document.getElementById('btnDown').addEventListener('click', () => setDirection(0, 1));
document.getElementById('btnLeft').addEventListener('click', () => setDirection(-1, 0));
document.getElementById('btnRight').addEventListener('click', () => setDirection(1, 0));

// Controle por arrastar o dedo (swipe) na tela
let touchStartX = 0, touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

canvas.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;

  if (Math.abs(dx) > Math.abs(dy)) {
    setDirection(dx > 0 ? 1 : -1, 0);
  } else {
    setDirection(0, dy > 0 ? 1 : -1);
  }
}, { passive: true });
