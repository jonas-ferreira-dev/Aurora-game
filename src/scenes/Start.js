export class Start extends Phaser.Scene {
    constructor() {
        super("Start");
    }

    preload() {
        this.load.image("menuBg", "assets/start/menu-bg.jpg");

        this.load.audio("menuMusic", [
            "assets/audio/menu.mp3",
            "assets/audio/menu.ogg"
        ]);
    }

    create() {
        this.add.image(640, 360, "menuBg").setDisplaySize(1280, 720);

        this.started = false;

        this.menuMusic = this.sound.add("menuMusic", {
            volume: 0.5,
            loop: true
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

        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

        this.pressText = this.add.text(640, 650, "APERTE ENTER", {
            fontSize: "28px",
            color: "#ffffff",
            fontStyle: "bold"
        }).setOrigin(0.5);

        this.tweens.add({
            targets: this.pressText,
            alpha: 0.3,
            duration: 700,
            yoyo: true,
            repeat: -1
        });

        this.events.on("shutdown", this.finalizarCena, this);
        this.events.on("destroy", this.finalizarCena, this);
    }

    update() {
        if (this.started) return;

        if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
            this.started = true;

            if (this.menuMusic) {
                this.menuMusic.stop();
            }

            this.scene.start("Lore");
        }
    }

    finalizarCena() {
        if (this.menuMusic) {
            this.menuMusic.stop();
            this.menuMusic.destroy();
            this.menuMusic = null;
        }
    }
}