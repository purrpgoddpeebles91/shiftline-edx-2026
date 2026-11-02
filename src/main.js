const app = document.getElementById('app');
const canvas = document.createElement('canvas');
canvas.width = 960;
canvas.height = 540;
const ctx = canvas.getContext('2d');

const keyState = {};
const shiftStates = ['normal', 'echo', 'rift'];

let screenState = 'title';
let score = 0;
let lastFrame = 0;

const ui = {
  status: null,
  score: null,
};

const groundY = 450;

const world = {
  platforms: [
    { x: 200, y: 390, w: 160, h: 18 },
    { x: 470, y: 350, w: 210, h: 18 },
    { x: 720, y: 420, w: 170, h: 18 },
  ],
  projectiles: [],
  enemies: [],
  pickups: [],
  particles: [],
};

const player = {
  x: 110,
  y: 390,
  w: 26,
  h: 34,
  vx: 0,
  vy: 0,
  speed: 240,
  jump: 500,
  grounded: true,
  hp: 100,
  invuln: 0,
  attackCooldown: 0,
  shiftCooldown: 0,
  shiftIndex: 0,
  facing: 1,
  weaponLevel: 1,
};

const boss = {
  active: false,
  x: 720,
  y: 250,
  w: 96,
  h: 96,
  hp: 180,
  maxHp: 180,
  phase: 1,
  phaseTimer: 0,
  fireTimer: 0,
  moveDir: 1,
};

function setStatus(text) {
  if (ui.status) ui.status.textContent = `Status: ${text}`;
}

function updateHud() {
  if (ui.score) ui.score.textContent = `Shards: ${score}`;
}

function buildTitleScreen() {
  const screen = document.createElement('div');
  screen.className = 'screen';
  screen.innerHTML = `
    <div class="title-box">
      <h1>SHIFTLINE</h1>
      <p>GitHub Game Off 2026</p>
      <p>The Fractured Gate</p>
      <p>You are the last one who can cross the seams between reality. Shift between broken worlds, survive the Rift, and shatter the gate before it consumes the last living city.</p>
      <button id="start-btn">Begin Chapter 1</button>
    </div>
  `;

  screen.querySelector('#start-btn').addEventListener('click', () => {
    screenState = 'story';
    renderScreen();
  });

  return screen;
}

function buildStoryScreen() {
  const screen = document.createElement('div');
  screen.className = 'story-log';
  screen.innerHTML = `
    <h2>CHAPTER LOG</h2>
    <p>The city still breathes, but only in fragments.</p>
    <p>The gate ahead trembles because reality is trying to peel itself open.</p>
    <p>Your shift-state is the only thing still holding the seams together.</p>
    <p>You must cross the gate and survive the Warden before the city is erased.</p>
    <button id="continue-btn">Continue</button>
  `;

  screen.querySelector('#continue-btn').addEventListener('click', () => {
    screenState = 'game';
    renderScreen();
    startGame();
  });

  return screen;
}

function buildGameShell() {
  const shell = document.createElement('div');
  shell.className = 'game-shell';

  const topbar = document.createElement('header');
  topbar.className = 'topbar';
  topbar.innerHTML = `
    <div class="brand">SHIFTLINE EDX 2026</div>
    <div class="meta">GitHub Game Off 2026</div>
  `;

  const hud = document.createElement('div');
  hud.className = 'hud';
  hud.innerHTML = `
    <div id="status">Status: Chapter 1</div>
    <div id="score">Shards: 0</div>
  `;

  ui.status = hud.querySelector('#status');
  ui.score = hud.querySelector('#score');

  shell.appendChild(topbar);
  shell.appendChild(canvas);
  shell.appendChild(hud);
  return shell;
}

