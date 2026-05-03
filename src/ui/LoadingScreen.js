export function setupLoadingScreen(scene, titulo = "CARREGANDO...") {
    const width = scene.scale.width;
    const height = scene.scale.height;

    scene.cameras.main.setBackgroundColor("#05070d");

    const bg = scene.add.rectangle(
        width / 2,
        height / 2,
        width,
        height,
        0x05070d,
        1
    )
        .setScrollFactor(0)
        .setDepth(999999);

    const titleText = scene.add.text(width / 2, height / 2 - 95, titulo, {
        fontSize: "38px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 6
    })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1000000);

    const barBg = scene.add.rectangle(
        width / 2,
        height / 2,
        540,
        28,
        0x111111,
        1
    )
        .setStrokeStyle(3, 0xffffff, 0.9)
        .setScrollFactor(0)
        .setDepth(1000000);

    const barFill = scene.add.rectangle(
        width / 2 - 260,
        height / 2,
        0,
        18,
        0xffd166,
        1
    )
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(1000001);

    const percentText = scene.add.text(width / 2, height / 2 + 48, "0%", {
        fontSize: "24px",
        color: "#ffd166",
        fontStyle: "bold"
    })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1000000);

    const fileText = scene.add.text(width / 2, height / 2 + 86, "", {
        fontSize: "16px",
        color: "#aaaaaa"
    })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1000000);

    scene.load.on("progress", (value) => {
        barFill.width = 520 * value;
        percentText.setText(`${Math.round(value * 100)}%`);
    });

    scene.load.on("fileprogress", (file) => {
        fileText.setText(`Carregando: ${file.key}`);
    });

    scene.load.once("complete", () => {
        bg.destroy();
        titleText.destroy();
        barBg.destroy();
        barFill.destroy();
        percentText.destroy();
        fileText.destroy();
    });
}