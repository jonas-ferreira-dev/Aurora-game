import { setupLoadingScreen } from "../ui/LoadingScreen.js";

export class Start extends Phaser.Scene {
    constructor() {
        super("Start");
    }

    preload() {
        setupLoadingScreen(this, "INICIANDO");

        this.load.image("menuBg", "assets/start/menu-test.jpg");

        this.load.audio("menuMusic", [
            "assets/audio/menu.mp3",
            "assets/audio/menu.ogg"
        ]);

        this.load.audio("sfxSelectOption", "assets/audio/select_option.wav");
        this.load.audio("sfxClicked", "assets/audio/clicked.wav");
    }

    create() {
        this.cameras.main.fadeIn(350, 0, 0, 0);

        this.started = false;
        this.selectedIndex = 0;

        this.add.image(640, 360, "menuBg")
            .setDisplaySize(1280, 720);

        this.menuMusic = this.sound.add("menuMusic", {
            volume: 0.5,
            loop: true
        });

        this.sfxSelectOption = this.sound.add("sfxSelectOption", {
            volume: 0.55
        });

        this.sfxClicked = this.sound.add("sfxClicked", {
            volume: 0.65
        });

        if (!this.sound.locked) {
            this.menuMusic.play();
        } else {
            this.sound.once("unlocked", () => {
                if (this.menuMusic && !this.menuMusic.isPlaying) {
                    this.menuMusic.play();
                }
            });
        }

        this.keys = this.input.keyboard.addKeys({
            UP: Phaser.Input.Keyboard.KeyCodes.UP,
            DOWN: Phaser.Input.Keyboard.KeyCodes.DOWN,
            W: Phaser.Input.Keyboard.KeyCodes.W,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            ENTER: Phaser.Input.Keyboard.KeyCodes.ENTER,
            SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        this.criarMenuInvisivel();

        this.events.on("shutdown", this.finalizarCena, this);
        this.events.on("destroy", this.finalizarCena, this);
    }

    trocarCenaComFade(sceneKey, data = {}) {
        this.cameras.main.fadeOut(350, 0, 0, 0);

        this.cameras.main.once(
            Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
            () => {
                this.scene.start(sceneKey, data);
            }
        );
    }

    tocarSom(audio, restart = true) {
        if (!audio) return;

        if (restart && audio.isPlaying) {
            audio.stop();
        }

        audio.play();
    }

    criarMenuInvisivel() {
         this.menuItems = [
            {
                label: "JOGAR",
                x: 835,
                y: 389,
                width: 400,
                height: 72,
                action: () => this.iniciarJogo()
            },
            {
                label: "OPÇÕES",
                x: 835,
                y: 455,
                width: 400,
                height: 72,
                action: () => this.abrirOpcoes()
            },
            {
                label: "CRÉDITOS",
                x: 835,
                y: 530,
                width: 400,
                height: 72,
                action: () => this.abrirCreditos()
            },
            {
                label: "SAIR",
                x: 835,
                y: 610,
                width: 400,
                height: 60,
                action: () => this.sairDoJogo()
            }
        ];

        this.menuItems.forEach((item, index) => {
            const zone = this.add.zone(item.x, item.y, item.width, item.height)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });

           zone.on("pointerover", () => {
                if (this.selectedIndex !== index) {
                    this.selectedIndex = index;
                    this.tocarSom(this.sfxSelectOption, true);
                    this.atualizarSelecaoVisual();
                }
            });

            zone.on("pointerdown", () => {
                this.executarItemSelecionado();
            });

            item.zone = zone;
        });

        this.selectionArrow = this.add.text(0, 0, "▶", {
            fontSize: "24px",
            color: "#fff36b",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 3
        })
            .setOrigin(0.5)
            .setDepth(31);

        this.tweens.add({
            targets: this.selectionArrow,
            x: '+=4',
            duration: 350,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.atualizarSelecaoVisual();
    }

    update() {
        if (this.started) return;

        const up =
            Phaser.Input.Keyboard.JustDown(this.keys.UP) ||
            Phaser.Input.Keyboard.JustDown(this.keys.W);

        const down =
            Phaser.Input.Keyboard.JustDown(this.keys.DOWN) ||
            Phaser.Input.Keyboard.JustDown(this.keys.S);

        const confirm =
            Phaser.Input.Keyboard.JustDown(this.keys.ENTER) ||
            Phaser.Input.Keyboard.JustDown(this.keys.SPACE);

       if (up) {
            this.selectedIndex--;

            if (this.selectedIndex < 0) {
                this.selectedIndex = this.menuItems.length - 1;
            }

            this.tocarSom(this.sfxSelectOption, true);
            this.atualizarSelecaoVisual();
        }

        if (down) {
            this.selectedIndex++;

            if (this.selectedIndex >= this.menuItems.length) {
                this.selectedIndex = 0;
            }

            this.tocarSom(this.sfxSelectOption, true);
            this.atualizarSelecaoVisual();
        }

        if (confirm) {
            this.executarItemSelecionado();
        }
    }

       atualizarSelecaoVisual() {
        if (!this.selectionArrow || !this.menuItems) return;

        const item = this.menuItems[this.selectedIndex];

        this.selectionArrow.setPosition(
            item.x - item.width / 2 - 18,
            item.y
        );
    }

    executarItemSelecionado() {
        const item = this.menuItems[this.selectedIndex];

        if (!item || typeof item.action !== "function") return;

        this.tocarSom(this.sfxClicked, true);

        this.time.delayedCall(180, () => {
            item.action();
        });
    }

    iniciarJogo() {
        this.trocarCenaComFade("Lore");
        if (this.started) return;

        this.started = true;

        if (this.menuMusic) {
            this.menuMusic.stop();
        }

        this.scene.start("Lore");
    }

    abrirOpcoes() {
        console.log("Abrir opções");

        // Quando tiver cena de opções:
        // this.scene.start("Options");
    }

    abrirCreditos() {
        console.log("Abrir créditos");

        // Quando tiver cena de créditos:
        // this.scene.start("Credits");
    }

    sairDoJogo() {
        console.log("Sair do jogo");

        // No navegador não dá para fechar a aba livremente.
        // Se estiver empacotado em Electron/Tauri, depois dá para chamar o fechamento real.
    }

     finalizarCena() {
        const audios = [
            this.menuMusic,
            this.sfxSelectOption,
            this.sfxClicked
        ];

        audios.forEach((audio) => {
            if (audio) {
                audio.stop();
                audio.destroy();
            }
        });

        this.menuMusic = null;
        this.sfxSelectOption = null;
        this.sfxClicked = null;
    }
}