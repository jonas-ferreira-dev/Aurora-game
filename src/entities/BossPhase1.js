export class BossPhase1 {
    static preload(scene) {
        scene.load.image("boss_idle_base", "assets/Boss/Base.png");

        scene.load.image("boss_walk1", "assets/Boss/walking1.png");
        scene.load.image("boss_walk2", "assets/Boss/walking2.png");
        scene.load.image("boss_walk3", "assets/Boss/walking3.png");
        scene.load.image("boss_walk4", "assets/Boss/walking4.png");
        scene.load.image("boss_walk5", "assets/Boss/walking5.png");
        scene.load.image("boss_walk6", "assets/Boss/walking6.png");

        scene.load.image("boss_punch1", "assets/Boss/punch1.png");
        scene.load.image("boss_punch2", "assets/Boss/punch2.png");

        scene.load.image("boss_damage", "assets/Boss/damage1.png");
        scene.load.image("boss_death1", "assets/Boss/death1.png");
        scene.load.image("boss_death2", "assets/Boss/death2.png");

        scene.load.image("bossPortrait", "assets/Boss/iconboss1.png");
    }

    static createAnimations(scene) {
        if (!scene.anims.exists("boss_idle")) {
            scene.anims.create({
                key: "boss_idle",
                frames: [{ key: "boss_idle_base" }],
                frameRate: 1,
                repeat: -1
            });
        }

        if (!scene.anims.exists("boss_walk")) {
            scene.anims.create({
                key: "boss_walk",
                frames: [
                    { key: "boss_walk1" },
                    { key: "boss_walk2" },
                    { key: "boss_walk3" },
                    { key: "boss_walk4" },
                    { key: "boss_walk5" },
                    { key: "boss_walk6" }
                ],
                frameRate: 6,
                repeat: -1
            });
        }

        if (!scene.anims.exists("boss_death")) {
            scene.anims.create({
                key: "boss_death",
                frames: [
                    { key: "boss_death1" },
                    { key: "boss_death2" }
                ],
                frameRate: 4,
                repeat: 0
            });
        }
    }

    constructor(scene, x, y, config = {}) {
        this.scene = scene;

        this.worldWidth = config.worldWidth ?? 4200;
        this.floorTop = config.floorTop ?? 560;
        this.floorBottom = config.floorBottom ?? 650;
        this.alturaBoss = config.alturaBoss ?? 220;

        const yFinal = Phaser.Math.Clamp(y, this.floorTop + 8, this.floorBottom);

        this.sprite = scene.physics.add.sprite(x, yFinal, "boss_idle_base");
        this.sprite.setOrigin(0.5, 1);
        this.sprite.setCollideWorldBounds(true);

        this.data = {
            maxHp: 260,
            currentHp: 260,

            speed: 104,
            damage: 18,

            isDead: false,
            isRemoving: false,
            isAttacking: false,
            isHurt: false,

            isBeingThrown: false,
            isReturning: false,

            attackCooldown: 2400,
            lastAttackTime: this.scene.time.now,
            nextAttackAllowedAt: this.scene.time.now + 1800,

            attackRangeX: 145,
            attackRangeY: 66,

            dashStartRangeX: 210,
            dashStartRangeY: 72,

            dashHitX: 82,
            dashHitY: 66,

            lastHitFromX: null,
            hurtReturnEvent: null,
            pauseUntil: 0,
            hasHitPlayerThisAttack: false
            
        };

        this.ajustarEscalaSprite();
        this.sprite.play("boss_idle", true);

        this.sprite.on(Phaser.Animations.Events.ANIMATION_UPDATE, () => {
            this.ajustarEscalaSprite();
        });
    }

    playerEstaCaindoOuRecuperando(player) {
        if (!player || !player.sprite) return false;

        const textureKey = player.sprite.texture?.key;
        const animKey = player.sprite.anims?.currentAnim?.key;

        return (
            player.isBeingShocked === true ||
            player.isDead === true ||
            textureKey === "leona_death1" ||
            textureKey === "leona_death2" ||
            animKey === "leona_death"
        );
    }


    esperarLeonaLevantar(player) {
        const now = this.scene.time.now;

        const deveEsperar =
            this.playerEstaCaindoOuRecuperando(player) ||
            now < this.data.pauseUntil;

        if (!deveEsperar) return false;

        this.sprite.body?.setVelocity(0, 0);

        if (!this.data.isDead && !this.data.isRemoving) {
            this.playIdle();
        }

        // Garante que ele não ataque imediatamente quando ela levantar.
        this.data.nextAttackAllowedAt = Math.max(
            this.data.nextAttackAllowedAt,
            now + 900
        );

        return true;
    }

    update(player, aiEnabled = true) {
        if (!this.sprite || !this.sprite.active) return;

        const sprite = this.sprite;
        const data = this.data;

        if (data.isDead || data.isRemoving) {
            sprite.body?.setVelocity(0, 0);
            return;
        }

        if (!aiEnabled) {
            sprite.body?.setVelocity(0, 0);
            this.playIdle();
            return;
        }

        if (!player || !player.sprite || player.isDead) {
            sprite.body?.setVelocity(0, 0);
            this.playIdle();
            return;
        }

        if (data.isAttacking || data.isHurt || data.isBeingThrown || data.isReturning) {
            sprite.body?.setVelocity(0, 0);
            return;
        }

        if (this.esperarLeonaLevantar(player)) {
            return;
        }

        const playerSprite = player.sprite;
        const playerY = player.getGroundY ? player.getGroundY() : playerSprite.y;

        const dx = playerSprite.x - sprite.x;
        const dy = playerY - sprite.y;

        const distanciaX = Math.abs(dx);
        const distanciaY = Math.abs(dy);

        const now = this.scene.time.now;


        const podeInvestir =
            distanciaX <= data.dashStartRangeX &&
            distanciaY <= data.dashStartRangeY &&
            now >= data.nextAttackAllowedAt;

        if (podeInvestir) {
            this.atacarInvestida(player);
            return;
        }

        this.perseguirPlayer(player);
    }

    perseguirPlayer(player) {
        const sprite = this.sprite;
        const data = this.data;

        const playerY = player.getGroundY ? player.getGroundY() : player.sprite.y;

        const dx = player.sprite.x - sprite.x;
        const dy = playerY - sprite.y;

        let vx = 0;
        let vy = 0;

        if (dx < -8) vx = -data.speed;
        if (dx > 8) vx = data.speed;

        if (dy < -8) vy = -data.speed * 0.62;
        if (dy > 8) vy = data.speed * 0.62;

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
    }

    atacarInvestida(player) {
        const sprite = this.sprite;
        const data = this.data;

        if (data.isDead || data.isRemoving) return;
        if (data.isAttacking || data.isHurt || data.isReturning) return;
        if (!player || player.isDead) return;

        data.isAttacking = true;
        data.isReturning = false;
        data.hasHitPlayerThisAttack = false;
        data.lastAttackTime = this.scene.time.now;

        sprite.body.setVelocity(0, 0);
        sprite.anims.stop();

        this.virarParaPlayer(player);

        sprite.setTexture("boss_punch1");
        this.ajustarEscalaSprite();

        this.scene.tocarSom?.(this.scene.sfxPunch, true);

        const playerY = player.getGroundY ? player.getGroundY() : player.sprite.y;
        const direcao = player.sprite.x < sprite.x ? -1 : 1;

        // Posição onde a investida começou.
        const xInicial = sprite.x;
        const yInicial = sprite.y;

        data.attackHomeX = xInicial;
        data.attackHomeY = yInicial;

        const xFinal = Phaser.Math.Clamp(
            player.sprite.x + direcao * 125,
            60,
            this.worldWidth - 60
        );

        const yFinal = Phaser.Math.Clamp(
            playerY,
            this.floorTop,
            this.floorBottom
        );

        this.scene.time.delayedCall(140, () => {
            if (!sprite.active) return;
            if (data.isDead || data.isRemoving || !data.isAttacking) return;

            sprite.setTexture("boss_punch2");
            this.ajustarEscalaSprite();

            this.scene.tweens.add({
                targets: sprite,
                x: xFinal,
                y: yFinal,
                duration: 260,
                ease: "Quad.Out",

                onUpdate: () => {
                    if (!sprite.active) return;
                    if (data.isDead || data.isRemoving) return;
                    if (!data.isAttacking) return;

                    this.verificarHitInvestida(player);
                },

                onComplete: () => {
                    if (!sprite.active) return;
                    if (data.isDead || data.isRemoving) return;

                    data.isAttacking = false;
                    data.isReturning = true;
                    data.hasHitPlayerThisAttack = false;

                    sprite.body.setVelocity(0, 0);

                    this.virarParaPonto(xInicial);
                    this.playWalk();

                    this.scene.tweens.add({
                        targets: sprite,
                        x: xInicial,
                        y: yInicial,
                        duration: 380,
                        ease: "Quad.Out",

                        onComplete: () => {
                            if (!sprite.active) return;
                            if (data.isDead || data.isRemoving) return;

                            data.isReturning = false;
                            data.isAttacking = false;
                            data.hasHitPlayerThisAttack = false;

                            sprite.body.setVelocity(0, 0);
                            this.playIdle();

                           data.lastAttackTime = this.scene.time.now;

                            const pausaExtraSeLeonaCaiu = this.playerEstaCaindoOuRecuperando(player) ? 1200 : 0;

                            data.nextAttackAllowedAt = this.scene.time.now + Phaser.Math.Between(
                                2300 + pausaExtraSeLeonaCaiu,
                                3200 + pausaExtraSeLeonaCaiu
                            );
                        }
                    });
                }
            });
        });
    }

    virarParaPonto(x) {
        if (!this.sprite?.active) return;

        const pontoEstaNaEsquerda = x < this.sprite.x;

        // Se o sprite original do Eisen olha para a esquerda, use esta linha:
        this.sprite.setFlipX(!pontoEstaNaEsquerda);

        // Se ficar invertido visualmente, troque pela linha abaixo:
        // this.sprite.setFlipX(pontoEstaNaEsquerda);
    }

    cancelarAtaque() {
        if (!this.sprite?.active) return;

        this.scene.tweens.killTweensOf(this.sprite);

        if (this.data.hurtReturnEvent) {
            this.data.hurtReturnEvent.remove(false);
            this.data.hurtReturnEvent = null;
        }

        this.data.isAttacking = false;
        this.data.isReturning = false;
        this.data.isHurt = false;
        this.data.isBeingThrown = false;
        this.data.hasHitPlayerThisAttack = false;

        this.sprite.body?.setVelocity(0, 0);
        this.sprite.setAngle(0);
        this.playIdle();

        this.data.nextAttackAllowedAt = this.scene.time.now + 1600;
    }

    verificarHitInvestida(player) {
        const data = this.data;

        if (data.hasHitPlayerThisAttack) return;
        if (!player || !player.sprite || player.isDead) return;

        const playerY = player.getGroundY ? player.getGroundY() : player.sprite.y;

        const dx = Math.abs(player.sprite.x - this.sprite.x);
        const dy = Math.abs(playerY - this.sprite.y);

        if (dx > data.dashHitX || dy > data.dashHitY) return;

        data.hasHitPlayerThisAttack = true;
        data.pauseUntil = this.scene.time.now + 1800;
        data.nextAttackAllowedAt = this.scene.time.now + 2600;

        if (typeof player.receberDanoArremesso === "function") {
            player.receberDanoArremesso(data.damage, this.sprite.x);
            return;
        }

        if (typeof player.receberDanoRaio === "function") {
            // Reaproveita a queda forte que já criamos para a fase 2.
            player.receberDanoRaio(data.damage, this.sprite.x);
            return;
        }

        if (typeof player.receberDano === "function") {
            player.receberDano(data.damage, this.sprite.x);
        }
    }

    receberDano(valor, opcoes = {}) {
        const player = opcoes.player;

        if (this.data.isDead || this.data.isRemoving) return false;
        if (this.data.isBeingThrown || this.data.isReturning) return false;

        this.data.currentHp -= valor;
        if (this.data.currentHp < 0) this.data.currentHp = 0;

        this.data.isHurt = true;
        this.data.isAttacking = false;
        this.data.hasHitPlayerThisAttack = false;
        this.data.nextAttackAllowedAt = this.scene.time.now + 1300;

        if (this.data.hurtReturnEvent) {
            this.data.hurtReturnEvent.remove(false);
            this.data.hurtReturnEvent = null;
        }

        this.scene.tweens.killTweensOf(this.sprite);

        this.sprite.body.setVelocity(0, 0);
        this.sprite.anims.stop();
        this.sprite.setTexture("boss_damage");
        this.ajustarEscalaSprite();

        this.scene.tocarSom?.(this.scene.sfxEnemyDamage, true);

        if (player?.sprite) {
            this.data.lastHitFromX = player.sprite.x;

            // Decide o lado ANTES do empurrão para não virar errado durante o hitstun.
            const atacanteVeioDaEsquerda = player.sprite.x < this.sprite.x;
            const flipDuranteHit = atacanteVeioDaEsquerda;

            const empurrao = atacanteVeioDaEsquerda ? 28 : -28;
            this.sprite.x += empurrao;
            this.sprite.x = Phaser.Math.Clamp(this.sprite.x, 50, this.worldWidth - 50);

            this.sprite.setFlipX(flipDuranteHit);
         }

        if (this.data.currentHp <= 0) {
            this.morrer(player?.sprite?.x ?? this.data.lastHitFromX ?? null);
            return true;
        }

        if (opcoes.arremessarDepois === true && player?.sprite) {
            this.arremessar(player);
            return true;
        }

        this.data.hurtReturnEvent = this.scene.time.delayedCall(210, () => {
            if (this.data.isDead || this.data.isRemoving) return;
            if (this.data.isBeingThrown || this.data.isReturning) return;

            this.data.isHurt = false;
            this.playIdle();
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

        if (data.hurtReturnEvent) {
            data.hurtReturnEvent.remove(false);
            data.hurtReturnEvent = null;
        }

        this.scene.tweens.killTweensOf(sprite);

        data.isHurt = true;
        data.isAttacking = false;
        data.isBeingThrown = true;
        data.isReturning = false;
        data.hasHitPlayerThisAttack = false;

        sprite.body.setVelocity(0, 0);
        sprite.anims.stop();
        sprite.setTexture("boss_damage");
        this.ajustarEscalaSprite();

       const direcao = player.sprite.x < sprite.x ? 1 : -1;

        const xBase = sprite.x;
        const yBase = sprite.y;

        const xPico = Phaser.Math.Clamp(
            xBase + direcao * 80,
            60,
            this.worldWidth - 60
        );

        const yPico = Phaser.Math.Clamp(
            yBase - 32,
            this.floorTop,
            this.floorBottom
        );

        const xFinal = Phaser.Math.Clamp(
            xBase + direcao * 145,
            60,
            this.worldWidth - 60
        );

        const yFinal = Phaser.Math.Clamp(
            yBase + 12,
            this.floorTop,
            this.floorBottom
        );

        const flipQueda = direcao > 0;

        this.scene.tweens.add({
            targets: sprite,
            x: xPico,
            y: yPico,
            angle: direcao * 6,
            duration: 150,
            ease: "Quad.Out",

            onComplete: () => {
                if (!sprite.active) return;
                if (data.isDead || data.isRemoving) return;

                sprite.setFlipX(flipQueda);
                sprite.play("boss_death", true);
                this.ajustarEscalaSprite();

                this.scene.tweens.add({
                    targets: sprite,
                    x: xFinal,
                    y: yFinal,
                    angle: 0,
                    duration: 280,
                    ease: "Quad.In",

                    onUpdate: () => {
                        if (sprite.active) {
                            sprite.setFlipX(flipQueda);
                        }
                    },

                    onComplete: () => {
                        if (!sprite.active) return;
                        if (data.isDead || data.isRemoving) return;

                        this.scene.time.delayedCall(520, () => {
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
        this.data.hasHitPlayerThisAttack = false;

        this.sprite.body.setVelocity(0, 0);
        this.sprite.setAngle(0);
        this.playIdle();
    }

    liberarHitstun() {
        if (!this.sprite || !this.sprite.active) return;
        if (this.data.isDead || this.data.isRemoving) return;
        if (this.data.isBeingThrown || this.data.isReturning) return;

        if (this.data.hurtReturnEvent) {
            this.data.hurtReturnEvent.remove(false);
            this.data.hurtReturnEvent = null;
        }

        this.data.hurtReturnEvent = this.scene.time.delayedCall(140, () => {
            if (this.data.isDead || this.data.isRemoving) return;
            if (this.data.isBeingThrown || this.data.isReturning) return;

            this.data.isHurt = false;
            this.playIdle();
        });
    }

    morrer(origemX = null) {
        if (this.data.isDead || this.data.isRemoving) return;

        this.data.isDead = true;
        this.data.isRemoving = true;
        this.data.isAttacking = false;
        this.data.isHurt = false;
        this.data.isBeingThrown = false;
        this.data.isReturning = false;

        if (this.data.hurtReturnEvent) {
            this.data.hurtReturnEvent.remove(false);
            this.data.hurtReturnEvent = null;
        }

        this.scene.tweens.killTweensOf(this.sprite);

        this.sprite.body.setVelocity(0, 0);
        this.sprite.anims.stop();
        this.sprite.setTexture("boss_damage");
        this.ajustarEscalaSprite();

        const xBase = this.sprite.x;
        const yBase = this.sprite.y;
        const origemGolpe = origemX !== null ? origemX : xBase - 40;
        const direcao = origemGolpe < xBase ? 1 : -1;

        this.scene.tweens.add({
            targets: this.sprite,
            x: xBase + direcao * 58,
            y: yBase - 28,
            duration: 150,
            ease: "Quad.Out",
            onComplete: () => {
                if (!this.sprite.active) return;

                this.sprite.play("boss_death", true);
                this.ajustarEscalaSprite();

                this.scene.tocarSom?.(this.scene.sfxBossDeath, true);

                this.scene.tweens.add({
                    targets: this.sprite,
                    x: xBase + direcao * 96,
                    y: Phaser.Math.Clamp(yBase + 16, this.floorTop, this.floorBottom),
                    alpha: 0.75,
                    duration: 360,
                    ease: "Quad.In"
                });
            }
        });
    }

    virarParaPlayer(player) {
        if (!player?.sprite || !this.sprite?.active) return;
        this.sprite.setFlipX(player.sprite.x < this.sprite.x);
    }

    playIdle() {
        if (!this.sprite || !this.sprite.active) return;

        if (this.sprite.anims.currentAnim?.key !== "boss_idle") {
            this.sprite.play("boss_idle", true);
            this.ajustarEscalaSprite();
        }
    }

    playWalk() {
        if (!this.sprite || !this.sprite.active) return;

        if (this.sprite.anims.currentAnim?.key !== "boss_walk") {
            this.sprite.play("boss_walk", true);
            this.ajustarEscalaSprite();
        }
    }

    ajustarEscalaSprite() {
        if (!this.sprite || !this.sprite.frame) return;

        const escala = this.alturaBoss / this.sprite.frame.height;
        this.sprite.setScale(escala);
    }

    isAlive() {
        return !this.data.isDead && !this.data.isRemoving && this.sprite?.active;
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