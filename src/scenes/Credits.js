export class Credits extends Phaser.Scene {
    constructor() {
        super("Credits");
    }

    preload() {
        this.load.image("menuBgCredits", "assets/start/menu-test.jpg");

        this.load.audio("sfxClicked", "assets/audio/clicked.wav");
    }

    create() {
        this.cameras.main.fadeIn(300, 0, 0, 0);

        this.add.image(640, 360, "menuBgCredits")
            .setDisplaySize(1280, 720)
            .setAlpha(0.38);

        this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.58);

        this.sfxClicked = this.sound.add("sfxClicked", { volume: 0.65 });

        this.add.text(640, 95, "CRÉDITOS", {
            fontSize: "56px",
            color: "#fff6c7",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 8
        }).setOrigin(0.5);

        this.add.text(640, 205, "BATALHA EM AURORA", {
            fontSize: "38px",
            color: "#ffffff",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(640, 315, "Desenvolvimento", {
            fontSize: "28px",
            color: "#ffd166",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 5
        }).setOrigin(0.5);

        this.add.text(640, 360, "Jonas Ferreira / OrGames", {
            fontSize: "30px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 5
        }).setOrigin(0.5);

        this.add.text(640, 430, "Programação", {
            fontSize: "28px",
            color: "#ffd166",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 5
        }).setOrigin(0.5);

        this.add.text(640, 475, "Jonas Ferreira", {
            fontSize: "30px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 5
        }).setOrigin(0.5);

        this.add.text(640, 545, "Design / Direção Criativa", {
            fontSize: "28px",
            color: "#ffd166",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 5
        }).setOrigin(0.5);

        this.add.text(640, 590, "Jonas Ferreira / OrGames", {
            fontSize: "30px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 5
        }).setOrigin(0.5);

        this.add.text(640, 675, "Pressione ENTER, SPACE ou ESC para voltar", {
            fontSize: "20px",
            color: "#dddddd",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 4
        }).setOrigin(0.5);

        this.keys = this.input.keyboard.addKeys({
            ENTER: Phaser.Input.Keyboard.KeyCodes.ENTER,
            SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
            ESC: Phaser.Input.Keyboard.KeyCodes.ESC
        });

        this.input.once("pointerdown", () => {
            this.voltar();
        });

        this.events.on("shutdown", this.finalizarCena, this);
        this.events.on("destroy", this.finalizarCena, this);
    }

    update() {
        const voltar =
            Phaser.Input.Keyboard.JustDown(this.keys.ENTER) ||
            Phaser.Input.Keyboard.JustDown(this.keys.SPACE) ||
            Phaser.Input.Keyboard.JustDown(this.keys.ESC);

        if (voltar) {
            this.voltar();
        }
    }

    voltar() {
        if (this.saindo) return;

        this.saindo = true;

        if (this.sfxClicked) {
            this.sfxClicked.stop();
            this.sfxClicked.play();
        }

        this.cameras.main.fadeOut(300, 0, 0, 0);

        this.cameras.main.once(
            Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
            () => {
                this.scene.start("Start");
            }
        );
    }

    finalizarCena() {
        if (this.sfxClicked) {
            this.sfxClicked.stop();
            this.sfxClicked.destroy();
            this.sfxClicked = null;
        }
    }
}