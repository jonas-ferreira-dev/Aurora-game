export class TrainingEnemy {
    static preload(scene) {
        scene.load.image("enemy_idle", "assets/Enemy 1/idle.png");

        scene.load.image("enemy_walk1", "assets/Enemy 1/walking1.png");
        scene.load.image("enemy_walk2", "assets/Enemy 1/walking2.png");
        scene.load.image("enemy_walk3", "assets/Enemy 1/walking3.png");
        scene.load.image("enemy_walk4", "assets/Enemy 1/walking4.png");
        scene.load.image("enemy_walk5", "assets/Enemy 1/walking5.png");
        scene.load.image("enemy_walk6", "assets/Enemy 1/walking6.png");

        scene.load.image("enemy_punch1", "assets/Enemy 1/punch1.png");
        scene.load.image("enemy_punch2", "assets/Enemy 1/punch2.png");
        scene.load.image("enemy_punch3", "assets/Enemy 1/punch3.png");

        scene.load.image("enemy_damage", "assets/Enemy 1/damage.png");
        scene.load.image("enemy_death1", "assets/Enemy 1/death1.png");
        scene.load.image("enemy_death2", "assets/Enemy 1/death2.png");
    }

    static createAnimations(scene) {
        if (!scene.anims.exists("enemy_idle")) {
            scene.anims.create({
                key: "enemy_idle",
                frames: [{ key: "enemy_idle" }],
                frameRate: 1,
                repeat: -1
            });
        }

        if (!scene.anims.exists("enemy_walk")) {
            scene.anims.create({
                key: "enemy_walk",
                frames: [
                    { key: "enemy_walk1" },
                    { key: "enemy_walk2" },
                    { key: "enemy_walk3" },
                    { key: "enemy_walk4" },
                    { key: "enemy_walk5" },
                    { key: "enemy_walk6" }
                ],
                frameRate: 6.5,
                repeat: -1
            });
        }

        if (!scene.anims.exists("enemy_death")) {
            scene.anims.create({
                key: "enemy_death",
                frames: [
                    { key: "enemy_death1" },
                    { key: "enemy_death2" }
                ],
                frameRate: 5,
                repeat: 0
            });
        }
    }

    constructor(scene, x, y, config = {}) {
        this.scene = scene;

        this.worldWidth = config.worldWidth ?? 1280;
        this.floorTop = config.floorTop ?? 470;
        this.floorBottom = config.floorBottom ?? 675;
        this.alturaEnemy = config.alturaEnemy ?? 196;

        this.sprite = scene.physics.add.sprite(x, y, "enemy_idle");
        this.sprite.setOrigin(0.5, 1);
        this.sprite.setCollideWorldBounds(true);

        this.ajustarEscalaSprite();
        this.sprite.play("enemy_idle");
        this.sprite.setFlipX(true);

        this.sprite.on(Phaser.Animations.Events.ANIMATION_UPDATE, () => {
            this.ajustarEscalaSprite();
        });

        this.data = {
            maxHp: 100,
            currentHp: 100,
            speed: 105,
            damage: 8,

            isDead: false,
            isAttacking: false,
            isHurt: false,

            isBeingThrown: false,
            isReturning: false,
            hurtReturnEvent: null,

            attackCooldown: 700,
            lastAttackTime: -9999,
            attackRangeX: 96,
            attackRangeY: 60,
            personalSpace: 62
        };
    }

    update(player, aiEnabled = true) {
        if (!this.sprite || !this.sprite.active) return;

        const sprite = this.sprite;
        const data = this.data;

        if (data.isDead) {
            sprite.body.setVelocity(0, 0);
            return;
        }

        if (!player || player.isDead) {
            sprite.body.setVelocity(0, 0);
            return;
        }

        if (data.isBeingThrown || data.isReturning) {
            sprite.body.setVelocity(0, 0);
            return;
        }

        if (!aiEnabled) {
            if (!data.isAttacking && !data.isHurt) {
                sprite.body.setVelocity(0, 0);

                if (sprite.anims.currentAnim?.key !== "enemy_idle") {
                    sprite.play("enemy_idle", true);
                }
            }

            return;
        }

        if (data.isAttacking || data.isHurt) {
            sprite.body.setVelocity(0, 0);
            return;
        }

        const dx = player.sprite.x - sprite.x;
        const dyGround = player.getGroundY() - sprite.y;
        const dyAttack = player.sprite.y - sprite.y;

        const distanciaX = Math.abs(dx);
        const distanciaYGround = Math.abs(dyGround);
        const distanciaYAttack = Math.abs(dyAttack);

        const dentroDoAtaque =
            distanciaX <= data.attackRangeX &&
            distanciaYAttack <= data.attackRangeY &&
            !player.isJumping;

        const leonaAtacando =
            player.inAction &&
            player.isOffensiveAction();

        const grudadoNaLeona =
            distanciaX <= 48 &&
            distanciaYGround <= 38;

        if (leonaAtacando && grudadoNaLeona) {
            const direcaoX = sprite.x < player.sprite.x ? -1 : 1;
            const direcaoY = sprite.y < player.getGroundY() ? -1 : 1;

            const vx = direcaoX * data.speed * 0.75;
            const vy = direcaoY * data.speed * 0.35;

            sprite.body.setVelocity(vx, vy);

            if (vx < 0) sprite.setFlipX(true);
            if (vx > 0) sprite.setFlipX(false);

            if (sprite.anims.currentAnim?.key !== "enemy_walk") {
                sprite.play("enemy_walk", true);
            }

            sprite.y = Phaser.Math.Clamp(sprite.y, this.floorTop, this.floorBottom);
            return;
        }

        if (dentroDoAtaque) {
            if (this.scene.time.now > data.lastAttackTime + data.attackCooldown) {
                this.atacar(player);
                return;
            }

            sprite.body.setVelocity(dx < 0 ? -22 : 22, dyGround < 0 ? -14 : 14);

            if (dx < 0) sprite.setFlipX(true);
            if (dx > 0) sprite.setFlipX(false);

            if (sprite.anims.currentAnim?.key !== "enemy_walk") {
                sprite.play("enemy_walk", true);
            }

            return;
        }

        let vx = 0;
        let vy = 0;

        if (dx < -8) vx = -data.speed;
        if (dx > 8) vx = data.speed;
        if (dyGround < -8) vy = -data.speed * 0.65;
        if (dyGround > 8) vy = data.speed * 0.65;

        if (vx !== 0 && vy !== 0) {
            vx *= 0.7071;
            vy *= 0.7071;
        }

        sprite.body.setVelocity(vx, vy);

        if (vx < 0) sprite.setFlipX(true);
        if (vx > 0) sprite.setFlipX(false);

        const moving = Math.abs(vx) > 2 || Math.abs(vy) > 2;

        if (moving) {
            if (sprite.anims.currentAnim?.key !== "enemy_walk") {
                sprite.play("enemy_walk", true);
            }
        } else if (sprite.anims.currentAnim?.key !== "enemy_idle") {
            sprite.play("enemy_idle", true);
        }

        sprite.y = Phaser.Math.Clamp(sprite.y, this.floorTop, this.floorBottom);
    }

    atacar(player) {
        if (!player || player.isDead) return;
        if (this.data.isDead || this.data.isAttacking || this.data.isHurt) return;
        if (this.data.isBeingThrown || this.data.isReturning) return;

        const sprite = this.sprite;
        const data = this.data;

        data.isAttacking = true;
        data.lastAttackTime = this.scene.time.now;

        sprite.body.setVelocity(0, 0);
        sprite.anims.stop();

        if (player.sprite.x < sprite.x) {
            sprite.setFlipX(true);
        } else {
            sprite.setFlipX(false);
        }

        sprite.setTexture("enemy_punch1");
        this.ajustarEscalaSprite();

        this.scene.time.delayedCall(70, () => {
            if (!data.isDead && data.isAttacking) {
                sprite.setTexture("enemy_punch2");
                this.ajustarEscalaSprite();
            }
        });

        this.scene.time.delayedCall(125, () => {
            if (!data.isDead && data.isAttacking) {
                sprite.setTexture("enemy_punch3");
                this.ajustarEscalaSprite();
            }
        });

        this.scene.time.delayedCall(145, () => {
            if (data.isDead || player.isDead) return;
            if (data.isBeingThrown || data.isReturning) return;

            const dx = Math.abs(player.sprite.x - sprite.x);
            const dy = Math.abs(player.sprite.y - sprite.y);

            if (dx <= data.attackRangeX + 8 && dy <= data.attackRangeY && !player.isJumping) {
                player.receberDano(data.damage, sprite.x);
            }
        });

        this.scene.time.delayedCall(270, () => {
            if (!data.isDead && !data.isHurt && !data.isBeingThrown && !data.isReturning) {
                data.isAttacking = false;
                sprite.play("enemy_idle", true);
                this.ajustarEscalaSprite();
            } else {
                data.isAttacking = false;
            }
        });
    }

    receberDano(valor, opcoes = {}) {
        const player = opcoes.player;

        if (!this.sprite || !this.sprite.active) return false;

        const sprite = this.sprite;
        const data = this.data;

        if (data.isBeingThrown || data.isReturning) return false;

        // Boneco de treino: perde vida, mas nunca morre.
        data.currentHp -= valor;
        if (data.currentHp <= 0) {
            data.currentHp = 1;
        }

        data.isHurt = true;
        data.isAttacking = false;

        sprite.body.setVelocity(0, 0);
        sprite.anims.stop();
        sprite.setTexture("enemy_damage");
        this.ajustarEscalaSprite();

        this.scene.tocarSom?.(this.scene.sfxEnemyDamage, true);

        if (player) {
            const empurraoPequeno = player.sprite.flipX ? -18 : 18;

            sprite.x += empurraoPequeno;
            sprite.y += Phaser.Math.Between(-3, 3);
        }

        sprite.x = Phaser.Math.Clamp(sprite.x, 30, this.worldWidth - 30);
        sprite.y = Phaser.Math.Clamp(sprite.y, this.floorTop, this.floorBottom);

        data.lastAttackTime = this.scene.time.now + 350;

        if (data.hurtReturnEvent) {
            data.hurtReturnEvent.remove(false);
            data.hurtReturnEvent = null;
        }

        if (opcoes.arremessarDepois && player) {
            this.scene.time.delayedCall(90, () => {
                this.arremessar(player);
            });
        }

        data.hurtReturnEvent = this.scene.time.delayedCall(360, () => {
            if (!this.sprite || !this.sprite.active) return;
            if (data.isBeingThrown || data.isReturning) return;

            if (player && player.isComboActive()) {
                return;
            }

            data.isHurt = false;
            sprite.play("enemy_idle", true);
            this.ajustarEscalaSprite();
        });

        return true;
    }

    liberarHitstun() {
        if (!this.sprite || !this.sprite.active) return;

        const sprite = this.sprite;
        const data = this.data;

        if (data.isBeingThrown || data.isReturning) return;

        if (data.hurtReturnEvent) {
            data.hurtReturnEvent.remove(false);
            data.hurtReturnEvent = null;
        }

        data.hurtReturnEvent = this.scene.time.delayedCall(180, () => {
            if (!this.sprite || !this.sprite.active) return;
            if (data.isBeingThrown || data.isReturning) return;

            data.isHurt = false;
            data.isAttacking = false;

            sprite.body.setVelocity(0, 0);
            sprite.play("enemy_idle", true);
            this.ajustarEscalaSprite();
        });
    }

    arremessar(player) {
        if (!this.sprite || !this.sprite.active || !player) return;

        const sprite = this.sprite;
        const data = this.data;

        if (data.isBeingThrown || data.isReturning) return;

        if (data.hurtReturnEvent) {
            data.hurtReturnEvent.remove(false);
            data.hurtReturnEvent = null;
        }

        data.isHurt = true;
        data.isAttacking = false;
        data.isBeingThrown = true;
        data.isReturning = false;

        sprite.body.setVelocity(0, 0);
        sprite.anims.stop();
        sprite.setTexture("enemy_damage");
        this.ajustarEscalaSprite();

        this.scene.tweens.killTweensOf(sprite);

        const direcao = player.sprite.x < sprite.x ? 1 : -1;

        const xInicial = sprite.x;
        const yInicial = sprite.y;

        const xFinal = Phaser.Math.Clamp(
            xInicial + direcao * 210,
            70,
            this.worldWidth - 70
        );

        const yFinal = Phaser.Math.Clamp(
            yInicial + 18,
            this.floorTop,
            this.floorBottom
        );

        this.scene.tweens.add({
            targets: sprite,
            x: xInicial + direcao * 90,
            y: yInicial - 34,
            duration: 150,
            ease: "Quad.Out",
            onComplete: () => {
                if (!this.sprite || !this.sprite.active) return;

                sprite.play("enemy_death", true);
                this.ajustarEscalaSprite();

                this.scene.tweens.add({
                    targets: sprite,
                    x: xFinal,
                    y: yFinal,
                    duration: 260,
                    ease: "Quad.In",
                    onComplete: () => {
                        if (!this.sprite || !this.sprite.active) return;

                        this.scene.time.delayedCall(380, () => {
                            this.voltarParaPertoDoPlayer(player);
                        });
                    }
                });
            }
        });
    }

    voltarParaPertoDoPlayer(player) {
        if (!this.sprite || !this.sprite.active || !player) return;

        const sprite = this.sprite;
        const data = this.data;

        sprite.anims.stop();

        data.isBeingThrown = false;
        data.isReturning = true;
        data.isHurt = false;
        data.isAttacking = false;

        sprite.body.setVelocity(0, 0);

        const ladoDaFrenteDaLeona = player.sprite.flipX ? -1 : 1;

        const alvoX = Phaser.Math.Clamp(
            player.sprite.x + ladoDaFrenteDaLeona * 220,
            80,
            this.worldWidth - 80
        );

        const alvoY = Phaser.Math.Clamp(
            player.getGroundY(),
            this.floorTop,
            this.floorBottom
        );

        if (player.sprite.x < sprite.x) {
            sprite.setFlipX(true);
        } else {
            sprite.setFlipX(false);
        }

        sprite.play("enemy_walk", true);
        this.ajustarEscalaSprite();

        this.scene.tweens.killTweensOf(sprite);

        this.scene.tweens.add({
            targets: sprite,
            x: alvoX,
            y: alvoY,
            duration: 620,
            ease: "Sine.Out",
            onComplete: () => {
                if (!this.sprite || !this.sprite.active) return;

                data.isReturning = false;
                data.isHurt = false;
                data.isAttacking = false;

                sprite.body.setVelocity(0, 0);
                sprite.play("enemy_idle", true);
                this.ajustarEscalaSprite();

                if (player.sprite.x < sprite.x) {
                    sprite.setFlipX(true);
                } else {
                    sprite.setFlipX(false);
                }
            }
        });
    }

    reset(x, y) {
        if (this.data.hurtReturnEvent) {
            this.data.hurtReturnEvent.remove(false);
            this.data.hurtReturnEvent = null;
        }

        this.scene.tweens.killTweensOf(this.sprite);

        this.sprite.setPosition(x, y);
        this.sprite.setVelocity(0, 0);
        this.sprite.setAlpha(1);
        this.sprite.setFlipX(true);
        this.sprite.play("enemy_idle", true);
        this.ajustarEscalaSprite();

        this.data.currentHp = this.data.maxHp;
        this.data.isDead = false;
        this.data.isAttacking = false;
        this.data.isHurt = false;
        this.data.isBeingThrown = false;
        this.data.isReturning = false;
        this.data.lastAttackTime = -9999;
    }

    ajustarEscalaSprite() {
        if (!this.sprite || !this.sprite.frame) return;

        const alturaOriginal = this.sprite.frame.height;
        const escala = this.alturaEnemy / alturaOriginal;

        this.sprite.setScale(escala);
    }

    destroy() {
        if (this.data?.hurtReturnEvent) {
            this.data.hurtReturnEvent.remove(false);
            this.data.hurtReturnEvent = null;
        }

        if (this.sprite) {
            this.scene.tweens.killTweensOf(this.sprite);
            this.sprite.destroy();
        }
    }
}