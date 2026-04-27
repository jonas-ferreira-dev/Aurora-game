import { LeonaPlayer } from "../entities/LeonaPlayer.js";
import { StageEnemy } from "../entities/StageEnemy.js";
import { Boss2Training } from "../entities/Boss2Training.js";

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

        // HUD / retratos
        this.load.image("heroPortrait", "assets/player/portrait.png");
        this.load.image("danielPortrait", "assets/dialog/icon-daniel.png");
        this.load.image("potrait_kayla", "assets/Boss 2/portrait.png");

        // Entidades reutilizáveis
        LeonaPlayer.preload(this);
        StageEnemy.preload(this);
        Boss2Training.preload(this);

        // Decoração da praia
        this.load.image("decor_cadeira", "assets/phase2/cadeira praia.png");
        this.load.image("decor_guardasol", "assets/phase2/guardasol.png");
        this.load.image("decor_bola", "assets/phase2/bola.png");

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
        this.retryOpen = false;

        this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);

        this.levelComplete = false;
        this.isGameEnding = false;
        this.playerDeathHandled = false;

        this.boardwalkTop = 620;
        this.boardwalkBottom = 690;
        this.boardwalkMid = 668;

        this.alturaPlayer = 212;
        this.alturaEnemy = 196;
        this.alturaBoss = 245;

        this.leona = null;
        this.player = null;

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
        this.criarDecoracaoPraia();
        this.criarAnimacoes();
        this.criarControles();
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

        this.events.on("player:dead", this.onPlayerDead, this);

        this.iniciarDialogoInicial();

        this.events.on("shutdown", this.finalizarCena, this);
        this.events.on("destroy", this.finalizarCena, this);
    }

    update() {
        if (!this.leona || !this.player || !this.keys) return;

        if (this.retryOpen) {
            if (
                Phaser.Input.Keyboard.JustDown(this.keys.R) ||
                Phaser.Input.Keyboard.JustDown(this.keys.ENTER) ||
                Phaser.Input.Keyboard.JustDown(this.keys.SPACE)
            ) {
                this.retryPlayer();
            }

            return;
        }

        if (this.levelComplete) {
            this.pararLeonaEmIdle(false);
            return;
        }

        if (this.bossIntroActive) {
            this.atualizarParallax();
            this.pararLeonaEmIdle(true);
            this.pararEntidadesEmIdle();

            if (Phaser.Input.Keyboard.JustDown(this.enterKey) && this.bossDialogActive) {
                this.avancarDialogoBoss();
            }

            this.atualizarHUD();
            this.atualizarHUDInimigos();
            this.atualizarBossHUD();
            this.organizarProfundidade();
            return;
        }

        this.atualizarParallax();

        if (this.introDialogActive) {
            this.pararLeonaEmIdle(true);
            this.pararEntidadesEmIdle();

            if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
                this.avancarDialogoInicial();
            }

            this.atualizarHUD();
            this.organizarProfundidade();
            return;
        }

        this.verificarGatilhosFase();

        this.leona.setCurrentLimitX?.(this.currentLimitX);

        this.leona.update(
            this.cursors,
            this.keys,
            this.getCombatTargets()
        );

        // Segurança caso sua LeonaPlayer ainda não tenha setCurrentLimitX
        if (this.leona.sprite.x > this.currentLimitX) {
            this.leona.sprite.x = this.currentLimitX;
        }

        this.enemies.forEach((enemy) => {
            enemy.update(this.leona, this.enemies);
        });

        this.enemies = this.enemies.filter((enemy) => {
            return enemy?.sprite?.active || enemy?.data?.isRemoving;
        });

        if (this.bossFightStarted && this.boss) {
            this.boss.update(this.leona, true);
        }

        this.atualizarItens();
        this.atualizarHUD();
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

    criarDecoracaoPraia() {
        this.beachDecor = [];

        const decoracoesPraia = [
            { key: "decor_cadeira", altura: 92, yOffset: 0 },
            { key: "decor_guardasol", altura: 105, yOffset: 0 },
            { key: "decor_bola", altura: 78, yOffset: 0 }
        ];

        const props = [
            { x: 760, y: 520, scale: 0.95, angle: -6 },
            { x: 980, y: 560, scale: 1.10, angle: 4 },
            { x: 1250, y: 500, scale: 0.80, angle: -8 },
            { x: 1580, y: 545, scale: 1.00, angle: 6 },
            { x: 1960, y: 515, scale: 0.90, angle: -5 },
            { x: 2280, y: 550, scale: 1.15, angle: 3 },
            { x: 2670, y: 505, scale: 0.85, angle: -7 },
            { x: 3010, y: 560, scale: 1.05, angle: 5 },
            { x: 3380, y: 525, scale: 0.95, angle: -4 },
            { x: 3740, y: 545, scale: 1.10, angle: 7 },

            { x: 1120, y: 610, scale: 0.85, angle: 0 },
            { x: 1840, y: 615, scale: 0.95, angle: 0 },
            { x: 2460, y: 608, scale: 0.88, angle: 0 },
            { x: 3280, y: 612, scale: 0.92, angle: 0 }
        ];

        props.forEach((propData) => {
            const decoracao = Phaser.Utils.Array.GetRandom(decoracoesPraia);

            const prop = this.add.image(
                propData.x,
                propData.y + decoracao.yOffset,
                decoracao.key
            )
                .setOrigin(0.5, 1)
                .setAngle(propData.angle)
                .setAlpha(0.92);

            const escala = (decoracao.altura / prop.height) * propData.scale;
            prop.setScale(escala);
            prop.setDepth(prop.y - 2);

            this.beachDecor.push(prop);
        });
    }

    atualizarParallax() {
        const scrollX = this.cameras.main.scrollX;

        if (this.layerSky) this.layerSky.x = -120 + (scrollX * 0.03);
        if (this.layerSea) this.layerSea.x = -90 + (scrollX * 0.08);
        if (this.layerSand) this.layerSand.x = -60 + (scrollX * 0.14);
        if (this.layerWalk) this.layerWalk.x = -30 + (scrollX * 0.22);
    }

    criarAnimacoes() {
        LeonaPlayer.createAnimations(this);
        StageEnemy.createAnimations(this);
        Boss2Training.createAnimations(this);
    }

    criarControles() {
        this.cursors = this.input.keyboard.createCursorKeys();

        this.keys = this.input.keyboard.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D,
            J: Phaser.Input.Keyboard.KeyCodes.J,
            K: Phaser.Input.Keyboard.KeyCodes.K,
            R: Phaser.Input.Keyboard.KeyCodes.R,
            SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
            ENTER: Phaser.Input.Keyboard.KeyCodes.ENTER
        });

        this.enterKey = this.keys.ENTER;
    }

    criarPlayer() {
        this.leona = new LeonaPlayer(this, 250, this.boardwalkMid, {
            worldWidth: this.worldWidth,
            floorTop: this.boardwalkTop,
            floorBottom: this.boardwalkBottom,
            alturaPlayer: this.alturaPlayer
        });

        this.leona.setCurrentLimitX?.(this.currentLimitX);

        // Compatibilidade com trechos da fase que usam this.player como sprite
        this.player = this.leona.sprite;
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
            "Mover: WASD/Setas | SPACE: pulo | J: combo | K: voadora/chute aéreo",
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

        this.esconderDialogo();

        this.mostrarAvisoFase("FASE 2 - PRAIA AO ENTARDECER");
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
                texto: "Cuidado com o que diz. Meus raios encerram conversas bem rápido."
            },
            {
                nome: "Leona",
                texto: "Ótimo. Eu já estava cansada de ouvir desculpas."
            },
            {
                nome: "Kayla",
                texto: "Então venha. Vamos ver se você aguenta a tempestade."
            }
        ];

        if (!this.boss) {
            this.spawnBoss(this.pendingBossConfig.boss.x, this.pendingBossConfig.boss.y, false);
        }

        this.pararLeonaEmIdle(true);

        if (this.boss?.sprite?.active) {
            this.boss.sprite.body?.setVelocity(0, 0);
            this.boss.sprite.anims.stop();
            this.boss.sprite.setTexture("boss2_idle");
            this.boss.ajustarEscalaSprite?.();
            this.boss.sprite.setFlipX(true);

            this.pararCicloBossAteLuta();
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

        this.esconderDialogo();
        this.iniciarLutaBoss();
    }

    esconderDialogo() {
        this.dialogBg.setVisible(false);
        this.dialogPortraitFrameLeona.setVisible(false);
        this.dialogPortraitLeona.setVisible(false);
        this.dialogPortraitFrameDaniel.setVisible(false);
        this.dialogPortraitDaniel.setVisible(false);
        this.dialogNome.setVisible(false);
        this.dialogTexto.setVisible(false);
        this.dialogHint.setVisible(false);
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
        this.leona.setCurrentLimitX?.(this.currentLimitX);

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

    iniciarLutaBoss() {
        if (this.bossFightStarted || !this.pendingBossConfig) return;

        this.bossFightStarted = true;

        if (!this.boss) {
            this.spawnBoss(this.pendingBossConfig.boss.x, this.pendingBossConfig.boss.y, true);
        }

        if (this.boss?.sprite?.active) {
            this.boss.sprite.anims.stop();
            this.boss.sprite.setTexture("boss2_idle");
            this.boss.ajustarEscalaSprite?.();
            this.boss.sprite.setFlipX(false);
        }

        if (typeof this.boss.start === "function") {
            this.boss.start();
        } else if (typeof this.boss.iniciarCarregamento === "function") {
            this.boss.iniciarCarregamento();
        }

        this.bossHudBg.setVisible(true);
        this.bossNameText.setVisible(true);
        this.bossHpText.setVisible(true);

        this.mostrarAvisoFase("KAYLA");
    }

    finalizarWave() {
        this.waveActive = false;
        this.currentLimitX = this.worldWidth - 40;
        this.leona.setCurrentLimitX?.(this.currentLimitX);

        this.mostrarAvisoFase("ÁREA LIMPA!");
    }

    spawnEnemy(x, y, tipo = "light") {
        const enemy = new StageEnemy(this, x, y, tipo, {
            worldWidth: this.worldWidth,
            floorTop: this.boardwalkTop,
            floorBottom: this.boardwalkBottom,
            alturaEnemy: this.alturaEnemy
        });

        this.enemies.push(enemy);

        return enemy;
    }

    spawnBoss(x, y, exibirHud = false) {
        this.boss = new Boss2Training(this, x, y, {
            worldWidth: this.worldWidth,
            floorTop: this.boardwalkTop,
            floorBottom: this.boardwalkBottom,
            alturaBoss: this.alturaBoss,
            autoStart: false
        });

        this.pararCicloBossAteLuta();

        this.bossHudBg.setVisible(exibirHud);
        this.bossNameText.setVisible(exibirHud);
        this.bossHpText.setVisible(exibirHud);

        return this.boss;
    }

    pararCicloBossAteLuta() {
        if (!this.boss) return;

        if (this.boss.startDelayEvent) {
            this.boss.startDelayEvent.remove(false);
            this.boss.startDelayEvent = null;
        }

        this.boss.state = "idle";
        this.boss.charge = 0;
        this.boss.nextStrikeAt = 0;
        this.boss.stateStartedAt = this.time.now;

        if (this.boss.sprite?.active) {
            this.boss.sprite.anims.stop();
            this.boss.sprite.setTexture("boss2_idle");
            this.boss.ajustarEscalaSprite?.();
        }
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

                // Retorna false para não contar como hit de combo.
                return false;
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

            const playerY = this.leona.getGroundY
                ? this.leona.getGroundY()
                : this.player.y;

            const dx = Math.abs(this.player.x - item.sprite.x);
            const dy = Math.abs(playerY - item.sprite.y);

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

        this.leona.currentHp += item.heal;
        if (this.leona.currentHp > this.leona.maxHp) {
            this.leona.currentHp = this.leona.maxHp;
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
        box.data.isDead = true;
        box.data.isRemoving = true;

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

    getCombatTargets() {
        const targets = [];

        this.enemies.forEach((enemy) => {
            if (enemy?.isAlive?.()) {
                targets.push(enemy);
            }
        });

        this.boxes.forEach((box) => {
            if (!box.destroyed && box.sprite?.active) {
                targets.push(box);
            }
        });

        if (
            this.bossFightStarted &&
            this.boss &&
            this.boss.sprite?.active &&
            !this.boss.data.isDead
        ) {
            targets.push(this.boss);
        }

        return targets;
    }

    verificarFimDaFase() {
        if (this.isGameEnding || !this.waveActive) return;

        const configAtual = this.waveConfigs[this.currentWaveIndex];
        if (!configAtual) return;

        if (configAtual.tipo === "wave" || !configAtual.tipo) {
            const vivos = this.enemies.filter((enemy) => enemy.isAlive?.()).length;

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

    atualizarHUD() {
        if (!this.leona) return;

        const x = 120;
        const y = 50;
        const largura = 280;
        const altura = 22;

        this.hpBarBg.clear();
        this.hpBarBg.fillStyle(0x222222, 1);
        this.hpBarBg.fillRoundedRect(x, y, largura, altura, 8);
        this.hpBarBg.lineStyle(2, 0xffffff, 1);
        this.hpBarBg.strokeRoundedRect(x, y, largura, altura, 8);

        const hpPercent = Phaser.Math.Clamp(
            this.leona.currentHp / this.leona.maxHp,
            0,
            1
        );

        this.hpBarFill.clear();
        this.hpBarFill.fillStyle(0xff3b30, 1);
        this.hpBarFill.fillRoundedRect(
            x + 3,
            y + 3,
            (largura - 6) * hpPercent,
            altura - 6,
            6
        );

        this.hpText.setText(`${this.leona.currentHp} / ${this.leona.maxHp}`);
    }

    atualizarHUDInimigos() {
        this.enemies.forEach((enemy) => {
            enemy.updateHpBar?.();
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

        const hpPercent = Phaser.Math.Clamp(
            this.boss.data.currentHp / this.boss.data.maxHp,
            0,
            1
        );

        this.bossHpBarBg.fillStyle(0x222222, 1);
        this.bossHpBarBg.fillRoundedRect(x, y, largura, altura, 8);
        this.bossHpBarBg.lineStyle(2, 0xffffff, 1);
        this.bossHpBarBg.strokeRoundedRect(x, y, largura, altura, 8);

        this.bossHpBarFill.fillStyle(0xb30000, 1);
        this.bossHpBarFill.fillRoundedRect(
            x + 3,
            y + 3,
            (largura - 6) * hpPercent,
            altura - 6,
            6
        );

        const raioPercent = Math.round((this.boss.charge ?? 0) * 100);
        this.bossHpText.setText(`${this.boss.data.currentHp} / ${this.boss.data.maxHp} | Raio ${raioPercent}%`);
    }

    organizarProfundidade() {
        if (this.leona?.sprite) {
            const playerDepthY = this.leona.getGroundY
                ? this.leona.getGroundY()
                : this.leona.sprite.y;

            this.leona.sprite.setDepth(playerDepthY);
        }

        this.enemies.forEach((enemy) => {
            if (enemy.sprite && enemy.sprite.active) {
                enemy.sprite.setDepth(enemy.sprite.y);
            }
        });

        if (this.boss && this.boss.sprite && this.boss.sprite.active) {
            this.boss.sprite.setDepth(this.boss.sprite.y + 10);
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

    pararLeonaEmIdle(forceIdle = false) {
        if (!this.leona?.sprite) return;

        this.leona.sprite.setVelocity(0, 0);

        if (forceIdle && !this.leona.isDead) {
            this.leona.sprite.anims.stop();
            this.leona.sprite.play("leona_idle", true);
            this.leona.ajustarEscalaSprite?.();
        }
    }

    pararEntidadesEmIdle() {
        this.enemies.forEach((enemy) => {
            if (!enemy.sprite?.active) return;

            enemy.sprite.body?.setVelocity(0, 0);

            if (!enemy.data.isDead && !enemy.data.isRemoving) {
                if (enemy.sprite.anims.currentAnim?.key !== "enemy_idle") {
                    enemy.sprite.play("enemy_idle", true);
                    enemy.ajustarEscalaSprite?.();
                }
            }

            enemy.updateHpBar?.();
        });

        if (this.boss?.sprite?.active) {
            this.boss.sprite.body?.setVelocity(0, 0);

            if (!this.boss.data.isDead) {
                this.boss.sprite.anims.stop();
                this.boss.sprite.setTexture("boss2_idle");
                this.boss.ajustarEscalaSprite?.();
            }
        }
    }

    onPlayerDead() {
        if (this.playerDeathHandled || this.isGameEnding || this.levelComplete) return;

        this.playerDeathHandled = true;

        this.time.delayedCall(450, () => {
            this.mostrarRetry();
        });
    }


mostrarRetry() {
    if (this.retryOpen || this.isGameEnding || this.levelComplete) return;

    this.retryOpen = true;

    this.physics.pause();
    this.time.paused = true;

    this.leona?.sprite?.body?.setVelocity(0, 0);
    this.boss?.sprite?.body?.setVelocity(0, 0);

    this.enemies.forEach((enemy) => {
        enemy?.sprite?.body?.setVelocity(0, 0);
    });

    this.retryOverlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.68)
        .setScrollFactor(0)
        .setDepth(40000);

    this.retryBox = this.add.rectangle(640, 360, 560, 280, 0x151515, 0.96)
        .setStrokeStyle(3, 0xff3b30)
        .setScrollFactor(0)
        .setDepth(40001);

    this.retryTitle = this.add.text(640, 285, "LEONA CAIU", {
        fontSize: "42px",
        color: "#ff4d4d",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 6
    })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(40002);

    this.retryText = this.add.text(640, 335, "Quer tentar de novo e continuar a luta?", {
        fontSize: "22px",
        color: "#ffffff",
        align: "center",
        stroke: "#000000",
        strokeThickness: 4
    })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(40002);

    this.retryButton = this.add.rectangle(640, 410, 240, 58, 0x7efcff, 1)
        .setStrokeStyle(3, 0xffffff)
        .setScrollFactor(0)
        .setDepth(40002)
        .setInteractive({ useHandCursor: true });

    this.retryButtonText = this.add.text(640, 410, "RETRY", {
        fontSize: "28px",
        color: "#000000",
        fontStyle: "bold"
    })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(40003);

    this.retryHint = this.add.text(640, 470, "Pressione R, ENTER ou SPACE", {
        fontSize: "18px",
        color: "#ffd166",
        stroke: "#000000",
        strokeThickness: 4
    })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(40002);

    this.retryButton.on("pointerdown", () => {
        this.retryPlayer();
    });

    this.retryButton.on("pointerover", () => {
        this.retryButton.setFillStyle(0xffffff, 1);
    });

    this.retryButton.on("pointerout", () => {
        this.retryButton.setFillStyle(0x7efcff, 1);
    });
}

    retryPlayer() {
        if (!this.retryOpen) return;

        this.fecharRetry();

        this.time.paused = false;
        this.physics.resume();

        this.playerDeathHandled = false;

        const reviveX = Phaser.Math.Clamp(
            this.cameras.main.scrollX + 220,
            40,
            this.currentLimitX - 40
        );

        const reviveY = this.boardwalkMid;

        this.leona.reset(reviveX, reviveY);
        this.player = this.leona.sprite;

        this.leona.playerIframesUntil = this.time.now + 1400;
        this.leona.playerAttackArmorUntil = this.time.now + 700;

        this.atualizarHUD();
    }

    fecharRetry() {
        this.retryOpen = false;

        this.retryOverlay?.destroy();
        this.retryBox?.destroy();
        this.retryTitle?.destroy();
        this.retryText?.destroy();
        this.retryButton?.destroy();
        this.retryButtonText?.destroy();
        this.retryHint?.destroy();

        this.retryOverlay = null;
        this.retryBox = null;
        this.retryTitle = null;
        this.retryText = null;
        this.retryButton = null;
        this.retryButtonText = null;
        this.retryHint = null;
    }
    concluirVitoria() {
        if (this.isGameEnding) return;

        this.isGameEnding = true;
        this.levelComplete = true;

        if (this.phaseMusic?.isPlaying) {
            this.phaseMusic.stop();
        }

        this.tocarSom(this.sfxVictory, true);
        this.mostrarMensagemFinal("FASE 2 CONCLUÍDA!", "Indo para o caminho do Labirinto...");

        this.time.delayedCall(2600, () => {
            this.scene.start("Phase3");
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

    ajustarPortrait(img, maxLargura, maxAltura) {
        img.setScale(1);

        const escala = Math.min(
            maxLargura / img.width,
            maxAltura / img.height
        );

        img.setScale(escala);
    }

    finalizarCena() {
        
        if (this.retryOpen) {
            this.fecharRetry();
        }

        this.events.off("player:dead", this.onPlayerDead, this);

        const audios = [
            this.phaseMusic,
            this.sfxPunch,
            this.sfxKick,
            this.sfxHurt,
            this.sfxDeath,
            this.sfxEnemyDamage,
            this.sfxVictory,
            this.sfxDialog,
            this.sfxBossDeath
        ];

        audios.forEach((audio) => {
            if (audio) {
                audio.stop();
                audio.destroy();
            }
        });

        this.leona?.destroy?.();
        this.boss?.destroy?.();

        this.enemies.forEach((enemy) => {
            enemy.destroy?.();
        });

        this.boxes.forEach((box) => {
            box.sprite?.destroy();
        });

        this.items.forEach((item) => {
            if (item.tween) item.tween.stop();
            item.sprite?.destroy();
        });

        if (this.beachDecor) {
            this.beachDecor.forEach((prop) => prop?.destroy());
            this.beachDecor = [];
        }

        this.phaseMusic = null;
        this.sfxPunch = null;
        this.sfxKick = null;
        this.sfxHurt = null;
        this.sfxDeath = null;
        this.sfxEnemyDamage = null;
        this.sfxVictory = null;
        this.sfxDialog = null;
        this.sfxBossDeath = null;

        this.leona = null;
        this.player = null;
        this.boss = null;
        this.enemies = [];
        this.boxes = [];
        this.items = [];
    }
}