function buildUpgradeScreen() {
  const panel = document.createElement('div');
  panel.className = 'upgrade-panel';
  panel.innerHTML = `
    <h3>Chapter Reward</h3>
    <div class="upgrade-grid">
      <div class="upgrade-card">
        <h4>Rift Pulse</h4>
        <p>Faster shot timing and cleaner dodge windows while shifting into the Rift.</p>
        <button data-upgrade="pulse">Take this</button>
      </div>
      <div class="upgrade-card">
        <h4>Echo Step</h4>
        <p>Improves movement precision and reduces the penalty for repeated shift swaps.</p>
        <button data-upgrade="echo">Take this</button>
      </div>
      <div class="upgrade-card">
        <h4>Seam Breaker</h4>
        <p>Boosts projectile power and increases boss damage when your shift state is unstable.</p>
        <button data-upgrade="breaker">Take this</button>
      </div>
    </div>
  `;

  panel.querySelectorAll('button[data-upgrade]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const choice = btn.dataset.upgrade;
      if (choice === 'pulse') player.weaponLevel = 2;
      if (choice === 'echo') player.speed += 20;
      if (choice === 'breaker') player.jump += 30;

      screenState = 'title';
      renderScreen();
    });
  });

  return panel;
}

function renderScreen() {
  app.innerHTML = '';

  if (screenState === 'title') {
    app.appendChild(buildTitleScreen());
    return;
  }

  if (screenState === 'story') {
    app.appendChild(buildStoryScreen());
    return;
  }

  if (screenState === 'upgrade') {
    app.appendChild(buildUpgradeScreen());
    return;
  }

  if (screenState === 'game') {
    app.appendChild(buildGameShell());
    updateHud();
  }
}

function resetBattle() {
  score = 0;
  boss.active = false;
  boss.hp = boss.maxHp;
  boss.phase = 1;
  boss.phaseTimer = 0;
  boss.fireTimer = 0;
  boss.moveDir = 1;
  boss.x = 720;
  boss.y = 250;

  world.projectiles.length = 0;
  world.enemies.length = 0;
  world.pickups.length = 0;
  world.particles.length = 0;

  player.x = 110;
  player.y = groundY - player.h;
  player.vx = 0;
  player.vy = 0;
  player.hp = 100;
  player.invuln = 0;
  player.attackCooldown = 0;
  player.shiftCooldown = 0;
  player.shiftIndex = 0;
  player.grounded = true;
}

function startGame() {
  resetBattle();
  setStatus('Chapter 1: The Fractured Gate');
  updateHud();
  requestAnimationFrame(gameLoop);
}

function setShiftState(index) {
  player.shiftIndex = ((index % shiftStates.length) + shiftStates.length) % shiftStates.length;
  setStatus(`Shift: ${shiftStates[player.shiftIndex].toUpperCase()}`);
}

function toggleShift() {
  if (player.shiftCooldown > 0) return;
  setShiftState(player.shiftIndex + 1);
  player.shiftCooldown = 0.8;
}

function createBurst(x, y, count, hue) {
  for (let i = 0; i < count; i++) {
    world.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 180,
      vy: (Math.random() - 0.5) * 180,
      life: 0.45 + Math.random() * 0.7,
      size: 2 + Math.random() * 4,
      hue,
    });
  }
}

function spawnEnemy(x, y) {
  world.enemies.push({
    x,
    y,
    w: 22,
    h: 22,
    speed: 90 + Math.random() * 60,
  });
}

function spawnPickup(x, y) {
  world.pickups.push({
    x,
    y,
    r: 8,
    pulse: Math.random() * Math.PI * 2,
  });
}

function firePlayerShot() {
  if (player.attackCooldown > 0) return;

  const speed = 470;
  world.projectiles.push({
    x: player.x + player.w / 2 + player.facing * 12,
    y: player.y + 15,
    vx: player.facing * speed,
    vy: 0,
    radius: 5,
    fromEnemy: false,
  });

  if (player.weaponLevel >= 2) {
    world.projectiles.push({
      x: player.x + player.w / 2 + player.facing * 12,
      y: player.y + 22,
      vx: player.facing * (speed + 30),
      vy: -20,
      radius: 4,
      fromEnemy: false,
    });
  }

  player.attackCooldown = 0.2;
}

function fireEnemyBullet(enemy) {
  const dx = player.x + player.w / 2 - enemy.x;
  const dy = player.y + player.h / 2 - enemy.y;
  const len = Math.hypot(dx, dy) || 1;
  const speed = 180 + Math.random() * 30;

  world.projectiles.push({
    x: enemy.x,
    y: enemy.y,
    vx: (dx / len) * speed,
    vy: (dy / len) * speed,
    radius: 5,
    fromEnemy: true,
  });
}

