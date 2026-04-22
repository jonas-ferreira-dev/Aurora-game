export class Cene1 extends Phaser.Scene {
    constructor() {
        super("Cene1");
    }

    preload() {
        this.load.image("dialogBg", "assets/dialog/dialog-bg.png");

        this.load.image("iconLeona", "assets/dialog/icon-leona.png");
        this.load.image("iconDaniel", "assets/dialog/icon-daniel.png");

        this.load.audio("dialogMusic", [
            "assets/audio/dialog.mp3",
            "assets/audio/dialog.ogg"
        ]);
    }

    create() {
        this.add.image(640, 360, "dialogBg").setDisplaySize(1280, 720);

        this.dialogMusic = this.sound.add("dialogMusic", {
            volume: 0.4,
            loop: true
        });

        if (!this.sound.locked) {
            this.dialogMusic.play();
        } else {
            this.sound.once("unlocked", () => {
                if (this.dialogMusic) {
                    this.dialogMusic.play();
                }
            });
        }

        this.dialogBox = this.add.rectangle(640, 585, 1160, 205, 0x000000, 0.72)
            .setStrokeStyle(3, 0xffffff);

        this.iconFrame = this.add.rectangle(130, 585, 120, 120, 0x111111, 0.95)
            .setStrokeStyle(2, 0xffffff);

        this.speakerIcon = this.add.image(130, 585, "iconLeona").setOrigin(0.5);
        this.ajustarIcone(this.speakerIcon, 100, 100);

        this.nomeText = this.add.text(210, 515, "", {
            fontSize: "28px",
            color: "#ffd166",
            fontStyle: "bold",
            fontFamily: "Georgia"
        });

        this.infoText = this.add.text(210, 550, "", {
            fontSize: "18px",
            color: "#bdbdbd",
            fontStyle: "italic",
            fontFamily: "Georgia"
        });

        this.dialogoText = this.add.text(210, 585, "", {
            fontSize: "22px",
            color: "#ffffff",
            fontFamily: "Georgia",
            wordWrap: { width: 900 }
        });

        this.hintText = this.add.text(1115, 650, "ENTER", {
            fontSize: "18px",
            color: "#e0e0e0",
            fontStyle: "bold",
            fontFamily: "Georgia"
        }).setOrigin(1, 0.5);

        this.tweens.add({
            targets: this.hintText,
            alpha: 0.35,
            duration: 700,
            yoyo: true,
            repeat: -1
        });

        this.dialogos = [
            {
                nome: "Leona",
                icone: "iconLeona",
                info: "",
                texto: "Essa rua tá estranha hoje... tá quieta demais."
            },
            {
                nome: "Daniel",
                icone: "iconDaniel",
                info: "no telefone",
                texto: "Leona, presta atenção. Recebi uma denúncia agora há pouco."
            },
            {
                nome: "Leona",
                icone: "iconLeona",
                info: "",
                texto: "Denúncia de quê?"
            },
            {
                nome: "Daniel",
                icone: "iconDaniel",
                info: "no telefone",
                texto: "Tem gente causando confusão mais à frente. Vai com cuidado."
            },
            {
                nome: "Leona",
                icone: "iconLeona",
                info: "",
                texto: "Entendi. Vou verificar isso agora."
            },
            {
                nome: "Daniel",
                icone: "iconDaniel",
                info: "no telefone",
                texto: "Qualquer coisa, me liga. E não tenta resolver tudo sozinha."
            },
            {
                nome: "Leona",
                icone: "iconLeona",
                info: "",
                texto: "Você me conhece bem demais, Daniel."
            }
        ];

        this.indiceAtual = 0;
        this.transicaoIniciada = false;
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

        this.mostrarDialogo();

        this.events.on("shutdown", this.finalizarCena, this);
        this.events.on("destroy", this.finalizarCena, this);
    }

    update() {
        if (this.transicaoIniciada) return;

        if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
            this.indiceAtual++;

            if (this.indiceAtual >= this.dialogos.length) {
                this.transicaoIniciada = true;

                if (this.dialogMusic) {
                    this.dialogMusic.stop();
                }

                this.scene.start("Phase7");
                return;
            }

            this.mostrarDialogo();
        }
    }

    mostrarDialogo() {
        const fala = this.dialogos[this.indiceAtual];

        this.speakerIcon.setTexture(fala.icone);
        this.ajustarIcone(this.speakerIcon, 100, 100);

        this.nomeText.setText(fala.nome);
        this.infoText.setText(fala.info);
        this.dialogoText.setText(fala.texto);
    }

    ajustarIcone(icon, maxLargura, maxAltura) {
        icon.setScale(1);

        const larguraOriginal = icon.width;
        const alturaOriginal = icon.height;

        const escala = Math.min(
            maxLargura / larguraOriginal,
            maxAltura / alturaOriginal
        );

        icon.setScale(escala);
    }

    finalizarCena() {
        if (this.dialogMusic) {
            this.dialogMusic.stop();
            this.dialogMusic.destroy();
            this.dialogMusic = null;
        }
    }
}