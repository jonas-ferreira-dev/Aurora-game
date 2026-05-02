import { LeonaPlayer } from "../entities/LeonaPlayer.js";
import { StageEnemy } from "../entities/StageEnemy.js";
import { BossPhase1 } from "../entities/BossPhase1.js";

export class Phase1 extends Phaser.Scene {
    constructor() {
        super("Phase1");
    }

    preload() {
        // Fundo principal
        this.load.image("phase1Bg1", "assets/phase1/cenario1.jpg");
        this.load.image("phase1Bg2", "assets/phase1/cenario2.jpg");
        this.load.image("phase1Bg3", "assets/phase1/cenario3.jpg");

        // HUD / Leona
        this.load.image("heroPortrait", "assets/player/portrait.png");

        LeonaPlayer.preload(this);
        StageEnemy.preload(this);

        // Boss
        this.load.image("bossPortrait", "assets/Boss/iconboss1.png");
        BossPhase1.preload(this);

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

        this.load.audio("sfxEnemyDamage", "assets/audio/damage_enemy.mp3");
        this.load.audio("sfxBossDeath", "assets/audio/death_enemy.mp3");

        this.load.audio("sfxVictory", [
            "assets/audio/victory.mp3",
            "assets/audio/victory.ogg"
        ]);
    }

    create() {
        this.worldWidth = 4200;
        this.worldHeight = 720;

        this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);

        this.levelComplete = false;
        this.isGameEnding = false;
        this.retryOpen = false;
        this.playerDeathHandled = false;
        this.combatPausedForRespawn = false;
        this.lastDeathX = null;
        this.lastDeathY = null;
        this.playerDeathPlayed = false;
        this.lastDamageSourceX = null;

        this.alturaPlayer = 180;
        this.alturaEnemy = 165;
        this.alturaBoss = 220;

        this.enemies = [];
        this.boxes = [];
        this.items = [];
        this.boss = null;

        this.currentWaveIndex = -1;
        this.waveActive = false;
        this.currentLimitX = this.worldWidth - 40;

        this.bossIntroStarted = false;
        this.bossIntroActive = false;
        this.bossDialogActive = false;
        this.bossApproachActive = false;
        this.bossIntroIndex = 0;
        this.bossFightStarted = false;
        this.pendingBossConfig = null;
        this.bossDialogos = [];

        this.waveConfigs = [
            {
                tipo: "wave",
                titulo: "BATALHA 1",
                triggerX: 650,
                blockX: 980,
                enemies: [
                    { x: 1020, y: 610 },
                    { x: 1160, y: 635 }
                ],
                boxes: [
                    { x: 930, y: 635 }
                ]
            },
            {
                tipo: "wave",
                titulo: "BATALHA 2",
                triggerX: 1650,
                blockX: 2050,
                enemies: [
                    { x: 2100, y: 590 },
                    { x: 2260, y: 630 }
                ],
                boxes: [
                    { x: 1980, y: 635 }
                ]
            },
            {
                tipo: "wave",
                titulo: "BATALHA 3",
                triggerX: 2650,
                blockX: 3050,
                enemies: [
                    { x: 3110, y: 600 },
                    { x: 3250, y: 635 }
                ],
                boxes: [
                    { x: 2900, y: 635 }
                ]
            },
            {
                tipo: "boss",
                titulo: "EISEN",
                triggerX: 3400,
                blockX: 3800,
                boss: { x: 3920, y: 625 }
            }
        ];

        this.criarTexturasProcedurais();
        this.criarCenario();
        this.criarAnimacoes();
        this.criarPlayer();
        this.criarHUD();
        this.criarMensagens();
        this.criarAudio();

        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        this.cursors = this.input.keyboard.createCursorKeys();
       this.keys = this.input.keyboard.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D,

            J: Phaser.Input.Keyboard.KeyCodes.J,
            K: Phaser.Input.Keyboard.KeyCodes.K,

            SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
            ENTER: Phaser.Input.Keyboard.KeyCodes.ENTER,
            R: Phaser.Input.Keyboard.KeyCodes.R
        });

        this.enterKey = this.keys.ENTER;

        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

        this.events.on("shutdown", this.finalizarCena, this);
        this.events.on("destroy", this.finalizarCena, this);
    }

    update() {

        if (this.levelComplete) {
            this.player.setVelocity(0, 0);
            return;
        }

        if (this.retryOpen) {
            this.atualizarParallax();
            this.pararEntidadesEmIdle();

            const apertouR = this.keys.R && Phaser.Input.Keyboard.JustDown(this.keys.R);
            const apertouEnter = this.keys.ENTER && Phaser.Input.Keyboard.JustDown(this.keys.ENTER);
            const apertouSpace = this.keys.SPACE && Phaser.Input.Keyboard.JustDown(this.keys.SPACE);

            if (apertouR || apertouEnter || apertouSpace) {
                this.retryPlayer();
            }

            this.atualizarHUD();
            this.atualizarHUDInimigos();
            this.atualizarBossHUD();
            this.organizarProfundidade();

            return;
        }

        if (this.combatPausedForRespawn) {
            this.atualizarParallax();
            this.pararEntidadesEmIdle();

            this.atualizarHUD();
            this.atualizarHUDInimigos();
            this.atualizarBossHUD();
            this.organizarProfundidade();

            return;
        }

        if (this.bossIntroActive) {
            this.atualizarParallax();

            this.enemies.forEach((enemy) => {
                if (enemy.sprite?.body) {
                    enemy.sprite.body.setVelocity(0, 0);
                }
            });

            if (this.boss?.sprite?.body) {
                this.boss.sprite.body.setVelocity(0, 0);
            }

            if (this.bossApproachActive) {
                this.atualizarAproximacaoDoBoss();
            } else {
                this.player.setVelocity(0, 0);

                if (Phaser.Input.Keyboard.JustDown(this.enterKey) && this.bossDialogActive) {
                    this.avancarDialogoBoss();
                }
            }

            this.atualizarHUDInimigos();
            this.atualizarBossHUD();
            this.organizarProfundidade();
            return;
        }

        this.atualizarParallax();
        this.verificarGatilhosFase();

        this.atualizarPlayer();
        this.atualizarInimigos();
        this.atualizarBoss();
        this.atualizarItens();

        this.atualizarHUDInimigos();
        this.atualizarBossHUD();
        this.organizarProfundidade();
        this.verificarFimDaFase();
    }

    criarRetryUI() {
            this.retryOverlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.55)
                .setScrollFactor(0)
                .setDepth(20000)
                .setVisible(false);

            this.retryBox = this.add.rectangle(640, 360, 520, 190, 0x111111, 0.9)
                .setStrokeStyle(3, 0xffffff)
                .setScrollFactor(0)
                .setDepth(20001)
                .setVisible(false);

            this.retryTitle = this.add.text(640, 320, "CONTINUAR?", {
                fontSize: "38px",
                color: "#ffffff",
                fontStyle: "bold",
                stroke: "#000000",
                strokeThickness: 5
            })
                .setOrigin(0.5)
                .setScrollFactor(0)
                .setDepth(20002)
                .setVisible(false);

            this.retryHint = this.add.text(640, 380, "Pressione R, ENTER ou SPACE", {
                fontSize: "24px",
                color: "#ffd166",
                fontStyle: "bold"
            })
                .setOrigin(0.5)
                .setScrollFactor(0)
                .setDepth(20002)
                .setVisible(false);
        }

    criarTexturasProcedurais() {
        const g = this.add.graphics();

        if (!this.textures.exists("parallaxClouds")) {
            g.clear();
            g.fillStyle(0xffffff, 0.9);
            g.fillEllipse(80, 50, 90, 36);
            g.fillEllipse(120, 45, 80, 34);
            g.fillEllipse(155, 52, 65, 28);

            g.fillEllipse(310, 80, 100, 40);
            g.fillEllipse(360, 75, 70, 32);
            g.fillEllipse(400, 82, 80, 30);

            g.generateTexture("parallaxClouds", 512, 128);
        }

        if (!this.textures.exists("parallaxSkyline")) {
            g.clear();
            g.fillStyle(0x4d6478, 1);
            g.fillRect(0, 140, 60, 116);
            g.fillRect(70, 110, 90, 146);
            g.fillRect(175, 135, 75, 121);
            g.fillRect(265, 85, 80, 171);
            g.fillRect(360, 120, 55, 136);
            g.fillRect(430, 95, 70, 161);
            g.generateTexture("parallaxSkyline", 512, 256);
        }

        if (!this.textures.exists("crateBox")) {
            g.clear();
            g.fillStyle(0x7a5230, 1);
            g.fillRoundedRect(0, 0, 64, 64, 6);
            g.lineStyle(4, 0x4a2d17, 1);
            g.strokeRoundedRect(0, 0, 64, 64, 6);
            g.lineBetween(10, 10, 54, 54);
            g.lineBetween(54, 10, 10, 54);
            g.lineStyle(2, 0x3d2412, 1);
            g.strokeRect(6, 6, 52, 52);
            g.generateTexture("crateBox", 64, 64);
        }

        if (!this.textures.exists("snackItem")) {
            g.clear();
            g.fillStyle(0xf29e38, 1);
            g.fillEllipse(28, 24, 28, 20);
            g.fillStyle(0xffd8a6, 1);
            g.fillCircle(14, 18, 7);
            g.fillCircle(16, 30, 7);
            g.fillStyle(0x6fbf4b, 1);
            g.fillEllipse(34, 8, 10, 6);
            g.generateTexture("snackItem", 48, 40);
        }

        if (!this.textures.exists("bossPlaceholder")) {
            g.clear();
            g.fillStyle(0x7a0c0c, 1);
            g.fillRoundedRect(0, 0, 150, 160, 12);
            g.lineStyle(6, 0x2a0000, 1);
            g.strokeRoundedRect(0, 0, 150, 160, 12);

            g.fillStyle(0xffffff, 1);
            g.fillRect(28, 42, 28, 18);
            g.fillRect(94, 42, 28, 18);

            g.fillStyle(0x000000, 1);
            g.fillRect(36, 46, 10, 10);
            g.fillRect(102, 46, 10, 10);

            g.lineStyle(6, 0x2a0000, 1);
            g.lineBetween(28, 115, 122, 115);

            g.generateTexture("bossPlaceholder", 150, 160);
        }

        g.destroy();
    }

  criarCenario() {
    this.add.rectangle(0, 0, this.worldWidth, this.worldHeight, 0x9fd7f5)
        .setOrigin(0, 0)
        .setDepth(-50);

    this.parallaxClouds = this.add.tileSprite(640, 120, 1280, 180, "parallaxClouds")
        .setScrollFactor(0)
        .setDepth(-45)
        .setAlpha(0.55);

    this.parallaxSkyline = this.add.tileSprite(640, 220, 1280, 260, "parallaxSkyline")
        .setScrollFactor(0)
        .setDepth(-42)
        .setAlpha(0.35);

    const larguraSegmento = this.worldWidth / 3;

    this.add.image(0, 0, "phase1Bg1")
        .setOrigin(0, 0)
        .setDisplaySize(larguraSegmento, this.worldHeight)
        .setDepth(-30);

    this.add.image(larguraSegmento, 0, "phase1Bg2")
        .setOrigin(0, 0)
        .setDisplaySize(larguraSegmento, this.worldHeight)
        .setDepth(-30);

    this.add.image(larguraSegmento * 2, 0, "phase1Bg3")
        .setOrigin(0, 0)
        .setDisplaySize(larguraSegmento, this.worldHeight)
        .setDepth(-30);

    this.add.rectangle(0, 645, this.worldWidth, 75, 0x2b2b2b, 0.15)
        .setOrigin(0, 0)
        .setDepth(-10);
}

    atualizarParallax() {
        const scrollX = this.cameras.main.scrollX;

        if (this.parallaxClouds) {
            this.parallaxClouds.tilePositionX = scrollX * 0.15;
        }

        if (this.parallaxSkyline) {
            this.parallaxSkyline.tilePositionX = scrollX * 0.35;
        }
    }

  criarAudio() {
    this.phaseMusic = this.sound.add("phaseMusic", {
        volume: 0.35,
        loop: true
    });

    this.sfxPunch = this.sound.add("sfxPunch", { volume: 0.5 });
    this.sfxKick = this.sound.add("sfxKick", { volume: 0.55 });

    this.sfxHurt = this.sound.add("sfxHurt", { volume: 0.6 }); // Leona levando dano
    this.sfxDeath = this.sound.add("sfxDeath", { volume: 0.7 }); // Leona morrendo

    this.sfxEnemyDamage = this.sound.add("sfxEnemyDamage", { volume: 0.6 }); // inimigos/boss levando dano
    this.sfxBossDeath = this.sound.add("sfxBossDeath", { volume: 0.75 }); // boss morrendo

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

        this.waveText = this.add.text(640, 120, "", {
            fontSize: "36px",
            color: "#ffffff",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 6
        }).setOrigin(0.5).setScrollFactor(0).setAlpha(0).setDepth(10000);

        this.dialogBg = this.add.rectangle(640, 585, 1160, 190, 0x000000, 0.78)
            .setStrokeStyle(3, 0xffffff)
            .setScrollFactor(0)
            .setDepth(10020)
            .setVisible(false);

        this.dialogPortraitFrameLeona = this.add.circle(120, 585, 52, 0x1d1d1d)
            .setStrokeStyle(3, 0xffffff)
            .setScrollFactor(0)
            .setDepth(10021)
            .setVisible(false);

        this.dialogPortraitLeona = this.add.image(120, 585, "heroPortrait")
            .setScrollFactor(0)
            .setDepth(10022)
            .setVisible(false);
        this.ajustarPortrait(this.dialogPortraitLeona, 86, 86);

        this.dialogPortraitFrameBoss = this.add.circle(1160, 585, 52, 0x1d1d1d)
            .setStrokeStyle(3, 0xffffff)
            .setScrollFactor(0)
            .setDepth(10021)
            .setVisible(false);

        this.dialogPortraitBoss = this.add.image(1160, 585, "bossPortrait")
            .setScrollFactor(0)
            .setDepth(10022)
            .setVisible(false);
        this.ajustarPortrait(this.dialogPortraitBoss, 92, 92);

        this.dialogNome = this.add.text(205, 520, "", {
            fontSize: "28px",
            color: "#ffd166",
            fontStyle: "bold"
        })
            .setScrollFactor(0)
            .setDepth(10021)
            .setVisible(false);

        this.dialogTexto = this.add.text(205, 555, "", {
            fontSize: "26px",
            color: "#ffffff",
            wordWrap: { width: 840 }
        })
            .setScrollFactor(0)
            .setDepth(10021)
            .setVisible(false);

        this.dialogHint = this.add.text(1095, 650, "ENTER", {
            fontSize: "20px",
            color: "#dddddd",
            fontStyle: "bold"
        })
            .setOrigin(1, 0.5)
            .setScrollFactor(0)
            .setDepth(10021)
            .setVisible(false);

        this.tweens.add({
            targets: this.dialogHint,
            alpha: 0.35,
            duration: 700,
            yoyo: true,
            repeat: -1
        });

        this.criarRetryUI();
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


    onPlayerDead() {
    if (this.playerDeathHandled || this.isGameEnding || this.levelComplete) return;

    this.playerDeathHandled = true;

    this.lastDeathX = this.leona?.sprite?.x ?? this.player?.x ?? this.cameras.main.scrollX + 320;
    this.lastDeathY = this.leona?.getGroundY?.() ?? this.leona?.sprite?.y ?? 610;

    this.time.delayedCall(520, () => {
        this.mostrarRetry();
    });
}

mostrarRetry() {
    this.retryOpen = true;

    this.prepararCombateParaRetry();

    this.retryOverlay?.setVisible(true);
    this.retryBox?.setVisible(true);
    this.retryTitle?.setVisible(true);
    this.retryHint?.setVisible(true);
}

fecharRetry() {
    this.retryOpen = false;

    this.retryOverlay?.setVisible(false);
    this.retryBox?.setVisible(false);
    this.retryTitle?.setVisible(false);
    this.retryHint?.setVisible(false);
}

prepararCombateParaRetry() {
    const now = this.time.now;

    if (this.leona?.sprite) {
        this.tweens.killTweensOf(this.leona.sprite);
        this.leona.sprite.setVelocity(0, 0);
        this.leona.sprite.setAngle(0);
    }

    this.enemies.forEach((enemy) => {
        if (!enemy?.sprite?.active) return;

        this.tweens.killTweensOf(enemy.sprite);
        enemy.sprite.body?.setVelocity(0, 0);

        if (enemy.data) {
            enemy.data.isAttacking = false;
            enemy.data.isHurt = false;
            enemy.data.isBeingThrown = false;
            enemy.data.isReturning = false;
            enemy.data.retreatAfterAttackUntil = now + 700;
        }

        enemy.sprite.play?.("enemy_idle", true);
        enemy.ajustarEscalaSprite?.();
    });

    if (this.boss?.sprite?.active) {
        this.boss.cancelarAtaque?.();

        this.tweens.killTweensOf(this.boss.sprite);
        this.boss.sprite.body?.setVelocity(0, 0);

        if (this.boss.data) {
            this.boss.data.isAttacking = false;
            this.boss.data.isHurt = false;
            this.boss.data.isBeingThrown = false;
            this.boss.data.isReturning = false;
            this.boss.data.hasHitPlayerThisAttack = false;
            this.boss.data.nextAttackAllowedAt = now + 1600;
        }

        this.boss.playIdle?.();
    }
}

pararEntidadesEmIdle() {
    this.enemies.forEach((enemy) => {
        if (!enemy?.sprite?.active) return;

        enemy.sprite.body?.setVelocity(0, 0);

        if (!enemy.data?.isDead && !enemy.data?.isRemoving) {
            enemy.sprite.play?.("enemy_idle", true);
            enemy.ajustarEscalaSprite?.();
        }
    });

    if (this.boss?.sprite?.active) {
        this.boss.sprite.body?.setVelocity(0, 0);

        if (!this.boss.data?.isDead && !this.boss.data?.isRemoving) {
            this.boss.playIdle?.();
        }
    }
}

    retryPlayer() {
        if (!this.retryOpen) return;

        this.fecharRetry();

        this.playerDeathHandled = false;
        this.combatPausedForRespawn = true;

        this.prepararCombateParaRetry();

        const cameraLeft = this.cameras.main.scrollX;
        const cameraRight = cameraLeft + this.cameras.main.width;

        const reviveX = Phaser.Math.Clamp(
            this.lastDeathX ?? cameraLeft + 360,
            cameraLeft + 120,
            Math.min(cameraRight - 120, this.currentLimitX - 40)
        );

        const reviveY = Phaser.Math.Clamp(
            this.lastDeathY ?? 610,
            560,
            650
        );

        this.leona.reset(reviveX, reviveY);
        this.player = this.leona.sprite;

        this.leona.playerIframesUntil = this.time.now + 2300;
        this.leona.playerAttackArmorUntil = this.time.now + 1600;

        this.leona.inAction = true;
        this.leona.isPunching = false;
        this.leona.isJumping = false;
        this.leona.isAirKicking = false;
        this.leona.isBeingShocked = false;

        const startY = reviveY - 330;

        this.leona.sprite.setPosition(reviveX, startY);
        this.leona.sprite.setVelocity(0, 0);
        this.leona.sprite.setAlpha(0);
        this.leona.sprite.setAngle(0);
        this.leona.sprite.anims.stop();
        this.leona.sprite.setTexture("leona_jump");
        this.leona.ajustarEscalaSprite?.();

        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        this.tweens.add({
            targets: this.leona.sprite,
            alpha: 1,
            y: reviveY,
            duration: 620,
            ease: "Quad.In",
            onComplete: () => {
                if (!this.leona?.sprite?.active) return;

                this.leona.sprite.setVelocity(0, 0);
                this.leona.sprite.setAngle(0);
                this.leona.sprite.play("leona_idle", true);
                this.leona.ajustarEscalaSprite?.();

                const impacto = this.add.ellipse(
                    reviveX,
                    reviveY + 4,
                    90,
                    22,
                    0xffffff,
                    0.22
                )
                    .setDepth(reviveY - 2);

                this.tweens.add({
                    targets: impacto,
                    alpha: 0,
                    scaleX: 1.5,
                    scaleY: 0.7,
                    duration: 220,
                    onComplete: () => impacto.destroy()
                });

                this.time.delayedCall(250, () => {
                    this.leona.inAction = false;
                    this.combatPausedForRespawn = false;

                    this.leona.playerIframesUntil = this.time.now + 1300;
                    this.leona.playerAttackArmorUntil = this.time.now + 700;

                    this.atualizarHUD();
                });
            }
        });

        this.atualizarHUD();
    }

    mostrarAvisoFase(texto) {
        this.waveText.setText(texto);
        this.waveText.setAlpha(0);

        this.tweens.add({
            targets: this.waveText,
            alpha: 1,
            duration: 200,
            yoyo: true,
            hold: 800
        });
    }

    criarPlayer() {
        this.leona = new LeonaPlayer(this, 250, 610, {
            worldWidth: this.worldWidth,
            floorTop: 560,
            floorBottom: 650,
            alturaPlayer: 180
        });

        this.player = this.leona.sprite;
        this.events.on("player:dead", this.onPlayerDead, this);
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

        this.bossHudBg = this.add.rectangle(930, 55, 470, 95, 0x000000, 0.45)
            .setStrokeStyle(2, 0xffffff)
            .setScrollFactor(0)
            .setDepth(9999)
            .setVisible(false);

        this.bossNameText = this.add.text(720, 25, "EISEN", {
            fontSize: "24px",
            color: "#ffffff",
            fontStyle: "bold"
        }).setScrollFactor(0).setDepth(10000).setVisible(false);

        this.bossHpBarBg = this.add.graphics().setScrollFactor(0).setDepth(10000);
        this.bossHpBarFill = this.add.graphics().setScrollFactor(0).setDepth(10000);
        this.bossHpText = this.add.text(720, 80, "", {
            fontSize: "20px",
            color: "#ffffff"
        }).setScrollFactor(0).setDepth(10000).setVisible(false);

        this.atualizarHUD();
    }

    criarAnimacoes() {
       
            LeonaPlayer.createAnimations(this);
            StageEnemy.createAnimations(this);
            BossPhase1.createAnimations(this);
    }

    verificarGatilhosFase() {
        if (this.waveActive || this.levelComplete) return;

        const proximaWave = this.waveConfigs[this.currentWaveIndex + 1];
        if (!proximaWave) return;

        if (this.player.x >= proximaWave.triggerX) {
            this.iniciarWave(proximaWave, this.currentWaveIndex + 1);
        }
    }

    iniciarWave(config, index) {
        this.currentWaveIndex = index;
        this.waveActive = true;
        this.currentLimitX = config.blockX;

        if (config.tipo === "wave") {
            this.mostrarAvisoFase(config.titulo);

            config.enemies.forEach((enemyData) => {
                this.spawnEnemy(enemyData.x, enemyData.y);
            });

            if (config.boxes) {
                config.boxes.forEach((boxData) => {
                    this.spawnBox(boxData.x, boxData.y);
                });
            }
        }

        if (config.tipo === "boss") {
            this.pendingBossConfig = config;
            this.iniciarDialogoBoss();
        }
    }

    finalizarWave() {
        this.waveActive = false;
        this.currentLimitX = this.worldWidth - 40;
        this.mostrarAvisoFase("ÁREA LIMPA!");
    }

    iniciarDialogoBoss() {
        if (this.bossIntroStarted || !this.pendingBossConfig) return;

        this.bossIntroStarted = true;
        this.bossIntroActive = true;
        this.bossDialogActive = false;
        this.bossApproachActive = true;
        this.bossIntroIndex = 0;

        this.bossDialogos = [
            {
                nome: "Eisen",
                texto: "Então foi você que abriu caminho até aqui."
            },
            {
                nome: "Leona",
                texto: "Se os seus capangas caíram, o problema agora é você."
            },
            {
                nome: "Eisen",
                texto: "Aurora inteira vai se curvar diante de mim... e você vai servir de exemplo."
            },
            {
                nome: "Leona",
                texto: "Eu já ouvi esse tipo de ameaça antes."
            },
            {
                nome: "Eisen",
                texto: "Ótimo. Então chega de conversa."
            }
        ];

        if (!this.boss) {
            this.spawnBoss(this.pendingBossConfig.boss.x, this.pendingBossConfig.boss.y, false);
        }

        if (this.boss?.sprite) {
            this.boss.sprite.setFlipX(true);
            this.boss.sprite.play("boss_idle", true);
            this.ajustarEscalaSprite(this.boss.sprite, this.alturaBoss);
        }
    }

    atualizarAproximacaoDoBoss() {
        if (!this.boss || !this.boss.sprite?.active) {
            this.bossApproachActive = false;
            this.abrirDialogoBoss();
            return;
        }

        const alvoX = this.boss.sprite.x - 185;
        const alvoY = Phaser.Math.Clamp(this.boss.sprite.y, 590, 640);
        const dx = alvoX - this.player.x;
        const dy = alvoY - this.player.y;
        const distanciaX = Math.abs(dx);
        const distanciaY = Math.abs(dy);

        if (distanciaX <= 12 && distanciaY <= 12) {
            this.player.setVelocity(0, 0);
            this.player.setFlipX(false);
            this.player.play("leona_idle", true);
            this.ajustarEscalaSprite(this.player, this.alturaPlayer);

            this.boss.sprite.setFlipX(true);
            this.boss.sprite.play("boss_idle", true);
            this.ajustarEscalaSprite(this.boss.sprite, this.alturaBoss);

            this.bossApproachActive = false;
            this.abrirDialogoBoss();
            return;
        }

        const velocidadeX = 135;
        const velocidadeY = 70;
        let vx = 0;
        let vy = 0;

        if (dx < -12) vx = -velocidadeX;
        if (dx > 12) vx = velocidadeX;
        if (dy < -10) vy = -velocidadeY;
        if (dy > 10) vy = velocidadeY;

        if (vx !== 0 && vy !== 0) {
            vx *= 0.7071;
            vy *= 0.7071;
        }

        this.player.setVelocity(vx, vy);
        this.player.setFlipX(false);

        if (this.player.anims.currentAnim?.key !== "leona_walk") {
            this.player.play("leona_walk", true);
        }

        this.boss.sprite.setFlipX(true);
        if (this.boss.sprite.anims.currentAnim?.key !== "boss_idle") {
            this.boss.sprite.play("boss_idle", true);
        }
    }

    abrirDialogoBoss() {
        this.bossDialogActive = true;

        this.dialogBg.setVisible(true);
        this.dialogPortraitFrameLeona.setVisible(true);
        this.dialogPortraitLeona.setVisible(true);
        this.dialogPortraitFrameBoss.setVisible(true);
        this.dialogPortraitBoss.setVisible(true);
        this.dialogNome.setVisible(true);
        this.dialogTexto.setVisible(true);
        this.dialogHint.setVisible(true);

        this.mostrarDialogoBossAtual();
    }

    mostrarDialogoBossAtual() {
        const fala = this.bossDialogos[this.bossIntroIndex];
        this.dialogNome.setText(fala.nome);
        this.dialogTexto.setText(fala.texto);
        this.atualizarRetratosDialogo(fala.nome);
    }

    atualizarRetratosDialogo(nomeFalante) {
        const leonaFalando = nomeFalante === "Leona";

        this.dialogPortraitLeona.setAlpha(leonaFalando ? 1 : 0.45);
        this.dialogPortraitBoss.setAlpha(leonaFalando ? 0.45 : 1);

        this.dialogPortraitFrameLeona.setStrokeStyle(3, leonaFalando ? 0xffd166 : 0xffffff, 1);
        this.dialogPortraitFrameBoss.setStrokeStyle(3, leonaFalando ? 0xffffff : 0xffd166, 1);
    }

    avancarDialogoBoss() {
        this.bossIntroIndex++;

        if (this.bossIntroIndex >= this.bossDialogos.length) {
            this.encerrarDialogoBoss();
            return;
        }

        this.mostrarDialogoBossAtual();
    }

    encerrarDialogoBoss() {
        this.bossIntroActive = false;
        this.bossDialogActive = false;
        this.bossApproachActive = false;

        this.dialogBg.setVisible(false);
        this.dialogPortraitFrameLeona.setVisible(false);
        this.dialogPortraitLeona.setVisible(false);
        this.dialogPortraitFrameBoss.setVisible(false);
        this.dialogPortraitBoss.setVisible(false);
        this.dialogNome.setVisible(false);
        this.dialogTexto.setVisible(false);
        this.dialogHint.setVisible(false);

        this.iniciarLutaBoss();
    }

    iniciarLutaBoss() {
        if (this.bossFightStarted || !this.pendingBossConfig) return;

        this.bossFightStarted = true;

        if (!this.boss) {
            this.spawnBoss(this.pendingBossConfig.boss.x, this.pendingBossConfig.boss.y, true);
        }

        if (this.boss?.sprite?.active) {
            this.boss.sprite.play("boss_idle", true);
            this.ajustarEscalaSprite(this.boss.sprite, this.alturaBoss);
            this.boss.sprite.setFlipX(true);
        }

        this.atualizarBossHUD();
        this.mostrarAvisoFase("BOSS FIGHT!");
    }

   spawnEnemy(x, y, tipo = "light") {
        const enemy = new StageEnemy(this, x, y, tipo, {
            worldWidth: this.worldWidth,
            floorTop: 560,
            floorBottom: 650,
            alturaEnemy: this.alturaEnemy
        });

        this.enemies.push(enemy);

        return enemy;
    }

    spawnBoss(x, y, exibirHud = false) {
        this.boss = new BossPhase1(this, x, y, {
            worldWidth: this.worldWidth,
            floorTop: 560,
            floorBottom: 650,
            alturaBoss: this.alturaBoss
        });

        this.bossHudBg.setVisible(exibirHud);
        this.bossNameText.setVisible(exibirHud);
        this.bossHpText.setVisible(exibirHud);

        return this.boss;
    }

    spawnBox(x, y) {
        const sprite = this.add.image(x, y, "crateBox").setOrigin(0.5, 1);

        const box = {
            sprite,
            hp: 20,
            destroyed: false,
            data: {
                isDead: false,
                isRemoving: false,
                isBeingThrown: false,
                isReturning: false
            },
            receberDano: (valor) => {
                this.danoNaCaixa(box, valor);
                return true;
            }
        };

        this.boxes.push(box);
    }

    spawnHealthItem(x, groundY, mode = "rise") {
        const sprite = this.add.image(x, mode === "fall" ? -30 : groundY + 10, "snackItem")
            .setOrigin(0.5, 1);

        const item = {
            sprite,
            heal: 25,
            picked: false,
            tween: null
        };

        this.items.push(item);

        if (mode === "fall") {
            this.tweens.add({
                targets: sprite,
                y: groundY,
                duration: 500,
                ease: "Bounce.Out",
                onComplete: () => {
                    this.iniciarBalancoDoItem(item);
                }
            });
        } else {
            this.tweens.add({
                targets: sprite,
                y: groundY - 25,
                duration: 260,
                ease: "Back.Out",
                onComplete: () => {
                    this.iniciarBalancoDoItem(item);
                }
            });
        }
    }

    iniciarBalancoDoItem(item) {
        if (!item || item.picked || !item.sprite.active) return;

        item.tween = this.tweens.add({
            targets: item.sprite,
            y: item.sprite.y - 8,
            duration: 650,
            yoyo: true,
            repeat: -1
        });
    }

    atualizarItens() {
        this.items.forEach((item) => {
            if (item.picked || !item.sprite.active) return;

            const dx = Math.abs(this.player.x - item.sprite.x);
            const dy = Math.abs(this.player.y - item.sprite.y);

            if (dx <= 45 && dy <= 50) {
                this.coletarItem(item);
            }
        });

        this.items = this.items.filter((item) => item.sprite && item.sprite.active);
    }

    coletarItem(item) {
        if (!item || item.picked) return;

        item.picked = true;

        if (item.tween) {
            item.tween.stop();
        }

        if (this.leona) {
            this.leona.currentHp += item.heal;

            if (this.leona.currentHp > this.leona.maxHp) {
                this.leona.currentHp = this.leona.maxHp;
            }
        }

        this.atualizarHUD();

        this.tweens.add({
            targets: item.sprite,
            alpha: 0,
            scaleX: 1.35,
            scaleY: 1.35,
            duration: 150,
            onComplete: () => {
                item.sprite.destroy();
            }
        });
    }

    atualizarPlayer() {
        if (!this.leona) return;

        const targets = [
            ...this.enemies,
            ...this.boxes,
            this.boss
        ].filter(Boolean);

        this.leona.update(this.cursors, this.keys, targets);

        this.player = this.leona.sprite;
        this.atualizarHUD();
    }

    

    tentarAcertarBoss(dano, alcanceX, alcanceY) {
        if (!this.boss || this.boss.data.isDead) return;

        const dx = this.boss.sprite.x - this.player.x;
        const dy = Math.abs(this.boss.sprite.y - this.player.y);

        let acertouNaFrente = false;

        if (this.player.flipX) {
            acertouNaFrente = dx < 0 && Math.abs(dx) <= alcanceX + 10;
        } else {
            acertouNaFrente = dx > 0 && dx <= alcanceX + 10;
        }

        if (acertouNaFrente && dy <= alcanceY + 10) {
            this.danoNoBoss(dano);
        }
    }

    tentarAcertarCaixas(dano, alcanceX, alcanceY) {
        const caixasVivas = this.boxes.filter((box) => !box.destroyed);

        caixasVivas.forEach((box) => {
            const dx = box.sprite.x - this.player.x;
            const dy = Math.abs(box.sprite.y - this.player.y);

            let acertouNaFrente = false;

            if (this.player.flipX) {
                acertouNaFrente = dx < 0 && Math.abs(dx) <= alcanceX;
            } else {
                acertouNaFrente = dx > 0 && dx <= alcanceX;
            }

            if (acertouNaFrente && dy <= alcanceY + 25) {
                this.danoNaCaixa(box, dano);
            }
        });
    }

    danoNaCaixa(box, valor) {
        if (box.destroyed) return;

        box.hp -= valor;

        this.tweens.add({
            targets: box.sprite,
            x: box.sprite.x + (Phaser.Math.Between(0, 1) ? 4 : -4),
            duration: 40,
            yoyo: true
        });

        if (box.hp <= 0) {
            this.destruirCaixa(box);
        }
    }

    destruirCaixa(box) {
        if (box.destroyed) return;

        box.destroyed = true;

        this.tweens.add({
            targets: box.sprite,
            alpha: 0,
            angle: Phaser.Math.Between(-15, 15),
            scaleX: 1.15,
            scaleY: 1.15,
            duration: 180,
            onComplete: () => {
                const itemY = Phaser.Math.Clamp(box.sprite.y - 4, 580, 645);
                this.spawnHealthItem(box.sprite.x, itemY, "rise");
                box.sprite.destroy();
            }
        });

        this.boxes = this.boxes.filter((b) => b !== box);
    }

    atualizarInimigos() {
        this.enemies.forEach((enemy) => {
            enemy.update(this.leona, this.enemies);
        });

        this.enemies = this.enemies.filter((enemy) => {
            return enemy?.sprite?.active;
        });
    }

    calcularSeparacaoInimigos(enemy) {
        let repulsaoX = 0;
        let repulsaoY = 0;

        this.enemies.forEach((other) => {
            if (!other || other === enemy) return;
            if (!other.sprite?.active) return;
            if (other.data.isDead || other.data.isRemoving) return;

            const dx = enemy.sprite.x - other.sprite.x;
            const dy = enemy.sprite.y - other.sprite.y;
            const dist = Math.sqrt((dx * dx) + (dy * dy)) || 0.0001;
            const distanciaMinima = Math.max(
                enemy.data.personalSpace || 64,
                other.data.personalSpace || 64
            );

            if (dist < distanciaMinima) {
                const forca = (distanciaMinima - dist) / distanciaMinima;
                repulsaoX += (dx / dist) * forca * 90;
                repulsaoY += (dy / dist) * forca * 120;
            }
        });

        return { x: repulsaoX, y: repulsaoY };
    }

    atualizarInimigo(enemy) {
    const sprite = enemy.sprite;
    const data = enemy.data;

    if (!sprite || data.isDead || data.isRemoving) {
        if (sprite?.body) sprite.body.setVelocity(0, 0);
        return;
    }

    if (this.leona?.isDead) {
        sprite.body.setVelocity(0, 0);
        return;
    }

    if (data.isAttacking || data.isHurt) {
        sprite.body.setVelocity(0, 0);
        return;
    }

    const alvoX = this.player.x + data.attackOffsetX;
    const alvoY = Phaser.Math.Clamp(this.player.y + data.laneOffsetY, 565, 645);

    const dxPlayer = this.player.x - sprite.x;
    const dyPlayer = this.player.y - sprite.y;

    const dx = alvoX - sprite.x;
    const dy = alvoY - sprite.y;

    const distanciaPlayerX = Math.abs(dxPlayer);
    const distanciaPlayerY = Math.abs(dyPlayer);

    const separacao = this.calcularSeparacaoInimigos(enemy);

    const dentroDoAtaque =
        distanciaPlayerX <= data.attackRangeX &&
        distanciaPlayerY <= data.attackRangeY;

    const pertoDoPlayer =
        distanciaPlayerX <= data.attackRangeX + 42 &&
        distanciaPlayerY <= data.attackRangeY + 30;

    if (dentroDoAtaque) {
        if (this.time.now > data.lastAttackTime + data.attackCooldown && Math.abs(dy) <= 20) {
            sprite.body.setVelocity(0, 0);
            this.atacarComInimigo(enemy);
            return;
        }

        let vx = separacao.x * 1.15;
        let vy = dy * 1.5 + separacao.y;

        if (Math.abs(dxPlayer) > 28) {
            vx += dxPlayer > 0 ? 18 : -18;
        }

        vx = Phaser.Math.Clamp(vx, -58, 58);
        vy = Phaser.Math.Clamp(vy, -68, 68);

        sprite.body.setVelocity(vx, vy);

        if (vx < 0) sprite.setFlipX(true);
        if (vx > 0) sprite.setFlipX(false);

        if (Math.abs(vx) > 4 || Math.abs(vy) > 4) {
            if (sprite.anims.currentAnim?.key !== "enemy_walk") {
                sprite.play("enemy_walk", true);
            }
        } else if (sprite.anims.currentAnim?.key !== "enemy_idle") {
            sprite.play("enemy_idle", true);
        }

        if (sprite.y < 560) sprite.y = 560;
        if (sprite.y > 650) sprite.y = 650;
        return;
    }

    let vx = 0;
    let vy = 0;

    if (pertoDoPlayer) {
        if (dx < -6) vx = -data.speed * 1.03;
        if (dx > 6) vx = data.speed * 1.03;
        if (dy < -8) vy = -data.speed * 0.78;
        if (dy > 8) vy = data.speed * 0.78;
    } else {
        if (dx < -8) vx = -data.speed;
        if (dx > 8) vx = data.speed;
        if (dy < -8) vy = -data.speed * 0.68;
        if (dy > 8) vy = data.speed * 0.68;
    }

    vx += separacao.x;
    vy += separacao.y;

    vx = Phaser.Math.Clamp(vx, -data.speed * 1.05, data.speed * 1.05);
    vy = Phaser.Math.Clamp(vy, -data.speed * 0.95, data.speed * 0.95);

    if (vx !== 0 && vy !== 0) {
        vx *= 0.7071;
        vy *= 0.7071;
    }

    sprite.body.setVelocity(vx, vy);

    if (vx < 0) sprite.setFlipX(true);
    if (vx > 0) sprite.setFlipX(false);

    const moving = Math.abs(vx) > 3 || Math.abs(vy) > 3;

    if (moving) {
        if (sprite.anims.currentAnim?.key !== "enemy_walk") {
            sprite.play("enemy_walk", true);
        }
    } else if (sprite.anims.currentAnim?.key !== "enemy_idle") {
        sprite.play("enemy_idle", true);
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

        this.time.delayedCall(70, () => {
            if (!data.isDead && !data.isRemoving && data.isAttacking) {
                sprite.setTexture("enemy_punch2");
                this.ajustarEscalaSprite(sprite, this.alturaEnemy);
            }
        });

        this.time.delayedCall(125, () => {
            if (!data.isDead && !data.isRemoving && data.isAttacking) {
                sprite.setTexture("enemy_punch3");
                this.ajustarEscalaSprite(sprite, this.alturaEnemy);
            }
        });

        this.time.delayedCall(135, () => {
            if (data.isDead || data.isRemoving || this.isDead || this.levelComplete) return;

            const dx = Math.abs(this.player.x - sprite.x);
            const dy = Math.abs(this.player.y - sprite.y);

            if (dx <= (data.attackRangeX || 86) && dy <= (data.attackRangeY || 54)) {
                this.tomarDano(data.damage || 10, sprite.x);
            }
        });

        this.time.delayedCall(250, () => {
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
        this.tocarSom(this.sfxEnemyDamage, true);

        const empurrao = this.player.flipX ? -25 : 25;
        sprite.x += empurrao;

        if (data.currentHp <= 0) {
            this.morrerInimigo(enemy, this.player.x);
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

    morrerInimigo(enemy, origemX = null) {
        const sprite = enemy.sprite;
        const data = enemy.data;

        if (data.isDead || data.isRemoving) return;

        data.isDead = true;
        data.isAttacking = false;
        data.isHurt = false;
        data.isRemoving = true;

        sprite.body.setVelocity(0, 0);
        sprite.anims.stop();
        sprite.setTexture("enemy_damage");
        this.ajustarEscalaSprite(sprite, this.alturaEnemy);

       

        this.aplicarArremessoNaMorte(
            sprite,
            origemX,
            42,
            22,
            14,
            120,
            220,
            () => {
                if (!sprite.active) return;
                sprite.play("enemy_death", true);
                this.ajustarEscalaSprite(sprite, this.alturaEnemy);
            }
        );

        if (Phaser.Math.Between(0, 100) < 28) {
            const dropY = Phaser.Math.Clamp(sprite.y - 8, 580, 640);
            this.spawnHealthItem(sprite.x, dropY, "fall");
        }

        this.time.delayedCall(520, () => {
            enemy.hpBg?.clear();
            enemy.hpFill?.clear();
            enemy.hpBg?.destroy();
            enemy.hpFill?.destroy();
            sprite.destroy();

            this.enemies = this.enemies.filter((e) => e !== enemy);
        });
    }

    atualizarBoss() {
        if (!this.boss || !this.bossFightStarted) return;

        this.boss.update(this.leona, true);
    }


    atacarComBoss() {
    
    if (!this.boss || this.boss.data.isDead || this.leona?.isDead) return;

    const sprite = this.boss.sprite;
    const data = this.boss.data;

    data.isAttacking = true;
    data.lastAttackTime = this.time.now;

    sprite.body.setVelocity(0, 0);
    sprite.anims.stop();
    sprite.setTexture("boss_punch1");
    this.ajustarEscalaSprite(sprite, this.alturaBoss);

    this.tocarSom(this.sfxPunch, true);

    this.time.delayedCall(120, () => {
        if (!this.boss || this.boss.data.isDead || !data.isAttacking) return;

        sprite.setTexture("boss_punch2");
        this.ajustarEscalaSprite(sprite, this.alturaBoss);
    });

    this.time.delayedCall(160, () => {
        if (!this.boss || this.boss.data.isDead || this.leona?.isDead) return;

        const dx = Math.abs(this.player.x - sprite.x);
        const dy = Math.abs(this.player.y - sprite.y);

        if (dx <= data.attackRangeX + 12 && dy <= data.attackRangeY + 8) {
            this.leona?.receberDano(data.damage, sprite.x);
            this.atualizarHUD();
        }
    });

    this.time.delayedCall(300, () => {
        if (this.boss && !this.boss.data.isDead) {
            data.isAttacking = false;
            sprite.play("boss_idle", true);
            this.ajustarEscalaSprite(sprite, this.alturaBoss);
        }
    });
}

    danoNoBoss(valor) {
        if (!this.boss || this.boss.data.isDead) return;

        const sprite = this.boss.sprite;
        const data = this.boss.data;

        data.currentHp -= valor;
        if (data.currentHp < 0) data.currentHp = 0;

        data.isHurt = true;
        data.isAttacking = false;
        sprite.body.setVelocity(0, 0);
        sprite.anims.stop();
        sprite.setTexture("boss_damage");
        this.ajustarEscalaSprite(sprite, this.alturaBoss);
        this.tocarSom(this.sfxEnemyDamage, true);

        const empurrao = this.player.flipX ? -28 : 28;
        sprite.x += empurrao;

        if (data.currentHp <= 0) {
            this.morrerBoss(this.player.x);
            return;
        }

        this.time.delayedCall(180, () => {
            if (this.boss && !this.boss.data.isDead) {
                data.isHurt = false;
                sprite.play("boss_idle", true);
                this.ajustarEscalaSprite(sprite, this.alturaBoss);
            }
        });
    }

    morrerBoss(origemX = null) {
        if (!this.boss || this.boss.data.isDead) return;

        const sprite = this.boss.sprite;
        const data = this.boss.data;

        data.isDead = true;
        data.isAttacking = false;
        data.isHurt = false;

        sprite.body.setVelocity(0, 0);
        sprite.anims.stop();
        sprite.setTexture("boss_damage");
        this.ajustarEscalaSprite(sprite, this.alturaBoss);
        

        this.aplicarArremessoNaMorte(
            sprite,
            origemX,
            54,
            26,
            16,
            140,
            260,
            () => {
                if (!sprite.active) return;
                sprite.play("boss_death", true);
                this.ajustarEscalaSprite(sprite, this.alturaBoss);
                this.tocarSom(this.sfxBossDeath, true);
            }
        );

        this.tweens.add({
            targets: sprite,
            alpha: 0.8,
            duration: 450
        });
    }

   


    verificarFimDaFase() {
        if (this.isGameEnding || !this.waveActive) return;

        const configAtual = this.waveConfigs[this.currentWaveIndex];
        if (!configAtual) return;

        if (configAtual.tipo === "wave") {
            const vivos = this.enemies.filter(
                (enemy) => !enemy.data.isDead && !enemy.data.isRemoving
            ).length;

            if (vivos === 0) {
                this.finalizarWave();
            }
        }

        if (configAtual.tipo === "boss") {
            if (this.bossFightStarted && this.boss && this.boss.data.isDead) {
                this.concluirVitoria();
            }
        }
    }

    concluirVitoria() {
        if (this.isGameEnding) return;

        this.isGameEnding = true;
        this.levelComplete = true;

        if (this.phaseMusic?.isPlaying) {
            this.phaseMusic.stop();
        }

        this.tocarSom(this.sfxVictory, true);
        this.mostrarMensagemFinal("FASE 1 CONCLUÍDA!", "Indo para a proxima fase..");

        this.time.delayedCall(2600, () => {
            this.scene.start("Phase2");
        });
    }

    concluirDerrota() {
        if (this.isGameEnding) return;

        this.isGameEnding = true;
        this.levelComplete = true;

        if (this.phaseMusic?.isPlaying) {
            this.phaseMusic.stop();
        }

        this.mostrarMensagemFinal("VOCÊ FOI DERROTADA!", "Voltando para a tela inicial...");

        this.time.delayedCall(2600, () => {
            this.scene.start("Start");
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
        const hpAtual = this.leona?.currentHp ?? 100;
        const hpMax = this.leona?.maxHp ?? 100;

        this.hpBarFill.fillRoundedRect(
            x + 3,
            y + 3,
            (largura - 6) * (hpAtual / hpMax),
            altura - 6,
            6
        );

        this.hpText.setText(`${hpAtual} / ${hpMax}`);
    }

    atualizarHUDInimigos() {
    this.enemies.forEach((enemy) => {
        if (!enemy.hpBg || !enemy.hpFill) return;

        enemy.hpBg.clear();
        enemy.hpFill.clear();

        if (enemy.data.isDead || enemy.data.isRemoving || !enemy.sprite.active) {
            return;
        }

        const largura = 60;
        const altura = 8;

        const bounds = enemy.sprite.getBounds();
        const x = enemy.sprite.x - largura / 2;
        const y = bounds.top - 14;

        enemy.hpBg.setDepth(enemy.sprite.y + 20);
        enemy.hpFill.setDepth(enemy.sprite.y + 21);

        enemy.hpBg.fillStyle(0x000000, 0.85);
        enemy.hpBg.fillRoundedRect(x, y, largura, altura, 3);

        enemy.hpFill.fillStyle(0xff3b30, 1);
        enemy.hpFill.fillRoundedRect(
            x + 1,
            y + 1,
            (largura - 2) * (enemy.data.currentHp / enemy.data.maxHp),
            altura - 2,
            2
        );
    });
}

    atualizarBossHUD() {
        this.bossHpBarBg.clear();
        this.bossHpBarFill.clear();

        if (!this.boss || this.boss.data.isDead || !this.bossFightStarted) {
            this.bossHudBg.setVisible(false);
            this.bossNameText.setVisible(false);
            this.bossHpText.setVisible(false);
            return;
        }

        this.bossHudBg.setVisible(true);
        this.bossNameText.setVisible(true);
        this.bossHpText.setVisible(true);

        const x = 720;
        const y = 50;
        const largura = 260;
        const altura = 22;

        this.bossHpBarBg.fillStyle(0x222222, 1);
        this.bossHpBarBg.fillRoundedRect(x, y, largura, altura, 8);
        this.bossHpBarBg.lineStyle(2, 0xffffff, 1);
        this.bossHpBarBg.strokeRoundedRect(x, y, largura, altura, 8);

        this.bossHpBarFill.fillStyle(0xb30000, 1);
        this.bossHpBarFill.fillRoundedRect(
            x + 3,
            y + 3,
            (largura - 6) * (this.boss.data.currentHp / this.boss.data.maxHp),
            altura - 6,
            6
        );

        this.bossHpText.setText(`${this.boss.data.currentHp} / ${this.boss.data.maxHp}`);
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

        if (this.boss && this.boss.sprite && this.boss.sprite.active) {
            this.boss.sprite.setDepth(this.boss.sprite.y);
        }

        this.boxes.forEach((box) => {
            if (box.sprite && box.sprite.active) {
                box.sprite.setDepth(box.sprite.y);
            }
        });

        this.items.forEach((item) => {
            if (item.sprite && item.sprite.active) {
                item.sprite.setDepth(item.sprite.y + 3);
            }
        });
    }

    ajustarEscalaSprite(sprite, alturaAlvo) {
        const alturaOriginal = sprite.frame.height;
        const escala = alturaAlvo / alturaOriginal;
        sprite.setScale(escala);
    }

    aplicarArremessoNaMorte(sprite, origemX, distanciaX, subidaY, quedaY, duracaoSubida, duracaoQueda, onQuedaComeca = null) {
        if (!sprite || !sprite.active) return;

        const xBase = sprite.x;
        const yBase = sprite.y;
        const origemGolpe = origemX !== null ? origemX : xBase - 40;
        const direcaoEmpurrao = origemGolpe < xBase ? 1 : -1;

        this.tweens.killTweensOf(sprite);

        this.tweens.add({
            targets: sprite,
            x: xBase + (direcaoEmpurrao * distanciaX),
            y: yBase - subidaY,
            duration: duracaoSubida,
            ease: "Quad.Out",
            onComplete: () => {
                if (!sprite.active) return;

                if (onQuedaComeca) {
                    onQuedaComeca(direcaoEmpurrao);
                }

                this.tweens.add({
                    targets: sprite,
                    x: xBase + (direcaoEmpurrao * (distanciaX + 34)),
                    y: Phaser.Math.Clamp(yBase + quedaY, 600, 650),
                    duration: duracaoQueda,
                    ease: "Quad.In"
                });
            }
        });
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

        this.boxes.forEach((box) => {
            box.sprite?.destroy();
        });

        this.items.forEach((item) => {
            if (item.tween) item.tween.stop();
            item.sprite?.destroy();
        });

        if (this.boss) {
            this.boss.sprite?.destroy();
            this.boss = null;
        }

        this.phaseMusic = null;
        this.sfxPunch = null;
        this.sfxKick = null;
        this.sfxHurt = null;
        this.sfxDeath = null;
        this.sfxVictory = null;
    }
}