function fireBossPattern() {
  if (!boss.active) return;

  const count = boss.phase >= 2 ? 7 : 5;

  for (let i = 0; i < count; i++) {
    const angle = ((Math.PI * 2) / count) * i + boss.phaseTimer * 0.8;
    const speed = boss.phase >= 3 ? 170 : 130;

    world.projectiles.push({
      x: boss.x + boss.w / 2,
      y: boss.y + boss.h / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 6,
      fromEnemy: true,
    });
  }

  if (boss.phase >= 3) {
    const targetX = player.x + player.w / 2;
    const targetY = player.y + player.h / 2;
    const dx = targetX - (boss.x + boss.w / 2);
    const dy = targetY - (boss.y + boss.h / 2);
    const len = Math.hypot(dx, dy) || 1;

    world.projectiles.push({
      x: boss.x + boss.w / 2,
      y: boss.y + boss.h / 2,
      vx: (dx / len) * 220,
      vy: (dy / len) * 220,
      radius: 7,
      fromEnemy: true,
    });
  }
}

function updatePlayer(dt) {
  const left = keyState.a || keyState.ArrowLeft;
  const right = keyState.d || keyState.ArrowRight;
  const jump = keyState.w || keyState.ArrowUp || keyState[' '];

  if (left && !right) {
    player.vx = -player.speed;
    player.facing = -1;
  } else if (right && !left) {
    player.vx = player.speed;
    player.facing = 1;
  } else {
    player.vx *= 0.7;
    if (Math.abs(player.vx) < 2) player.vx = 0;
  }

  if (jump && player.grounded) {
    player.vy = -player.jump;
    player.grounded = false;
  }

  player.vy += 1400 * dt;
  player.x += player.vx * dt;
  player.y += player.vy * dt;

  if (player.y + player.h >= groundY) {
    player.y = groundY - player.h;
    player.vy = 0;
    player.grounded = true;
  }

  for (const platform of world.platforms) {
    const inX = player.x + player.w > platform.x && player.x < platform.x + platform.w;
    const onTop = player.y + player.h >= platform.y && player.y + player.h <= platform.y + 25 && player.vy >= 0;
    if (inX && onTop) {
      player.y = platform.y - player.h;
      player.vy = 0;
      player.grounded = true;
    }
  }

  player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
  player.attackCooldown = Math.max(0, player.attackCooldown - dt);
  player.shiftCooldown = Math.max(0, player.shiftCooldown - dt);
  player.invuln = Math.max(0, player.invuln - dt);

  if (keyState.j || keyState.Enter) firePlayerShot();
  if (keyState.c || keyState.e) toggleShift();
}

function updateEnemies(dt) {
  for (let i = world.enemies.length - 1; i >= 0; i--) {
    const enemy = world.enemies[i];
    enemy.x -= 100 * dt;
    if (Math.random() < 0.015) {
      fireEnemyBullet(enemy);
    }
    if (enemy.x < -40) world.enemies.splice(i, 1);
  }
}

function updateProjectiles(dt) {
  for (let i = world.projectiles.length - 1; i >= 0; i--) {
    const p = world.projectiles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    if (p.fromEnemy) {
      const hit =
        p.x > player.x &&
        p.x < player.x + player.w &&
        p.y > player.y &&
        p.y < player.y + player.h;

      if (hit) {
        world.projectiles.splice(i, 1);
        if (player.invuln <= 0) {
          player.hp -= 10;
          player.invuln = 0.6;
          createBurst(player.x + player.w / 2, player.y + player.h / 2, 18, 18);
        }
        continue;
      }
    } else {
      for (let j = world.enemies.length - 1; j >= 0; j--) {
        const enemy = world.enemies[j];
        const hit =
          p.x > enemy.x &&
          p.x < enemy.x + enemy.w &&
          p.y > enemy.y &&
          p.y < enemy.y + enemy.h;

        if (hit) {
          world.enemies.splice(j, 1);
          world.projectiles.splice(i, 1);
          score += 10;
          createBurst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, 12, 190);
          spawnPickup(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
          break;
        }
      }

      if (boss.active) {
        const bossHit =
          p.x > boss.x &&
          p.x < boss.x + boss.w &&
          p.y > boss.y &&
          p.y < boss.y + boss.h;

        if (bossHit) {
          world.projectiles.splice(i, 1);
          boss.hp -= 10;
          createBurst(p.x, p.y, 12, 200);
        }
      }
    }

    if (p.x < -30 || p.x > canvas.width + 30 || p.y < -30 || p.y > canvas.height + 30) {
      world.projectiles.splice(i, 1);
    }
  }
}

