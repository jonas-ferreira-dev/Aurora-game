import { LeonaPlayer } from "../entities/LeonaPlayer.js";
import { Boss2Training } from "../entities/Boss2Training.js";

export class PhaseTraining extends Phaser.Scene {
    constructor() {
        super("PhaseTraining");
    }

    preload() {
        LeonaPlayer.preload(this);
        Boss2Training.preload(this);

        // Áudios
        // this.load.audio("sfxPunch", "assets/audio/punch.mp3");
        // this.load.audio("sfxKick", "assets/audio/kick.mp3");
        this.load.audio("sfxHurt", "assets/audio/hurt.mp3");
        this.load.audio("sfxDeath", "assets/audio/death.mp3");
        this.load.audio("sfxEnemyDamage", "assets/audio/damage_enemy.mp3");
    }

    create() {
        this.worldWidth = 1280;
        this.worldHeight = 720;

        this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);

        this.floorTop = 470;
        this.floorBottom = 675;
        this.floorMid = 620;

        this.alturaPlayer = 212;
        this.alturaBoss = 245;

        this.isPaused = false;
        this.enemyAIEnabled = true;

        this.criarFundoSimples();
        this.criarAnimacoes();
        this.criarControles();
        this.criarAudio();

        this.player = new LeonaPlayer(this, 410, this.floorMid, {
            worldWidth: this.worldWidth,
            floorTop: this.floorTop,
            floorBottom: this.floorBottom,
            alturaPlayer: this.alturaPlayer
        });

        // Mantive como this.enemy para continuar compatível com a LeonaPlayer.
        this.enemy = new Boss2Training(this, 860, this.floorMid, {
            worldWidth: this.worldWidth,
            floorTop: this.floorTop,
            floorBottom: this.floorBottom,
            alturaBoss: this.alturaBoss
        });

        this.retryOpen = false;
        this.events.on("player:dead", this.mostrarRetry, this);

        this.bossLoreOpen = false;
        this.events.on("boss2:derrotada", this.mostrarDossieBoss, this);

        this.criarHUD();
        this.criarPauseUI();

