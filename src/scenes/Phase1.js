export class Phase1 extends Phaser.Scene {
    constructor() {
        super("Phase1");
    }

    preload() {
        // Fundo
        this.load.image("phase1Bg", "assets/phase1/cenario1.jpg");

        // HUD / Leona
        this.load.image("heroPortrait", "assets/player/portrait.png");

        this.load.image("leona_idle", "assets/player/idle.png");
        this.load.image("leona_walk1", "assets/player/walking1.png");
        this.load.image("leona_walk2", "assets/player/walking2.png");
        this.load.image("leona_walk3", "assets/player/walking3.png");
        this.load.image("leona_walk4", "assets/player/walking4.png");
        this.load.image("leona_walk5", "assets/player/walking5.png");

        this.load.image("leona_punch1", "assets/player/punch1.png");
        this.load.image("leona_punch2", "assets/player/punch2.png");
        this.load.image("leona_punch3", "assets/player/punch3.png");

        this.load.image("leona_kick", "assets/player/kick3.png");
        this.load.image("leona_damage", "assets/player/damage.png");
        this.load.image("leona_death1", "assets/player/death1.png");
        this.load.image("leona_death2", "assets/player/death2.png");

        // Inimigo
        this.load.image("enemy_idle", "assets/Enemy 1/idle.png");

        this.load.image("enemy_walk1", "assets/Enemy 1/walking1.png");
        this.load.image("enemy_walk2", "assets/Enemy 1/walking2.png");
        this.load.image("enemy_walk3", "assets/Enemy 1/walking3.png");
        this.load.image("enemy_walk4", "assets/Enemy 1/walking4.png");
        this.load.image("enemy_walk5", "assets/Enemy 1/walking5.png");
        this.load.image("enemy_walk6", "assets/Enemy 1/walking6.png");

        this.load.image("enemy_punch1", "assets/Enemy 1/punch1.png");
        this.load.image("enemy_punch2", "assets/Enemy 1/punch2.png");
        this.load.image("enemy_punch3", "assets/Enemy 1/punch3.png");

        this.load.image("enemy_damage", "assets/Enemy 1/damage.png");
        this.load.image("enemy_death1", "assets/Enemy 1/death1.png");
        this.load.image("enemy_death2", "assets/Enemy 1/death2.png");

        // Áudios
        this.load.audio("phaseMusic", [
            "assets/audio/phase1.mp3",
            "assets/audio/phase1.ogg"
        ]);

        this.load.audio("sfxPunch", [
            "assets/audio/punch.mp3",
            "assets/audio/punch.ogg"
        ]);

        this.load.audio("sfxKick", [
            "assets/audio/kick.mp3",
            "assets/audio/kick.ogg"
        ]);

        this.load.audio("sfxHurt", [
            "assets/audio/hurt.mp3",
            "assets/audio/hurt.ogg"
        ]);

        this.load.audio("sfxDeath", [
            "assets/audio/death.mp3",
            "assets/audio/death.ogg"
        ]);

        this.load.audio("sfxVictory", [
            "assets/audio/victory.mp3",
            "assets/audio/victory.ogg"
        ]);
    }

    create() {
        this.worldWidth = 1280;
        this.worldHeight = 720;

        this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);

        this.levelComplete = false;
        this.isGameEnding = false;
        this.playerDeathPlayed = false;

        this.totalEnemiesToSpawn = 5;
        this.spawnedEnemies = 0;
        this.enemiesDefeated = 0;
        this.maxEnemiesOnScreen = 2;

        this.enemySpawnMinY = 580;
        this.enemySpawnMaxY = 635;

        this.alturaPlayer = 180;
        this.alturaEnemy = 165;

        this.enemies = [];

        this.criarCenario();
        this.criarAnimacoes();
        this.criarPlayer();
        this.criarHUD();
        this.criarMensagens();
        this.criarAudio();
        this.iniciarSpawnerInimigos();

        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D,
            J: Phaser.Input.Keyboard.KeyCodes.J,
            K: Phaser.Input.Keyboard.KeyCodes.K
        });

        this.events.on("shutdown", this.finalizarCena, this);
        this.events.on("destroy", this.finalizarCena, this);
    }

    update() {
        if (this.levelComplete) {
            this.player.setVelocity(0, 0);
            return;
        }

        this.atualizarPlayer();
        this.atualizarInimigos();
        this.atualizarHUDInimigos();
        this.organizarProfundidade();
        this.verificarFimDaFase();
    }

    criarCenario() {
        this.add.image(0, 0, "phase1Bg")
            .setOrigin(0, 0)
            .setDisplaySize(this.worldWidth, this.worldHeight);
    }

    criarAudio() {
        this.phaseMusic = this.sound.add("phaseMusic", {
            volume: 0.35,
            loop: true
        });

        this.sfxPunch = this.sound.add("sfxPunch", { volume: 0.5 });
        this.sfxKick = this.sound.add("sfxKick", { volume: 0.55 });
        this.sfxHurt = this.sound.add("sfxHurt", { volume: 0.6 });
        this.sfxDeath = this.sound.add("sfxDeath", { volume: 0.7 });
        this.sfxVictory = this.sound.add("sfxVictory", { volume: 0.8 });

        if (!this.sound.locked) {
            this.phaseMusic.play();
        } else {
            this.sound.once("unlocked", () => {
                if (this.phaseMusic && !this.phaseMusic.isPlaying) {
                    this.phaseMusic.play();
                }
            });
        }
    }

    tocarSom(audio, restart = false) {
        if (!audio) return;

        if (restart) {
            audio.stop();
        }

        audio.play();
    }

    criarMensagens() {
        this.endBox = this.add.rectangle(640, 360, 620, 160, 0x000000, 0.75)
            .setStrokeStyle(3, 0xffffff)
            .setScrollFactor(0)
            .setVisible(false)
            .setAlpha(0)
            .setDepth(9999);

        this.endTitle = this.add.text(640, 335, "", {
            fontSize: "34px",
            color: "#ffffff",
            fontStyle: "bold"
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setAlpha(0).setDepth(10000);

        this.endSub = this.add.text(640, 390, "", {
            fontSize: "24px",
            color: "#ffd166"
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setAlpha(0).setDepth(10000);
    }

    mostrarMensagemFinal(titulo, subtitulo) {
        this.endTitle.setText(titulo);
        this.endSub.setText(subtitulo);

        this.endBox.setVisible(true);
        this.endTitle.setVisible(true);
        this.endSub.setVisible(true);

        this.tweens.add({
            targets: [this.endBox, this.endTitle, this.endSub],
            alpha: 1,
            duration: 250
        });
    }

    criarPlayer() {
        this.player = this.physics.add.sprite(250, 610, "leona_idle");
        this.player.setCollideWorldBounds(true);
        this.player.setOrigin(0.5, 1);

        this.ajustarEscalaSprite(this.player, this.alturaPlayer);
        this.player.play("leona_idle");

        this.player.on(Phaser.Animations.Events.ANIMATION_UPDATE, () => {
            this.ajustarEscalaSprite(this.player, this.alturaPlayer);
        });

        this.isDead = false;
        this.inAction = false;
        this.isPunching = false;

        this.comboStep = 0;
        this.punchBuffer = 0;
        this.maxCombo = 3;

        this.maxHp = 100;
        this.currentHp = 100;
    }

    iniciarSpawnerInimigos() {
        this.enemySpawnEvent = this.time.addEvent({
            delay: 2400,
            loop: true,
            callback: () => {
                if (this.levelComplete) return;
                if (this.spawnedEnemies >= this.totalEnemiesToSpawn) return;
                if (this.contarInimigosAtivos() >= this.maxEnemiesOnScreen) return;

                this.spawnEnemy();
            }
        });

        this.spawnEnemy();
    }

    spawnEnemy() {
        if (this.spawnedEnemies >= this.totalEnemiesToSpawn) return;
        if (this.contarInimigosAtivos() >= this.maxEnemiesOnScreen) return;

        const x = Phaser.Math.Between(980, 1180);
        const y = Phaser.Math.Between(this.enemySpawnMinY, this.enemySpawnMaxY);

        const sprite = this.physics.add.sprite(x, y, "enemy_idle");
        sprite.setOrigin(0.5, 1);
        sprite.setCollideWorldBounds(true);

        this.ajustarEscalaSprite(sprite, this.alturaEnemy);
        sprite.play("enemy_idle");

        sprite.on(Phaser.Animations.Events.ANIMATION_UPDATE, () => {
            this.ajustarEscalaSprite(sprite, this.alturaEnemy);
        });

        const hpBg = this.add.graphics();
        const hpFill = this.add.graphics();

        const enemy = {
            sprite,
            hpBg,
            hpFill,
            data: {
                maxHp: 45,
                currentHp: 45,
                speed: 80,
                isDead: false,
                isAttacking: false,
                isHurt: false,
                isRemoving: false,
                attackCooldown: 950,
                lastAttackTime: 0
            }
        };

        this.enemies.push(enemy);
        this.spawnedEnemies++;
    }

    contarInimigosAtivos() {
        return this.enemies.filter((enemy) => !enemy.data.isDead && !enemy.data.isRemoving).length;
    }

    criarHUD() {
        this.hudBg = this.add.rectangle(230, 55, 420, 95, 0x000000, 0.45)
            .setStrokeStyle(2, 0xffffff)
            .setScrollFactor(0)
            .setDepth(9999);

        this.portraitFrame = this.add.circle(80, 55, 28, 0x222222)
            .setStrokeStyle(2, 0xffffff)
            .setScrollFactor(0)
            .setDepth(9999);

        this.portrait = this.add.image(80, 55, "heroPortrait")
            .setScrollFactor(0)
            .setDepth(10000);

        this.ajustarPortrait(this.portrait, 52, 52);

        this.nomeHud = this.add.text(120, 25, "Leona", {
            fontSize: "24px",
            color: "#ffffff",
            fontStyle: "bold"
        }).setScrollFactor(0).setDepth(10000);

        this.hpBarBg = this.add.graphics().setScrollFactor(0).setDepth(10000);
        this.hpBarFill = this.add.graphics().setScrollFactor(0).setDepth(10000);

        this.hpText = this.add.text(120, 80, "", {
            fontSize: "20px",
            color: "#ffffff"
        }).setScrollFactor(0).setDepth(10000);

        this.infoText = this.add.text(
            610,
            25,
            "Mover: WASD/Setas | J: combo | K: voadora",
            {
                fontSize: "18px",
                color: "#ffffff"
            }
        ).setScrollFactor(0).setDepth(10000);

        this.atualizarHUD();
    }

    criarAnimacoes() {
        if (!this.anims.exists("leona_idle")) {
            this.anims.create({
                key: "leona_idle",
                frames: [{ key: "leona_idle" }],
                frameRate: 1,
                repeat: -1
            });
        }

        if (!this.anims.exists("leona_walk")) {
            this.anims.create({
                key: "leona_walk",
                frames: [
                    { key: "leona_walk1" },
                    { key: "leona_walk2" },
                    { key: "leona_walk3" },
                    { key: "leona_walk4" },
                    { key: "leona_walk5" }
                ],
                frameRate: 10,
                repeat: -1
            });
        }

        if (!this.anims.exists("leona_death")) {
            this.anims.create({
                key: "leona_death",
                frames: [
                    { key: "leona_death1" },
                    { key: "leona_death2" }
                ],
                frameRate: 4,
                repeat: 0
            });
        }

        if (!this.anims.exists("enemy_idle")) {
            this.anims.create({
                key: "enemy_idle",
                frames: [{ key: "enemy_idle" }],
                frameRate: 1,
                repeat: -1
            });
        }

        if (!this.anims.exists("enemy_walk")) {
            this.anims.create({
                key: "enemy_walk",
                frames: [
                    { key: "enemy_walk1" },
                    { key: "enemy_walk2" },
                    { key: "enemy_walk3" },
                    { key: "enemy_walk4" },
                    { key: "enemy_walk5" },
                    { key: "enemy_walk6" }
                ],
                frameRate: 10,
                repeat: -1
            });
        }

        if (!this.anims.exists("enemy_death")) {
            this.anims.create({
                key: "enemy_death",
                frames: [
                    { key: "enemy_death1" },
                    { key: "enemy_death2" }
                ],
                frameRate: 5,
                repeat: 0
            });
        }
    }

    atualizarPlayer() {
        if (this.isDead) {
            this.player.setVelocity(0, 0);
            return;
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.J)) {
            if (this.isPunching) {
                if (this.comboStep + this.punchBuffer < this.maxCombo) {
                    this.punchBuffer++;
                }
                return;
            }

            if (!this.inAction) {
                this.iniciarCombo();
                return;
            }
        }

        if (this.inAction) {
            this.player.setVelocity(0, 0);
            return;
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.K)) {
            this.voadora();
            return;
        }

        this.movimentarPlayer();
    }

    movimentarPlayer() {
        const velocidade = 220;
        let vx = 0;
        let vy = 0;

        const esquerda = this.cursors.left.isDown || this.keys.A.isDown;
        const direita = this.cursors.right.isDown || this.keys.D.isDown;
        const cima = this.cursors.up.isDown || this.keys.W.isDown;
        const baixo = this.cursors.down.isDown || this.keys.S.isDown;

        if (esquerda) vx = -velocidade;
        if (direita) vx = velocidade;
        if (cima) vy = -velocidade;
        if (baixo) vy = velocidade;

        if (vx !== 0 && vy !== 0) {
            vx *= 0.7071;
            vy *= 0.7071;
        }

        this.player.setVelocity(vx, vy);

        if (vx < 0) this.player.setFlipX(true);
        if (vx > 0) this.player.setFlipX(false);

        const moving = vx !== 0 || vy !== 0;

        if (moving) {
            if (this.player.anims.currentAnim?.key !== "leona_walk") {
                this.player.play("leona_walk", true);
            }
        } else {
            if (this.player.anims.currentAnim?.key !== "leona_idle") {
                this.player.play("leona_idle", true);
            }
        }

        if (this.player.y < 560) this.player.y = 560;
        if (this.player.y > 650) this.player.y = 650;
    }

    iniciarCombo() {
        this.comboStep = 1;
        this.punchBuffer = 0;
        this.executarPunch(this.comboStep);
    }

    executarPunch(step) {
        this.inAction = true;
        this.isPunching = true;

        this.player.setVelocity(0, 0);
        this.player.anims.stop();
        this.player.setTexture(`leona_punch${step}`);
        this.ajustarEscalaSprite(this.player, this.alturaPlayer);

        this.tocarSom(this.sfxPunch, true);

        const dano = step === 1 ? 10 : step === 2 ? 12 : 16;
        const alcanceX = step === 3 ? 110 : 90;
        const alcanceY = 55;

        let duracao = 180;
        if (step === 3) duracao = 210;

        this.time.delayedCall(55, () => {
            this.tentarAcertarInimigos(dano, alcanceX, alcanceY);
        });

        this.time.delayedCall(duracao, () => {
            if (this.punchBuffer > 0 && this.comboStep < this.maxCombo) {
                this.punchBuffer--;
                this.comboStep++;
                this.executarPunch(this.comboStep);
            } else {
                this.encerrarCombo();
            }
        });
    }

    encerrarCombo() {
        this.inAction = false;
        this.isPunching = false;
        this.comboStep = 0;
        this.punchBuffer = 0;

        if (!this.isDead) {
            this.player.play("leona_idle", true);
            this.ajustarEscalaSprite(this.player, this.alturaPlayer);
        }
    }

    voadora() {
        this.inAction = true;
        this.isPunching = false;
        this.comboStep = 0;
        this.punchBuffer = 0;

        this.player.setVelocity(0, 0);
        this.player.anims.stop();
        this.player.setTexture("leona_kick");
        this.ajustarEscalaSprite(this.player, this.alturaPlayer);

        this.tocarSom(this.sfxKick, true);

        this.time.delayedCall(50, () => {
            this.tentarAcertarInimigos(20, 120, 60);
        });

        this.time.delayedCall(240, () => {
            if (!this.isDead) {
                this.inAction = false;
                this.player.play("leona_idle", true);
                this.ajustarEscalaSprite(this.player, this.alturaPlayer);
            }
        });
    }

    tentarAcertarInimigos(dano, alcanceX, alcanceY) {
        const inimigosVivos = this.enemies.filter(
            (enemy) => !enemy.data.isDead && !enemy.data.isRemoving
        );

        inimigosVivos.forEach((enemy) => {
            const dx = enemy.sprite.x - this.player.x;
            const dy = Math.abs(enemy.sprite.y - this.player.y);

            let acertouNaFrente = false;

            if (this.player.flipX) {
                acertouNaFrente = dx < 0 && Math.abs(dx) <= alcanceX;
            } else {
                acertouNaFrente = dx > 0 && dx <= alcanceX;
            }

            if (acertouNaFrente && dy <= alcanceY) {
                this.danoNoInimigo(enemy, dano);
            }
        });
    }

    atualizarInimigos() {
        this.enemies.forEach((enemy) => {
            this.atualizarInimigo(enemy);
        });
    }

    atualizarInimigo(enemy) {
        const sprite = enemy.sprite;
        const data = enemy.data;

        if (!sprite || data.isDead || data.isRemoving) {
            if (sprite?.body) sprite.body.setVelocity(0, 0);
            return;
        }

        if (this.isDead) {
            sprite.body.setVelocity(0, 0);
            return;
        }

        if (data.isAttacking || data.isHurt) {
            sprite.body.setVelocity(0, 0);
            return;
        }

        const dx = this.player.x - sprite.x;
        const dy = this.player.y - sprite.y;

        const distanciaX = Math.abs(dx);
        const distanciaY = Math.abs(dy);

        const alcanceAtaqueX = 70;
        const alcanceAtaqueY = 45;

        if (distanciaX <= alcanceAtaqueX && distanciaY <= alcanceAtaqueY) {
            sprite.body.setVelocity(0, 0);

            if (this.time.now > data.lastAttackTime + data.attackCooldown) {
                this.atacarComInimigo(enemy);
            }
            return;
        }

        let vx = 0;
        let vy = 0;

        if (dx < -6) vx = -data.speed;
        if (dx > 6) vx = data.speed;
        if (dy < -6) vy = -data.speed * 0.55;
        if (dy > 6) vy = data.speed * 0.55;

        if (vx !== 0 && vy !== 0) {
            vx *= 0.7071;
            vy *= 0.7071;
        }

        sprite.body.setVelocity(vx, vy);

        if (vx < 0) sprite.setFlipX(true);
        if (vx > 0) sprite.setFlipX(false);

        const moving = vx !== 0 || vy !== 0;

        if (moving) {
            if (sprite.anims.currentAnim?.key !== "enemy_walk") {
                sprite.play("enemy_walk", true);
            }
        } else {
            if (sprite.anims.currentAnim?.key !== "enemy_idle") {
                sprite.play("enemy_idle", true);
            }
        }

        if (sprite.y < 560) sprite.y = 560;
        if (sprite.y > 650) sprite.y = 650;
    }

    atacarComInimigo(enemy) {
        const sprite = enemy.sprite;
        const data = enemy.data;

        if (data.isDead || data.isRemoving || data.isAttacking || data.isHurt || this.isDead) return;

        data.isAttacking = true;
        data.lastAttackTime = this.time.now;

        sprite.body.setVelocity(0, 0);
        sprite.anims.stop();
        sprite.setTexture("enemy_punch1");
        this.ajustarEscalaSprite(sprite, this.alturaEnemy);

        this.time.delayedCall(90, () => {
            if (!data.isDead && !data.isRemoving && data.isAttacking) {
                sprite.setTexture("enemy_punch2");
                this.ajustarEscalaSprite(sprite, this.alturaEnemy);
            }
        });

        this.time.delayedCall(170, () => {
            if (!data.isDead && !data.isRemoving && data.isAttacking) {
                sprite.setTexture("enemy_punch3");
                this.ajustarEscalaSprite(sprite, this.alturaEnemy);
            }
        });

        this.time.delayedCall(175, () => {
            if (data.isDead || data.isRemoving || this.isDead || this.levelComplete) return;

            const dx = Math.abs(this.player.x - sprite.x);
            const dy = Math.abs(this.player.y - sprite.y);

            if (dx <= 80 && dy <= 50) {
                this.tomarDano(8);
            }
        });

        this.time.delayedCall(320, () => {
            if (!data.isDead && !data.isRemoving) {
                data.isAttacking = false;
                sprite.play("enemy_idle", true);
                this.ajustarEscalaSprite(sprite, this.alturaEnemy);
            }
        });
    }

    danoNoInimigo(enemy, valor) {
        const sprite = enemy.sprite;
        const data = enemy.data;

        if (data.isDead || data.isRemoving) return;

        data.currentHp -= valor;
        if (data.currentHp < 0) {
            data.currentHp = 0;
        }

        data.isHurt = true;
        data.isAttacking = false;
        sprite.body.setVelocity(0, 0);
        sprite.anims.stop();
        sprite.setTexture("enemy_damage");
        this.ajustarEscalaSprite(sprite, this.alturaEnemy);

        const empurrao = this.player.flipX ? -25 : 25;
        sprite.x += empurrao;

        if (data.currentHp <= 0) {
            this.morrerInimigo(enemy);
            return;
        }

        this.time.delayedCall(140, () => {
            if (!data.isDead && !data.isRemoving) {
                data.isHurt = false;
                sprite.play("enemy_idle", true);
                this.ajustarEscalaSprite(sprite, this.alturaEnemy);
            }
        });
    }

    morrerInimigo(enemy) {
        const sprite = enemy.sprite;
        const data = enemy.data;

        if (data.isDead || data.isRemoving) return;

        data.isDead = true;
        data.isAttacking = false;
        data.isHurt = false;
        data.isRemoving = true;

        sprite.body.setVelocity(0, 0);
        sprite.play("enemy_death", true);
        this.ajustarEscalaSprite(sprite, this.alturaEnemy);

        this.enemiesDefeated++;

        this.time.delayedCall(500, () => {
            if (enemy.hpBg) enemy.hpBg.clear();
            if (enemy.hpFill) enemy.hpFill.clear();

            enemy.hpBg?.destroy();
            enemy.hpFill?.destroy();
            sprite.destroy();

            this.enemies = this.enemies.filter((e) => e !== enemy);
        });
    }

    tomarDano(valor) {
        if (this.isDead || this.levelComplete) return;

        this.currentHp -= valor;
        if (this.currentHp < 0) this.currentHp = 0;

        this.atualizarHUD();
        this.tocarSom(this.sfxHurt, true);

        if (this.currentHp <= 0) {
            this.morrer();
            return;
        }

        this.inAction = true;
        this.isPunching = false;
        this.comboStep = 0;
        this.punchBuffer = 0;

        this.player.setVelocity(0, 0);
        this.player.anims.stop();
        this.player.setTexture("leona_damage");
        this.ajustarEscalaSprite(this.player, this.alturaPlayer);

        this.time.delayedCall(180, () => {
            if (!this.isDead) {
                this.inAction = false;
                this.player.play("leona_idle", true);
                this.ajustarEscalaSprite(this.player, this.alturaPlayer);
            }
        });
    }

    morrer() {
        if (this.isDead || this.isGameEnding) return;

        this.isDead = true;
        this.inAction = true;
        this.isPunching = false;
        this.comboStep = 0;
        this.punchBuffer = 0;

        this.player.setVelocity(0, 0);
        this.player.play("leona_death", true);
        this.ajustarEscalaSprite(this.player, this.alturaPlayer);

        if (!this.playerDeathPlayed) {
            this.playerDeathPlayed = true;
            this.tocarSom(this.sfxDeath, true);
        }

        this.time.delayedCall(1800, () => {
            this.concluirDerrota();
        });
    }

    verificarFimDaFase() {
        if (this.isGameEnding) return;

        const todosSpawnados = this.spawnedEnemies >= this.totalEnemiesToSpawn;
        const vivos = this.contarInimigosAtivos();

        if (todosSpawnados && vivos === 0) {
            this.concluirVitoria();
        }
    }

    concluirVitoria() {
        if (this.isGameEnding) return;

        this.isGameEnding = true;
        this.levelComplete = true;

        if (this.enemySpawnEvent) {
            this.enemySpawnEvent.remove(false);
            this.enemySpawnEvent = null;
        }

        if (this.phaseMusic?.isPlaying) {
            this.phaseMusic.stop();
        }

        this.tocarSom(this.sfxVictory, true);
        this.mostrarMensagemFinal("FASE CONCLUÍDA!", "Voltando para a tela inicial...");

        this.time.delayedCall(2600, () => {
            this.scene.start("Start");
        });
    }

    concluirDerrota() {
        if (this.isGameEnding) return;

        this.isGameEnding = true;
        this.levelComplete = true;

        if (this.enemySpawnEvent) {
            this.enemySpawnEvent.remove(false);
            this.enemySpawnEvent = null;
        }

        if (this.phaseMusic?.isPlaying) {
            this.phaseMusic.stop();
        }

        this.mostrarMensagemFinal("VOCÊ FOI DERROTADA!", "Voltando para a tela inicial...");

        this.time.delayedCall(2600, () => {
            this.scene.start("Start");
        });
    }

    organizarProfundidade() {
        if (this.player) {
            this.player.setDepth(this.player.y);
        }

        this.enemies.forEach((enemy) => {
            if (enemy.sprite && enemy.sprite.active) {
                enemy.sprite.setDepth(enemy.sprite.y);
            }
        });
    }

    atualizarHUD() {
        const x = 120;
        const y = 50;
        const largura = 280;
        const altura = 22;

        this.hpBarBg.clear();
        this.hpBarBg.fillStyle(0x222222, 1);
        this.hpBarBg.fillRoundedRect(x, y, largura, altura, 8);
        this.hpBarBg.lineStyle(2, 0xffffff, 1);
        this.hpBarBg.strokeRoundedRect(x, y, largura, altura, 8);

        this.hpBarFill.clear();
        this.hpBarFill.fillStyle(0xff3b30, 1);
        this.hpBarFill.fillRoundedRect(
            x + 3,
            y + 3,
            (largura - 6) * (this.currentHp / this.maxHp),
            altura - 6,
            6
        );

        this.hpText.setText(`${this.currentHp} / ${this.maxHp}`);
    }

    atualizarHUDInimigos() {
        this.enemies.forEach((enemy) => {
            enemy.hpBg.clear();
            enemy.hpFill.clear();

            if (enemy.data.isDead || enemy.data.isRemoving || !enemy.sprite.active) {
                return;
            }

            const largura = 60;
            const altura = 8;
            const x = enemy.sprite.x - largura / 2;
            const y = enemy.sprite.y - 115;

            enemy.hpBg.fillStyle(0x000000, 0.8);
            enemy.hpBg.fillRect(x, y, largura, altura);

            enemy.hpFill.fillStyle(0xff3b30, 1);
            enemy.hpFill.fillRect(
                x + 1,
                y + 1,
                (largura - 2) * (enemy.data.currentHp / enemy.data.maxHp),
                altura - 2
            );
        });
    }

    ajustarEscalaSprite(sprite, alturaAlvo) {
        const alturaOriginal = sprite.frame.height;
        const escala = alturaAlvo / alturaOriginal;
        sprite.setScale(escala);
    }

    ajustarPortrait(img, maxLargura, maxAltura) {
        img.setScale(1);

        const escala = Math.min(
            maxLargura / img.width,
            maxAltura / img.height
        );

        img.setScale(escala);
    }

    finalizarCena() {
        if (this.enemySpawnEvent) {
            this.enemySpawnEvent.remove(false);
            this.enemySpawnEvent = null;
        }

        const audios = [
            this.phaseMusic,
            this.sfxPunch,
            this.sfxKick,
            this.sfxHurt,
            this.sfxDeath,
            this.sfxVictory
        ];

        audios.forEach((audio) => {
            if (audio) {
                audio.stop();
                audio.destroy();
            }
        });

        this.enemies.forEach((enemy) => {
            enemy.hpBg?.destroy();
            enemy.hpFill?.destroy();
            enemy.sprite?.destroy();
        });

        this.phaseMusic = null;
        this.sfxPunch = null;
        this.sfxKick = null;
        this.sfxHurt = null;
        this.sfxDeath = null;
        this.sfxVictory = null;
    }
}