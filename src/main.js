import { Boot } from "./scenes/Boot.js";
import { Splash } from "./scenes/Splash.js";
import { Start } from "./scenes/Start.js";
import { Lore } from "./scenes/Lore.js";
import { Cene1 } from "./scenes/cene1.js";
import { PhaseTraining } from "./scenes/PhaseTraining.js";
import { Phase1 } from "./scenes/Phase1.js";
import { Phase2 } from "./scenes/Phase2.js";
import { Phase3 } from "./scenes/Phase3.js";
import { Phase4 } from "./scenes/Phase4.js";
import { Phase5 } from "./scenes/Phase5.js";
import { Phase6 } from "./scenes/Phase6.js";
import { Phase7 } from "./scenes/Phase7.js";
import { Credits } from "./scenes/Credits.js";
import { Options } from "./scenes/Options.js";

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
     dom: {
        createContainer: true
    },
    scene: [Boot ,Splash, Start, Lore, Cene1, 
            PhaseTraining, Phase1, Phase2, Phase3, Phase4, Phase5, Phase6, Phase7, 
            Options, Credits]
};

new Phaser.Game(config);