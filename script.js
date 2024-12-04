window.addEventListener("load", function () {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const CANVAS_WIDTH = (canvas.width = window.innerWidth);
  const CANVAS_HEIGHT = (canvas.height = window.innerHeight);

  const ammoEl = document.getElementById("ammoEl");
  const scoreEl = document.getElementById("scoreEl");
  const modalEl = document.getElementById("modalEl");
  const interface = document.getElementById("interface");
  const zombiesEl = document.getElementById("zombiesEl");
  const zombiesDiv = document.getElementById("zombiesDiv");
  const healthbar1 = document.getElementById("healthbar1");
  const healthbar2 = document.getElementById("healthbar2");
  const modalScoreEl = document.getElementById("modalScoreEl");
  const startGameBtn = document.getElementById("startGameBtn");

  let enemies = [];
  let particles = [];
  let bloodPools = [];
  let projectiles = [];

  class InputHandler {
    constructor() {
      this.keys = [];
      this.intervalId = null;
      this.isShooting = false;
      this.playerX = player.x;
      this.playerY = player.y;
      window.addEventListener("keydown", (event) => {
        if (
          (event.key === "w" ||
            event.key === "a" ||
            event.key === "s" ||
            event.key === "d" ||
            event.key === "r") &&
          !this.keys.includes(event.key)
        ) {
          this.keys.push(event.key);
        }
      });
      window.addEventListener("keyup", (event) => {
        if (
          event.key === "w" ||
          event.key === "a" ||
          event.key === "s" ||
          event.key === "d" ||
          event.key === "r"
        ) {
          this.keys.splice(this.keys.indexOf(event.key), 1);
        }
      });
      window.addEventListener("mousedown", (event) => {
        if (player.isDead || player.isReloading || !gameHasStarted) return;
        if (!this.isShooting) {
          this.isShooting = true;
          this.intervalId = setInterval(() => {
            this.playerX = player.x;
            this.playerY = player.y;
            if (player.isDead) {
              clearInterval(this.intervalId);
              window.removeEventListener("mousedown", this);
              return;
            }
            const velocity = {
              x: Math.cos(player.angle) * 20,
              y: Math.sin(player.angle) * 20,
            };
            if (player.ammo > 0) {
              const shootSound = new Audio();
              shootSound.src = "./Public/Audio/fire.wav";
              shootSound.play();
              projectiles.push(
                new Projectile(
                  this.playerX,
                  this.playerY,
                  5,
                  "#FFA500",
                  velocity
                )
              );
              drawGlowEffect(this.playerX, this.playerY);
            }
            player.ammo--;
            if (player.ammo <= 0) {
              player.reload();
            }
            if (player.ammo >= 0) ammoEl.innerHTML = player.ammo;
          }, 100);
        }
      });
      window.addEventListener("mouseup", () => {
        this.isShooting = false;
        clearInterval(this.intervalId);
      });
      window.addEventListener("mousemove", (event) => {
        this.playerX = player.x;
        this.playerY = player.y;
        const angle = Math.atan2(
          event.clientY - this.playerY,
          event.clientX - this.playerX
        );
        player.rotate(angle);
        corsshair.update(event.clientX, event.clientY);
      });
      startGameBtn.addEventListener("click", () => {
        init();
        animate(0);
        modalEl.style.display = "none";
      });
    }
  }

  class Player {
    constructor(x, y, color, radius) {
      this.x = x;
      this.y = y;
      this.vy = 0;
      this.vx = 0;
      this.color = color;
      this.radius = radius;
      this.spriteWidth = 313;
      this.spriteHeight = 206;
      this.width = this.spriteWidth * 0.5;
      this.height = this.spriteHeight * 0.5;
      this.health = 100;
      this.angle = 0;
      this.frames = [];
      this.maxFrames = 20;
      this.currentFrame = 0;
      this.feetFrames = [];
      this.feetMaxFrames = 1;
      this.feetCurrentFrame = 0;
      this.timeToNewFrame = 0;
      this.frameInterval = 10;
      this.loadFrames("idle", 20);
      this.feetLoadFrames("feetIdle", 1);
      this.image = document.getElementById("idle1");
      this.feetImage = document.getElementById("feetIdle1");
      this.ammo = 30;
      this.isDead = false;
      this.isReloading = false;
      this.magInSound = new Audio();
      this.magInSound.src = "./Public/Audio/mag-in.wav";
      this.magOutSound = new Audio();
      this.magOutSound.src = "./Public/Audio/mag-out.wav";
      this.footsteps = new Audio();
      this.footsteps.src = "./Public/Audio/footsteps.mp3";
      this.footsteps.loop = true;
    }
    reload() {
      if (this.isReloading || this.isDead) return;
      this.magOutSound.play();
      this.isReloading = true;
      this.loadFrames("reload", 20);
      setTimeout(() => {
        this.ammo = 30;
        ammoEl.innerHTML = this.ammo;
        this.isReloading = false;
        this.loadFrames("idle", 20);
        this.magInSound.play();
      }, 1000);
    }
    loadFrames(animationType, maxFrames) {
      this.frames = [];
      this.maxFrames = maxFrames;
      for (let i = 1; i <= maxFrames; i++) {
        this.frames.push(document.getElementById(`${animationType}${i}`));
      }
    }
    feetLoadFrames(animationType, maxFrames) {
      this.feetFrames = [];
      for (let i = 1; i <= maxFrames; i++) {
        const image = document.getElementById(`${animationType}${i}`);
        if (image) {
          this.feetFrames.push(image);
        }
      }
      this.feetMaxFrames = maxFrames;
    }
    update(pressedKeys, deltaTime) {
      this.draw();
      if (pressedKeys.includes("r") && this.ammo < 30) this.reload();
      if (this.isReloading) {
        this.loadFrames("reload", 20);
      } else {
        if (
          pressedKeys.includes("w") ||
          pressedKeys.includes("a") ||
          pressedKeys.includes("s") ||
          pressedKeys.includes("d")
        ) {
          this.footsteps.play();
          this.loadFrames("move", 20);
          this.feetLoadFrames("feetWalk", 20);
        } else {
          this.footsteps.pause();
          this.loadFrames("idle", 20);
          this.feetLoadFrames("feetIdle", 1);
        }
      }
      if (this.timeToNewFrame >= this.frameInterval) {
        this.image = this.frames[this.currentFrame];
        if (this.feetFrames.length > 0) {
          this.feetImage = this.feetFrames[this.feetCurrentFrame];
        }
        this.currentFrame = (this.currentFrame + 1) % this.maxFrames;
        this.feetCurrentFrame =
          (this.feetCurrentFrame + 1) % this.feetMaxFrames;
        this.timeToNewFrame = 0;
      } else {
        this.timeToNewFrame += deltaTime;
      }
      this.x += this.vx;
      if (pressedKeys.includes("d")) this.vx = 3;
      else if (pressedKeys.includes("a")) this.vx = -3;
      else this.vx = 0;
      this.y += this.vy;
      if (pressedKeys.includes("w")) this.vy = -3;
      else if (pressedKeys.includes("s")) this.vy = 3;
      else this.vy = 0;
      if (this.x <= this.radius) this.x = this.radius;
      else if (this.x >= CANVAS_WIDTH - this.radius)
        this.x = CANVAS_WIDTH - this.radius;
      if (this.y <= this.radius) this.y = this.radius;
      else if (this.y >= CANVAS_HEIGHT - this.radius)
        this.y = CANVAS_HEIGHT - this.radius;
    }
    rotate(angle) {
      this.angle = angle;
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      if (this.feetImage) {
        ctx.drawImage(
          this.feetImage,
          -this.width / 2 + 25,
          -this.height / 2 - 10,
          this.width,
          this.height
        );
      }
      ctx.drawImage(
        this.image,
        -this.width / 2 + 25,
        -this.height / 2 - 10,
        this.width,
        this.height
      );
      ctx.restore();
    }
  }

  class Enemy {
    constructor(player, x, y, radius, color, health) {
      this.player = player;
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.color = color;
      this.health = health;
      this.speed = Math.random() * 5 + 1;
      this.angle = null;
      this.velocity = null;
      this.spriteWidth = 288;
      this.spriteHeight = 311;
      this.width = this.spriteWidth * 0.5;
      this.height = this.spriteHeight * 0.5;
      this.frames = [];
      this.maxFrames = 17;
      this.currentFrame = 0;
      this.timeToNewFrame = 0;
      this.frameInterval = 50;
      this.loadFrames("enemyMove", 17);
      this.image = document.getElementById("enemyMove1");
      this.sound = this.getRandomSound("Groan", 24);
      this.deathSound = this.getRandomSound("Death", 3);
      this.timeToNewSound = 0;
      this.soundInterval = Math.random() * 4000 + 1000;
    }
    getRandomSound(soundType, maxSounds) {
      const randomSound = new Audio();
      randomSound.src = `./Public/Audio/Zombies/${soundType}/${Math.floor(Math.random() * maxSounds + 1)}.wav`;
      return randomSound;
    }
    loadFrames(animationType, maxFrames) {
      this.frames = [];
      for (let i = 1; i <= maxFrames; i++) {
        this.frames.push(document.getElementById(`${animationType}${i}`));
      }
      this.maxFrames = maxFrames;
    }
    update(deltaTime) {
      this.draw();
      if (this.timeToNewSound >= this.soundInterval) {
        this.sound.play();
        this.timeToNewSound = 0;
      } else {
        this.timeToNewSound += deltaTime;
      }
      this.angle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
      this.velocity = {
        x: Math.cos(this.angle) * this.speed,
        y: Math.sin(this.angle) * this.speed,
      };
      this.x += this.velocity.x;
      this.y += this.velocity.y;
      if (this.timeToNewFrame >= this.frameInterval) {
        this.image = this.frames[this.currentFrame];
        this.currentFrame = (this.currentFrame + 1) % this.maxFrames;
        this.timeToNewFrame = 0;
      } else {
        this.timeToNewFrame += deltaTime;
      }
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.drawImage(
        this.image,
        -this.width * 0.5,
        -this.height * 0.5,
        this.width,
        this.height
      );
      ctx.restore();
    }
  }

  class Projectile {
    constructor(x, y, radius, color, velocity) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.color = color;
      this.velocity = velocity;
    }
    update() {
      this.draw();
      this.x += this.velocity.x;
      this.y += this.velocity.y;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }

  class Particle {
    constructor(x, y, radius, color, velocity) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.color = color;
      this.velocity = velocity;
      this.alpha = 1;
      this.friction = 0.99;
    }
    update() {
      this.draw();
      this.velocity.x *= this.friction;
      this.velocity.y *= this.friction;
      this.x += this.velocity.x;
      this.y += this.velocity.y;
      this.alpha -= 0.01;
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.restore();
    }
  }

  class BloodPool {
    constructor(x, y, radius, color) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.color = color;
      this.alpha = 1;
    }
    update() {
      this.draw();
      this.radius += 0.5;
      this.alpha -= 0.009;
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.restore();
    }
  }

  class Crosshair {
    constructor() {
      this.width = 30;
      this.height = 30;
      this.x = CANVAS_WIDTH / 2 - this.width;
      this.y = CANVAS_HEIGHT / 2 - this.height;
      this.image = document.getElementById("crosshair");
    }
    update(x, y) {
      this.x = x - this.width / 2;
      this.y = y - this.height / 2;
    }
    draw() {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
  }

  function drawGlowEffect(playerX, playerY) {
    const size = Math.random() * 80 + 80;
    const gradient = ctx.createRadialGradient(
      playerX,
      playerY,
      0,
      playerX,
      playerY,
      size
    );
    gradient.addColorStop(0, "rgba(255, 165, 0, 0.7)");
    gradient.addColorStop(1, "rgba(255, 165, 0, 0)");
    ctx.save();
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(playerX, playerY, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function spawnEnemies(deltaTime) {
    if (timeToNewEnemy >= enemyInterval) {
      const radius = 40;
      const health = Math.random() * 100 + 25;
      let x;
      let y;
      if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? -radius : CANVAS_WIDTH + radius;
        y = Math.random() * CANVAS_HEIGHT;
      } else {
        x = Math.random() * CANVAS_WIDTH;
        y = Math.random() < 0.5 ? -radius : CANVAS_HEIGHT + radius;
      }
      const hue = Math.random() * 20;
      const saturation = Math.random() * 50 + 50;
      const lightness = Math.random() * 20 + 30;
      const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      enemies.push(new Enemy(player, x, y, radius, color, health));
      timeToNewEnemy = 0;
    } else {
      timeToNewEnemy += deltaTime;
    }
  }

  function init() {
    score = 0;
    enemies = [];
    particles = [];
    bloodPools = [];
    projectiles = [];
    enemiesKilled = 0;
    gameHasStarted = true;
    backgroundMusic.play();
    scoreEl.innerHTML = score;
    modalScoreEl.innerHTML = score;
    zombiesDiv.style.display = "block";
    player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, "white", 30);
    ammoEl.innerHTML = player.ammo;
    interface.style.display = "block";
    healthbar2.style.backgroundColor = "green";
    healthbar2.style.width = `${player.health}px`;
    document.getElementById("ammoDiv").style.display = "block";
    document.getElementById("scoreDiv").style.display = "block";
  }

  let player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, "white", 30);
  const input = new InputHandler();
  const corsshair = new Crosshair();

  const backgroundMusic = new Audio();
  backgroundMusic.src = "./Public/Audio/background.mp3";
  backgroundMusic.loop = true;

  let score = 0;
  let animationId;
  let lastTime = 0;
  let enemiesKilled = 0;
  let timeToNewEnemy = 0;
  let enemyInterval = 1000;
  let gameHasStarted = false;
  let lastHealthDecreaseTime = 0;
  function animate(timesamp) {
    animationId = requestAnimationFrame(animate);
    zombiesEl.innerHTML = enemiesKilled;
    healthbar1.style.top = `${player.y - player.radius - 40}px`;
    healthbar1.style.left = `${player.x - player.radius - 20}px`;
    healthbar2.style.top = `${player.y - player.radius - 40}px`;
    healthbar2.style.left = `${player.x - player.radius - 20}px`;
    const deltaTime = timesamp - lastTime;
    lastTime = timesamp;
    ctx.fillStyle = "rgba(0, 20, 0, 0.15)";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    particles.forEach((particle, particleIndex) => {
      if (particle.alpha <= 0) {
        particles.splice(particleIndex, 1);
      } else {
        particle.update();
      }
    });
    bloodPools.forEach((bloodPool, bloodPoolIndex) => {
      if (bloodPool.alpha <= 0) {
        bloodPools.splice(bloodPoolIndex, 1);
      } else {
        bloodPool.update();
      }
    });
    projectiles.forEach((projectile, projectileIndex) => {
      projectile.update();
      if (
        projectile.x + projectile.radius < 0 ||
        projectile.x - projectile.radius > CANVAS_WIDTH ||
        projectile.y + projectile.radius < 0 ||
        projectile.y - projectile.radius > CANVAS_HEIGHT
      ) {
        setTimeout(() => {
          projectiles.splice(projectileIndex, 1);
        }, 0);
      }
    });
    player.update(input.keys, deltaTime);
    enemies.forEach((enemy, enemyIndex) => {
      enemy.update(deltaTime);
      const distance = Math.hypot(player.x - enemy.x, player.y - enemy.y);
      if (distance - enemy.radius - player.radius < 1) {
        enemy.angle = 0;
        if (player.health > 0 && timesamp - lastHealthDecreaseTime >= 250) {
          lastHealthDecreaseTime = timesamp;
          player.health -= Math.floor(Math.random() * 10 + 5);
          healthbar2.style.width = `${player.health}px`;
          if (player.health > 50) {
            healthbar2.style.backgroundColor = "green";
          } else if (player.health > 20) {
            healthbar2.style.backgroundColor = "yellow";
          } else {
            healthbar2.style.backgroundColor = "orange";
          }
          if (player.health <= 0) {
            player.health = 0;
            healthbar2.style.width = `${player.health}px`;
            gameHasStarted = false;
            player.footsteps.pause();
            zombiesDiv.style.display = "none";
            document.getElementById("ammoDiv").style.display = "none";
            document.getElementById("scoreDiv").style.display = "none";
            cancelAnimationFrame(animationId);
            player.isDead = true;
            modalScoreEl.innerHTML = score;
            modalEl.style.display = "flex";
          }
        }
      }
      projectiles.forEach((projectile, projectileIndex) => {
        const distance = Math.hypot(
          projectile.x - enemy.x,
          projectile.y - enemy.y
        );
        if (distance - enemy.radius - projectile.radius < 1) {
          for (let i = 0; i < enemy.radius * 2; i++) {
            particles.push(
              new Particle(
                projectile.x,
                projectile.y,
                Math.random() * 2,
                enemy.color,
                {
                  x: (Math.random() - 0.5) * (Math.random() * 5),
                  y: (Math.random() - 0.5) * (Math.random() * 5),
                }
              )
            );
          }
          if (enemy.health - 10 > 25) {
            score += 10;
            scoreEl.innerHTML = score;
            enemy.health -= Math.random() * 25 + 30;
            setTimeout(() => {
              projectiles.splice(projectileIndex, 1);
            }, 0);
          } else {
            score += 25;
            enemiesKilled++;
            scoreEl.innerHTML = score;
            enemy.deathSound.play();
            bloodPools.push(new BloodPool(enemy.x, enemy.y, 0, enemy.color));
            setTimeout(() => {
              enemies.splice(enemyIndex, 1);
              projectiles.splice(projectileIndex, 1);
            }, 0);
          }
        }
      });
    });
    corsshair.draw();
    spawnEnemies(deltaTime);
  }
});