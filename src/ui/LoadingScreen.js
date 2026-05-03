export function setupAuroraLoading(scene, titulo = "BATALHA AURORA") {
    const width = scene.scale.width;
    const height = scene.scale.height;

    scene.cameras.main.setBackgroundColor("#12091f");

    const bg = scene.add.image(width / 2, height / 2, "loadingBg")
        .setDisplaySize(width, height)
        .setScrollFactor(0)
        .setDepth(999990);

    const leona = scene.add.image(width / 2, 355, "loadingLeona")
        .setScrollFactor(0)
        .setDepth(999995);

    const escalaLeona = Math.min(
        400 / leona.width,
        400 / leona.height
    );

    leona.setScale(escalaLeona);

    scene.tweens.add({
        targets: leona,
        y: leona.y - 8,
        duration: 650,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
    });

    const titleText = scene.add.text(width / 2, 82, titulo, {
        fontSize: "64px",
        color: "#fff6c7",
        fontStyle: "bold",
        stroke: "#2a1708",
        strokeThickness: 10
    })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1000000);

    const loadingText = scene.add.text(width / 2, 545, "CARREGANDO... 0%", {
        fontSize: "34px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 7
    })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1000000);

    const barX = width / 2 - 480;
    const barY = 612;
    const barW = 960;
    const barH = 58;

    const barBg = scene.add.graphics()
        .setScrollFactor(0)
        .setDepth(1000000);

    const barFill = scene.add.graphics()
        .setScrollFactor(0)
        .setDepth(1000001);

    function desenharBarra(value) {
        const progress = Phaser.Math.Clamp(value, 0, 1);

        barBg.clear();
        barBg.fillStyle(0x050505, 0.96);
        barBg.fillRoundedRect(barX, barY, barW, barH, 14);
        barBg.lineStyle(4, 0xffffff, 0.75);
        barBg.strokeRoundedRect(barX, barY, barW, barH, 14);
        barBg.lineStyle(3, 0x000000, 0.9);
        barBg.strokeRoundedRect(barX + 6, barY + 6, barW - 12, barH - 12, 10);

        barFill.clear();

        const fillW = (barW - 28) * progress;

        if (fillW <= 0) return;

        barFill.fillStyle(0xff3b12, 1);
        barFill.fillRoundedRect(barX + 14, barY + 14, fillW, barH - 28, 8);

        barFill.fillStyle(0xffc928, 0.75);
        barFill.fillRoundedRect(barX + 18, barY + 17, Math.max(0, fillW - 8), 13, 6);

        barFill.fillStyle(0xffffff, 0.18);
        barFill.fillRoundedRect(barX + 18, barY + 15, Math.max(0, fillW - 8), 7, 5);
    }

    desenharBarra(0);

    scene.load.on("progress", (value) => {
        const percent = Math.round(value * 100);

        loadingText.setText(`CARREGANDO... ${percent}%`);
        desenharBarra(value);
    });

    scene.load.once("complete", () => {
        scene.tweens.add({
            targets: [
                bg,
                leona,
                titleText,
                loadingText,
                barBg,
                barFill
            ],
            alpha: 0,
            duration: 220,
            onComplete: () => {
                bg.destroy();
                leona.destroy();
                titleText.destroy();
                loadingText.destroy();
                barBg.destroy();
                barFill.destroy();
            }
        });
    });
}