export class Options extends Phaser.Scene {
    constructor() {
        super("Options");
    }

    preload() {
        this.load.image("menuBgOptions", "assets/start/menu-test.jpg");

        this.load.audio("sfxSelectOption", "assets/audio/select_option.wav");
        this.load.audio("sfxClicked", "assets/audio/clicked.wav");
    }

    create() {
        this.cameras.main.fadeIn(300, 0, 0, 0);

        this.selectedIndex = 0;

        this.add.image(640, 360, "menuBgOptions")
            .setDisplaySize(1280, 720)
            .setAlpha(0.45);

        this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.48);

        this.sfxSelectOption = this.sound.add("sfxSelectOption", { volume: 0.55 });
        this.sfxClicked = this.sound.add("sfxClicked", { volume: 0.65 });

        this.keys = this.input.keyboard.addKeys({
            UP: Phaser.Input.Keyboard.KeyCodes.UP,
            DOWN: Phaser.Input.Keyboard.KeyCodes.DOWN,
            W: Phaser.Input.Keyboard.KeyCodes.W,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            LEFT: Phaser.Input.Keyboard.KeyCodes.LEFT,
            RIGHT: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            D: Phaser.Input.Keyboard.KeyCodes.D,
            ENTER: Phaser.Input.Keyboard.KeyCodes.ENTER,
            SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
            ESC: Phaser.Input.Keyboard.KeyCodes.ESC
        });

        this.musicVolume = Number(localStorage.getItem("musicVolume") ?? 0.5);
        this.sfxVolume = Number(localStorage.getItem("sfxVolume") ?? 0.65);
        this.fullscreenEnabled = false;

        this.title = this.add.text(640, 115, "OPÇÕES", {
            fontSize: "54px",
            color: "#fff6c7",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 8
        }).setOrigin(0.5);

        this.hint = this.add.text(640, 650, "W/S ou ↑/↓ para navegar  |  A/D ou ←/→ para ajustar  |  ENTER para confirmar  |  ESC para voltar", {
            fontSize: "18px",
            color: "#dddddd",
            stroke: "#000000",
            strokeThickness: 4
        }).setOrigin(0.5);

        this.menuItems = [
            {
                label: "VOLUME MÚSICA",
                type: "slider",
                getValue: () => this.musicVolume,
                change: (delta) => {
                    this.musicVolume = Phaser.Math.Clamp(this.musicVolume + delta, 0, 1);
                    localStorage.setItem("musicVolume", String(this.musicVolume));
                }
            },
            {
                label: "VOLUME SFX",
                type: "slider",
                getValue: () => this.sfxVolume,
                change: (delta) => {
                    this.sfxVolume = Phaser.Math.Clamp(this.sfxVolume + delta, 0, 1);
                    localStorage.setItem("sfxVolume", String(this.sfxVolume));

                    this.sfxSelectOption.setVolume(this.sfxVolume);
                    this.sfxClicked.setVolume(this.sfxVolume);
                }
            },
            {
                label: "TELA CHEIA",
                type: "action",
                getValue: () => this.scale.isFullscreen ? "ON" : "OFF",
                action: () => this.toggleFullscreen()
            },
            {
                label: "VOLTAR",
                type: "action",
                action: () => this.voltar()
            }
        ];

        this.itemTexts = [];
        this.valueTexts = [];

        this.criarItens();
        this.criarSeta();
        this.atualizarSelecaoVisual();

