export class Lore extends Phaser.Scene {
    constructor() {
        super("Lore");
    }

    preload() {
        this.load.image("loreBg", "assets/start/lore.png");

        this.load.audio("loreMusic", [
            "assets/audio/lore.mp3",
            "assets/audio/lore.ogg"
        ]);
    }

    create() {
        this.skipped = false;

        this.add.image(640, 360, "loreBg").setDisplaySize(1280, 720);
        this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.45);

        const musicVolume = Number(localStorage.getItem("musicVolume") ?? 0.45);

        this.loreMusic = this.sound.add("loreMusic", {
            volume: musicVolume,
            loop: true
        });

        if (musicVolume > 0) {
            if (!this.sound.locked) {
                this.loreMusic.play();
            } else {
                this.sound.once("unlocked", () => {
                    if (this.loreMusic && !this.loreMusic.isPlaying) {
                        this.loreMusic.play();
                    }
                });
            }
        }

        const textoLore = [
            "A cidade de Aurora já não é a mesma.",
            "",
            "As ruas foram tomadas por gangues,",
            "corrupção e violência.",
            "",
            "Mesmo durante o dia, ninguém se sente seguro.",
            "",
            "Leona tenta seguir em frente,",
            "mas uma nova ameaça começa a crescer",
            "nos becos e avenidas da cidade.",
            "",
            "Do outro lado da linha, Daniel traz um aviso:",
            "algo está prestes a sair do controle.",
            "",
            "E quando Aurora chama...",
            "não existe espaço para recuar."
        ].join("\n");

        this.loreText = this.add.text(640, 900, textoLore, {
            fontSize: "34px",
            color: "#ffffff",
            align: "center",
            fontFamily: "Georgia",
            stroke: "#000000",
            strokeThickness: 4,
            lineSpacing: 12
        }).setOrigin(0.5, 0);

        this.skipText = this.add.text(640, 680, "ENTER para continuar", {
            fontSize: "24px",
            color: "#ffd166",
            fontStyle: "bold"
        }).setOrigin(0.5);

        this.tweens.add({
            targets: this.skipText,
            alpha: 0.35,
            duration: 700,
            yoyo: true,
            repeat: -1
        });

        this.scrollTween = this.tweens.add({
            targets: this.loreText,
            y: -900,
            duration: 26000,
            ease: "Linear",
            onComplete: () => {
                this.irParaDialogo();
            }
        });

        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

        this.events.on("shutdown", this.finalizarCena, this);
        this.events.on("destroy", this.finalizarCena, this);
    }

    update() {
        if (this.skipped) return;

        if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
            this.irParaDialogo();
        }
    }

    irParaDialogo() {
        if (this.skipped) return;
        this.skipped = true;

        if (this.scrollTween) {
            this.scrollTween.stop();
        }

        if (this.loreMusic) {
            this.loreMusic.stop();
        }

        this.scene.start("Cene1");
    }

    finalizarCena() {
        if (this.loreMusic) {
            this.loreMusic.stop();
            this.loreMusic.destroy();
            this.loreMusic = null;
        }
    }
}