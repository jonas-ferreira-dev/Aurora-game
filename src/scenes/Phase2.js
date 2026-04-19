export class Phase2 extends Phaser.Scene {
    constructor() {
        super("Phase2");
    }

    preload() {
        // Cenário da fase 2
        this.load.image("phase2_layer1", "assets/phase2/layer1.jpg");
        this.load.image("phase2_layer2", "assets/phase2/layer2.jpg");
        this.load.image("phase2_layer3", "assets/phase2/layer3.jpg");
        this.load.image("phase2_layer4", "assets/phase2/layer4.jpg");

        // HUD / Leona
        this.load.image("heroPortrait", "assets/player/portrait.png");
        this.load.image("danielPortrait", "assets/dialog/icon-daniel.png");

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

        // Inimigos (reaproveitando os sprites atuais)
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


        this.load.image("boss2_base", "assets/Boss 2/Base.png");
        this.load.image("boss2_idle", "assets/Boss 2/idle.png");
        this.load.image("boss2_attack", "assets/Boss 2/attack1.png");
        this.load.image("boss2_damage", "assets/Boss 2/damage.png");
        this.load.image("boss2_death1", "assets/Boss 2/death1.png");
        this.load.image("boss2_death2", "assets/Boss 2/death2.png");
        this.load.image("boss2_walk1", "assets/Boss 2/walk1.png");
        this.load.image("boss2_walk2", "assets/Boss 2/walk2.png");
        this.load.image("boss2_walk3", "assets/Boss 2/walk3.png");
        this.load.image("boss2_walk4", "assets/Boss 2/walk4.png");
        this.load.image("boss2_walk5", "assets/Boss 2/walk5.png");
        this.load.image("potrait_kayla", "assets/Boss 2/potrait_kayla.png");

        // Áudios
        this.load.audio("phaseMusic", "assets/audio/phase1.mp3");
        this.load.audio("sfxPunch", "assets/audio/punch.mp3");
        this.load.audio("sfxKick", "assets/audio/kick.mp3");
        this.load.audio("sfxHurt", "assets/audio/hurt.mp3");
        this.load.audio("sfxDeath", "assets/audio/death.mp3");
        this.load.audio("sfxEnemyDamage", "assets/audio/damage_enemy.mp3");
        this.load.audio("sfxVictory", "assets/audio/victory.mp3");
        this.load.audio("sfxDialog", "assets/audio/dialog.mp3");
        this.load.audio("sfxBossDeath", "assets/audio/death_enemy.mp3");
    }

    create() {
        this.worldWidth = 4200;
        this.worldHeight = 720;

        this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);

        this.levelComplete = false;
        this.isGameEnding = false;
        this.playerDeathPlayed = false;
        this.lastDamageSourceX = null;
        this.boardwalkTop = 620;
        this.boardwalkBottom = 690;
        this.boardwalkMid = 668;

        this.alturaPlayer = 212;
        this.alturaEnemy = 196;
        this.alturaBoss = 225;

        this.boss = null;
        this.bossFightStarted = false;
        this.bossIntroStarted = false;
        this.bossIntroActive = false;
        this.bossDialogActive = false;
        this.bossIntroIndex = 0;
        this.pendingBossConfig = null;
        this.bossDialogos = [];

        this.enemies = [];
        this.boxes = [];
        this.items = [];

        this.currentWaveIndex = -1;
        this.waveActive = false;
        this.currentLimitX = this.worldWidth - 40;

        this.introDialogActive = true;
        this.introDialogIndex = 0;
        this.phaseStarted = false;

        this.waveConfigs = [
            {
                titulo: "BATALHA 1",
                triggerX: 560,
                blockX: 980,
                enemies: [
                    { x: 1030, y: 610, tipo: "light" },
                    { x: 1170, y: 635, tipo: "light" }
                ],
                boxes: [
                    { x: 920, y: 635 }
                ]
            },
            {
                titulo: "BATALHA 2",
                triggerX: 1500,
                blockX: 1980,
                enemies: [
                    { x: 2050, y: 600, tipo: "light" },
                    { x: 2190, y: 630, tipo: "heavy" },
                    { x: 2340, y: 590, tipo: "light" }
                ],
                boxes: [
                    { x: 1910, y: 635 }
                ]
            },
            {
                titulo: "BATALHA 3",
                triggerX: 2600,
                blockX: 3120,
                enemies: [
                    { x: 3200, y: 600, tipo: "heavy" },
                    { x: 3340, y: 635, tipo: "light" },
                    { x: 3480, y: 590, tipo: "light" }
                ],
                boxes: [
                    { x: 3010, y: 635 }
                ]
            },
            
            {
                tipo: "boss",
                titulo: "KAYLA",
                triggerX: 3550,
                blockX: 4040,
                boss: { x: 4130, y: 680 }
            }
            
        ];

        this.criarTexturasProcedurais();
        this.criarCenario();
        this.criarAnimacoes();
        this.criarPlayer();
        this.criarHUD();
        this.criarMensagens();
        this.criarAudio();

       this.dialogosIniciais = [
        {
            nome: "Daniel",
            texto: "Leona, achei outra rota da Aurora. Eles tomaram conta da praia."
        },
        {
            nome: "Leona",
            texto: "Praia? Esses caras perderam completamente a noção."
        },
        {
            nome: "Daniel",
            texto: "Não é passeio. Tem capanga espalhado pelo calçadão inteiro."
        },
        {
            nome: "Leona",
            texto: "Ótimo. Então eu limpo a praia e sigo até o píer."
        },
        {
            nome: "Daniel",
            texto: "Fica esperta. Parece que eles já estavam esperando por você."
        },
        {
            nome: "Leona",
            texto: "Melhor ainda. Assim eu não preciso procurar."
        }
    ];

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

        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

        this.iniciarDialogoInicial();

        this.events.on("shutdown", this.finalizarCena, this);
        this.events.on("destroy", this.finalizarCena, this);
    }

    update() {
        if (this.levelComplete) {
            this.player.setVelocity(0, 0);
            return;
        }

        if (this.bossIntroActive) {
            this.atualizarParallax();

            this.player.setVelocity(0, 0);
            if (this.player.anims.currentAnim?.key !== "leona_idle") {
                this.player.play("leona_idle", true);
                this.ajustarEscalaSprite(this.player, this.alturaPlayer);
            }

            this.enemies.forEach((enemy) => {
                if (enemy.sprite?.body) {
                    enemy.sprite.body.setVelocity(0, 0);
                    if (enemy.sprite.anims.currentAnim?.key !== "enemy_idle") {
                        enemy.sprite.play("enemy_idle", true);
                        this.ajustarEscalaSprite(enemy.sprite, enemy.data.altura);
                    }
                }
            });

            if (this.boss?.sprite?.body) {
                this.boss.sprite.body.setVelocity(0, 0);
                if (this.boss.sprite.anims.currentAnim?.key !== "boss2_idle") {
                    this.boss.sprite.play("boss2_idle", true);
                    this.ajustarEscalaSprite(this.boss.sprite, this.alturaBoss);
                }
            }

            if (Phaser.Input.Keyboard.JustDown(this.enterKey) && this.bossDialogActive) {
                this.avancarDialogoBoss();
            }

            this.atualizarHUDInimigos();
            this.atualizarBossHUD();
            this.organizarProfundidade();
            return;
        }

        this.atualizarParallax();

        if (this.introDialogActive) {
            this.player.setVelocity(0, 0);

            this.enemies.forEach((enemy) => {
                if (enemy.sprite?.body) {
                    enemy.sprite.body.setVelocity(0, 0);
                }
            });

            if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
                this.avancarDialogoInicial();
            }

            this.organizarProfundidade();
            return;
        }

        this.verificarGatilhosFase();

        this.atualizarPlayer();
        this.atualizarInimigos();
        this.atualizarItens();
        this.atualizarBoss();
        this.atualizarBossHUD();
        this.atualizarHUDInimigos();
        this.organizarProfundidade();
        this.verificarFimDaFase();

    }

    criarTexturasProcedurais() {
        const g = this.add.graphics();

        if (!this.textures.exists("crateBox")) {
            g.clear();
            g.fillStyle(0x8a5a33, 1);
            g.fillRoundedRect(0, 0, 64, 64, 6);
            g.lineStyle(4, 0x523217, 1);
            g.strokeRoundedRect(0, 0, 64, 64, 6);
            g.lineBetween(10, 10, 54, 54);
            g.lineBetween(54, 10, 10, 54);
            g.lineStyle(2, 0x3f2410, 1);
            g.strokeRect(6, 6, 52, 52);
            g.generateTexture("crateBox", 64, 64);
        }

        if (!this.textures.exists("snackItem")) {
            g.clear();
            g.fillStyle(0x54c7ec, 1);
            g.fillRoundedRect(0, 0, 26, 52, 8);
            g.fillStyle(0xffffff, 1);
            g.fillRect(6, 8, 14, 24);
            g.fillStyle(0x2ecc71, 1);
            g.fillRect(6, 34, 14, 8);
            g.generateTexture("snackItem", 32, 56);
        }

        if (!this.textures.exists("danielPortrait")) {
            g.clear();
            g.fillStyle(0x1f2a44, 1);
            g.fillCircle(40, 40, 40);

            g.fillStyle(0xf2c29b, 1);
            g.fillCircle(40, 34, 20);

            g.fillStyle(0x3b2a1d, 1);
            g.fillRoundedRect(20, 18, 40, 12, 5);
            g.fillRoundedRect(25, 42, 30, 12, 5);

            g.fillStyle(0xffffff, 1);
            g.fillCircle(33, 34, 3);
            g.fillCircle(47, 34, 3);

            g.fillStyle(0x111111, 1);
            g.fillCircle(33, 34, 1);
            g.fillCircle(47, 34, 1);

            g.fillStyle(0x2e7d32, 1);
            g.fillRoundedRect(26, 56, 28, 14, 4);

            g.generateTexture("danielPortrait", 80, 80);
        }

        g.destroy();
    }

    criarCenario() {
        this.add.rectangle(0, 0, this.worldWidth, this.worldHeight, 0x87ceeb)
            .setOrigin(0, 0)
            .setDepth(-100);

        this.layerSky = this.add.image(-120, 0, "phase2_layer1")
            .setOrigin(0, 0)
            .setDisplaySize(this.worldWidth + 240, 180)
            .setDepth(-60);

        this.layerSea = this.add.image(-90, 170, "phase2_layer2")
            .setOrigin(0, 0)
            .setDisplaySize(this.worldWidth + 180, 150)
            .setDepth(-50);

        this.layerSand = this.add.image(-60, 300, "phase2_layer3")
            .setOrigin(0, 0)
            .setDisplaySize(this.worldWidth + 120, 330)
            .setDepth(-40);

        this.layerWalk = this.add.image(-30, 610, "phase2_layer4")
            .setOrigin(0, 0)
            .setDisplaySize(this.worldWidth + 60, 110)
            .setDepth(-30);

        this.add.rectangle(0, 640, this.worldWidth, 80, 0x000000, 0.06)
            .setOrigin(0, 0)
            .setDepth(-20);
    }

    atualizarParallax() {
        const scrollX = this.cameras.main.scrollX;

        if (this.layerSky) this.layerSky.x = -120 + (scrollX * 0.03);
        if (this.layerSea) this.layerSea.x = -90 + (scrollX * 0.08);
        if (this.layerSand) this.layerSand.x = -60 + (scrollX * 0.14);
        if (this.layerWalk) this.layerWalk.x = -30 + (scrollX * 0.22);
    }

    criarAudio() {
        this.phaseMusic = this.sound.add("phaseMusic", {
            volume: 0.32,
            loop: true
        });

        this.sfxPunch = this.sound.add("sfxPunch", { volume: 0.5 });
        this.sfxKick = this.sound.add("sfxKick", { volume: 0.55 });
        this.sfxHurt = this.sound.add("sfxHurt", { volume: 0.6 });
        this.sfxDeath = this.sound.add("sfxDeath", { volume: 0.7 });
        this.sfxEnemyDamage = this.sound.add("sfxEnemyDamage", { volume: 0.6 });
        this.sfxVictory = this.sound.add("sfxVictory", { volume: 0.8 });
        this.sfxDialog = this.sound.add("sfxDialog", { volume: 0.45 });
        this.sfxBossDeath = this.sound.add("sfxBossDeath", { volume: 0.8 });

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

    this.dialogBg = this.add.rectangle(640, 135, 1160, 150, 0x000000, 0.8)
        .setStrokeStyle(3, 0xffffff)
        .setScrollFactor(0)
        .setDepth(10020)
        .setVisible(false);

   this.dialogPortraitFrameLeona = this.add.circle(120, 135, 52, 0x1d1d1d)
    .setStrokeStyle(3, 0xffffff)
    .setScrollFactor(0)
    .setDepth(10021)
    .setVisible(false);

this.dialogPortraitLeona = this.add.image(120, 135, "heroPortrait")
    .setScrollFactor(0)
    .setDepth(10022)
    .setVisible(false);
this.ajustarPortrait(this.dialogPortraitLeona, 86, 86);

this.dialogPortraitFrameDaniel = this.add.circle(1160, 135, 52, 0x1d1d1d)
    .setStrokeStyle(3, 0xffffff)
    .setScrollFactor(0)
    .setDepth(10021)
    .setVisible(false);

this.dialogPortraitDaniel = this.add.image(1160, 135, "danielPortrait")
    .setScrollFactor(0)
    .setDepth(10022)
    .setVisible(false);
this.ajustarPortrait(this.dialogPortraitDaniel, 86, 86);

this.dialogNome = this.add.text(205, 82, "", {
    fontSize: "28px",
    color: "#ffd166",
    fontStyle: "bold"
})
    .setScrollFactor(0)
    .setDepth(10021)
    .setVisible(false);

this.dialogTexto = this.add.text(205, 115, "", {
    fontSize: "26px",
    color: "#ffffff",
    wordWrap: { width: 840 }
})
    .setScrollFactor(0)
    .setDepth(10021)
    .setVisible(false);

this.dialogHint = this.add.text(1095, 185, "ENTER", {
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
}

    iniciarDialogoInicial() {
        this.dialogBg.setVisible(true);
        this.dialogPortraitFrameLeona.setVisible(true);
        this.dialogPortraitLeona.setVisible(true);
        this.dialogPortraitFrameDaniel.setVisible(true);
        this.dialogPortraitDaniel.setVisible(true);
        this.dialogNome.setVisible(true);
        this.dialogTexto.setVisible(true);
        this.dialogHint.setVisible(true);
        this.mostrarDialogoAtual();
    }

  

    mostrarDialogoAtual() {
        const fala = this.dialogosIniciais[this.introDialogIndex];
        if (!fala) return;

        this.dialogNome.setText(fala.nome);
        this.dialogTexto.setText(fala.texto);
        this.atualizarRetratosDialogo(fala.nome);
    }

    atualizarRetratosDialogo(nomeFalante) {
        const leonaFalando = nomeFalante === "Leona";

        this.dialogPortraitLeona.setAlpha(leonaFalando ? 1 : 0.45);
        this.dialogPortraitDaniel.setAlpha(leonaFalando ? 0.45 : 1);

        this.dialogPortraitFrameLeona.setStrokeStyle(3, leonaFalando ? 0xffd166 : 0xffffff, 1);
        this.dialogPortraitFrameDaniel.setStrokeStyle(3, leonaFalando ? 0xffffff : 0xffd166, 1);
    }

    avancarDialogoInicial() {
        this.introDialogIndex++;

        if (this.introDialogIndex >= this.dialogosIniciais.length) {
            this.encerrarDialogoInicial();
            return;
        }

        this.mostrarDialogoAtual();
    }

   

    encerrarDialogoInicial() {
        this.introDialogActive = false;
        this.phaseStarted = true;

        this.dialogBg.setVisible(false);
        this.dialogPortraitFrameLeona.setVisible(false);
        this.dialogPortraitLeona.setVisible(false);
        this.dialogPortraitFrameDaniel.setVisible(false);
        this.dialogPortraitDaniel.setVisible(false);
        this.dialogNome.setVisible(false);
        this.dialogTexto.setVisible(false);
        this.dialogHint.setVisible(false);

        this.mostrarAvisoFase("FASE 2 - PRAIA AO ENTARDECER");
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

    mostrarAvisoFase(texto) {
        this.waveText.setText(texto);
        this.waveText.setAlpha(0);

        this.tweens.add({
            targets: this.waveText,
            alpha: 1,
            duration: 200,
            yoyo: true,
            hold: 900
        });
    }

    criarPlayer() {
        this.player = this.physics.add.sprite(250, this.boardwalkMid, "leona_idle");
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

           this.bossNameText = this.add.text(720, 25, "KAYLA", {
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
                frameRate: 8.4,
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
                frameRate: 5.4,
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

        if (!this.anims.exists("boss2_idle")) {
            this.anims.create({
                key: "boss2_idle",
                frames: [{ key: "boss2_idle" }],
                frameRate: 1,
                repeat: -1
            });
        }

        if (!this.anims.exists("boss2_walk")) {
            this.anims.create({
                key: "boss2_walk",
                frames: [
                    { key: "boss2_walk1" },
                    { key: "boss2_walk2" },
                    { key: "boss2_walk3" },
                    { key: "boss2_walk4" },
                    { key: "boss2_walk5" }
                ],
                frameRate: 8,
                repeat: -1
            });
        }

        if (!this.anims.exists("boss2_death")) {
            this.anims.create({
                key: "boss2_death",
                frames: [
                    { key: "boss2_death1" },
                    { key: "boss2_death2" }
                ],
                frameRate: 4,
                repeat: 0
            });
        }
    }

    verificarGatilhosFase() {
        if (!this.phaseStarted || this.waveActive || this.levelComplete) return;

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

        if (config.tipo === "wave" || !config.tipo) {
            this.mostrarAvisoFase(config.titulo);

            config.enemies.forEach((enemyData) => {
                this.spawnEnemy(enemyData.x, enemyData.y, enemyData.tipo);
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

   iniciarDialogoBoss() {
    if (this.bossIntroStarted || !this.pendingBossConfig) return;

    this.bossIntroStarted = true;
    this.bossIntroActive = true;
    this.bossDialogActive = true;
    this.bossIntroIndex = 0;

    this.bossDialogos = [
        {
            nome: "Kayla",
            texto: "Então você é a garota que está acabando com os homens da Aurora."
        },
        {
            nome: "Leona",
            texto: "Se eles caíram tão fácil, o problema sempre foi a liderança."
        },
        {
            nome: "Kayla",
            texto: "Cuidado com o que diz. Minha espada encerra conversas bem rápido."
        },
        {
            nome: "Leona",
            texto: "Ótimo. Eu já estava cansada de ouvir desculpas."
        },
        {
            nome: "Kayla",
            texto: "Então venha. Vou te cortar antes que dê o próximo passo."
        }
    ];

    if (!this.boss) {
        this.spawnBoss(this.pendingBossConfig.boss.x, this.pendingBossConfig.boss.y, false);
    }

    this.player.setVelocity(0, 0);
    this.player.play("leona_idle", true);
    this.ajustarEscalaSprite(this.player, this.alturaPlayer);

    if (this.boss?.sprite?.active) {
        this.boss.sprite.setVelocity(0, 0);
        this.boss.sprite.play("boss2_idle", true);
        this.ajustarEscalaSprite(this.boss.sprite, this.alturaBoss);

      
        this.boss.sprite.setFlipX(true);
    }

    this.dialogPortraitDaniel.setTexture("potrait_kayla");
    this.ajustarPortrait(this.dialogPortraitDaniel, 86, 86);

    this.dialogBg.setVisible(true);
    this.dialogPortraitFrameLeona.setVisible(true);
    this.dialogPortraitLeona.setVisible(true);
    this.dialogPortraitFrameDaniel.setVisible(true);
    this.dialogPortraitDaniel.setVisible(true);
    this.dialogNome.setVisible(true);
    this.dialogTexto.setVisible(true);
    this.dialogHint.setVisible(true);

    this.mostrarDialogoBossAtual();
}

mostrarDialogoBossAtual() {
    const fala = this.bossDialogos[this.bossIntroIndex];
    if (!fala) return;

    this.dialogNome.setText(fala.nome);
    this.dialogTexto.setText(fala.texto);
    this.atualizarRetratosDialogo(fala.nome);
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

    this.dialogBg.setVisible(false);
    this.dialogPortraitFrameLeona.setVisible(false);
    this.dialogPortraitLeona.setVisible(false);
    this.dialogPortraitFrameDaniel.setVisible(false);
    this.dialogPortraitDaniel.setVisible(false);
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
            this.boss.sprite.play("boss2_idle", true);
            this.ajustarEscalaSprite(this.boss.sprite, this.alturaBoss);
            this.boss.sprite.setFlipX(false);
        }

        this.bossHudBg.setVisible(true);
        this.bossNameText.setVisible(true);
        this.bossHpText.setVisible(true);

        this.mostrarAvisoFase("KAYLA");
    }


    spawnBoss(x, y, exibirHud = false) {
            const sprite = this.physics.add.sprite(x, y, "boss2_idle");
            sprite.setOrigin(0.5, 1);
            sprite.setCollideWorldBounds(true);

            this.ajustarEscalaSprite(sprite, this.alturaBoss);
            sprite.play("boss2_idle", true);

            sprite.on(Phaser.Animations.Events.ANIMATION_UPDATE, () => {
                this.ajustarEscalaSprite(sprite, this.alturaBoss);
            });

            this.boss = {
                sprite,
                data: {
                    maxHp: 320,
                    currentHp: 320,
                    speed: 88,
                    damage: 24,
                    isDead: false,
                    isAttacking: false,
                    isHurt: false,
                    attackCooldown: 950,
                    lastAttackTime: 0,
                    attackRangeX: 122,
                    attackRangeY: 56
                }
            };

            this.bossHudBg.setVisible(exibirHud);
            this.bossNameText.setVisible(exibirHud);
            this.bossHpText.setVisible(exibirHud);
        }

    finalizarWave() {
        this.waveActive = false;
        this.currentLimitX = this.worldWidth - 40;
        this.mostrarAvisoFase("ÁREA LIMPA!");
    }

    spawnEnemy(x, y, tipo = "light") {
        const yFinal = Phaser.Math.Clamp(y, this.boardwalkTop + 8, this.boardwalkBottom);

        const sprite = this.physics.add.sprite(x, yFinal, "enemy_idle");
        sprite.setOrigin(0.5, 1);
        sprite.setCollideWorldBounds(true);

        const altura = tipo === "heavy" ? this.alturaEnemy + 20 : this.alturaEnemy;
        this.ajustarEscalaSprite(sprite, altura);
        sprite.play("enemy_idle");

        sprite.on(Phaser.Animations.Events.ANIMATION_UPDATE, () => {
            this.ajustarEscalaSprite(sprite, altura);
        });

        const hpBg = this.add.graphics().setDepth(3000);
        const hpFill = this.add.graphics().setDepth(3001);

        const lightStats = {
            maxHp: 52,
            currentHp: 52,
            speed: 94,
            damage: 10,
            attackCooldown: 760,
            attackRangeX: 86,
            attackRangeY: 54
        };

        const heavyStats = {
            maxHp: 72,
            currentHp: 72,
            speed: 76,
            damage: 14,
            attackCooldown: 920,
            attackRangeX: 92,
            attackRangeY: 56
        };

        const stats = tipo === "heavy" ? heavyStats : lightStats;

        const enemy = {
            sprite,
            hpBg,
            hpFill,
            data: {
                tipo,
                altura,
                maxHp: stats.maxHp,
                currentHp: stats.currentHp,
                speed: stats.speed,
                damage: stats.damage,
                isDead: false,
                isAttacking: false,
                isHurt: false,
                isRemoving: false,
                attackCooldown: stats.attackCooldown,
                lastAttackTime: 0,
                attackRangeX: stats.attackRangeX,
                attackRangeY: stats.attackRangeY,
                laneOffsetY: Phaser.Math.Between(-18, 18),
                attackOffsetX: Phaser.Math.Between(-34, 34),
                personalSpace: Phaser.Math.Between(64, 82)
            }
        };

        this.enemies.push(enemy);
    }

    spawnBox(x, y) {
        const sprite = this.add.image(x, y, "crateBox").setOrigin(0.5, 1);

        const box = {
            sprite,
            hp: 20,
            destroyed: false
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

        this.currentHp += item.heal;
        if (this.currentHp > this.maxHp) {
            this.currentHp = this.maxHp;
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

        if (this.player.y < this.boardwalkTop) this.player.y = this.boardwalkTop;
        if (this.player.y > this.boardwalkBottom) this.player.y = this.boardwalkBottom;

        if (this.player.x > this.currentLimitX) {
            this.player.x = this.currentLimitX;
        }
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
            this.tentarAcertarAlvos(dano, alcanceX, alcanceY);
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
            this.tentarAcertarAlvos(20, 120, 60);
        });

        this.time.delayedCall(240, () => {
            if (!this.isDead) {
                this.inAction = false;
                this.player.play("leona_idle", true);
                this.ajustarEscalaSprite(this.player, this.alturaPlayer);
            }
        });
    }

   

    tentarAcertarAlvos(dano, alcanceX, alcanceY) {
        this.tentarAcertarInimigos(dano, alcanceX, alcanceY);
        this.tentarAcertarBoss(dano, alcanceX, alcanceY);
        this.tentarAcertarCaixas(dano, alcanceX, alcanceY);
    }

    tentarAcertarBoss(dano, alcanceX, alcanceY) {
        if (!this.boss || this.boss.data.isDead) return;

        const dx = this.boss.sprite.x - this.player.x;
        const dy = Math.abs(this.boss.sprite.y - this.player.y);

        let acertouNaFrente = false;

        if (this.player.flipX) {
            acertouNaFrente = dx < 0 && Math.abs(dx) <= alcanceX + 14;
        } else {
            acertouNaFrente = dx > 0 && dx <= alcanceX + 14;
        }

        if (acertouNaFrente && dy <= alcanceY + 10) {
            this.danoNoBoss(dano);
        }
    }

    atualizarBoss() {
        if (!this.boss || this.boss.data.isDead || !this.bossFightStarted) return;

        const sprite = this.boss.sprite;
        const data = this.boss.data;

        if (this.isDead) {
            sprite.body.setVelocity(0, 0);
            if (sprite.anims.currentAnim?.key !== "boss2_idle") {
                sprite.play("boss2_idle", true);
                this.ajustarEscalaSprite(sprite, this.alturaBoss);
            }
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

        if (distanciaX <= data.attackRangeX && distanciaY <= data.attackRangeY) {
            if (this.time.now > data.lastAttackTime + data.attackCooldown) {
                sprite.body.setVelocity(0, 0);
                this.atacarComBoss();
                return;
            }

            const vx = dx < 0 ? -26 : 26;
            const vy = dy < 0 ? -18 : 18;
            sprite.body.setVelocity(vx, vy);

            if (vx < 0) sprite.setFlipX(true);
            if (vx > 0) sprite.setFlipX(false);

            if (sprite.anims.currentAnim?.key !== "boss2_walk") {
                sprite.play("boss2_walk", true);
                this.ajustarEscalaSprite(sprite, this.alturaBoss);
            }

            if (sprite.y < this.boardwalkTop) sprite.y = this.boardwalkTop;
            if (sprite.y > this.boardwalkBottom) sprite.y = this.boardwalkBottom;
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
            if (sprite.anims.currentAnim?.key !== "boss2_walk") {
                sprite.play("boss2_walk", true);
                this.ajustarEscalaSprite(sprite, this.alturaBoss);
            }
        } else {
            if (sprite.anims.currentAnim?.key !== "boss2_idle") {
                sprite.play("boss2_idle", true);
                this.ajustarEscalaSprite(sprite, this.alturaBoss);
            }
        }

        if (sprite.y < this.boardwalkTop) sprite.y = this.boardwalkTop;
        if (sprite.y > this.boardwalkBottom) sprite.y = this.boardwalkBottom;
    }

    atacarComBoss() {
        if (!this.boss || this.boss.data.isDead || this.boss.data.isAttacking || this.boss.data.isHurt) return;

        const sprite = this.boss.sprite;
        const data = this.boss.data;

        data.isAttacking = true;
        data.lastAttackTime = this.time.now;

        sprite.body.setVelocity(0, 0);
        sprite.anims.stop();
        sprite.setTexture("boss2_attack");
        this.ajustarEscalaSprite(sprite, this.alturaBoss);

        this.tocarSom(this.sfxPunch, true);

        this.time.delayedCall(170, () => {
            if (!this.boss || this.boss.data.isDead || this.isDead) return;

            const dx = Math.abs(this.player.x - sprite.x);
            const dy = Math.abs(this.player.y - sprite.y);

            if (dx <= data.attackRangeX + 10 && dy <= data.attackRangeY + 8) {
                this.tomarDano(data.damage, sprite.x);
            }
        });

        this.time.delayedCall(360, () => {
            if (this.boss && !this.boss.data.isDead) {
                data.isAttacking = false;
                sprite.play("boss2_idle", true);
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
        sprite.setTexture("boss2_damage");
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
                sprite.play("boss2_idle", true);
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
        sprite.setTexture("boss2_damage");
        this.ajustarEscalaSprite(sprite, this.alturaBoss);
        this.tocarSom(this.sfxBossDeath, true);

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
                sprite.play("boss2_death", true);
                this.ajustarEscalaSprite(sprite, this.alturaBoss);
            }
        );

        this.tweens.add({
            targets: sprite,
            alpha: 0.85,
            duration: 500
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


    verificarFimDaFase() {
        if (this.isGameEnding || !this.waveActive) return;

        const configAtual = this.waveConfigs[this.currentWaveIndex];
        if (!configAtual) return;

        if (configAtual.tipo === "wave" || !configAtual.tipo) {
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
            this.atualizarInimigo(enemy);
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

        if (this.isDead) {
            sprite.body.setVelocity(0, 0);
            return;
        }

        if (data.isAttacking || data.isHurt) {
            sprite.body.setVelocity(0, 0);
            return;
        }

        const alvoX = this.player.x + data.attackOffsetX;
        const alvoY = Phaser.Math.Clamp(this.player.y + data.laneOffsetY, this.boardwalkTop + 4, this.boardwalkBottom);

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


        if (sprite.y < this.boardwalkTop) sprite.y = this.boardwalkTop;
        if (sprite.y > this.boardwalkBottom) sprite.y = this.boardwalkBottom;
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
        this.ajustarEscalaSprite(sprite, data.altura);

        this.time.delayedCall(70, () => {
            if (!data.isDead && !data.isRemoving && data.isAttacking) {
                sprite.setTexture("enemy_punch2");
                this.ajustarEscalaSprite(sprite, data.altura);
            }
        });

        this.time.delayedCall(125, () => {
            if (!data.isDead && !data.isRemoving && data.isAttacking) {
                sprite.setTexture("enemy_punch3");
                this.ajustarEscalaSprite(sprite, data.altura);
            }
        });

        this.time.delayedCall(135, () => {
            if (data.isDead || data.isRemoving || this.isDead || this.levelComplete) return;

            const dx = Math.abs(this.player.x - sprite.x);
            const dy = Math.abs(this.player.y - sprite.y);

            if (dx <= data.attackRangeX && dy <= data.attackRangeY) {
                this.tomarDano(data.damage, sprite.x);
            }
        });

        this.time.delayedCall(250, () => {
            if (!data.isDead && !data.isRemoving) {
                data.isAttacking = false;
                sprite.play("enemy_idle", true);
                this.ajustarEscalaSprite(sprite, data.altura);
            }
        });
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

    tomarDano(valor, origemX = null) {
        if (this.isDead || this.levelComplete) return;

        if (origemX !== null) {
            this.lastDamageSourceX = origemX;
        }

        this.currentHp -= valor;
        if (this.currentHp < 0) this.currentHp = 0;

        this.atualizarHUD();
        this.tocarSom(this.sfxHurt, true);

        if (this.currentHp <= 0) {
            this.morrer(origemX);
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

    morrer(origemX = null) {
        if (this.isDead || this.isGameEnding) return;

        this.isDead = true;
        this.inAction = true;
        this.isPunching = false;
        this.comboStep = 0;
        this.punchBuffer = 0;

        this.player.setVelocity(0, 0);
        this.player.anims.stop();
        this.player.setTexture("leona_damage");
        this.ajustarEscalaSprite(this.player, this.alturaPlayer);

        if (!this.playerDeathPlayed) {
            this.playerDeathPlayed = true;
            this.tocarSom(this.sfxDeath, true);
        }

        this.aplicarArremessoNaMorte(
            this.player,
            origemX !== null ? origemX : this.lastDamageSourceX,
            58,
            34,
            18,
            150,
            280,
            () => {
                if (!this.player || !this.player.active) return;
                this.player.play("leona_death", true);
                this.ajustarEscalaSprite(this.player, this.alturaPlayer);
            }
        );

        this.time.delayedCall(1800, () => {
            this.concluirDerrota();
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
        this.ajustarEscalaSprite(sprite, data.altura);
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
                this.ajustarEscalaSprite(sprite, data.altura);
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
        this.ajustarEscalaSprite(sprite, data.altura);

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
                this.ajustarEscalaSprite(sprite, data.altura);
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


    concluirVitoria() {
        if (this.isGameEnding) return;

        this.isGameEnding = true;
        this.levelComplete = true;

        if (this.phaseMusic?.isPlaying) {
            this.phaseMusic.stop();
        }

        this.tocarSom(this.sfxVictory, true);
        this.mostrarMensagemFinal("FASE 2 CONCLUÍDA!", "Voltando para a tela inicial...");

        this.time.delayedCall(2600, () => {
            this.scene.start("Start");
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
            if (!enemy.hpBg || !enemy.hpFill) return;

            enemy.hpBg.clear();
            enemy.hpFill.clear();

            if (enemy.data.isDead || enemy.data.isRemoving || !enemy.sprite.active) {
                return;
            }

            const largura = enemy.data.tipo === "heavy" ? 70 : 60;
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

    organizarProfundidade() {
        if (this.player) {
            this.player.setDepth(this.player.y);
        }

        this.enemies.forEach((enemy) => {
            if (enemy.sprite && enemy.sprite.active) {
                enemy.sprite.setDepth(enemy.sprite.y);
            }
        });

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
            this.sfxEnemyDamage,
            this.sfxVictory,
            this.sfxDialog
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

        this.phaseMusic = null;
        this.sfxPunch = null;
        this.sfxKick = null;
        this.sfxHurt = null;
        this.sfxDeath = null;
        this.sfxEnemyDamage = null;
        this.sfxVictory = null;
        this.sfxDialog = null;
    }
}