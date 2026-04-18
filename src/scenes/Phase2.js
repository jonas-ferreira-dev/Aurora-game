import { BattleScene } from "./BattleScene.js";

export class Phase2 extends BattleScene {
    constructor() {
        super("Phase2");

        this.phaseData = {
            nome: "FASE 2 - NAVIO",
            theme: "ship",
            top: 150,
            bottom: 620,
            enemyLife: 4,
            enemySpeed: 120,
            enemyPositions: [
                { x: 880, y: 240 },
                { x: 980, y: 330 },
                { x: 820, y: 430 },
                { x: 1080, y: 520 }
            ]
        };

        this.nextSceneKey = null;
    }
}