        this.events.on("shutdown", this.finalizarCena, this);
        this.events.on("destroy", this.finalizarCena, this);
    }

    criarItens() {
        const startY = 245;
        const gap = 82;

        this.menuItems.forEach((item, index) => {
            const y = startY + index * gap;

            const labelText = this.add.text(410, y, item.label, {
                fontSize: "32px",
                color: "#ffffff",
                fontStyle: "bold",
                stroke: "#000000",
                strokeThickness: 6
            }).setOrigin(0, 0.5);

            const valueText = this.add.text(850, y, this.formatarValor(item), {
                fontSize: "30px",
                color: "#ffd166",
                fontStyle: "bold",
                stroke: "#000000",
                strokeThickness: 6
            }).setOrigin(0.5);

            this.itemTexts.push(labelText);
            this.valueTexts.push(valueText);
        });
    }

    criarSeta() {
        this.selectionArrow = this.add.text(365, 245, "▶", {
            fontSize: "28px",
            color: "#fff36b",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 4
        }).setOrigin(0.5);

        this.tweens.add({
            targets: this.selectionArrow,
            x: "+=6",
            duration: 360,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
        });
    }

    update() {
        const up =
            Phaser.Input.Keyboard.JustDown(this.keys.UP) ||
            Phaser.Input.Keyboard.JustDown(this.keys.W);

        const down =
            Phaser.Input.Keyboard.JustDown(this.keys.DOWN) ||
            Phaser.Input.Keyboard.JustDown(this.keys.S);

        const left =
            Phaser.Input.Keyboard.JustDown(this.keys.LEFT) ||
            Phaser.Input.Keyboard.JustDown(this.keys.A);

        const right =
            Phaser.Input.Keyboard.JustDown(this.keys.RIGHT) ||
            Phaser.Input.Keyboard.JustDown(this.keys.D);

        const confirm =
            Phaser.Input.Keyboard.JustDown(this.keys.ENTER) ||
            Phaser.Input.Keyboard.JustDown(this.keys.SPACE);

        const back = Phaser.Input.Keyboard.JustDown(this.keys.ESC);

        if (up) {
            this.selectedIndex--;
            if (this.selectedIndex < 0) this.selectedIndex = this.menuItems.length - 1;
            this.tocarSom(this.sfxSelectOption);
            this.atualizarSelecaoVisual();
        }

        if (down) {
            this.selectedIndex++;
            if (this.selectedIndex >= this.menuItems.length) this.selectedIndex = 0;
            this.tocarSom(this.sfxSelectOption);
            this.atualizarSelecaoVisual();
        }

        if (left) {
            this.alterarOpcao(-0.1);
        }

        if (right) {
            this.alterarOpcao(0.1);
        }

        if (confirm) {
            const item = this.menuItems[this.selectedIndex];

            this.tocarSom(this.sfxClicked);

            if (item.type === "action" && typeof item.action === "function") {
                this.time.delayedCall(140, () => item.action());
            }
        }

        if (back) {
            this.voltar();
        }
    }

    alterarOpcao(delta) {
        const item = this.menuItems[this.selectedIndex];

        if (!item || item.type !== "slider") return;

        item.change(delta);
        this.tocarSom(this.sfxSelectOption);

        this.valueTexts[this.selectedIndex].setText(this.formatarValor(item));
    }

    formatarValor(item) {
        if (item.type === "slider") {
            return `${Math.round(item.getValue() * 100)}%`;
        }

        if (typeof item.getValue === "function") {
            return item.getValue();
        }

        return "";
    }

    atualizarSelecaoVisual() {
        const startY = 245;
        const gap = 82;

        this.selectionArrow.setY(startY + this.selectedIndex * gap);

        this.itemTexts.forEach((text, index) => {
            text.setColor(index === this.selectedIndex ? "#fff36b" : "#ffffff");
        });

        this.valueTexts.forEach((text, index) => {
            text.setColor(index === this.selectedIndex ? "#ffffff" : "#ffd166");
            text.setText(this.formatarValor(this.menuItems[index]));
        });
    }

    toggleFullscreen() {
        if (this.scale.isFullscreen) {
            this.scale.stopFullscreen();
        } else {
            this.scale.startFullscreen();
        }

        this.atualizarSelecaoVisual();
    }

    tocarSom(audio) {
        if (!audio) return;

        audio.stop();
        audio.play();
    }

    voltar() {
        this.cameras.main.fadeOut(300, 0, 0, 0);

        this.cameras.main.once(
            Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
            () => {
                this.scene.start("Start");
            }
        );
    }

    finalizarCena() {
        [this.sfxSelectOption, this.sfxClicked].forEach((audio) => {
            if (audio) {
                audio.stop();
                audio.destroy();
            }
        });

        this.sfxSelectOption = null;
        this.sfxClicked = null;
    }
}