export class Game extends Phaser.Scene {
    constructor() {
        super("Game");
    }

    init(data) {
        this.phase = data.phase || 1;
        this.startLife = data.playerLife ?? 100;
    }

    create() {
        this.w = this.scale.width;
        this.h = this.scale.height;

        this.playerSpeed = 220;
        this.playerLife = this.startLife;
        this.playerMaxLife = 100;
        this.playerFacing = "right";
        this.attackCooldown = false;
        this.playerInvulnerable = false;
        this.gameOver = false;
        this.phaseFinished = false;
        this.waitingNextPhase = false;

        this.phaseConfig = this.getPhaseConfig(this.phase);

        this.desenharCenario();
        this.criarHUD();
        this.criarPlayer();
        this.criarInimigos();
        this.criarControles();

        this.physics.add.overlap(this.player, this.enemies, this.receberDano, null, this);

        this.mostrarBannerFase();
    }

    getPhaseConfig(phase) {
        if (phase === 2) {
            return {
                nome: "FASE 2 - NAVIO",
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
        }

        return {
            nome: "FASE 1 - RUA",
            top: 150,
            bottom: 620,
            enemyLife: 3,
            enemySpeed: 105,
            enemyPositions: [
                { x: 840, y: 240 },
                { x: 950, y: 320 },
                { x: 790, y: 410 },
                { x: 1080, y: 500 }
            ]
        };
    }

    desenharCenario() {
        if (this.phase === 1) {
            this.desenharRua();
        } else {
            this.desenharNavio();
        }

        this.streetTop = this.phaseConfig.top;
        this.streetBottom = this.phaseConfig.bottom;

        this.physics.world.setBounds(
            0,
            this.streetTop,
            this.w,
            this.streetBottom - this.streetTop
        );
    }

    desenharRua() {
        this.add.rectangle(this.w / 2, this.h / 2, this.w, this.h, 0x1f1f1f);

        this.add.rectangle(this.w / 2, 95, this.w, 110, 0x2f2f2f);
        this.add.rectangle(this.w / 2, 385, this.w, 470, 0x454545);
        this.add.rectangle(this.w / 2, 685, this.w, 70, 0x2f2f2f);

        this.add.rectangle(this.w / 2, 235, this.w, 4, 0xffff00, 0.35);
        this.add.rectangle(this.w / 2, 535, this.w, 4, 0xffff00, 0.35);

        this.add.text(this.w / 2, 345, "RUA", {
            fontSize: "42px",
            color: "#bbbbbb",
            fontStyle: "bold"
        }).setOrigin(0.5);
    }

    desenharNavio() {
        this.add.rectangle(this.w / 2, this.h / 2, this.w, this.h, 0x0f2233);

        this.add.rectangle(this.w / 2, 100, this.w, 120, 0x13364d);
        this.add.rectangle(this.w / 2, 385, this.w, 470, 0x6e4d2f);
        this.add.rectangle(this.w / 2, 685, this.w, 70, 0x13364d);

        this.add.rectangle(this.w / 2, 250, this.w, 6, 0xd9c28f, 0.35);
        this.add.rectangle(this.w / 2, 540, this.w, 6, 0xd9c28f, 0.35);

        this.add.text(this.w / 2, 350, "NAVIO", {
            fontSize: "42px",
            color: "#f1dfb5",
            fontStyle: "bold"
        }).setOrigin(0.5);

        this.add.rectangle(170, 385, 12, 470, 0x4b2d18);
        this.add.rectangle(this.w - 170, 385, 12, 470, 0x4b2d18);
    }

    criarHUD() {
        this.add.rectangle(this.w / 2, 35, this.w, 70, 0x000000, 0.8).setDepth(1000);

        this.iconBg = this.add.circle(42, 35, 20, 0x3aa0ff).setDepth(1001);
        this.iconLetter = this.add.text(42, 35, "P", {
            fontSize: "22px",
            color: "#ffffff",
            fontStyle: "bold"
        }).setOrigin(0.5).setDepth(1002);

        this.add.text(74, 18, "PLAYER", {
            fontSize: "22px",
            color: "#ffffff",
            fontStyle: "bold"
        }).setDepth(1001);

        this.lifeBarBg = this.add.rectangle(180, 36, 260, 20, 0x4a1111)
            .setOrigin(0, 0.5)
            .setDepth(1001);

        this.lifeBar = this.add.rectangle(180, 36, 260, 20, 0x19c15e)
            .setOrigin(0, 0.5)
            .setDepth(1002);

        this.lifeText = this.add.text(455, 20, "", {
            fontSize: "20px",
            color: "#ffffff"
        }).setDepth(1001);

        this.phaseText = this.add.text(this.w / 2, 18, this.phaseConfig.nome, {
            fontSize: "24px",
            color: "#ffffaa",
            fontStyle: "bold"
        }).setOrigin(0.5, 0).setDepth(1001);

        this.enemyCountText = this.add.text(this.w - 220, 20, "", {
            fontSize: "20px",
            color: "#ffffff"
        }).setDepth(1001);

        this.helpText = this.add.text(20, this.h - 32, "Mover: WASD/setas | Ataque: ESPACO | ENTER: continuar fase | ESC: menu", {
            fontSize: "18px",
            color: "#ffffff"
        }).setDepth(1001);

        this.atualizarHUD();
    }

    criarPlayer() {
        this.player = this.add.rectangle(180, 390, 44, 62, 0x3aa0ff);
        this.physics.add.existing(this.player);

        this.player.body.setCollideWorldBounds(true);
        this.player.body.setSize(44, 62);

        this.player.setDepth(this.player.y);
    }

    criarInimigos() {
        this.enemies = this.physics.add.group();

        this.phaseConfig.enemyPositions.forEach((pos) => {
            const enemy = this.add.rectangle(pos.x, pos.y, 44, 62, 0xff4444);
            this.physics.add.existing(enemy);

            enemy.body.setCollideWorldBounds(true);
            enemy.body.setSize(44, 62);

            enemy.life = this.phaseConfig.enemyLife;
            enemy.speed = this.phaseConfig.enemySpeed;
            enemy.hitCooldown = false;

            enemy.setDepth(enemy.y);

            this.enemies.add(enemy);
        });

        this.atualizarHUD();
    }

    criarControles() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

        this.keySpace.on("down", () => {
            this.atacar();
        });

        this.keyEnter.on("down", () => {
            if (this.waitingNextPhase && this.phase === 1) {
                this.scene.start("Game", {
                    phase: 2,
                    playerLife: this.playerLife
                });
            }
        });

        this.keyEsc.on("down", () => {
            this.scene.start("Start");
        });
    }

