export class Boot extends Phaser.Scene {
    constructor() {
        super("Boot");
    }

    preload() {
        this.load.image("loadingBg", "assets/loading/loading-bg.png");
        this.load.image("loadingLeona", "assets/loading/loading-leona.png");
    }

    create() {
        this.scene.start("Splash");
    }
}