import { Splash } from "./scenes/Splash.js";
import { Start } from "./scenes/Start.js";
import { Lore } from "./scenes/Lore.js";
import { Cene1 } from "./scenes/cene1.js";
import { Phase1 } from "./scenes/Phase1.js";
import { Phase2 } from "./scenes/Phase2.js";
import { Credits } from "./scenes/Credits.js";

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    backgroundColor: "#000000",
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: "arcade",
        arcade: {
            debug: false
        }
    },
    scene: [Splash, Start, Lore, Cene1, Phase1, Phase2, Credits]
};

new Phaser.Game(config);