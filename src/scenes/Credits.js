export class Credits extends Phaser.Scene {
    constructor() {
        super("Credits");
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.cameras.main.setBackgroundColor("#000000");

        this.add.text(w / 2, 60, "CREDITOS", {
            fontSize: "44px",
            color: "#ffffff",
            fontStyle: "bold"
        }).setOrigin(0.5);

        const creditLines = [
            "BEAT IN UP",
            "",
            "Projeto Demo",
            "",
            "Direcao",
            "Jonas Ferreira",
            "",
            "Programacao",
            "Alex Monteiro",
            "Marina Costa",
            "",
            "Game Design",
            "Caio Mendes",
            "Luana Ribeiro",
            "",
            "Arte Conceitual",
            "Rafaela Torres",
            "",
            "UI / HUD",
            "Bruno Azevedo",
            "",
            "Testes",
            "Equipe Phantom Lab",
            "",
            "Colaboracao Especial",
            "UERNM",
            "",
            "Obrigado por jogar"
        ];

        const creditsText = this.add.text(w / 2, h + 100, creditLines.join("\n"), {
            fontSize: "30px",
            color: "#dddddd",
            align: "center",
            lineSpacing: 12
        }).setOrigin(0.5, 0);

        this.tweens.add({
            targets: creditsText,
            y: -creditsText.height - 100,
            duration: 18000,
            ease: "Linear"
        });

        const skipText = this.add.text(w / 2, h - 40, "ENTER, ESC ou clique para voltar ao menu", {
            fontSize: "22px",
            color: "#aaaaaa"
        }).setOrigin(0.5);

        this.tweens.add({
            targets: skipText,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        this.input.keyboard.on("keydown-ENTER", () => {
            this.scene.start("Start");
        });

        this.input.keyboard.on("keydown-ESC", () => {
            this.scene.start("Start");
        });

        this.input.on("pointerdown", () => {
            this.scene.start("Start");
        });

        this.time.delayedCall(19000, () => {
            this.scene.start("Start");
        });
    }
}