    mostrarBannerFase() {
        const banner = this.add.text(this.w / 2, this.h / 2 - 120, this.phaseConfig.nome, {
            fontSize: "38px",
            color: "#ffffff",
            backgroundColor: "#000000",
            padding: { x: 18, y: 10 }
        })
        .setOrigin(0.5)
        .setDepth(3000);

        this.time.delayedCall(1000, () => {
            this.tweens.add({
                targets: banner,
                alpha: 0,
                duration: 350,
                onComplete: () => banner.destroy()
            });
        });
    }

    update() {
        if (this.gameOver) {
            return;
        }

        if (!this.phaseFinished) {
            this.movimentarPlayer();
            this.atualizarIAInimigos();
            this.atualizarProfundidade();

            if (this.enemies.countActive(true) === 0) {
                this.finalizarFase();
            }
        } else {
            this.player.body.setVelocity(0, 0);
        }
    }

    movimentarPlayer() {
        let vx = 0;
        let vy = 0;

        const left = this.cursors.left.isDown || this.keyA.isDown;
        const right = this.cursors.right.isDown || this.keyD.isDown;
        const up = this.cursors.up.isDown || this.keyW.isDown;
        const down = this.cursors.down.isDown || this.keyS.isDown;

        if (left) {
            vx = -this.playerSpeed;
            this.playerFacing = "left";
        } else if (right) {
            vx = this.playerSpeed;
            this.playerFacing = "right";
        }

        if (up) {
            vy = -this.playerSpeed * 0.75;
        } else if (down) {
            vy = this.playerSpeed * 0.75;
        }

        this.player.body.setVelocity(vx, vy);

        if (this.player.y < this.streetTop) {
            this.player.y = this.streetTop;
        }

        if (this.player.y > this.streetBottom) {
            this.player.y = this.streetBottom;
        }
    }

    atualizarIAInimigos() {
        this.enemies.getChildren().forEach((enemy) => {
            if (!enemy.active) return;

            const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

            if (dist > 50) {
                this.physics.moveToObject(enemy, this.player, enemy.speed);
            } else {
                enemy.body.setVelocity(0, 0);
            }

            if (enemy.y < this.streetTop) {
                enemy.y = this.streetTop;
            }

            if (enemy.y > this.streetBottom) {
                enemy.y = this.streetBottom;
            }
        });
    }

    atualizarProfundidade() {
        this.player.setDepth(this.player.y);

        this.enemies.getChildren().forEach((enemy) => {
            if (enemy.active) {
                enemy.setDepth(enemy.y);
            }
        });
    }