function updatePickups(dt) {
  for (let i = world.pickups.length - 1; i >= 0; i--) {
    const p = world.pickups[i];
    p.pulse += dt * 4;
    const touched =
      player.x < p.x + 14 &&
      player.x + player.w > p.x - 14 &&
      player.y < p.y + 14 &&
      player.y + player.h > p.y - 14;

    if (touched) {
      world.pickups.splice(i, 1);
      score += 25;
      player.weaponLevel = Math.min(player.weaponLevel + 1, 3);
      createBurst(p.x, p.y, 18, 210);
    }
  }
}

function updateParticles(dt) {
  for (let i = world.particles.length - 1; i >= 0; i--) {
    const p = world.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) world.particles.splice(i, 1);
  }
}

function startBossFight() {
  boss.active = true;
  boss.phase = 1;
  boss.hp = boss.maxHp;
  boss.phaseTimer = 0;
  boss.fireTimer = 0;
  setStatus('Boss: The Warden of the Seams');
}

function updateBoss(dt) {
  if (!boss.active) return;

  boss.phaseTimer += dt;
  boss.fireTimer += dt;
  boss.x += Math.sin(boss.phaseTimer * 2) * 20 * dt * boss.moveDir;

  if (boss.x < 610) boss.moveDir = 1;
  if (boss.x > 820) boss.moveDir = -1;

  if (boss.hp < boss.maxHp * 0.7) boss.phase = 2;
  if (boss.hp < boss.maxHp * 0.35) boss.phase = 3;

  if (boss.fireTimer > (boss.phase === 3 ? 0.7 : boss.phase === 2 ? 1.0 : 1.35)) {
    fireBossPattern();
    boss.fireTimer = 0;
  }

  if (boss.hp <= 0) {
    boss.active = false;
    score += 200;
    setStatus('Gate shattered. Chapter clear.');
    screenState = 'upgrade';
    renderScreen();
  }
}

function updateStage(dt) {
  if (!boss.active && player.x > 560) {
    startBossFight();
  }

  if (!boss.active && Math.random() < 0.032) {
    spawnEnemy(canvas.width + 40, groundY - 30);
    if (Math.random() > 0.55) spawnEnemy(canvas.width + 180, groundY - 50);
  }
}

function renderBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#0d1222');
  gradient.addColorStop(0.5, '#111829');
  gradient.addColorStop(1, '#171722');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(173, 189, 255, 0.08)';
  for (let i = 0; i < 20; i++) {
    const x = (i * 52 + (performance.now() * 0.03) % 80) % 1000;
    const h = 80 + (i % 5) * 26;
    ctx.fillRect(x, 360 - h, 34, h);
  }

  for (let i = 0; i < 60; i++) {
    const x = (i * 91 + (performance.now() * 0.02) % canvas.width) % canvas.width;
    const y = (i * 37) % 220;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(x, y, 2, 2);
  }
}

function renderGround() {
  ctx.fillStyle = '#0c1522';
  ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
  ctx.fillStyle = '#172b3f';
  ctx.fillRect(0, groundY, canvas.width, 14);

  for (const platform of world.platforms) {
    ctx.fillStyle = '#1c3348';
    ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
  }
}

