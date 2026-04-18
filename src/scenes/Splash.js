export class Splash extends Phaser.Scene {
    constructor() {
        super("Splash");
    }

    preload() {
        this.load.image("uermnLogo", "assets/uernm-logo.png");
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.cameras.main.setBackgroundColor("#000000");

        this.add.text(w / 2, h * 0.18, "APOIO / PATROCINIO", {
            fontSize: "28px",
            color: "#bbbbbb"
        }).setOrigin(0.5);

        const logo = this.add.image(w / 2, h / 2, "uermnLogo");
        logo.setDisplaySize(260, 260);
        logo.setAlpha(0);

        this.add.text(w / 2, h * 0.78, "Apresenta", {
            fontSize: "26px",
            color: "#ffffff"
        }).setOrigin(0.5).setAlpha(0);

        const presentText = this.add.text(w / 2, h * 0.78, "Apresenta", {
            fontSize: "26px",
            color: "#ffffff"
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: [logo, presentText],
            alpha: 1,
            duration: 700,
            ease: "Power2"
        });

        this.time.delayedCall(2200, () => {
            this.tweens.add({
                targets: [logo, presentText],
                alpha: 0,
                duration: 700,
                onComplete: () => {
                    this.scene.start("Start");
                }
            });
        });

        this.input.keyboard.on("keydown-ENTER", () => {
            this.scene.start("Start");
        });

        this.input.keyboard.on("keydown-SPACE", () => {
            this.scene.start("Start");
        });

        this.input.on("pointerdown", () => {
            this.scene.start("Start");
        });
    }
}