    atacar() {
        if (this.attackCooldown || this.phaseFinished || this.gameOver) {
            return;
        }

        this.attackCooldown = true;

        let attackX = this.player.x;
        let attackY = this.player.y;

        if (this.playerFacing === "right") {
            attackX += 52;
        } else {
            attackX -= 52;
        }

        const attackZone = this.add.rectangle(attackX, attackY, 60, 54, 0xffff00, 0.35);
        this.physics.add.existing(attackZone);

        attackZone.body.allowGravity = false;
        attackZone.body.moves = false;

        this.physics.add.overlap(attackZone, this.enemies, (zone, enemy) => {
            this.danoNoInimigo(enemy);
        });

        this.time.delayedCall(100, () => {
            attackZone.destroy();
        });

        this.time.delayedCall(260, () => {
            this.attackCooldown = false;
        });
    }

    danoNoInimigo(enemy) {
        if (!enemy.active || enemy.hitCooldown) {
            return;
        }

        enemy.hitCooldown = true;
        enemy.life -= 1;
        enemy.fillColor = 0xffffff;

        const knockback = this.playerFacing === "right" ? 150 : -150;
        enemy.body.setVelocity(knockback, 0);

        this.time.delayedCall(100, () => {
            if (enemy.active) {
                enemy.fillColor = 0xff4444;
            }
        });

        if (enemy.life <= 0) {
            enemy.body.setVelocity(0, 0);

            this.tweens.add({
                targets: enemy,
                alpha: 0,
                duration: 180,
                onComplete: () => {
                    enemy.destroy();
                    this.atualizarHUD();
                }
            });
        }

        this.time.delayedCall(250, () => {
            if (enemy.active) {
                enemy.hitCooldown = false;
            }
        });
    }

    receberDano(player, enemy) {
        if (this.playerInvulnerable || !enemy.active || this.phaseFinished || this.gameOver) {
            return;
        }

        this.playerInvulnerable = true;
        this.playerLife -= 10;

        if (this.playerLife < 0) {
            this.playerLife = 0;
        }

        this.player.fillColor = 0xffffff;
        this.atualizarHUD();

        const knockback = enemy.x < player.x ? 180 : -180;
        player.body.setVelocity(knockback, 0);

        this.time.delayedCall(120, () => {
            if (!this.gameOver) {
                this.player.fillColor = 0x3aa0ff;
            }
        });

        this.time.delayedCall(700, () => {
            this.playerInvulnerable = false;
        });

        if (this.playerLife <= 0) {
            this.mostrarGameOver();
        }
    }

    atualizarHUD() {
        const porcentagem = this.playerLife / this.playerMaxLife;
        this.lifeBar.width = 260 * porcentagem;
        this.lifeText.setText(`${this.playerLife} / ${this.playerMaxLife}`);
        this.enemyCountText.setText(`Inimigos: ${this.enemies ? this.enemies.countActive(true) : 0}`);
    }

    finalizarFase() {
        this.phaseFinished = true;

        this.enemies.getChildren().forEach((enemy) => {
            if (enemy.active) {
                enemy.body.setVelocity(0, 0);
            }
        });

        this.add.rectangle(this.w / 2, this.h / 2, this.w, this.h, 0x000000, 0.4).setDepth(2000);

        if (this.phase === 1) {
            this.waitingNextPhase = true;

            this.add.text(this.w / 2, this.h / 2 - 20, "FASE 1 CONCLUIDA", {
                fontSize: "44px",
                color: "#44ff88",
                fontStyle: "bold"
            }).setOrigin(0.5).setDepth(2001);

            this.add.text(this.w / 2, this.h / 2 + 38, "ENTER para entrar no navio", {
                fontSize: "26px",
                color: "#ffffff"
            }).setOrigin(0.5).setDepth(2001);
        } else {
            this.add.text(this.w / 2, this.h / 2 - 20, "FASE 2 CONCLUIDA", {
                fontSize: "44px",
                color: "#44ff88",
                fontStyle: "bold"
            }).setOrigin(0.5).setDepth(2001);

            this.add.text(this.w / 2, this.h / 2 + 38, "Demo finalizada - ESC para voltar ao menu", {
                fontSize: "26px",
                color: "#ffffff"
            }).setOrigin(0.5).setDepth(2001);
        }
    }

    mostrarGameOver() {
        this.gameOver = true;
        this.player.body.setVelocity(0, 0);

        this.enemies.getChildren().forEach((enemy) => {
            if (enemy.active) {
                enemy.body.setVelocity(0, 0);
            }
        });

        this.add.rectangle(this.w / 2, this.h / 2, this.w, this.h, 0x000000, 0.5).setDepth(2000);

        this.add.text(this.w / 2, this.h / 2 - 20, "GAME OVER", {
            fontSize: "46px",
            color: "#ff4444",
            fontStyle: "bold"
        }).setOrigin(0.5).setDepth(2001);

        this.add.text(this.w / 2, this.h / 2 + 36, "ESC para voltar ao menu", {
            fontSize: "24px",
            color: "#ffffff"
        }).setOrigin(0.5).setDepth(2001);
    }
}