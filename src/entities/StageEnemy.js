export class StageEnemy {
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
                frameRate: 5.4,
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

    constructor(scene, x, y, tipo = "light", config = {}) {
        this.scene = scene;

        this.worldWidth = config.worldWidth ?? 4200;
        this.floorTop = config.floorTop ?? 620;
        this.floorBottom = config.floorBottom ?? 690;
        this.alturaBase = config.alturaEnemy ?? 196;

        const yFinal = Phaser.Math.Clamp(y, this.floorTop + 8, this.floorBottom);

        this.sprite = scene.physics.add.sprite(x, yFinal, "enemy_idle");
        this.sprite.setOrigin(0.5, 1);
        this.sprite.setCollideWorldBounds(true);

        const lightStats = {
            maxHp: 52,
            speed: 94,
            damage: 10,
            attackCooldown: 760,
            attackRangeX: 86,
            attackRangeY: 54
        };

        const heavyStats = {
            maxHp: 72,
            speed: 76,
            damage: 14,
            attackCooldown: 920,
            attackRangeX: 92,
            attackRangeY: 56
        };

        const stats = tipo === "heavy" ? heavyStats : lightStats;
        const altura = tipo === "heavy" ? this.alturaBase + 20 : this.alturaBase;

        this.data = {
            tipo,
            altura,
            maxHp: stats.maxHp,
            currentHp: stats.maxHp,
            speed: stats.speed,
            damage: stats.damage,

            isDead: false,
            isAttacking: false,
            isHurt: false,
            isRemoving: false,

            attackCooldown: stats.attackCooldown,
            lastAttackTime: 0,
            attackRangeX: stats.attackRangeX,
            attackRangeY: stats.attackRangeY,

            laneOffsetY: Phaser.Math.Between(-18, 18),
            attackOffsetX: Phaser.Math.Between(-34, 34),
            personalSpace: Phaser.Math.Between(64, 82),

            // compatibilidade com LeonaPlayer
            isBeingThrown: false,
            isReturning: false
        };

        this.hpBg = scene.add.graphics().setDepth(3000);
        this.hpFill = scene.add.graphics().setDepth(3001);

        this.ajustarEscalaSprite();
        this.sprite.play("enemy_idle");

        this.sprite.on(Phaser.Animations.Events.ANIMATION_UPDATE, () => {
            this.ajustarEscalaSprite();
        });
    }

    update(player, allEnemies = []) {
        if (!this.sprite || !this.sprite.active) return;

        const sprite = this.sprite;
        const data = this.data;

        if (data.isDead || data.isRemoving) {
            sprite.body?.setVelocity(0, 0);
            this.updateHpBar();
            return;
        }

        if (data.isBeingThrown || data.isReturning) {
            sprite.body?.setVelocity(0, 0);
            this.updateHpBar();
            return;
        }

        if (!player || player.isDead) {
            sprite.body.setVelocity(0, 0);
            this.updateHpBar();
            return;
        }

        if (data.isAttacking || data.isHurt) {
            sprite.body.setVelocity(0, 0);
            this.updateHpBar();
            return;
        }

        const playerSprite = player.sprite;
        const playerY = player.getGroundY ? player.getGroundY() : playerSprite.y;

        const alvoX = playerSprite.x + data.attackOffsetX;
        const alvoY = Phaser.Math.Clamp(
            playerY + data.laneOffsetY,
            this.floorTop + 4,
            this.floorBottom
        );

        const dxPlayer = playerSprite.x - sprite.x;
        const dyPlayer = playerY - sprite.y;

        const dx = alvoX - sprite.x;
        const dy = alvoY - sprite.y;

        const distanciaPlayerX = Math.abs(dxPlayer);
        const distanciaPlayerY = Math.abs(dyPlayer);

        const separacao = this.calcularSeparacao(allEnemies);

        const dentroDoAtaque =
            distanciaPlayerX <= data.attackRangeX &&
            distanciaPlayerY <= data.attackRangeY &&
            !player.isJumping;

        const pertoDoPlayer =
            distanciaPlayerX <= data.attackRangeX + 42 &&
            distanciaPlayerY <= data.attackRangeY + 30;

        if (dentroDoAtaque) {
            if (this.scene.time.now > data.lastAttackTime + data.attackCooldown && Math.abs(dy) <= 20) {
                sprite.body.setVelocity(0, 0);
                this.atacar(player);
                this.updateHpBar();
                return;
            }

            let vx = separacao.x * 1.15;
            let vy = dy * 1.5 + separacao.y;

            if (Math.abs(dxPlayer) > 28) {
                vx += dxPlayer > 0 ? 18 : -18;
            }

            vx = Phaser.Math.Clamp(vx, -58, 58);
            vy = Phaser.Math.Clamp(vy, -68, 68);

            sprite.body.setVelocity(vx, vy);

            if (vx < 0) sprite.setFlipX(true);
            if (vx > 0) sprite.setFlipX(false);

            if (Math.abs(vx) > 4 || Math.abs(vy) > 4) {
                if (sprite.anims.currentAnim?.key !== "enemy_walk") {
                    sprite.play("enemy_walk", true);
                }
            } else if (sprite.anims.currentAnim?.key !== "enemy_idle") {
                sprite.play("enemy_idle", true);
            }

            sprite.y = Phaser.Math.Clamp(sprite.y, this.floorTop, this.floorBottom);
            this.updateHpBar();
            return;
        }

        let vx = 0;
        let vy = 0;

        if (pertoDoPlayer) {
            if (dx < -6) vx = -data.speed * 1.03;
            if (dx > 6) vx = data.speed * 1.03;
            if (dy < -8) vy = -data.speed * 0.78;
            if (dy > 8) vy = data.speed * 0.78;
        } else {
            if (dx < -8) vx = -data.speed;
            if (dx > 8) vx = data.speed;
            if (dy < -8) vy = -data.speed * 0.68;
            if (dy > 8) vy = data.speed * 0.68;
        }

        vx += separacao.x;
        vy += separacao.y;

        vx = Phaser.Math.Clamp(vx, -data.speed * 1.05, data.speed * 1.05);
        vy = Phaser.Math.Clamp(vy, -data.speed * 0.95, data.speed * 0.95);

        if (vx !== 0 && vy !== 0) {
            vx *= 0.7071;
            vy *= 0.7071;
        }

        sprite.body.setVelocity(vx, vy);

        if (vx < 0) sprite.setFlipX(true);
        if (vx > 0) sprite.setFlipX(false);

        const moving = Math.abs(vx) > 3 || Math.abs(vy) > 3;

        if (moving) {
            if (sprite.anims.currentAnim?.key !== "enemy_walk") {
                sprite.play("enemy_walk", true);
            }
        } else if (sprite.anims.currentAnim?.key !== "enemy_idle") {
            sprite.play("enemy_idle", true);
        }

        sprite.y = Phaser.Math.Clamp(sprite.y, this.floorTop, this.floorBottom);

        this.updateHpBar();
    }

    calcularSeparacao(allEnemies) {
        let repulsaoX = 0;
        let repulsaoY = 0;

        allEnemies.forEach((other) => {
            if (!other || other === this) return;
            if (!other.sprite?.active) return;
            if (other.data.isDead || other.data.isRemoving) return;

            const dx = this.sprite.x - other.sprite.x;
            const dy = this.sprite.y - other.sprite.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;

            const distanciaMinima = Math.max(
                this.data.personalSpace || 64,
                other.data.personalSpace || 64
            );

            if (dist < distanciaMinima) {
                const forca = (distanciaMinima - dist) / distanciaMinima;
                repulsaoX += (dx / dist) * forca * 90;
                repulsaoY += (dy / dist) * forca * 120;
            }
        });

        return { x: repulsaoX, y: repulsaoY };
    }

    atacar(player) {
        const sprite = this.sprite;
        const data = this.data;

        if (data.isDead || data.isRemoving || data.isAttacking || data.isHurt) return;
        if (!player || player.isDead) return;

        data.isAttacking = true;
        data.lastAttackTime = this.scene.time.now;

        sprite.body.setVelocity(0, 0);
        sprite.anims.stop();
        sprite.setTexture("enemy_punch1");
        this.ajustarEscalaSprite();

        this.scene.time.delayedCall(170, () => {
            if (this.data.isDead || this.data.isRemoving) return;
            if (this.data.isBeingThrown || this.data.isReturning) return;

            this.data.isHurt = false;
            this.sprite.play("enemy_idle", true);
            this.ajustarEscalaSprite();
        });

        this.scene.time.delayedCall(125, () => {
            if (!data.isDead && !data.isRemoving && data.isAttacking) {
                sprite.setTexture("enemy_punch3");
                this.ajustarEscalaSprite();
            }
        });

        this.scene.time.delayedCall(135, () => {
            if (data.isDead || data.isRemoving || player.isDead) return;

            const playerY = player.getGroundY ? player.getGroundY() : player.sprite.y;

            const dx = Math.abs(player.sprite.x - sprite.x);
            const dy = Math.abs(playerY - sprite.y);

            if (dx <= data.attackRangeX && dy <= data.attackRangeY && !player.isJumping) {
                player.receberDano(data.damage, sprite.x);
            }
        });

        this.scene.time.delayedCall(250, () => {
            if (!data.isDead && !data.isRemoving) {
                data.isAttacking = false;
                sprite.play("enemy_idle", true);
                this.ajustarEscalaSprite();
            }
        });
    }

    receberDano(valor, opcoes = {}) {
        const player = opcoes.player;

        if (this.data.isDead || this.data.isRemoving) return false;

        this.data.currentHp -= valor;
        if (this.data.currentHp < 0) this.data.currentHp = 0;

        this.data.isHurt = true;
        this.data.isAttacking = false;

        this.sprite.body.setVelocity(0, 0);
        this.sprite.anims.stop();
        this.sprite.setTexture("enemy_damage");
        this.ajustarEscalaSprite();

        this.scene.tocarSom?.(this.scene.sfxEnemyDamage, true);

        if (player?.sprite) {
            const empurrao = player.sprite.flipX ? -32 : 32;
            this.sprite.x += empurrao;
            this.sprite.x = Phaser.Math.Clamp(this.sprite.x, 30, this.worldWidth - 30);
        }

        if (this.data.currentHp <= 0) {
            this.morrer(player?.sprite?.x ?? null);
            return true;
        }

        this.scene.time.delayedCall(170, () => {
            if (!this.data.isDead && !this.data.isRemoving) {
                this.data.isHurt = false;
                this.sprite.play("enemy_idle", true);
                this.ajustarEscalaSprite();
            }
        });

        return true;
    }

    arremessar(player) {
            if (!player?.sprite) return;
            if (!this.sprite || !this.sprite.active) return;
            if (this.data.isDead || this.data.isRemoving) return;
            if (this.data.isBeingThrown || this.data.isReturning) return;

            const sprite = this.sprite;
            const data = this.data;

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

            const xPico = Phaser.Math.Clamp(
                xInicial + direcao * 85,
                40,
                this.worldWidth - 40
            );

            const yPico = Phaser.Math.Clamp(
                yInicial - 34,
                this.floorTop,
                this.floorBottom
            );

            const xFinal = Phaser.Math.Clamp(
                xInicial + direcao * 155,
                40,
                this.worldWidth - 40
            );

            const yFinal = Phaser.Math.Clamp(
                yInicial + 10,
                this.floorTop,
                this.floorBottom
            );

            this.scene.tweens.add({
                targets: sprite,
                x: xPico,
                y: yPico,
                duration: 150,
                ease: "Quad.Out",
                onComplete: () => {
                    if (!sprite.active) return;
                    if (data.isDead || data.isRemoving) return;

                    // Usa animação de queda no chão
                    sprite.play("enemy_death", true);
                    this.ajustarEscalaSprite();

                    this.scene.tweens.add({
                        targets: sprite,
                        x: xFinal,
                        y: yFinal,
                        duration: 260,
                        ease: "Quad.In",
                        onComplete: () => {
                            if (!sprite.active) return;
                            if (data.isDead || data.isRemoving) return;

                            // Fica caído um instante antes de levantar
                            this.scene.time.delayedCall(360, () => {
                                this.levantarDepoisDoArremesso();
                            });
                        }
                    });
                }
            });
        }

        levantarDepoisDoArremesso() {
            if (!this.sprite || !this.sprite.active) return;
            if (this.data.isDead || this.data.isRemoving) return;

            const sprite = this.sprite;
            const data = this.data;

            data.isBeingThrown = false;
            data.isReturning = false;
            data.isHurt = false;
            data.isAttacking = false;

            sprite.body.setVelocity(0, 0);
            sprite.play("enemy_idle", true);
            this.ajustarEscalaSprite();
        }

    morrer(origemX = null) {
        if (this.data.isDead || this.data.isRemoving) return;

        this.data.isDead = true;
        this.data.isAttacking = false;
        this.data.isHurt = false;
        this.data.isRemoving = true;

        this.sprite.body.setVelocity(0, 0);
        this.sprite.anims.stop();
        this.sprite.setTexture("enemy_damage");
        this.ajustarEscalaSprite();

        this.aplicarArremessoNaMorte(origemX);

        if (Phaser.Math.Between(0, 100) < 28) {
            const dropY = Phaser.Math.Clamp(this.sprite.y - 8, 580, 640);
            this.scene.spawnHealthItem?.(this.sprite.x, dropY, "fall");
        }

        this.scene.time.delayedCall(520, () => {
            this.destroy();
        });
    }

    aplicarArremessoNaMorte(origemX = null) {
        const sprite = this.sprite;

        const xBase = sprite.x;
        const yBase = sprite.y;
        const origemGolpe = origemX !== null ? origemX : xBase - 40;
        const direcao = origemGolpe < xBase ? 1 : -1;

        this.scene.tweens.killTweensOf(sprite);

        this.scene.tweens.add({
            targets: sprite,
            x: xBase + direcao * 42,
            y: yBase - 22,
            duration: 120,
            ease: "Quad.Out",
            onComplete: () => {
                if (!sprite.active) return;

                sprite.play("enemy_death", true);
                this.ajustarEscalaSprite();

                this.scene.tweens.add({
                    targets: sprite,
                    x: xBase + direcao * 76,
                    y: Phaser.Math.Clamp(yBase + 14, this.floorTop, this.floorBottom),
                    duration: 220,
                    ease: "Quad.In"
                });
            }
        });
    }

    updateHpBar() {
        if (!this.hpBg || !this.hpFill) return;

        this.hpBg.clear();
        this.hpFill.clear();

        if (this.data.isDead || this.data.isRemoving || !this.sprite.active) return;

        const largura = this.data.tipo === "heavy" ? 70 : 60;
        const altura = 8;

        const bounds = this.sprite.getBounds();
        const x = this.sprite.x - largura / 2;
        const y = bounds.top - 14;

        this.hpBg.setDepth(this.sprite.y + 20);
        this.hpFill.setDepth(this.sprite.y + 21);

        this.hpBg.fillStyle(0x000000, 0.85);
        this.hpBg.fillRoundedRect(x, y, largura, altura, 3);

        this.hpFill.fillStyle(0xff3b30, 1);
        this.hpFill.fillRoundedRect(
            x + 1,
            y + 1,
            (largura - 2) * (this.data.currentHp / this.data.maxHp),
            altura - 2,
            2
        );
    }

    isAlive() {
        return !this.data.isDead && !this.data.isRemoving && this.sprite?.active;
    }

    ajustarEscalaSprite() {
        if (!this.sprite || !this.sprite.frame) return;

        const alturaOriginal = this.sprite.frame.height;
        const escala = this.data.altura / alturaOriginal;

        this.sprite.setScale(escala);
    }

    destroy() {
        this.hpBg?.clear();
        this.hpFill?.clear();
        this.hpBg?.destroy();
        this.hpFill?.destroy();

        if (this.sprite) {
            this.scene.tweens.killTweensOf(this.sprite);
            this.sprite.destroy();
        }
    }
}