        this.cameras.main.setBackgroundColor("#d7c5a8");

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.finalizarCena, this);
        this.events.once(Phaser.Scenes.Events.DESTROY, this.finalizarCena, this);
    }

    update() {
        if (!this.keys || !this.player || !this.enemy) return;

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

        if (this.bossLoreOpen) {
            if (
                Phaser.Input.Keyboard.JustDown(this.keys.ENTER) ||
                Phaser.Input.Keyboard.JustDown(this.keys.SPACE) ||
                Phaser.Input.Keyboard.JustDown(this.keys.ESC)
            ) {
                this.fecharDossieBoss();
            }

            return;
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.P) || Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
            this.togglePause();
            return;
        }

        if (this.isPaused) return;

        if (Phaser.Input.Keyboard.JustDown(this.keys.R)) {
            this.resetTraining();
            return;
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.I)) {
            this.enemyAIEnabled = !this.enemyAIEnabled;
            this.atualizarTextoAjuda();
        }

        // No Boss2Training, atacar() força a boss a começar a preparação dos raios.
        if (Phaser.Input.Keyboard.JustDown(this.keys.T)) {
            this.enemy.atacar(this.player);
        }

        this.player.update(this.cursors, this.keys, this.enemy);
        this.enemy.update(this.player, this.enemyAIEnabled);

        this.atualizarHUD();
        this.organizarProfundidade();
    }

    criarFundoSimples() {
        this.add.rectangle(0, 0, this.worldWidth, this.worldHeight, 0xd7c5a8)
            .setOrigin(0, 0)
            .setDepth(-100);

        this.add.rectangle(0, this.floorTop, this.worldWidth, this.floorBottom - this.floorTop, 0xb8a083, 1)
            .setOrigin(0, 0)
            .setDepth(-90);

        this.add.rectangle(0, this.floorTop, this.worldWidth, 4, 0x51483f, 1)
            .setOrigin(0, 0)
            .setDepth(-80);

        this.add.text(640, 42, "TRAINING MODE - BOSS 2", {
            fontSize: "36px",
            color: "#ffffff",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 6
        })
            .setOrigin(0.5)
            .setDepth(1000);
    }

    criarAnimacoes() {
        LeonaPlayer.createAnimations(this);
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
            I: Phaser.Input.Keyboard.KeyCodes.I,
            T: Phaser.Input.Keyboard.KeyCodes.T,
            P: Phaser.Input.Keyboard.KeyCodes.P,
            SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
            ENTER: Phaser.Input.Keyboard.KeyCodes.ENTER,
            ESC: Phaser.Input.Keyboard.KeyCodes.ESC
        });
    }

    criarAudio() {
        // this.sfxPunch = this.sound.add("sfxPunch", { volume: 0.5 });
        // this.sfxKick = this.sound.add("sfxKick", { volume: 0.55 });
        this.sfxHurt = this.sound.add("sfxHurt", { volume: 0.6 });
        this.sfxDeath = this.sound.add("sfxDeath", { volume: 0.7 });
        this.sfxEnemyDamage = this.sound.add("sfxEnemyDamage", { volume: 0.6 });
    }

    tocarSom(audio, restart = false) {
        if (!audio) return;

        if (restart) {
            audio.stop();
        }

        audio.play();
    }

    criarHUD() {
        this.hpBarBg = this.add.graphics().setDepth(10000);
        this.hpBarFill = this.add.graphics().setDepth(10001);

        this.hpText = this.add.text(30, 32, "", {
            fontSize: "20px",
            color: "#ffffff",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 4
        }).setDepth(10002);

        this.bossHpBarBg = this.add.graphics().setDepth(10000);
        this.bossHpBarFill = this.add.graphics().setDepth(10001);

        this.bossHpText = this.add.text(30, 72, "", {
            fontSize: "20px",
            color: "#ffffff",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 4
        }).setDepth(10002);

        this.bossStateText = this.add.text(30, 112, "", {
            fontSize: "18px",
            color: "#7efcff",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 4
        }).setDepth(10002);

        this.helpText = this.add.text(30, 628, "", {
            fontSize: "18px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 4,
            lineSpacing: 4
        }).setDepth(10002);

        this.atualizarTextoAjuda();
    }

    atualizarTextoAjuda() {
        const aiStatus = this.enemyAIEnabled ? "ON" : "OFF";

        this.helpText.setText(
            `Mover: WASD/Setas | SPACE: Pulo | J: Combo | K: Voadora / Chute aéreo\n` +
            `I: IA Boss ${aiStatus} | T: Forçar raio | R: Reset | P/ESC: Pause\n` +
            `A Boss só toma dano carregando em car1/car2. Durante os raios ela fica invulnerável.`
        );
    }

    criarPauseUI() {
        this.pauseOverlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.65)
            .setScrollFactor(0)
            .setDepth(20000)
            .setVisible(false);

        this.pauseBox = this.add.rectangle(640, 360, 520, 220, 0x111111, 0.92)
            .setStrokeStyle(3, 0xffffff)
            .setScrollFactor(0)
            .setDepth(20001)
            .setVisible(false);

        this.pauseTitle = this.add.text(640, 320, "PAUSADO", {
            fontSize: "42px",
            color: "#ffffff",
            fontStyle: "bold"
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(20002)
            .setVisible(false);

        this.pauseHint = this.add.text(640, 385, "Pressione P ou ESC para voltar", {
            fontSize: "24px",
            color: "#ffd166"
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(20002)
            .setVisible(false);
    }

    togglePause() {
        this.isPaused = !this.isPaused;

        this.pauseOverlay.setVisible(this.isPaused);
        this.pauseBox.setVisible(this.isPaused);
        this.pauseTitle.setVisible(this.isPaused);
        this.pauseHint.setVisible(this.isPaused);

        if (this.isPaused) {
            this.physics.pause();
            this.time.paused = true;

            this.player?.sprite?.body?.setVelocity(0, 0);
            this.enemy?.sprite?.body?.setVelocity(0, 0);

            this.player?.sprite?.anims?.pause();
            this.enemy?.sprite?.anims?.pause();
        } else {
            this.time.paused = false;
            this.physics.resume();

            this.player?.sprite?.anims?.resume();
            this.enemy?.sprite?.anims?.resume();
        }
    }

    mostrarRetry() {
        if (this.retryOpen) return;

        this.retryOpen = true;

        this.physics.pause();
        this.time.paused = true;

        this.player?.sprite?.body?.setVelocity(0, 0);
        this.enemy?.sprite?.body?.setVelocity(0, 0);

        this.player?.sprite?.anims?.pause();
        this.enemy?.sprite?.anims?.pause();

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

        this.player?.sprite?.anims?.resume();
        this.enemy?.sprite?.anims?.resume();

        // Revive só a Leona.
        // A boss continua com a vida e estado atuais.
        this.player.reset(410, this.floorMid);

        // Pequena proteção para ela não renascer tomando raio/soco instantâneo.
        this.player.playerIframesUntil = this.time.now + 1300;
        this.player.playerAttackArmorUntil = this.time.now + 600;

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

    resetTraining() {

        if (this.retryOpen) {
            this.fecharRetry();
            this.time.paused = false;
            this.physics.resume();
        }
        this.player.reset(410, this.floorMid);
        this.enemy.reset(860, this.floorMid);

        this.atualizarHUD();
    }

    atualizarHUD() {
        if (!this.player || !this.enemy) return;

        const playerX = 30;
        const playerY = 28;
        const barWidth = 250;
        const barHeight = 18;

        this.hpBarBg.clear();
        this.hpBarFill.clear();

        this.hpBarBg.fillStyle(0x111111, 0.9);
        this.hpBarBg.fillRoundedRect(playerX, playerY, barWidth, barHeight, 6);
        this.hpBarBg.lineStyle(2, 0xffffff, 1);
        this.hpBarBg.strokeRoundedRect(playerX, playerY, barWidth, barHeight, 6);

        this.hpBarFill.fillStyle(0xff3b30, 1);
        this.hpBarFill.fillRoundedRect(
            playerX + 2,
            playerY + 2,
            (barWidth - 4) * (this.player.currentHp / this.player.maxHp),
            barHeight - 4,
            5
        );

        this.hpText.setText(`Leona: ${this.player.currentHp} / ${this.player.maxHp}`);

        const bossX = 30;
        const bossY = 68;

        this.bossHpBarBg.clear();
        this.bossHpBarFill.clear();

        const bossHp = this.enemy?.data?.currentHp ?? 0;
        const bossMaxHp = this.enemy?.data?.maxHp ?? 100;
        const bossHpPercent = Phaser.Math.Clamp(bossHp / bossMaxHp, 0, 1);

        this.bossHpBarBg.fillStyle(0x111111, 0.9);
        this.bossHpBarBg.fillRoundedRect(bossX, bossY, barWidth, barHeight, 6);
        this.bossHpBarBg.lineStyle(2, 0xffffff, 1);
        this.bossHpBarBg.strokeRoundedRect(bossX, bossY, barWidth, barHeight, 6);

        this.bossHpBarFill.fillStyle(0xb30000, 1);
        this.bossHpBarFill.fillRoundedRect(
            bossX + 2,
            bossY + 2,
            (barWidth - 4) * bossHpPercent,
            barHeight - 4,
            5
        );

        this.bossHpText.setText(`Boss 2: ${bossHp} / ${bossMaxHp}`);

        const estado = this.getBossStateLabel();
        const raioPercent = Math.round((this.enemy.charge ?? 0) * 100);

        if (this.enemy.state === "casting") {
            this.bossStateText.setText(`Estado: ${estado} | Raio: ${raioPercent}% | Vulnerável`);
        } else {
            this.bossStateText.setText(`Estado: ${estado} | Raio: ${raioPercent}% | Invulnerável`);
        }
    }

    getBossStateLabel() {
        if (!this.enemy) return "-";

        switch (this.enemy.state) {
            case "idle":
                return "Parada";
            case "charging":
                return "Carregando";
            case "preparing":
                return "Preparando raio";
            case "casting":
                return "Soltando raios";
            case "post_cast":
                return "Recuperando";
            case "defeated":
                return "Derrotada";
            default:
                return this.enemy.state || "-";
        }
    }

    organizarProfundidade() {
        if (!this.player?.sprite) return;

        const playerDepthY = this.player.getGroundY();
        const playerBaseDepth = playerDepthY + 10;

        this.player.sprite.setDepth(playerBaseDepth);

        if (this.enemy?.sprite) {
            const sprite = this.enemy.sprite;
            const data = this.enemy.data;

            const pertoDaLeona =
                Math.abs(sprite.x - this.player.sprite.x) <= 140 &&
                Math.abs(sprite.y - playerDepthY) <= 100;

            const leonaEmAcao =
                this.player.isPunching ||
                this.player.comboWaitingForInput ||
                this.player.inAction;

            if (data.isHurt || data.isBeingThrown || (pertoDaLeona && leonaEmAcao)) {
                this.player.sprite.setDepth(Math.max(playerBaseDepth, sprite.y + 20));
                sprite.setDepth(this.player.sprite.depth - 12);
            } else {
                sprite.setDepth(sprite.y);
            }

            if (this.enemy.raioAura) {
                this.enemy.raioAura.setDepth(sprite.depth + 4);
            }
        }
    }

    finalizarCena() {

        this.events.off("player:dead", this.mostrarRetry, this);

        if (this.retryOpen) {
            this.fecharRetry();
        }
        const audios = [
            this.sfxHurt,
            this.sfxDeath,
            this.sfxEnemyDamage
        ];

        audios.forEach((audio) => {
            if (audio) {
                audio.stop();
                audio.destroy();
            }
        });

        this.player?.destroy();
        this.enemy?.destroy();

        this.player = null;
        this.enemy = null;

        this.sfxHurt = null;
        this.sfxDeath = null;
        this.sfxEnemyDamage = null;
        this.events.off("boss2:derrotada", this.mostrarDossieBoss, this);
    }

    mostrarDossieBoss(info) {
        if (this.bossLoreOpen) return;

        this.bossLoreOpen = true;

        this.player?.sprite?.body?.setVelocity(0, 0);

        this.dossieOverlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.68)
            .setScrollFactor(0)
            .setDepth(30000);

        this.dossieBox = this.add.rectangle(640, 360, 820, 360, 0x151515, 0.96)
            .setStrokeStyle(3, 0x7efcff)
            .setScrollFactor(0)
            .setDepth(30001);

        this.dossieTitulo = this.add.text(640, 210, info.titulo || "Dossiê desbloqueado", {
            fontSize: "30px",
            color: "#7efcff",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 5
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(30002);

        this.dossieNome = this.add.text(640, 260, info.nome || "Boss derrotada", {
            fontSize: "24px",
            color: "#ffffff",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 4
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(30002);

        // Agora o texto começa DE CIMA, sem sobrepor o nome
        this.dossieTexto = this.add.text(640, 305, info.texto || "", {
            fontSize: "18px",
            color: "#f2f2f2",
            align: "center",
            wordWrap: {
                width: 700,
                useAdvancedWrap: true
            },
            lineSpacing: 10
        })
            .setOrigin(0.5, 0)
            .setScrollFactor(0)
            .setDepth(30002);

        this.dossieHint = this.add.text(640, 495, "Pressione ENTER, SPACE ou ESC para fechar", {
            fontSize: "18px",
            color: "#ffd166",
            stroke: "#000000",
            strokeThickness: 4
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(30002);
    }

        fecharDossieBoss() {
            this.bossLoreOpen = false;

            this.dossieOverlay?.destroy();
            this.dossieBox?.destroy();
            this.dossieTitulo?.destroy();
            this.dossieNome?.destroy();
            this.dossieTexto?.destroy();
            this.dossieHint?.destroy();

            this.dossieOverlay = null;
            this.dossieBox = null;
            this.dossieTitulo = null;
            this.dossieNome = null;
            this.dossieTexto = null;
            this.dossieHint = null;
        }
}