function renderPlayer() {
  const tone = shiftStates[player.shiftIndex] === 'normal' ? '#8edbff' : shiftStates[player.shiftIndex] === 'echo' ? '#7ef2c0' : '#ff82d8';
  ctx.fillStyle = tone;
  ctx.fillRect(player.x, player.y, player.w, player.h);

  ctx.fillStyle = '#10141a';
  ctx.fillRect(player.x + 6, player.y + 8, 4, 4);
  ctx.fillRect(player.x + player.w - 10, player.y + 8, 4, 4);

  if (player.invuln > 0) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(player.x - 2, player.y - 2, player.w + 4, player.h + 4);
  }
}

function renderEnemies() {
  for (const enemy of world.enemies) {
    ctx.fillStyle = '#ff6a5f';
    ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
  }
}

function renderProjectiles() {
  for (const p of world.projectiles) {
    ctx.fillStyle = p.fromEnemy ? '#ffb703' : '#8ef0ff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderPickups() {
  for (const p of world.pickups) {
    const pulse = p.r + Math.sin(p.pulse) * 2;
    ctx.fillStyle = '#fce38a';
    ctx.beginPath();
    ctx.arc(p.x, p.y, pulse, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderBoss() {
  if (!boss.active) return;

  ctx.fillStyle = '#f3d29e';
  ctx.fillRect(boss.x, boss.y, boss.w, boss.h);

  ctx.fillStyle = '#2a1d31';
  ctx.fillRect(boss.x + 18, boss.y + 18, boss.w - 36, 12);

  ctx.fillStyle = '#d7367a';
  ctx.fillRect(
    boss.x + 18,
    boss.y + 18,
    (boss.w - 36) * (boss.hp / boss.maxHp),
    12
  );
}

function renderParticles() {
  for (const p of world.particles) {
    ctx.fillStyle = `hsla(${p.hue}, 90%, 60%, ${p.life})`;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }
}

function renderHud() {
  ctx.fillStyle = 'rgba(8, 10, 20, 0.52)';
  ctx.fillRect(20, 18, 360, 58);

  ctx.fillStyle = '#dfeaf8';
  ctx.font = '18px sans-serif';
  ctx.fillText('THE FRACTURED GATE', 32, 42);

  ctx.fillStyle = '#8cc8ff';
  ctx.font = '15px sans-serif';
  ctx.fillText(
    `HP: ${player.hp}   SHARDS: ${score}   SHIFT: ${shiftStates[player.shiftIndex].toUpperCase()}`,
    32,
    62
  );
}

function drawWorld() {
  renderBackground();
  renderGround();
  renderPickups();
  renderProjectiles();
  renderEnemies();
  renderBoss();
  renderPlayer();
  renderParticles();
  renderHud();
}

function gameLoop(ts) {
  const dt = Math.min((ts - lastFrame) / 1000 || 0.016, 0.033);
  lastFrame = ts;

  if (screenState === 'game') {
    updatePlayer(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updatePickups(dt);
    updateParticles(dt);
    updateStage(dt);
    updateBoss(dt);
    updateHud();
    drawWorld();

    if (player.hp <= 0) {
      player.hp = 100;
      player.x = 110;
      player.y = groundY - player.h;
      world.projectiles.length = 0;
      world.enemies.length = 0;
      world.pickups.length = 0;
      world.particles.length = 0;
      score = 0;
      setStatus('Reset: The Rift recalibrated.');
    }
  }

  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  keyState[key] = true;

  if (event.key === ' ') keyState[' '] = true;
  if (event.key === 'ArrowLeft') keyState.ArrowLeft = true;
  if (event.key === 'ArrowRight') keyState.ArrowRight = true;
  if (event.key === 'ArrowUp') keyState.ArrowUp = true;
  if (event.key === 'Enter') keyState.Enter = true;
});

window.addEventListener('keyup', (event) => {
  const key = event.key.toLowerCase();
  keyState[key] = false;

  if (event.key === ' ') keyState[' '] = false;
  if (event.key === 'ArrowLeft') keyState.ArrowLeft = false;
  if (event.key === 'ArrowRight') keyState.ArrowRight = false;
  if (event.key === 'ArrowUp') keyState.ArrowUp = false;
  if (event.key === 'Enter') keyState.Enter = false;
});

renderScreen();
