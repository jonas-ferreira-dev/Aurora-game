export class LeonaPlayer {
    static preload(scene) {
        scene.load.image("leona_idle", "assets/player/idle.png");
        scene.load.image("leona_idle2", "assets/player/idle2.png");
        scene.load.image("leona_idle3", "assets/player/idle3.png");

        scene.load.image("leona_walk1", "assets/player/walking1.png");
        scene.load.image("leona_walk2", "assets/player/walking2.png");
        scene.load.image("leona_walk3", "assets/player/walking3.png");
        scene.load.image("leona_walk4", "assets/player/walking4.png");
        scene.load.image("leona_walk5", "assets/player/walking5.png");

        scene.load.image("leona_punch1", "assets/player/punch1.png");
        scene.load.image("leona_punch2", "assets/player/punch2.png");
        scene.load.image("leona_punch3", "assets/player/punch3.png");
        scene.load.image("leona_punch4", "assets/player/punch4.png");

        scene.load.image("leona_kick", "assets/player/punch4.png");
        scene.load.image("leona_jump0", "assets/player/jump0 .png");
        scene.load.image("leona_jump", "assets/player/jump.png");
        scene.load.image("leona_jump2", "assets/player/jump2 .png");
        scene.load.image("leona_airKick", "assets/player/kick3.png");

        scene.load.image("leona_damage", "assets/player/damage.png");
        scene.load.image("leona_death1", "assets/player/death1.png");
        scene.load.image("leona_death2", "assets/player/death2.png");
    }

    static createAnimations(scene) {

        if (!scene.anims.exists("leona_idle")) {
            scene.anims.create({
                key: "leona_idle",
                frames: [
                    { key: "leona_idle" },
                    { key: "leona_idle2" },
                    { key: "leona_idle3" },
                    { key: "leona_idle2" }
                ],

                // Bem mais lento.
                // 1.2 = ciclo mais calmo, com cara de respiração/pose parada.
                frameRate: 1.2,

                repeat: -1
            });
        }

        if (!scene.anims.exists("leona_walk")) {
            scene.anims.create({
                key: "leona_walk",
                frames: [
                    { key: "leona_walk1" },
                    { key: "leona_walk2" },
                    { key: "leona_walk3" },
                    { key: "leona_walk4" },
                    { key: "leona_walk5" }
                ],
                frameRate: 8.4,
                repeat: -1
            });
        }

        if (!scene.anims.exists("leona_jump_anim")) {
            scene.anims.create({
                key: "leona_jump_anim",
                frames: [
                    { key: "leona_jump0" },
                    { key: "leona_jump" },
                    { key: "leona_jump2" }
                ],

                // Mais lento para acompanhar melhor o tempo do pulo.
                frameRate: 4,

                repeat: 0
            });
        }

        if (!scene.anims.exists("leona_death")) {
            scene.anims.create({
                key: "leona_death",
                frames: [
                    { key: "leona_death1" },
                    { key: "leona_death2" }
                ],
                frameRate: 4,
                repeat: 0
            });
        }
    }

    constructor(scene, x, y, config = {}) {
        this.scene = scene;

        this.worldWidth = config.worldWidth ?? 1280;
        this.floorTop = config.floorTop ?? 470;
        this.floorBottom = config.floorBottom ?? 675;
        this.alturaPlayer = config.alturaPlayer ?? 212;

        this.sprite = scene.physics.add.sprite(x, y, "leona_idle");
        this.sprite.setOrigin(0.5, 1);
        this.sprite.setCollideWorldBounds(true);

        this.ajustarEscalaSprite();
        this.sprite.play("leona_idle");

        this.sprite.on(Phaser.Animations.Events.ANIMATION_UPDATE, () => {
            this.ajustarEscalaSprite();
        });

        this.isDead = false;
        this.inAction = false;
        this.isPunching = false;

        this.comboStep = 0;
        this.punchBuffer = 0;
        this.maxCombo = 4;

        this.comboWaitingForInput = false;
        this.comboInputGrace = 600;
        this.comboWaitEvent = null;
        this.comboAcertouInimigo = false;
        this.comboHitsConectados = 0;
        this.currentPunchHit = false;
        this.comboHitTargets = new Set();

        this.maxHp = 100;
        this.currentHp = 100;

        this.playerIframesUntil = 0;
        this.playerAttackArmorUntil = 0;

        this.isJumping = false;
        this.isAirKicking = false;
        this.isBeingShocked = false;
        this.jumpGroundY = null;
        this.jumpTween = null;
        this.jumpOffset = { y: 0 };
        this.airMoveSpeed = 210;
        this.jumpTakeoffEvent = null;
    }

    update(cursors, keys, targets) {
        if (this.isDead) {
            this.sprite.setVelocity(0, 0);
            return;
        }

        if (this.isBeingShocked) {
            this.sprite.setVelocity(0, 0);
            return;
        }

        if (this.isJumping) {
            this.atualizarMovimentoAereo(cursors, keys);

            if (Phaser.Input.Keyboard.JustDown(keys.K)) {
                this.voadoraAerea(targets);
            }

            return;
        }

        if (Phaser.Input.Keyboard.JustDown(keys.J)) {
            const podeAcertarInimigo = this.algumAlvoNaAreaDoGolpe(targets, 118, 74);

            if (this.comboWaitingForInput && this.comboStep < this.maxCombo) {
                if (!podeAcertarInimigo) {
                    this.encerrarCombo(targets);
                    return;
                }

                this.comboWaitingForInput = false;

                if (this.comboWaitEvent) {
                    this.comboWaitEvent.remove(false);
                    this.comboWaitEvent = null;
                }

                this.comboStep++;
                this.executarPunch(this.comboStep, targets);
                return;
            }

            if (this.isPunching) {
                const podeBufferizar =
                    this.comboAcertouInimigo ||
                    podeAcertarInimigo;

                if (podeBufferizar && this.comboStep + this.punchBuffer < this.maxCombo) {
                    this.punchBuffer++;
                }

                return;
            }

            // Soco normal sempre sai, mesmo longe.
            // Só continua combo se acertar algum alvo.
            if (!this.inAction) {
                this.iniciarCombo(targets);
                return;
            }
        }

        if (this.inAction) {
            this.sprite.setVelocity(0, 0);
            return;
        }

        if (Phaser.Input.Keyboard.JustDown(keys.SPACE)) {
            this.iniciarPulo();
            return;
        }

        if (Phaser.Input.Keyboard.JustDown(keys.K)) {
            this.voadora(targets);
            return;
        }

        this.movimentar(cursors, keys);
    }

    movimentar(cursors, keys) {
        const velocidade = 230;

        let vx = 0;
        let vy = 0;



        const esquerda = cursors.left.isDown || keys.A.isDown;
        const direita = cursors.right.isDown || keys.D.isDown;
        const cima = cursors.up.isDown || keys.W.isDown;
        const baixo = cursors.down.isDown || keys.S.isDown;

        if (esquerda) vx = -velocidade;
        if (direita) vx = velocidade;
        if (cima) vy = -velocidade;
        if (baixo) vy = velocidade;

        if (vx !== 0 && vy !== 0) {
            vx *= 0.7071;
            vy *= 0.7071;
        }

        this.sprite.setVelocity(vx, vy);

        if (vx < 0) this.sprite.setFlipX(true);
        if (vx > 0) this.sprite.setFlipX(false);

        const moving = vx !== 0 || vy !== 0;

        if (moving) {
            if (this.sprite.anims.currentAnim?.key !== "leona_walk") {
                this.sprite.play("leona_walk", true);
            }
        } else if (this.sprite.anims.currentAnim?.key !== "leona_idle") {
            this.sprite.play("leona_idle", true);
        }

        this.sprite.y = Phaser.Math.Clamp(this.sprite.y, this.floorTop, this.floorBottom);
        const limiteX = this.currentLimitX ?? this.worldWidth - 30;
        this.sprite.x = Phaser.Math.Clamp(this.sprite.x, 30, limiteX);
    }

    iniciarPulo() {
            if (this.isDead || this.inAction || this.isJumping) return;

            this.inAction = true;
            this.isJumping = true;
            this.isAirKicking = false;

            this.jumpGroundY = this.sprite.y;
            this.jumpOffset = { y: 0 };

            this.sprite.setVelocity(0, 0);
            this.sprite.anims.stop();

            // jump0 só aparece no chão / começo do pulo
            this.sprite.setTexture("leona_jump0");
            this.ajustarEscalaSprite();

            if (this.jumpTween) {
                this.jumpTween.stop();
                this.jumpTween = null;
            }

            if (this.jumpTakeoffEvent) {
                this.jumpTakeoffEvent.remove(false);
                this.jumpTakeoffEvent = null;
            }

            // Depois de um instante, troca para o frame do ar.
            // Assim o jump0 não fica aparecendo quando ela já está no alto.
            this.jumpTakeoffEvent = this.scene.time.delayedCall(90, () => {
                this.jumpTakeoffEvent = null;

                if (!this.isJumping || this.isAirKicking || this.isDead) return;

                this.sprite.anims.stop();
                this.sprite.setTexture("leona_jump");
                this.ajustarEscalaSprite();
            });

            this.jumpTween = this.scene.tweens.add({
                targets: this.jumpOffset,

                // Mais alto
                y: -140,

                // Mais lento
                duration: 360,

                ease: "Quad.Out",
                yoyo: true,

                // Suspensão no topo
                hold: 190,

                onUpdate: () => {
                    if (!this.sprite || !this.sprite.active) return;

                    const baseY = this.jumpGroundY !== null ? this.jumpGroundY : this.sprite.y;
                    this.sprite.y = baseY + this.jumpOffset.y;
                },

                // Quando começa a descida, usa o jump2
                onYoyo: () => {
                    if (!this.isJumping || this.isAirKicking || this.isDead) return;

                    this.sprite.anims.stop();
                    this.sprite.setTexture("leona_jump2");
                    this.ajustarEscalaSprite();
                },

                onComplete: () => {
                    this.finalizarPulo();
                }
            });
        }

    atualizarMovimentoAereo(cursors, keys) {
        if (!this.isJumping) return;

        const delta = this.scene.game.loop.delta / 1000;
        const velocidade = this.airMoveSpeed;

        let vx = 0;
        let vy = 0;

        const esquerda = cursors.left.isDown || keys.A.isDown;
        const direita = cursors.right.isDown || keys.D.isDown;
        const cima = cursors.up.isDown || keys.W.isDown;
        const baixo = cursors.down.isDown || keys.S.isDown;

        if (esquerda) vx = -velocidade;
        if (direita) vx = velocidade;
        if (cima) vy = -velocidade;
        if (baixo) vy = velocidade;

        if (vx !== 0 && vy !== 0) {
            vx *= 0.7071;
            vy *= 0.7071;
        }

        this.sprite.x += vx * delta;

        if (this.jumpGroundY === null) {
            this.jumpGroundY = this.sprite.y;
        }

        this.jumpGroundY += vy * delta;

        this.sprite.x = Phaser.Math.Clamp(this.sprite.x, 30, this.worldWidth - 30);
        const limiteX = this.currentLimitX ?? this.worldWidth - 30;
        this.sprite.x = Phaser.Math.Clamp(this.sprite.x, 30, limiteX);
        this.jumpGroundY = Phaser.Math.Clamp(this.jumpGroundY, this.floorTop, this.floorBottom);

        const offsetY = this.jumpOffset ? this.jumpOffset.y : 0;
        this.sprite.y = this.jumpGroundY + offsetY;

        if (vx < 0) this.sprite.setFlipX(true);
        if (vx > 0) this.sprite.setFlipX(false);

        // O jump0 só deve acontecer no início do pulo.
        if (!this.isAirKicking) {
            const texturaAtual = this.sprite.texture.key;

            const estaEmSpriteDePulo =
                texturaAtual === "leona_jump0" ||
                texturaAtual === "leona_jump" ||
                texturaAtual === "leona_jump2";

            if (!estaEmSpriteDePulo) {
                this.sprite.anims.stop();
                this.sprite.setTexture("leona_jump");
                this.ajustarEscalaSprite();
            }
        }
        this.sprite.setVelocity(0, 0);

    }

    finalizarPulo() {
        if (this.isDead) return;

       
        if (this.jumpTakeoffEvent) {
            this.jumpTakeoffEvent.remove(false);
            this.jumpTakeoffEvent = null;
        }
       
        if (this.jumpGroundY !== null) {
            this.sprite.y = this.jumpGroundY;
        }


        this.jumpGroundY = null;
        this.jumpTween = null;
        this.jumpOffset = { y: 0 };

        this.isJumping = false;
        this.isAirKicking = false;
        this.inAction = false;

        this.sprite.setVelocity(0, 0);
        this.sprite.play("leona_idle", true);
        this.ajustarEscalaSprite();
    }

    iniciarCombo(targets) {
        this.comboStep = 1;
        this.punchBuffer = 0;
        this.comboAcertouInimigo = false;
        this.comboHitsConectados = 0;
        this.currentPunchHit = false;
        this.comboWaitingForInput = false;
        this.comboHitTargets.clear();

        if (this.comboWaitEvent) {
            this.comboWaitEvent.remove(false);
            this.comboWaitEvent = null;
        }

        this.executarPunch(this.comboStep, targets);
    }

    executarPunch(step, targets) {
        this.inAction = true;
        this.isPunching = true;
        this.comboWaitingForInput = false;
        this.currentPunchHit = false;

        this.sprite.setVelocity(0, 0);
        this.sprite.anims.stop();

        this.sprite.setTexture(`leona_punch${step}`);
        this.ajustarEscalaSprite();

        this.scene.tocarSom?.(this.scene.sfxPunch, true);

        let dano = 12;
        let alcanceX = 118;
        let alcanceY = 52;
        let duracao = 190;

       if (step === 2) {
            dano = 14;
            alcanceX = 124;
            alcanceY = 54;
            duracao = 200;
        }

        if (step === 3) {
            dano = 18;
            alcanceX = 134;
            alcanceY = 56;
            duracao = 220;
        }

        if (step === 4) {
            dano = 26;
            alcanceX = 150;
            alcanceY = 60;
            duracao = 260;
        }

        this.playerAttackArmorUntil = this.scene.time.now + duracao + 90;

        this.scene.time.delayedCall(55, () => {
            this.tentarAcertarAlvos(targets, dano, alcanceX, alcanceY);
        });

        this.scene.time.delayedCall(duracao, () => {
            if (!this.currentPunchHit) {
                this.encerrarCombo(targets);
                return;
            }

            if (this.punchBuffer > 0 && this.comboStep < this.maxCombo) {
                this.punchBuffer--;
                this.comboStep++;
                this.executarPunch(this.comboStep, targets);
                return;
            }

            if (this.comboStep < this.maxCombo) {
                this.aguardarProximoGolpeCombo(targets);
                return;
            }

            this.encerrarCombo(targets);
        });
    }

    aguardarProximoGolpeCombo(targets) {
        this.isPunching = false;
        this.comboWaitingForInput = true;

        this.sprite.setVelocity(0, 0);

        if (!this.isDead) {
            this.sprite.play("leona_idle", true);
            this.ajustarEscalaSprite();
        }

        if (this.comboWaitEvent) {
            this.comboWaitEvent.remove(false);
            this.comboWaitEvent = null;
        }

        this.comboWaitEvent = this.scene.time.delayedCall(this.comboInputGrace, () => {
            if (this.comboWaitingForInput) {
                this.encerrarCombo(targets);
            }
        });
    }

    encerrarCombo(targets) {
        const comboCompletoConectou =
            this.comboStep >= this.maxCombo &&
            this.comboHitsConectados >= this.maxCombo;

        if (this.comboWaitEvent) {
            this.comboWaitEvent.remove(false);
            this.comboWaitEvent = null;
        }

        const alvosValidos = this.getAlvosValidos(targets);

        this.inAction = false;
        this.isPunching = false;
        this.comboWaitingForInput = false;
        this.comboStep = 0;
        this.punchBuffer = 0;
        this.comboAcertouInimigo = false;
        this.comboHitsConectados = 0;
        this.currentPunchHit = false;

        if (!this.isDead) {
            this.sprite.play("leona_idle", true);
            this.ajustarEscalaSprite();
        }

       const alvosDoCombo = Array.from(this.comboHitTargets).filter((target) => {
            if (!target || !target.sprite || !target.sprite.active) return false;
            if (target.data?.isDead || target.data?.isRemoving) return false;
            if (target.data?.isBeingThrown || target.data?.isReturning) return false;
            return true;
        });

        if (comboCompletoConectou) {
            alvosDoCombo.forEach((target) => {
                if (typeof target.arremessar === "function") {
                    target.arremessar(this);
                }
            });
        } else {
            alvosDoCombo.forEach((target) => {
                if (typeof target.liberarHitstun === "function") {
                    target.liberarHitstun();
                }
            });
        }

        this.comboHitTargets.clear();
    }

    voadora(targets) {
        if (this.isDead || this.inAction) return;

        this.inAction = true;
        this.isPunching = false;
        this.comboStep = 0;
        this.punchBuffer = 0;
        this.comboWaitingForInput = false;
        this.comboAcertouInimigo = false;
        this.comboHitsConectados = 0;
        this.currentPunchHit = false;

        if (this.comboWaitEvent) {
            this.comboWaitEvent.remove(false);
            this.comboWaitEvent = null;
        }

        this.playerAttackArmorUntil = this.scene.time.now + 320;

        this.sprite.setVelocity(0, 0);
        this.sprite.anims.stop();
        this.sprite.setTexture("leona_kick");
        this.ajustarEscalaSprite();

        this.scene.tocarSom?.(this.scene.sfxKick, true);

        this.scene.time.delayedCall(60, () => {
            this.tentarAcertarAlvos(targets, 26, 160, 84, {
                arremessarDepois: true
            });
        });

        this.scene.time.delayedCall(280, () => {
            if (!this.isDead) {
                this.inAction = false;
                this.sprite.play("leona_idle", true);
                this.ajustarEscalaSprite();
            }
        });
    }

    voadoraAerea(targets) {
        if (this.isDead || !this.isJumping || this.isAirKicking) return;

        this.isAirKicking = true;
        this.playerAttackArmorUntil = this.scene.time.now + 360;

        this.sprite.anims.stop();
        this.sprite.setTexture("leona_airKick");
        this.ajustarEscalaSprite();

        this.scene.tocarSom?.(this.scene.sfxKick, true);

        this.scene.time.delayedCall(55, () => {
            this.tentarAcertarAlvos(targets, 30, 170, 115, {
                arremessarDepois: true
            });
        });
    }

    setCurrentLimitX(limitX) {
            this.currentLimitX = limitX;
    }

    tentarAcertarInimigo(enemy, dano, alcanceX, alcanceY, opcoes = {}) {
        if (!enemy || !enemy.sprite || !enemy.sprite.active) return false;

        const acertou = this.inimigoNaAreaDoGolpe(enemy, alcanceX, alcanceY);
        

        if (!acertou) return false;

        const aplicouDano = enemy.receberDano(dano, {
            player: this,
            arremessarDepois: opcoes.arremessarDepois
        });

        if (aplicouDano && this.comboStep > 0) {
            this.comboAcertouInimigo = true;
            this.currentPunchHit = true;

            this.comboHitsConectados = Math.max(
                this.comboHitsConectados,
                this.comboStep
            );
        }

        return aplicouDano;
    }

    tentarAcertarInimigoAereo(enemy, dano, alcanceX, alcanceY, opcoes = {}) {
        if (!enemy || !enemy.sprite || !enemy.sprite.active) return false;

        const acertou = this.inimigoNaAreaDoGolpeAereo(enemy, alcanceX, alcanceY);

        if (!acertou) return false;

        return enemy.receberDano(dano, {
            player: this,
            arremessarDepois: opcoes.arremessarDepois
        });
    }

    inimigoNaAreaDoGolpe(enemy, alcanceX = 118, alcanceY = 74) {
        if (!enemy || !enemy.sprite || !enemy.sprite.active) return false;
        if (enemy.data.isBeingThrown || enemy.data.isReturning) return false;

        const dx = enemy.sprite.x - this.sprite.x;
        const dy = Math.abs(enemy.sprite.y - this.sprite.y);

        const muitoColado = Math.abs(dx) <= 56;

        let acertouNaFrente = false;

        if (this.sprite.flipX) {
            acertouNaFrente = dx < 0 && Math.abs(dx) <= alcanceX;
        } else {
            acertouNaFrente = dx > 0 && dx <= alcanceX;
        }

        return (acertouNaFrente || muitoColado) && dy <= alcanceY;
    }

    inimigoNaAreaDoGolpeAereo(enemy, alcanceX = 170, alcanceY = 115) {
        if (!enemy || !enemy.sprite || !enemy.sprite.active) return false;
        if (enemy.data.isBeingThrown || enemy.data.isReturning) return false;

        const dx = enemy.sprite.x - this.sprite.x;

        const baseY = this.jumpGroundY !== null ? this.jumpGroundY : this.sprite.y;
        const dy = Math.abs(enemy.sprite.y - baseY);

        const muitoColado = Math.abs(dx) <= 62;

        let acertouNaFrente = false;

        if (this.sprite.flipX) {
            acertouNaFrente = dx < 0 && Math.abs(dx) <= alcanceX;
        } else {
            acertouNaFrente = dx > 0 && dx <= alcanceX;
        }

        return (acertouNaFrente || muitoColado) && dy <= alcanceY;
    }


    receberDanoRaio(valor, origemX = null) {
        if (this.isDead) return;
        if (this.isBeingShocked) return;
        if (this.scene.time.now < this.playerIframesUntil) return;

        this.playerIframesUntil = this.scene.time.now + 900;

        this.currentHp -= valor;
        if (this.currentHp < 0) this.currentHp = 0;

        this.scene.tocarSom?.(this.scene.sfxHurt, true);

        if (this.comboWaitEvent) {
            this.comboWaitEvent.remove(false);
            this.comboWaitEvent = null;
        }

        if (this.jumpTween) {
            this.jumpTween.stop();
            this.jumpTween = null;
        }

        if (this.jumpTakeoffEvent) {
            this.jumpTakeoffEvent.remove(false);
            this.jumpTakeoffEvent = null;
        }

        this.isBeingShocked = true;
        this.inAction = true;
        this.isPunching = false;
        this.isJumping = false;
        this.isAirKicking = false;
        this.comboStep = 0;
        this.punchBuffer = 0;
        this.comboWaitingForInput = false;
        this.comboAcertouInimigo = false;
        this.comboHitsConectados = 0;
        this.currentPunchHit = false;

        this.jumpGroundY = null;
        this.jumpOffset = { y: 0 };

        this.sprite.setVelocity(0, 0);
        this.sprite.anims.stop();
        this.sprite.setTexture("leona_damage");
        this.ajustarEscalaSprite();

        const ALTURA_LEONA_CAIDA_RAIO = 175;
        const TEMPO_SUBIDA_RAIO = 150;
        const TEMPO_QUEDA_RAIO = 280;
        const TEMPO_NO_CHAO_APOS_RAIO = 800;

        const direcao = origemX !== null && origemX <= this.sprite.x ? 1 : -1;

        // Se a pose deitada ainda aparecer invertida, troque esta linha para:
        // const flipCaida = direcao > 0;
        const flipCaida = direcao > 0;

        const xBase = this.sprite.x;
        const yBase = this.getGroundY ? this.getGroundY() : this.sprite.y;

        const limiteX = this.currentLimitX ?? this.worldWidth - 30;

        const xPico = Phaser.Math.Clamp(
            xBase + direcao * 48,
            30,
            limiteX
        );

        const xFinal = Phaser.Math.Clamp(
            xBase + direcao * 86,
            30,
            limiteX
        );

        const yFinal = Phaser.Math.Clamp(
            yBase + 10,
            this.floorTop,
            this.floorBottom
        );

        this.scene.tweens.killTweensOf(this.sprite);

       this.scene.tweens.add({
            targets: this.sprite,
            x: xPico,
            y: yBase - 38,
            angle: direcao * -8,
            duration: TEMPO_SUBIDA_RAIO,
            ease: "Quad.Out",
            onComplete: () => {
                if (!this.sprite.active) return;

                this.sprite.setTexture("leona_death1");
                this.sprite.setFlipX(flipCaida);
                this.ajustarEscalaSpritePorAltura(ALTURA_LEONA_CAIDA_RAIO);

                this.scene.tweens.add({
                    targets: this.sprite,
                    x: xFinal,
                    y: yFinal,
                    angle: 0,
                    duration: TEMPO_QUEDA_RAIO,
                    ease: "Quad.In",
                    onComplete: () => {
                        if (!this.sprite.active) return;

                        if (this.currentHp <= 0) {
                            this.morrer(origemX);
                            return;
                        }

                        this.sprite.setTexture("leona_death2");
                        this.sprite.setFlipX(flipCaida);
                        this.ajustarEscalaSpritePorAltura(ALTURA_LEONA_CAIDA_RAIO);

                        this.scene.time.delayedCall(TEMPO_NO_CHAO_APOS_RAIO, () => {
                            if (this.isDead) return;

                            this.isBeingShocked = false;
                            this.inAction = false;
                            this.sprite.setAngle(0);
                            this.sprite.play("leona_idle", true);
                            this.ajustarEscalaSprite();
                        });
                    }
                });
            }
        });
    }

    receberDano(valor, origemX = null) {
        if (this.isDead) return;
        if (this.scene.time.now < this.playerIframesUntil) return;
        if (this.scene.time.now < this.playerAttackArmorUntil) return;

        this.playerIframesUntil = this.scene.time.now + 450;

        this.currentHp -= valor;
        if (this.currentHp < 0) this.currentHp = 0;

        this.scene.tocarSom?.(this.scene.sfxHurt, true);

        if (this.currentHp <= 0) {
            this.morrer(origemX);
            return;
        }

        this.inAction = true;
        this.isPunching = false;
        this.comboStep = 0;
        this.punchBuffer = 0;
        this.comboWaitingForInput = false;
        this.comboAcertouInimigo = false;
        this.comboHitsConectados = 0;
        this.currentPunchHit = false;

        if (this.comboWaitEvent) {
            this.comboWaitEvent.remove(false);
            this.comboWaitEvent = null;
        }

        this.sprite.setVelocity(0, 0);
        this.sprite.anims.stop();
        this.sprite.setTexture("leona_damage");
        this.ajustarEscalaSprite();

        if (origemX !== null) {
            const empurrao = origemX < this.sprite.x ? 26 : -26;
            this.sprite.x += empurrao;
            this.sprite.x = Phaser.Math.Clamp(this.sprite.x, 30, this.worldWidth - 30);
        }

        this.scene.time.delayedCall(180, () => {
            if (!this.isDead) {
                this.inAction = false;
                this.sprite.play("leona_idle", true);
                this.ajustarEscalaSprite();
            }
        });
    }

    morrer(origemX = null) {
        if (this.isDead) return;

        this.isDead = true;
        this.inAction = true;
        this.isPunching = false;
        this.comboWaitingForInput = false;

        if (this.comboWaitEvent) {
            this.comboWaitEvent.remove(false);
            this.comboWaitEvent = null;
        }

        this.sprite.setVelocity(0, 0);
        this.sprite.anims.stop();
        this.sprite.setTexture("leona_damage");
        this.ajustarEscalaSprite();

        this.scene.tocarSom?.(this.scene.sfxDeath, true);

        const direcao = origemX !== null && origemX < this.sprite.x ? 1 : -1;
        const xBase = this.sprite.x;
        const yBase = this.sprite.y;

        this.scene.tweens.add({
            targets: this.sprite,
            x: xBase + direcao * 54,
            y: yBase - 28,
            duration: 150,
            ease: "Quad.Out",
            onComplete: () => {
                if (!this.sprite.active) return;

                this.sprite.play("leona_death", true);
                this.ajustarEscalaSprite();

                this.scene.tweens.add({
                    targets: this.sprite,
                    x: xBase + direcao * 82,
                    y: Phaser.Math.Clamp(yBase + 18, this.floorTop, this.floorBottom),
                    duration: 280,
                    ease: "Quad.In",
                    onComplete: () => {
                        this.scene.events.emit("player:dead");
                    }
                });
            }
        });
    }

    normalizarAlvos(targets) {
        if (!targets) return [];
        if (Array.isArray(targets)) return targets;
        return [targets];
    }

        getAlvosValidos(targets) {
            return this.normalizarAlvos(targets).filter((target) => {
                if (!target || !target.sprite || !target.sprite.active) return false;
                if (target.data?.isDead || target.data?.isRemoving) return false;
                if (target.data?.isBeingThrown || target.data?.isReturning) return false;
                return true;
            });
        }

        algumAlvoNaAreaDoGolpe(targets, alcanceX = 118, alcanceY = 74) {
            return this.getAlvosValidos(targets).some((target) => {
                return this.alvoNaAreaDoGolpe(target, alcanceX, alcanceY);
            });
        }

        alvoNaAreaDoGolpe(target, alcanceX = 118, alcanceY = 74) {
            if (!target || !target.sprite || !target.sprite.active) return false;

            const dx = target.sprite.x - this.sprite.x;
            const dy = Math.abs(target.sprite.y - this.getGroundY());

            const muitoColado = Math.abs(dx) <= 56;

            let acertouNaFrente = false;

            if (this.sprite.flipX) {
                acertouNaFrente = dx < 0 && Math.abs(dx) <= alcanceX;
            } else {
                acertouNaFrente = dx > 0 && dx <= alcanceX;
            }

            return (acertouNaFrente || muitoColado) && dy <= alcanceY;
        }

        tentarAcertarAlvos(targets, dano, alcanceX, alcanceY, opcoes = {}) {
            const alvosValidos = this.getAlvosValidos(targets);

            const candidatos = alvosValidos.filter((target) => {
                return this.alvoNaAreaDoGolpe(target, alcanceX, alcanceY);
            });

            if (candidatos.length === 0) {
                return false;
            }

            const leonaY = this.getGroundY();

            candidatos.sort((a, b) => {
                const dyA = Math.abs(a.sprite.y - leonaY);
                const dyB = Math.abs(b.sprite.y - leonaY);

                if (dyA !== dyB) {
                    return dyA - dyB;
                }

                const dxA = Math.abs(a.sprite.x - this.sprite.x);
                const dxB = Math.abs(b.sprite.x - this.sprite.x);

                return dxA - dxB;
            });

            const maxHits = opcoes.maxHits ?? 1;
            const alvosEscolhidos = candidatos.slice(0, maxHits);

            let acertouAlgum = false;

            alvosEscolhidos.forEach((target) => {
                if (typeof target.receberDano !== "function") return;

                const aplicou = target.receberDano(dano, {
                    player: this,
                    arremessarDepois: opcoes.arremessarDepois
                });

                if (aplicou) {
                    acertouAlgum = true;
                    this.comboHitTargets.add(target);
                }
            });

            if (acertouAlgum && this.comboStep > 0) {
                this.comboAcertouInimigo = true;
                this.currentPunchHit = true;

                this.comboHitsConectados = Math.max(
                    this.comboHitsConectados,
                    this.comboStep
                );
            }

            return acertouAlgum;
        }

    reset(x, y) {
        if (this.comboWaitEvent) {
            this.comboWaitEvent.remove(false);
            this.comboWaitEvent = null;
        }

        if (this.jumpTween) {
            this.jumpTween.stop();
            this.jumpTween = null;
        }

        if (this.jumpTakeoffEvent) {
            this.jumpTakeoffEvent.remove(false);
            this.jumpTakeoffEvent = null;
        }

        this.isDead = false;
        this.inAction = false;
        this.isPunching = false;
        this.comboWaitingForInput = false;
        this.comboAcertouInimigo = false;
        this.comboHitsConectados = 0;
        this.currentPunchHit = false;
        this.comboStep = 0;
        this.punchBuffer = 0;

        this.currentHp = this.maxHp;
        this.playerIframesUntil = 0;
        this.playerAttackArmorUntil = 0;

        this.isJumping = false;
        this.isAirKicking = false;
        this.jumpGroundY = null;
        this.jumpOffset = { y: 0 };

        this.sprite.setPosition(x, y);
        this.sprite.setVelocity(0, 0);
        this.sprite.setAlpha(1);
        this.sprite.setFlipX(false);
        this.sprite.play("leona_idle", true);
        this.ajustarEscalaSprite();
        this.isBeingShocked = false;
    }

    getGroundY() {
        return this.isJumping && this.jumpGroundY !== null
            ? this.jumpGroundY
            : this.sprite.y;
    }

    hasAttackArmor() {
        return this.scene.time.now < this.playerAttackArmorUntil;
    }

    isComboActive() {
        return this.comboStep > 0 || this.comboWaitingForInput || this.isPunching;
    }

    isOffensiveAction() {
        return this.isPunching || this.isAirKicking || this.hasAttackArmor();
    }

    ajustarEscalaSpritePorAltura(alturaAlvo) {
        if (!this.sprite || !this.sprite.frame) return;

        const alturaOriginal = this.sprite.frame.height;
        const escala = alturaAlvo / alturaOriginal;

        this.sprite.setScale(escala);
    }


    receberDanoArremesso(valor, origemX = null) {
        if (typeof this.receberDanoRaio === "function") {
            this.receberDanoRaio(valor, origemX);
            return;
        }

        this.receberDano(valor, origemX);
    }

    ajustarEscalaSprite() {
        if (!this.sprite || !this.sprite.frame) return;

        const alturaOriginal = this.sprite.frame.height;
        const escala = this.alturaPlayer / alturaOriginal;

        this.sprite.setScale(escala);
    }

    destroy() {
        if (this.comboWaitEvent) {
            this.comboWaitEvent.remove(false);
            this.comboWaitEvent = null;
        }

        if (this.jumpTween) {
            this.jumpTween.stop();
            this.jumpTween = null;
        }

        if (this.jumpTakeoffEvent) {
            this.jumpTakeoffEvent.remove(false);
            this.jumpTakeoffEvent = null;
        }

        this.sprite?.destroy();
    }
}