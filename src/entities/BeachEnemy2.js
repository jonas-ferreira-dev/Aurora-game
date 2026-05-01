export class BeachEnemy2 {
    static preload(scene) {
        scene.load.image("beach2_idle", "assets/Enemy2/guarda.png");

        scene.load.image("beach2_walk1", "assets/Enemy2/walking1.png");
        scene.load.image("beach2_walk2", "assets/Enemy2/walking2.png");
        scene.load.image("beach2_walk3", "assets/Enemy2/walking3.png");
        scene.load.image("beach2_walk4", "assets/Enemy2/walking4.png");
        scene.load.image("beach2_walk5", "assets/Enemy2/walking5.png");
        scene.load.image("beach2_walk6", "assets/Enemy2/walking6.png");

        scene.load.image("beach2_punch", "assets/Enemy2/punch1.png");
        scene.load.image("beach2_kick", "assets/Enemy2/chute1.png");

        scene.load.image("beach2_damage", "assets/Enemy2/tomando dano.png");
        scene.load.image("beach2_fall", "assets/Enemy2/caindo1.png");
        scene.load.image("beach2_down", "assets/Enemy2/desmaiado.png");
    }

    static createAnimations(scene) {
        if (!scene.anims.exists("beach2_idle")) {
            scene.anims.create({
                key: "beach2_idle",
                frames: [{ key: "beach2_idle" }],
                frameRate: 1,
                repeat: -1
            });
        }

        if (!scene.anims.exists("beach2_walk")) {
            scene.anims.create({
                key: "beach2_walk",
                frames: [
                    { key: "beach2_walk1" },
                    { key: "beach2_walk2" },
                    { key: "beach2_walk3" },
                    { key: "beach2_walk4" },
                    { key: "beach2_walk5" },
                    { key: "beach2_walk6" }
                ],
                frameRate: 6,
                repeat: -1
            });
        }

        if (!scene.anims.exists("beach2_fall")) {
            scene.anims.create({
                key: "beach2_fall",
                frames: [
                    { key: "beach2_fall" },
                    { key: "beach2_down" }
                ],
                frameRate: 5,
                repeat: 0
            });
        }
    }

    constructor(scene, x, y, tipo = "beach", config = {}) {
        this.scene = scene;

        this.worldWidth = config.worldWidth ?? 4200;
        this.floorTop = config.floorTop ?? 620;
        this.floorBottom = config.floorBottom ?? 690;
        this.alturaBase = config.alturaEnemy ?? 188;

        const yFinal = Phaser.Math.Clamp(y, this.floorTop + 8, this.floorBottom);

        this.sprite = scene.physics.add.sprite(x, yFinal, "beach2_idle");
        this.sprite.setOrigin(0.5, 1);
        this.sprite.setCollideWorldBounds(true);

        this.data = {
            tipo,
            altura: this.alturaBase,

            maxHp: 64,
            currentHp: 64,

            speed: 108,
            damagePunch: 9,
            damageKick: 13,

            isDead: false,
            isAttacking: false,
            isHurt: false,
            isRemoving: false,

            isBeingThrown: false,
            isReturning: false,

            attackCooldown: 820,
            lastAttackTime: -9999,

            attackRangeX: 92,
            attackRangeY: 58,

            kickRangeX: 118,
            kickRangeY: 62,

            laneOffsetY: Phaser.Math.Between(-18, 18),
            attackOffsetX: Phaser.Math.Between(-30, 30),
            personalSpace: Phaser.Math.Between(72, 88),
            lastHitFromX: null,
            deathFlipX: false,

            playerPersonalSpaceX: Phaser.Math.Between(34, 46),
            playerPersonalSpaceY: 32,
            retreatAfterAttackUntil: 0,

            hurtReturnEvent: null
        };

        this.hpBg = scene.add.graphics().setDepth(3000);
        this.hpFill = scene.add.graphics().setDepth(3001);

        this.ajustarEscalaSprite();
        this.sprite.play("beach2_idle");

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

        const dentroDoSoco =
            distanciaPlayerX <= data.attackRangeX &&
            distanciaPlayerY <= data.attackRangeY &&
            !player.isJumping;

        const dentroDoChute =
            distanciaPlayerX <= data.kickRangeX &&
            distanciaPlayerY <= data.kickRangeY &&
            !player.isJumping;

        const muitoColadoNaLeona =
            distanciaPlayerX <= data.playerPersonalSpaceX &&
            distanciaPlayerY <= data.playerPersonalSpaceY;

        const precisaRecuarDepoisDoAtaque =
            this.scene.time.now < data.retreatAfterAttackUntil;

        if (precisaRecuarDepoisDoAtaque) {
            this.recuarDoPlayer(player, separacao);
            return;
        }

        if (dentroDoSoco || dentroDoChute) {
            if (this.scene.time.now > data.lastAttackTime + data.attackCooldown) {
                const usarChute =
                    dentroDoChute &&
                    distanciaPlayerX > 66 &&
                    Phaser.Math.Between(0, 100) < 55;

                this.atacar(player, usarChute ? "kick" : "punch");
                return;
            }

            let vx = separacao.x * 1.15;
            let vy = dy * 1.35 + separacao.y;

            if (Math.abs(dxPlayer) > 34) {
                vx += dxPlayer > 0 ? 20 : -20;
            }

            vx = Phaser.Math.Clamp(vx, -62, 62);
            vy = Phaser.Math.Clamp(vy, -70, 70);

            sprite.body.setVelocity(vx, vy);

            this.virarParaPlayer(player);

            if (Math.abs(vx) > 4 || Math.abs(vy) > 4) {
                this.playWalk();
            } else {
                this.playIdle();
            }

            sprite.y = Phaser.Math.Clamp(sprite.y, this.floorTop, this.floorBottom);
            this.updateHpBar();
            return;
        }

        let vx = 0;
        let vy = 0;

        if (dx < -8) vx = -data.speed;
        if (dx > 8) vx = data.speed;
        if (dy < -8) vy = -data.speed * 0.68;
        if (dy > 8) vy = data.speed * 0.68;

        vx += separacao.x;
        vy += separacao.y;

        vx = Phaser.Math.Clamp(vx, -data.speed * 1.08, data.speed * 1.08);
        vy = Phaser.Math.Clamp(vy, -data.speed * 0.95, data.speed * 0.95);

        if (vx !== 0 && vy !== 0) {
            vx *= 0.7071;
            vy *= 0.7071;
        }

        sprite.body.setVelocity(vx, vy);

        this.virarParaPlayer(player);

        const moving = Math.abs(vx) > 3 || Math.abs(vy) > 3;

        if (moving) {
            this.playWalk();
        } else {
            this.playIdle();
        }

        sprite.y = Phaser.Math.Clamp(sprite.y, this.floorTop, this.floorBottom);
        this.updateHpBar();

        if (data.isEntering) {
            const dxEntrada = data.entryTargetX - sprite.x;

            if (Math.abs(dxEntrada) <= 6) {
                data.isEntering = false;
                sprite.body.setVelocity(0, 0);
                this.playIdle();
                this.updateHpBar();
                return;
            }

            const vxEntrada = dxEntrada > 0 ? data.entrySpeed : -data.entrySpeed;

            sprite.body.setVelocity(vxEntrada, 0);

            if (vxEntrada < 0) this.virarParaPlayer(player);;
            if (vxEntrada > 0) this.virarParaPlayer(player);;

            this.playWalk();

            sprite.y = Phaser.Math.Clamp(sprite.y, this.floorTop, this.floorBottom);
            this.updateHpBar();
            return;
        }
    }

    calcularSeparacao(allEnemies) {
        let repulsaoX = 0;
        let repulsaoY = 0;

        allEnemies.forEach((other) => {
            if (!other || other === this) return;
            if (!other.sprite?.active) return;
            if (other.data?.isDead || other.data?.isRemoving) return;

            const dx = this.sprite.x - other.sprite.x;
            const dy = this.sprite.y - other.sprite.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;

            const distanciaMinima = Math.max(
                this.data.personalSpace || 72,
                other.data?.personalSpace || 72
            );

            if (dist < distanciaMinima) {
                const forca = (distanciaMinima - dist) / distanciaMinima;
                repulsaoX += (dx / dist) * forca * 96;
                repulsaoY += (dy / dist) * forca * 125;
            }
        });

        return { x: repulsaoX, y: repulsaoY };
    }

    virarParaPlayer(player) {
        if (!player?.sprite || !this.sprite?.active) return;

        // Seus sprites parecem virados para a direita por padrão.
        // Então flipX = true quando a Leona está à esquerda.
        this.sprite.setFlipX(player.sprite.x < this.sprite.x);
        
    }

    recuarDoPlayer(player, separacao = { x: 0, y: 0 }) {
        if (!player || !player.sprite || !this.sprite?.active) return;

        const sprite = this.sprite;
        const data = this.data;

        const playerY = player.getGroundY ? player.getGroundY() : player.sprite.y;

        const dx = sprite.x - player.sprite.x;
        const dy = sprite.y - playerY;

        const dirX = dx >= 0 ? 1 : -1;
        const dirY = dy >= 0 ? 1 : -1;

        let vx = dirX * data.speed * 0.92 + separacao.x;
        let vy = dirY * data.speed * 0.42 + separacao.y;

        vx = Phaser.Math.Clamp(vx, -data.speed * 1.1, data.speed * 1.1);
        vy = Phaser.Math.Clamp(vy, -data.speed * 0.75, data.speed * 0.75);

        sprite.body.setVelocity(vx, vy);
        this.virarParaPlayer(player);

        this.playWalk();

        sprite.y = Phaser.Math.Clamp(sprite.y, this.floorTop, this.floorBottom);
        this.updateHpBar();
    }

    atacar(player, attackType = "punch") {
        const sprite = this.sprite;
        const data = this.data;

        if (data.isDead || data.isRemoving || data.isAttacking || data.isHurt) return;
        if (data.isBeingThrown || data.isReturning) return;
        if (!player || player.isDead) return;

        data.isAttacking = true;
        data.lastAttackTime = this.scene.time.now;

        sprite.body.setVelocity(0, 0);
        sprite.anims.stop();

        this.virarParaPlayer(player);

        const isKick = attackType === "kick";

        sprite.setTexture(isKick ? "beach2_kick" : "beach2_punch");
        this.ajustarEscalaSprite();

        const hitDelay = isKick ? 150 : 120;
        const endDelay = isKick ? 340 : 280;

        this.scene.time.delayedCall(hitDelay, () => {
            if (!sprite.active) return;
            if (data.isDead || data.isRemoving || data.isBeingThrown || data.isReturning) return;
            if (!data.isAttacking) return;
            if (!player || player.isDead) return;

            const playerY = player.getGroundY ? player.getGroundY() : player.sprite.y;

            const dx = Math.abs(player.sprite.x - sprite.x);
            const dy = Math.abs(playerY - sprite.y);

            const rangeX = isKick ? data.kickRangeX : data.attackRangeX;
            const rangeY = isKick ? data.kickRangeY : data.attackRangeY;
            const dano = isKick ? data.damageKick : data.damagePunch;

            if (dx <= rangeX && dy <= rangeY && !player.isJumping) {
                player.receberDano(dano, sprite.x);
            }
        });

       this.scene.time.delayedCall(endDelay, () => {
            if (!sprite.active) return;
            if (data.isDead || data.isRemoving) return;

            // Se ele tomou dano durante o ataque, não deixa o callback
            // sobrescrever o sprite de dano.
            if (!data.isAttacking || data.isHurt) return;

            data.isAttacking = false;
            data.retreatAfterAttackUntil = this.scene.time.now + 260;

            this.playIdle();
        });
    }

    receberDano(valor, opcoes = {}) {
        const player = opcoes.player;

        if (this.data.isDead || this.data.isRemoving) return false;
        if (this.data.isBeingThrown || this.data.isReturning) return false;

        this.data.currentHp -= valor;
        if (this.data.currentHp < 0) this.data.currentHp = 0;

        this.data.isHurt = true;
        this.data.isAttacking = false;

        this.sprite.body.setVelocity(0, 0);
        this.sprite.anims.stop();
        this.sprite.setTexture("beach2_damage");
        this.ajustarEscalaSprite();
        this.virarParaPlayer(player);

        this.scene.tocarSom?.(this.scene.sfxEnemyDamage, true);

        if (player?.sprite) {
            const origemX = player.sprite.x;

            this.data.lastHitFromX = origemX;

            // Durante o dano, o inimigo olha para quem bateu.
            this.virarParaPlayer(player);

            // Empurra para longe da Leona.
            const empurrao = origemX < this.sprite.x ? 30 : -30;

            this.sprite.x += empurrao;
            this.sprite.x = Phaser.Math.Clamp(this.sprite.x, 30, this.worldWidth - 30);

            // Garante que o sprite de dano não herdou um flip errado.
            this.virarParaPlayer(player);
        }

        if (this.data.currentHp <= 0) {
            this.morrer(this.data.lastHitFromX ?? player?.sprite?.x ?? null);
            return true;
        }

        if (this.data.hurtReturnEvent) {
            this.data.hurtReturnEvent.remove(false);
            this.data.hurtReturnEvent = null;
        }

        this.data.hurtReturnEvent = this.scene.time.delayedCall(180, () => {
            if (this.data.isDead || this.data.isRemoving) return;
            if (this.data.isBeingThrown || this.data.isReturning) return;

            this.data.isHurt = false;
            this.playIdle();
        });

        return true;
    }

    liberarHitstun() {
        if (!this.sprite || !this.sprite.active) return;
        if (this.data.isDead || this.data.isRemoving) return;
        if (this.data.isBeingThrown || this.data.isReturning) return;

        if (this.data.hurtReturnEvent) {
            this.data.hurtReturnEvent.remove(false);
            this.data.hurtReturnEvent = null;
        }

        this.data.hurtReturnEvent = this.scene.time.delayedCall(120, () => {
            if (this.data.isDead || this.data.isRemoving) return;
            if (this.data.isBeingThrown || this.data.isReturning) return;

            this.data.isHurt = false;
            this.playIdle();
        });
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

        if (data.hurtReturnEvent) {
            data.hurtReturnEvent.remove(false);
            data.hurtReturnEvent = null;
        }

        sprite.body.setVelocity(0, 0);
        sprite.anims.stop();
        sprite.setTexture("beach2_damage");
        this.ajustarEscalaSprite();

        this.scene.tweens.killTweensOf(sprite);

        const direcao = player.sprite.x < sprite.x ? 1 : -1;

        const xInicial = sprite.x;
        const yInicial = sprite.y;

        const xPico = Phaser.Math.Clamp(
            xInicial + direcao * 88,
            40,
            this.worldWidth - 40
        );

        const yPico = Phaser.Math.Clamp(
            yInicial - 36,
            this.floorTop,
            this.floorBottom
        );

        const xFinal = Phaser.Math.Clamp(
            xInicial + direcao * 160,
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

                sprite.play("beach2_fall", true);
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

                        this.scene.time.delayedCall(380, () => {
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

        this.data.isBeingThrown = false;
        this.data.isReturning = false;
        this.data.isHurt = false;
        this.data.isAttacking = false;

        this.sprite.body.setVelocity(0, 0);
        this.playIdle();
    }

    morrer(origemX = null) {
        if (this.data.isDead || this.data.isRemoving) return;

        this.data.isDead = true;
        this.data.isAttacking = false;
        this.data.isHurt = false;
        this.data.isRemoving = true;

        if (this.data.hurtReturnEvent) {
            this.data.hurtReturnEvent.remove(false);
            this.data.hurtReturnEvent = null;
        }

        this.sprite.body.setVelocity(0, 0);
        this.sprite.anims.stop();
        this.sprite.setTexture("beach2_damage");
        this.ajustarEscalaSprite();

        this.aplicarQuedaNaMorte(origemX);

        if (Phaser.Math.Between(0, 100) < 30) {
            const dropY = Phaser.Math.Clamp(this.sprite.y - 8, 580, 640);
            this.scene.spawnHealthItem?.(this.sprite.x, dropY, "fall");
        }

        this.scene.time.delayedCall(620, () => {
            this.destroy();
        });
    }

    aplicarQuedaNaMorte(origemX = null) {
            const sprite = this.sprite;

            const xBase = sprite.x;
            const yBase = sprite.y;

            const origemGolpe =
                origemX !== null
                    ? origemX
                    : this.data.lastHitFromX ?? xBase - 40;

            const direcao = origemGolpe < xBase ? 1 : -1;

            const flipMorte = direcao > 0;

            this.data.deathFlipX = flipMorte;
            sprite.setFlipX(flipMorte);

            this.scene.tweens.killTweensOf(sprite);

            this.scene.tweens.add({
                targets: sprite,
                x: xBase + direcao * 44,
                y: yBase - 24,
                duration: 120,
                ease: "Quad.Out",
                onComplete: () => {
                    if (!sprite.active) return;

                    sprite.setFlipX(flipMorte);
                    sprite.play("beach2_fall", true);
                    this.ajustarEscalaSprite();
                    sprite.setFlipX(flipMorte);

                    this.scene.tweens.add({
                        targets: sprite,
                        x: xBase + direcao * 82,
                        y: Phaser.Math.Clamp(yBase + 14, this.floorTop, this.floorBottom),
                        duration: 240,
                        ease: "Quad.In",
                        onUpdate: () => {
                            if (sprite.active) {
                                sprite.setFlipX(flipMorte);
                            }
                        }
                    });
                }
            });
        }

    updateHpBar() {
        if (!this.hpBg || !this.hpFill) return;

        this.hpBg.clear();
        this.hpFill.clear();

        if (this.data.isDead || this.data.isRemoving || !this.sprite.active) return;

        const largura = 66;
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

    playIdle() {
        if (!this.sprite || !this.sprite.active) return;

        if (this.sprite.anims.currentAnim?.key !== "beach2_idle") {
            this.sprite.play("beach2_idle", true);
            this.ajustarEscalaSprite();
        }
    }

    playWalk() {
        if (!this.sprite || !this.sprite.active) return;

        if (this.sprite.anims.currentAnim?.key !== "beach2_walk") {
            this.sprite.play("beach2_walk", true);
            this.ajustarEscalaSprite();
        }
    }

    ajustarEscalaSprite() {
        if (!this.sprite || !this.sprite.frame) return;

        const alturaOriginal = this.sprite.frame.height;
        const escala = this.data.altura / alturaOriginal;

        this.sprite.setScale(escala);
    }

    destroy() {
        if (this.data?.hurtReturnEvent) {
            this.data.hurtReturnEvent.remove(false);
            this.data.hurtReturnEvent = null;
        }

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