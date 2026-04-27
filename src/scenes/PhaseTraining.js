export class PhaseTraining extends Phaser.Scene {
    constructor() {
        super("PhaseTraining");
    }

    preload() {
        // Leona
        this.load.image("leona_idle", "assets/player/idle.png");

        this.load.image("leona_walk1", "assets/player/walking1.png");
        this.load.image("leona_walk2", "assets/player/walking2.png");
        this.load.image("leona_walk3", "assets/player/walking3.png");
        this.load.image("leona_walk4", "assets/player/walking4.png");
        this.load.image("leona_walk5", "assets/player/walking5.png");

        this.load.image("leona_punch1", "assets/player/punch1.png");
        this.load.image("leona_punch2", "assets/player/punch2.png");
        this.load.image("leona_punch3", "assets/player/punch3.png");
        this.load.image("leona_punch4", "assets/player/punch4.png");

        this.load.image("leona_kick", "assets/player/kick3.png");
        this.load.image("leona_jump", "assets/player/jump.png");
        this.load.image("leona_airKick", "assets/player/kick1.png");

        this.load.image("leona_damage", "assets/player/damage.png");
        this.load.image("leona_death1", "assets/player/death1.png");
        this.load.image("leona_death2", "assets/player/death2.png");

        // Inimigo
        this.load.image("enemy_idle", "assets/Enemy 1/idle.png");

        this.load.image("enemy_walk1", "assets/Enemy 1/walking1.png");
        this.load.image("enemy_walk2", "assets/Enemy 1/walking2.png");
        this.load.image("enemy_walk3", "assets/Enemy 1/walking3.png");
        this.load.image("enemy_walk4", "assets/Enemy 1/walking4.png");
        this.load.image("enemy_walk5", "assets/Enemy 1/walking5.png");
        this.load.image("enemy_walk6", "assets/Enemy 1/walking6.png");

        this.load.image("enemy_punch1", "assets/Enemy 1/punch1.png");
        this.load.image("enemy_punch2", "assets/Enemy 1/punch2.png");
        this.load.image("enemy_punch3", "assets/Enemy 1/punch3.png");

        this.load.image("enemy_damage", "assets/Enemy 1/damage.png");
        this.load.image("enemy_death1", "assets/Enemy 1/death1.png");
        this.load.image("enemy_death2", "assets/Enemy 1/death2.png");

        // Áudios
        // this.load.audio("sfxPunch", "assets/audio/punch.mp3");
        // this.load.audio("sfxKick", "assets/audio/kick.mp3");
        this.load.audio("sfxHurt", "assets/audio/hurt.mp3");
        this.load.audio("sfxDeath", "assets/audio/death.mp3");
        this.load.audio("sfxEnemyDamage", "assets/audio/damage_enemy.mp3");
    }

    create() {
        this.worldWidth = 1280;
        this.worldHeight = 720;

        this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);

        this.floorTop = 470;
        this.floorBottom = 675;
        this.floorMid = 620;

        this.alturaPlayer = 212;
        this.alturaEnemy = 196;

        this.isPaused = false;
        this.enemyAIEnabled = true;

        this.criarFundoSimples();
        this.criarAnimacoes();
        this.criarPlayer();
        this.criarInimigo();
        this.criarAudio();
        this.criarHUD();
        this.criarPauseUI();
        this.criarControles();

        this.cameras.main.setBackgroundColor("#d7c5a8");
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.P) || Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
            this.togglePause();
            return;
        }

        if (this.isPaused) return;

        if (Phaser.Input.Keyboard.JustDown(this.keys.R)) {
            this.resetTraining();
            return;
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.I)) {
            this.enemyAIEnabled = !this.enemyAIEnabled;
            this.atualizarTextoAjuda();
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.T)) {
            this.atacarComInimigo();
        }

        this.atualizarPlayer();
        this.atualizarInimigo();
        this.atualizarHUD();
        this.organizarProfundidade();
    }

    criarFundoSimples() {
        this.add.rectangle(0, 0, this.worldWidth, this.worldHeight, 0xd7c5a8)
            .setOrigin(0, 0)
            .setDepth(-100);

        this.add.rectangle(0, this.floorTop, this.worldWidth, this.floorBottom - this.floorTop, 0xb8a083, 1)
            .setOrigin(0, 0)
            .setDepth(-90);

        this.add.rectangle(0, this.floorTop, this.worldWidth, 4, 0x51483f, 1)
            .setOrigin(0, 0)
            .setDepth(-80);

        this.add.text(640, 42, "TRAINING MODE", {
            fontSize: "36px",
            color: "#ffffff",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 6
        })
            .setOrigin(0.5)
            .setDepth(1000);
    }

    criarControles() {
        this.cursors = this.input.keyboard.createCursorKeys();

        this.keys = this.input.keyboard.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D,
            J: Phaser.Input.Keyboard.KeyCodes.J,
            K: Phaser.Input.Keyboard.KeyCodes.K,
            R: Phaser.Input.Keyboard.KeyCodes.R,
            I: Phaser.Input.Keyboard.KeyCodes.I,
            T: Phaser.Input.Keyboard.KeyCodes.T,
            P: Phaser.Input.Keyboard.KeyCodes.P,
            SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
            ESC: Phaser.Input.Keyboard.KeyCodes.ESC
        });
    }

    criarAudio() {
        // this.sfxPunch = this.sound.add("sfxPunch", { volume: 0.5 });
        // this.sfxKick = this.sound.add("sfxKick", { volume: 0.55 });
        this.sfxHurt = this.sound.add("sfxHurt", { volume: 0.6 });
        this.sfxDeath = this.sound.add("sfxDeath", { volume: 0.7 });
        this.sfxEnemyDamage = this.sound.add("sfxEnemyDamage", { volume: 0.6 });
    }

    tocarSom(audio, restart = false) {
        if (!audio) return;

        if (restart) {
            audio.stop();
        }

        audio.play();
    }

    criarAnimacoes() {
        if (!this.anims.exists("leona_idle")) {
            this.anims.create({
                key: "leona_idle",
                frames: [{ key: "leona_idle" }],
                frameRate: 1,
                repeat: -1
            });
        }

        if (!this.anims.exists("leona_walk")) {
            this.anims.create({
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

        if (!this.anims.exists("leona_death")) {
            this.anims.create({
                key: "leona_death",
                frames: [
                    { key: "leona_death1" },
                    { key: "leona_death2" }
                ],
                frameRate: 4,
                repeat: 0
            });
        }

        if (!this.anims.exists("enemy_idle")) {
            this.anims.create({
                key: "enemy_idle",
                frames: [{ key: "enemy_idle" }],
                frameRate: 1,
                repeat: -1
            });
        }

        if (!this.anims.exists("enemy_walk")) {
            this.anims.create({
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

        if (!this.anims.exists("enemy_death")) {
            this.anims.create({
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

    criarPlayer() {
        this.player = this.physics.add.sprite(410, this.floorMid, "leona_idle");
        this.player.setOrigin(0.5, 1);
        this.player.setCollideWorldBounds(true);

        this.ajustarEscalaSprite(this.player, this.alturaPlayer);
        this.player.play("leona_idle");

        this.player.on(Phaser.Animations.Events.ANIMATION_UPDATE, () => {
            this.ajustarEscalaSprite(this.player, this.alturaPlayer);
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

        this.maxHp = 100;
        this.currentHp = 100;

        this.playerIframesUntil = 0;
        this.playerAttackArmorUntil = 0;

        this.isJumping = false;
        this.isAirKicking = false;
        this.jumpGroundY = null;
        this.jumpTween = null;
        this.jumpOffset = { y: 0 };
        this.airMoveSpeed = 210;
    }

    criarInimigo() {
        const sprite = this.physics.add.sprite(790, this.floorMid, "enemy_idle");
        sprite.setOrigin(0.5, 1);
        sprite.setCollideWorldBounds(true);

        this.ajustarEscalaSprite(sprite, this.alturaEnemy);
        sprite.play("enemy_idle");
        sprite.setFlipX(true);

        sprite.on(Phaser.Animations.Events.ANIMATION_UPDATE, () => {
            this.ajustarEscalaSprite(sprite, this.alturaEnemy);
        });

        this.enemy = {
            sprite,
            data: {
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
            }
        };
    }

    criarHUD() {
        this.hpBarBg = this.add.graphics().setDepth(10000);
        this.hpBarFill = this.add.graphics().setDepth(10001);
        this.hpText = this.add.text(30, 32, "", {
            fontSize: "20px",
            color: "#ffffff",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 4
        }).setDepth(10002);

        this.enemyHpBarBg = this.add.graphics().setDepth(10000);
        this.enemyHpBarFill = this.add.graphics().setDepth(10001);
        this.enemyHpText = this.add.text(30, 72, "", {
            fontSize: "20px",
            color: "#ffffff",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 4
        }).setDepth(10002);

        this.helpText = this.add.text(30, 640, "", {
            fontSize: "18px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 4,
            lineSpacing: 4
        }).setDepth(10002);

        this.atualizarTextoAjuda();
    }

    atualizarTextoAjuda() {
        const aiStatus = this.enemyAIEnabled ? "ON" : "OFF";

        this.helpText.setText(
            `Mover: WASD/Setas | SPACE: Pulo | J: Combo | K: Voadora / Chute aéreo\n` +
            `I: IA inimigo ${aiStatus} | T: Forçar ataque inimigo | R: Reset | P/ESC: Pause`
        );
    }

    criarPauseUI() {
        this.pauseOverlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.65)
            .setScrollFactor(0)
            .setDepth(20000)
            .setVisible(false);

        this.pauseBox = this.add.rectangle(640, 360, 520, 220, 0x111111, 0.92)
            .setStrokeStyle(3, 0xffffff)
            .setScrollFactor(0)
            .setDepth(20001)
            .setVisible(false);

        this.pauseTitle = this.add.text(640, 320, "PAUSADO", {
            fontSize: "42px",
            color: "#ffffff",
            fontStyle: "bold"
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(20002)
            .setVisible(false);

        this.pauseHint = this.add.text(640, 385, "Pressione P ou ESC para voltar", {
            fontSize: "24px",
            color: "#ffd166"
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(20002)
            .setVisible(false);
    }

    togglePause() {
        this.isPaused = !this.isPaused;

        this.pauseOverlay.setVisible(this.isPaused);
        this.pauseBox.setVisible(this.isPaused);
        this.pauseTitle.setVisible(this.isPaused);
        this.pauseHint.setVisible(this.isPaused);

        if (this.isPaused) {
            this.physics.pause();
            this.time.paused = true;

            if (this.player?.body) {
                this.player.body.setVelocity(0, 0);
            }

            if (this.enemy?.sprite?.body) {
                this.enemy.sprite.body.setVelocity(0, 0);
            }

            this.player?.anims?.pause();
            this.enemy?.sprite?.anims?.pause();
        } else {
            this.time.paused = false;
            this.physics.resume();

            this.player?.anims?.resume();
            this.enemy?.sprite?.anims?.resume();
        }
    }

      atualizarPlayer() {
            if (this.isDead) {
                this.player.setVelocity(0, 0);
                return;
            }

            // Durante o pulo, a Leona ainda pode se mover no ar
            if (this.isJumping) {
                this.atualizarMovimentoAereo();

                if (Phaser.Input.Keyboard.JustDown(this.keys.K)) {
                    this.voadoraAerea();
                }

                return;
            }

            if (Phaser.Input.Keyboard.JustDown(this.keys.J)) {
                const podeAcertarInimigo = this.inimigoNaAreaDoGolpe(118, 74);

                if (this.comboWaitingForInput && this.comboStep < this.maxCombo) {
                    if (!podeAcertarInimigo) {
                        this.encerrarCombo();
                        return;
                    }

                    this.comboWaitingForInput = false;

                    if (this.comboWaitEvent) {
                        this.comboWaitEvent.remove(false);
                        this.comboWaitEvent = null;
                    }

                    this.comboStep++;
                    this.executarPunch(this.comboStep);
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
                // Só abre combo se acertar.
                if (!this.inAction) {
                    this.iniciarCombo();
                    return;
                }
            }

            if (this.inAction) {
                this.player.setVelocity(0, 0);
                return;
            }

            if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
                this.iniciarPulo();
                return;
            }

            if (Phaser.Input.Keyboard.JustDown(this.keys.K)) {
                this.voadora();
                return;
            }

            this.movimentarPlayer();
        }

    movimentarPlayer() {
        const velocidade = 230;

        let vx = 0;
        let vy = 0;

        const esquerda = this.cursors.left.isDown || this.keys.A.isDown;
        const direita = this.cursors.right.isDown || this.keys.D.isDown;
        const cima = this.cursors.up.isDown || this.keys.W.isDown;
        const baixo = this.cursors.down.isDown || this.keys.S.isDown;

        if (esquerda) vx = -velocidade;
        if (direita) vx = velocidade;
        if (cima) vy = -velocidade;
        if (baixo) vy = velocidade;

        if (vx !== 0 && vy !== 0) {
            vx *= 0.7071;
            vy *= 0.7071;
        }

        this.player.setVelocity(vx, vy);

        if (vx < 0) this.player.setFlipX(true);
        if (vx > 0) this.player.setFlipX(false);

        const moving = vx !== 0 || vy !== 0;

        if (moving) {
            if (this.player.anims.currentAnim?.key !== "leona_walk") {
                this.player.play("leona_walk", true);
            }
        } else {
            if (this.player.anims.currentAnim?.key !== "leona_idle") {
                this.player.play("leona_idle", true);
            }
        }

        this.player.y = Phaser.Math.Clamp(this.player.y, this.floorTop, this.floorBottom);
    }

    iniciarPulo() {
        if (this.isDead || this.inAction || this.isJumping) return;

        this.inAction = true;
        this.isJumping = true;
        this.isAirKicking = false;

        this.jumpGroundY = this.player.y;
        this.jumpOffset = { y: 0 };

        this.player.setVelocity(0, 0);
        this.player.anims.stop();
        this.player.setTexture("leona_jump");
        this.ajustarEscalaSprite(this.player, this.alturaPlayer);

        if (this.jumpTween) {
            this.jumpTween.stop();
            this.jumpTween = null;
        }

        this.jumpTween = this.tweens.add({
            targets: this.jumpOffset,
            y: -95,
            duration: 170,
            ease: "Quad.Out",
            yoyo: true,
            hold: 70,
            onUpdate: () => {
                if (!this.player || !this.player.active) return;

                const baseY = this.jumpGroundY !== null ? this.jumpGroundY : this.player.y;
                this.player.y = baseY + this.jumpOffset.y;
            },
            onComplete: () => {
                this.finalizarPulo();
            }
        });
    }


    atualizarMovimentoAereo() {
    if (!this.isJumping) return;

    const delta = this.game.loop.delta / 1000;
    const velocidade = this.airMoveSpeed || 210;

    let vx = 0;
    let vy = 0;

    const esquerda = this.cursors.left.isDown || this.keys.A.isDown;
    const direita = this.cursors.right.isDown || this.keys.D.isDown;
    const cima = this.cursors.up.isDown || this.keys.W.isDown;
    const baixo = this.cursors.down.isDown || this.keys.S.isDown;

    if (esquerda) vx = -velocidade;
    if (direita) vx = velocidade;
    if (cima) vy = -velocidade;
    if (baixo) vy = velocidade;

    if (vx !== 0 && vy !== 0) {
        vx *= 0.7071;
        vy *= 0.7071;
    }

    this.player.x += vx * delta;

    if (this.jumpGroundY === null) {
        this.jumpGroundY = this.player.y;
    }

    this.jumpGroundY += vy * delta;

    this.player.x = Phaser.Math.Clamp(this.player.x, 30, this.worldWidth - 30);
    this.jumpGroundY = Phaser.Math.Clamp(this.jumpGroundY, this.floorTop, this.floorBottom);

    const offsetY = this.jumpOffset ? this.jumpOffset.y : 0;
    this.player.y = this.jumpGroundY + offsetY;

    if (vx < 0) this.player.setFlipX(true);
    if (vx > 0) this.player.setFlipX(false);

    // Se não está chutando no ar, mantém sprite de pulo
    if (!this.isAirKicking && this.player.texture.key !== "leona_jump") {
        this.player.setTexture("leona_jump");
        this.ajustarEscalaSprite(this.player, this.alturaPlayer);
    }

    this.player.setVelocity(0, 0);
}

finalizarPulo() {
    if (this.isDead) return;

    if (this.jumpGroundY !== null) {
        this.player.y = this.jumpGroundY;
    }

    this.jumpGroundY = null;
    this.jumpTween = null;
    this.jumpOffset = { y: 0 };

    this.isJumping = false;
    this.isAirKicking = false;
    this.inAction = false;

    this.player.setVelocity(0, 0);
    this.player.play("leona_idle", true);
    this.ajustarEscalaSprite(this.player, this.alturaPlayer);
}

    voadoraAerea() {
        if (this.isDead || !this.isJumping || this.isAirKicking) return;

        this.isAirKicking = true;
        this.playerAttackArmorUntil = this.time.now + 360;

        this.player.anims.stop();
        this.player.setTexture("leona_airKick");
        this.ajustarEscalaSprite(this.player, this.alturaPlayer);

        this.time.delayedCall(55, () => {
            this.tentarAcertarInimigoAereo(30, 170, 115, {
                arremessarDepois: true
            });
        });
    }

      inimigoNaAreaDoGolpe(alcanceX = 118, alcanceY = 74) {
            if (!this.enemy || !this.enemy.sprite || !this.enemy.sprite.active) return false;
            if (this.enemy.data.isBeingThrown || this.enemy.data.isReturning) return false;

            const enemySprite = this.enemy.sprite;

            const dx = enemySprite.x - this.player.x;
            const dy = Math.abs(enemySprite.y - this.player.y);

            // Ajuda quando os sprites estão muito colados / sobrepostos
            const muitoColado = Math.abs(dx) <= 56;

            let acertouNaFrente = false;

            if (this.player.flipX) {
                acertouNaFrente = dx < 0 && Math.abs(dx) <= alcanceX;
            } else {
                acertouNaFrente = dx > 0 && dx <= alcanceX;
            }

            return (acertouNaFrente || muitoColado) && dy <= alcanceY;
        }

        inimigoNaAreaDoGolpeAereo(alcanceX = 170, alcanceY = 115) {
            if (!this.enemy || !this.enemy.sprite || !this.enemy.sprite.active) return false;
            if (this.enemy.data.isBeingThrown || this.enemy.data.isReturning) return false;

            const enemySprite = this.enemy.sprite;

            const dx = enemySprite.x - this.player.x;

            const baseY = this.jumpGroundY !== null ? this.jumpGroundY : this.player.y;
            const dy = Math.abs(enemySprite.y - baseY);

            const muitoColado = Math.abs(dx) <= 62;

            let acertouNaFrente = false;

            if (this.player.flipX) {
                acertouNaFrente = dx < 0 && Math.abs(dx) <= alcanceX;
            } else {
                acertouNaFrente = dx > 0 && dx <= alcanceX;
            }

            return (acertouNaFrente || muitoColado) && dy <= alcanceY;
        }

    tentarAcertarInimigoAereo(dano, alcanceX, alcanceY, opcoes = {}) {
        if (!this.enemy || !this.enemy.sprite || !this.enemy.sprite.active) return false;
        if (this.enemy.data.isBeingThrown || this.enemy.data.isReturning) return false;

        const acertou = this.inimigoNaAreaDoGolpeAereo(alcanceX, alcanceY);

        if (acertou) {
            this.danoNoInimigo(dano, opcoes);
            return true;
        }

        return false;
    }

   

    iniciarCombo() {
        this.comboStep = 1;
        this.punchBuffer = 0;
        this.comboAcertouInimigo = false;
        this.comboHitsConectados = 0;
        this.comboWaitingForInput = false;

        if (this.comboWaitEvent) {
            this.comboWaitEvent.remove(false);
            this.comboWaitEvent = null;
        }

        this.executarPunch(this.comboStep);
    }

    executarPunch(step) {
        this.inAction = true;
        this.isPunching = true;
        this.comboWaitingForInput = false;

        this.player.setVelocity(0, 0);
        this.player.anims.stop();

        this.player.setTexture(`leona_punch${step}`);
        this.ajustarEscalaSprite(this.player, this.alturaPlayer);

        // this.tocarSom(this.sfxPunch, true);

        let dano = 12;
        let alcanceX = 96;
        let alcanceY = 58;
        let duracao = 190;

       if (step === 1) {
            dano = 12;
            alcanceX = 118;
            alcanceY = 74;
            duracao = 190;
        }

        if (step === 2) {
            dano = 14;
            alcanceX = 124;
            alcanceY = 76;
            duracao = 200;
        }

        if (step === 3) {
            dano = 18;
            alcanceX = 134;
            alcanceY = 78;
            duracao = 220;
        }

        if (step === 4) {
            dano = 26;
            alcanceX = 150;
            alcanceY = 82;
            duracao = 260;
        }

        this.playerAttackArmorUntil = this.time.now + duracao + 90;

        this.time.delayedCall(55, () => {
            this.tentarAcertarInimigo(dano, alcanceX, alcanceY);
        });

        this.time.delayedCall(duracao, () => {
            if (!this.comboAcertouInimigo) {
                this.encerrarCombo();
                return;
            }

            if (this.punchBuffer > 0 && this.comboStep < this.maxCombo) {
                this.punchBuffer--;
                this.comboStep++;
                this.executarPunch(this.comboStep);
                return;
            }

            if (this.comboStep < this.maxCombo) {
                this.aguardarProximoGolpeCombo();
                return;
            }

            this.encerrarCombo();
        });
    }

    aguardarProximoGolpeCombo() {
        this.isPunching = false;
        this.comboWaitingForInput = true;

        this.player.setVelocity(0, 0);

        if (!this.isDead) {
            this.player.play("leona_idle", true);
            this.ajustarEscalaSprite(this.player, this.alturaPlayer);
        }

        if (this.comboWaitEvent) {
            this.comboWaitEvent.remove(false);
            this.comboWaitEvent = null;
        }

        this.comboWaitEvent = this.time.delayedCall(this.comboInputGrace, () => {
            if (this.comboWaitingForInput) {
                this.encerrarCombo();
            }
        });
    }

    encerrarCombo() {
        const comboCompletoConectou =
            this.comboStep >= this.maxCombo &&
            this.comboHitsConectados >= this.maxCombo;

        if (this.comboWaitEvent) {
            this.comboWaitEvent.remove(false);
            this.comboWaitEvent = null;
        }

        this.inAction = false;
        this.isPunching = false;
        this.comboWaitingForInput = false;
        this.comboStep = 0;
        this.punchBuffer = 0;
        this.comboAcertouInimigo = false;
        this.comboHitsConectados = 0;

        if (!this.isDead) {
            this.player.play("leona_idle", true);
            this.ajustarEscalaSprite(this.player, this.alturaPlayer);
        }

        // Só arremessa no combo completo.
        // Se bateu 1 ou 2 vezes e parou, não arremessa.
        if (comboCompletoConectou) {
            this.arremessarInimigoAposCombo();
        } else {
            this.liberarInimigoDoHitstun();
        }
    }


    liberarInimigoDoHitstun() {
        if (!this.enemy || !this.enemy.sprite || !this.enemy.sprite.active) return;

        const sprite = this.enemy.sprite;
        const data = this.enemy.data;

        if (data.isBeingThrown || data.isReturning) return;

        if (data.hurtReturnEvent) {
            data.hurtReturnEvent.remove(false);
            data.hurtReturnEvent = null;
        }

        // Se o combo não completou, ele só fica um pouquinho no dano
        // e depois volta ao normal, sem ser arremessado.
        data.hurtReturnEvent = this.time.delayedCall(180, () => {
            if (!this.enemy || this.enemy.sprite !== sprite || !sprite.active) return;
            if (data.isBeingThrown || data.isReturning) return;
            if (this.isPunching || this.comboWaitingForInput || this.comboStep > 0) return;

            data.isHurt = false;
            data.isAttacking = false;

            sprite.body.setVelocity(0, 0);
            sprite.play("enemy_idle", true);
            this.ajustarEscalaSprite(sprite, this.alturaEnemy);
        });
    }

    voadora() {
        if (this.isDead || this.inAction) return;

        this.inAction = true;
        this.isPunching = false;
        this.comboStep = 0;
        this.punchBuffer = 0;
        this.comboWaitingForInput = false;
        this.comboAcertouInimigo = false;
        

        if (this.comboWaitEvent) {
            this.comboWaitEvent.remove(false);
            this.comboWaitEvent = null;
        }

        this.playerAttackArmorUntil = this.time.now + 320;

        this.player.setVelocity(0, 0);
        this.player.anims.stop();
        this.player.setTexture("leona_kick");
        this.ajustarEscalaSprite(this.player, this.alturaPlayer);

        // this.tocarSom(this.sfxKick, true);
        this.time.delayedCall(60, () => {
            this.tentarAcertarInimigo(26, 160, 84, {
                arremessarDepois: true
            });
        });

        this.time.delayedCall(280, () => {
            if (!this.isDead) {
                this.inAction = false;
                this.player.play("leona_idle", true);
                this.ajustarEscalaSprite(this.player, this.alturaPlayer);
            }
        });
    }

    tentarAcertarInimigo(dano, alcanceX, alcanceY, opcoes = {}) {
        if (!this.enemy || !this.enemy.sprite || !this.enemy.sprite.active) return false;
        if (this.enemy.data.isBeingThrown || this.enemy.data.isReturning) return false;

        const acertou = this.inimigoNaAreaDoGolpe(alcanceX, alcanceY);

        if (acertou) {
            this.danoNoInimigo(dano, opcoes);
            return true;
        }

        return false;
    }

    danoNoInimigo(valor, opcoes = {}) {
        if (!this.enemy || !this.enemy.sprite || !this.enemy.sprite.active) return;

        const sprite = this.enemy.sprite;
        const data = this.enemy.data;

        if (data.isBeingThrown || data.isReturning) return;

        // Boneco de treino: perde vida, mas nunca morre
        data.currentHp -= valor;
        if (data.currentHp <= 0) {
            data.currentHp = 1;
        }

        data.isHurt = true;
        data.isAttacking = false;

        sprite.body.setVelocity(0, 0);
        sprite.anims.stop();
        sprite.setTexture("enemy_damage");
        this.ajustarEscalaSprite(sprite, this.alturaEnemy);

        this.tocarSom(this.sfxEnemyDamage, true);


        if (this.comboStep > 0) {
            this.comboAcertouInimigo = true;

            // Marca até qual golpe do combo realmente conectou.
            // Só vai arremessar se chegar no terceiro golpe conectado.
            this.comboHitsConectados = Math.max(
                this.comboHitsConectados,
                this.comboStep
            );
        }

        const empurraoPequeno = this.player.flipX ? -18 : 18;
        sprite.x += empurraoPequeno;
        sprite.y += Phaser.Math.Between(-3, 3);

        sprite.x = Phaser.Math.Clamp(sprite.x, 30, this.worldWidth - 30);
        sprite.y = Phaser.Math.Clamp(sprite.y, this.floorTop, this.floorBottom);

        data.lastAttackTime = this.time.now + 350;

        if (data.hurtReturnEvent) {
            data.hurtReturnEvent.remove(false);
            data.hurtReturnEvent = null;
        }

        if (opcoes.arremessarDepois) {
            this.time.delayedCall(90, () => {
                this.arremessarInimigoAposCombo();
            });
        }

        data.hurtReturnEvent = this.time.delayedCall(360, () => {
            if (!this.enemy || this.enemy.sprite !== sprite || !sprite.active) return;
            if (data.isBeingThrown || data.isReturning) return;

            if (this.comboStep > 0 || this.comboWaitingForInput || this.isPunching) {
                return;
            }

            data.isHurt = false;
            sprite.play("enemy_idle", true);
            this.ajustarEscalaSprite(sprite, this.alturaEnemy);
        });
    }

    arremessarInimigoAposCombo() {
        if (!this.enemy || !this.enemy.sprite || !this.enemy.sprite.active) return;

        const sprite = this.enemy.sprite;
        const data = this.enemy.data;

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
        this.ajustarEscalaSprite(sprite, this.alturaEnemy);

        this.tweens.killTweensOf(sprite);

        const direcao = this.player.x < sprite.x ? 1 : -1;

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

        this.tweens.add({
            targets: sprite,
            x: xInicial + direcao * 90,
            y: yInicial - 34,
            duration: 150,
            ease: "Quad.Out",
            onComplete: () => {
                if (!this.enemy || this.enemy.sprite !== sprite || !sprite.active) return;

                sprite.play("enemy_death", true);
                this.ajustarEscalaSprite(sprite, this.alturaEnemy);

                this.tweens.add({
                    targets: sprite,
                    x: xFinal,
                    y: yFinal,
                    duration: 260,
                    ease: "Quad.In",
                    onComplete: () => {
                        if (!this.enemy || this.enemy.sprite !== sprite || !sprite.active) return;

                        this.time.delayedCall(380, () => {
                            this.voltarInimigoParaPertoDaLeona();
                        });
                    }
                });
            }
        });
    }

    voltarInimigoParaPertoDaLeona() {
        if (!this.enemy || !this.enemy.sprite || !this.enemy.sprite.active) return;

        const sprite = this.enemy.sprite;
        const data = this.enemy.data;

        sprite.anims.stop();

        data.isBeingThrown = false;
        data.isReturning = true;
        data.isHurt = false;
        data.isAttacking = false;

        sprite.body.setVelocity(0, 0);

        const ladoDaFrenteDaLeona = this.player.flipX ? -1 : 1;

        const alvoX = Phaser.Math.Clamp(
            this.player.x + ladoDaFrenteDaLeona * 220,
            80,
            this.worldWidth - 80
        );

        const alvoY = Phaser.Math.Clamp(
            this.player.y,
            this.floorTop,
            this.floorBottom
        );

        if (this.player.x < sprite.x) {
            sprite.setFlipX(true);
        } else {
            sprite.setFlipX(false);
        }

        sprite.play("enemy_walk", true);
        this.ajustarEscalaSprite(sprite, this.alturaEnemy);

        this.tweens.killTweensOf(sprite);

        this.tweens.add({
            targets: sprite,
            x: alvoX,
            y: alvoY,
            duration: 620,
            ease: "Sine.Out",
            onComplete: () => {
                if (!this.enemy || this.enemy.sprite !== sprite || !sprite.active) return;

                data.isReturning = false;
                data.isHurt = false;
                data.isAttacking = false;

                sprite.body.setVelocity(0, 0);
                sprite.play("enemy_idle", true);
                this.ajustarEscalaSprite(sprite, this.alturaEnemy);

                if (this.player.x < sprite.x) {
                    sprite.setFlipX(true);
                } else {
                    sprite.setFlipX(false);
                }
            }
        });
    }

    atualizarInimigo() {
        if (!this.enemy || !this.enemy.sprite || !this.enemy.sprite.active) return;

        const sprite = this.enemy.sprite;
        const data = this.enemy.data;

        if (data.isDead) {
            sprite.body.setVelocity(0, 0);
            return;
        }

        if (this.isDead) {
            sprite.body.setVelocity(0, 0);
            return;
        }

        if (data.isBeingThrown || data.isReturning) {
            sprite.body.setVelocity(0, 0);
            return;
        }

        if (!this.enemyAIEnabled) {
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

        const dx = this.player.x - sprite.x;
        const dy = this.player.y - sprite.y;

        const distanciaX = Math.abs(dx);
        const distanciaY = Math.abs(dy);

        const dentroDoAtaque =
            distanciaX <= data.attackRangeX &&
            distanciaY <= data.attackRangeY;

        const leonaAtacando = this.inAction && (
            this.isPunching || this.time.now < this.playerAttackArmorUntil
        );

        const grudadoNaLeona =
            distanciaX <= 48 &&
            distanciaY <= 38;

        if (leonaAtacando && grudadoNaLeona) {
            const direcaoX = sprite.x < this.player.x ? -1 : 1;
            const direcaoY = sprite.y < this.player.y ? -1 : 1;

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
            if (this.time.now > data.lastAttackTime + data.attackCooldown) {
                this.atacarComInimigo();
                return;
            }

            sprite.body.setVelocity(dx < 0 ? -22 : 22, dy < 0 ? -14 : 14);

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
        if (dy < -8) vy = -data.speed * 0.65;
        if (dy > 8) vy = data.speed * 0.65;

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
        } else {
            if (sprite.anims.currentAnim?.key !== "enemy_idle") {
                sprite.play("enemy_idle", true);
            }
        }

        sprite.y = Phaser.Math.Clamp(sprite.y, this.floorTop, this.floorBottom);
    }

    atacarComInimigo() {
        if (!this.enemy || this.enemy.data.isDead || this.enemy.data.isAttacking || this.enemy.data.isHurt) return;
        if (this.enemy.data.isBeingThrown || this.enemy.data.isReturning) return;
        if (this.isDead) return;

        const sprite = this.enemy.sprite;
        const data = this.enemy.data;

        data.isAttacking = true;
        data.lastAttackTime = this.time.now;

        sprite.body.setVelocity(0, 0);
        sprite.anims.stop();

        if (this.player.x < sprite.x) {
            sprite.setFlipX(true);
        } else {
            sprite.setFlipX(false);
        }

        sprite.setTexture("enemy_punch1");
        this.ajustarEscalaSprite(sprite, this.alturaEnemy);

        this.time.delayedCall(70, () => {
            if (!data.isDead && data.isAttacking) {
                sprite.setTexture("enemy_punch2");
                this.ajustarEscalaSprite(sprite, this.alturaEnemy);
            }
        });

        this.time.delayedCall(125, () => {
            if (!data.isDead && data.isAttacking) {
                sprite.setTexture("enemy_punch3");
                this.ajustarEscalaSprite(sprite, this.alturaEnemy);
            }
        });

        this.time.delayedCall(145, () => {
            if (data.isDead || this.isDead) return;
            if (data.isBeingThrown || data.isReturning) return;

            const dx = Math.abs(this.player.x - sprite.x);
            const dy = Math.abs(this.player.y - sprite.y);

            if (dx <= data.attackRangeX + 8 && dy <= data.attackRangeY) {
                this.tomarDano(data.damage, sprite.x);
            }
        });

        this.time.delayedCall(270, () => {
            if (!data.isDead && !data.isHurt && !data.isBeingThrown && !data.isReturning) {
                data.isAttacking = false;
                sprite.play("enemy_idle", true);
                this.ajustarEscalaSprite(sprite, this.alturaEnemy);
            } else {
                data.isAttacking = false;
            }
        });
    }

    tomarDano(valor, origemX = null) {
        if (this.isDead) return;

        if (this.time.now < this.playerIframesUntil) return;
        if (this.time.now < this.playerAttackArmorUntil) return;

        this.playerIframesUntil = this.time.now + 450;

        this.currentHp -= valor;
        if (this.currentHp < 0) this.currentHp = 0;

        this.tocarSom(this.sfxHurt, true);

        if (this.currentHp <= 0) {
            this.morrerPlayer(origemX);
            return;
        }

        this.inAction = true;
        this.isPunching = false;
        this.comboStep = 0;
        this.punchBuffer = 0;
        this.comboWaitingForInput = false;
        this.comboAcertouInimigo = false;

        if (this.comboWaitEvent) {
            this.comboWaitEvent.remove(false);
            this.comboWaitEvent = null;
        }

        this.player.setVelocity(0, 0);
        this.player.anims.stop();
        this.player.setTexture("leona_damage");
        this.ajustarEscalaSprite(this.player, this.alturaPlayer);

        if (origemX !== null) {
            const empurrao = origemX < this.player.x ? 26 : -26;
            this.player.x += empurrao;
            this.player.x = Phaser.Math.Clamp(this.player.x, 30, this.worldWidth - 30);
        }

        this.time.delayedCall(180, () => {
            if (!this.isDead) {
                this.inAction = false;
                this.player.play("leona_idle", true);
                this.ajustarEscalaSprite(this.player, this.alturaPlayer);
            }
        });
    }

    morrerPlayer(origemX = null) {
        if (this.isDead) return;

        this.isDead = true;
        this.inAction = true;
        this.isPunching = false;
        this.comboWaitingForInput = false;

        if (this.comboWaitEvent) {
            this.comboWaitEvent.remove(false);
            this.comboWaitEvent = null;
        }

        this.player.setVelocity(0, 0);
        this.player.anims.stop();
        this.player.setTexture("leona_damage");
        this.ajustarEscalaSprite(this.player, this.alturaPlayer);

        this.tocarSom(this.sfxDeath, true);

        const direcao = origemX !== null && origemX < this.player.x ? 1 : -1;
        const xBase = this.player.x;
        const yBase = this.player.y;

        this.tweens.add({
            targets: this.player,
            x: xBase + direcao * 54,
            y: yBase - 28,
            duration: 150,
            ease: "Quad.Out",
            onComplete: () => {
                if (!this.player.active) return;

                this.player.play("leona_death", true);
                this.ajustarEscalaSprite(this.player, this.alturaPlayer);

                this.tweens.add({
                    targets: this.player,
                    x: xBase + direcao * 82,
                    y: Phaser.Math.Clamp(yBase + 18, this.floorTop, this.floorBottom),
                    duration: 280,
                    ease: "Quad.In"
                });
            }
        });
    }

    resetTraining() {
        if (this.comboWaitEvent) {
            this.comboWaitEvent.remove(false);
            this.comboWaitEvent = null;
        }

        if (this.enemy?.data?.hurtReturnEvent) {
            this.enemy.data.hurtReturnEvent.remove(false);
            this.enemy.data.hurtReturnEvent = null;
        }

        if (this.enemy?.sprite) {
            this.tweens.killTweensOf(this.enemy.sprite);
        }

       if (this.jumpTween) {
            this.jumpTween.stop();
            this.jumpTween = null;
        }

       

        this.isDead = false;
        this.inAction = false;
        this.isPunching = false;
        this.comboWaitingForInput = false;
        this.comboAcertouInimigo = false;
        this.comboHitsConectados = 0;
        this.comboStep = 0;
        this.punchBuffer = 0;
        this.currentHp = this.maxHp;
        this.playerIframesUntil = 0;
        this.playerAttackArmorUntil = 0;
        this.isJumping = false;
        this.isAirKicking = false;
        this.jumpGroundY = null;
        this.jumpOffset = { y: 0 };

        this.player.setPosition(410, this.floorMid);
        this.player.setVelocity(0, 0);
        this.player.setAlpha(1);
        this.player.setFlipX(false);
        this.player.play("leona_idle", true);
        this.ajustarEscalaSprite(this.player, this.alturaPlayer);

        if (this.enemy?.sprite) {
            this.enemy.sprite.destroy();
        }

        this.criarInimigo();
        this.atualizarHUD();
    }

    atualizarHUD() {
        const playerX = 30;
        const playerY = 28;
        const barWidth = 250;
        const barHeight = 18;

        this.hpBarBg.clear();
        this.hpBarFill.clear();

        this.hpBarBg.fillStyle(0x111111, 0.9);
        this.hpBarBg.fillRoundedRect(playerX, playerY, barWidth, barHeight, 6);
        this.hpBarBg.lineStyle(2, 0xffffff, 1);
        this.hpBarBg.strokeRoundedRect(playerX, playerY, barWidth, barHeight, 6);

        this.hpBarFill.fillStyle(0xff3b30, 1);
        this.hpBarFill.fillRoundedRect(
            playerX + 2,
            playerY + 2,
            (barWidth - 4) * (this.currentHp / this.maxHp),
            barHeight - 4,
            5
        );

        this.hpText.setText(`Leona: ${this.currentHp} / ${this.maxHp}`);

        const enemyX = 30;
        const enemyY = 68;

        this.enemyHpBarBg.clear();
        this.enemyHpBarFill.clear();

        const enemyHp = this.enemy?.data?.currentHp ?? 0;
        const enemyMaxHp = this.enemy?.data?.maxHp ?? 100;

        this.enemyHpBarBg.fillStyle(0x111111, 0.9);
        this.enemyHpBarBg.fillRoundedRect(enemyX, enemyY, barWidth, barHeight, 6);
        this.enemyHpBarBg.lineStyle(2, 0xffffff, 1);
        this.enemyHpBarBg.strokeRoundedRect(enemyX, enemyY, barWidth, barHeight, 6);

        this.enemyHpBarFill.fillStyle(0xb30000, 1);
        this.enemyHpBarFill.fillRoundedRect(
            enemyX + 2,
            enemyY + 2,
            (barWidth - 4) * (enemyHp / enemyMaxHp),
            barHeight - 4,
            5
        );

        this.enemyHpText.setText(`Inimigo: ${enemyHp} / ${enemyMaxHp}`);
    }

    organizarProfundidade() {
        if (!this.player) return;

        const playerDepthY =
            this.isJumping && this.jumpGroundY !== null
                ? this.jumpGroundY
                : this.player.y;

        const playerBaseDepth = playerDepthY + 10;
        this.player.setDepth(playerBaseDepth);

        if (this.enemy?.sprite) {
            const sprite = this.enemy.sprite;
            const data = this.enemy.data;

            const pertoDaLeona =
                Math.abs(sprite.x - this.player.x) <= 120 &&
                Math.abs(sprite.y - playerDepthY) <= 90;

            const leonaEmCombo =
                this.isPunching ||
                this.comboWaitingForInput ||
                this.inAction;

            if (data.isHurt || data.isBeingThrown || (pertoDaLeona && leonaEmCombo)) {
                this.player.setDepth(Math.max(playerBaseDepth, sprite.y + 20));
                sprite.setDepth(this.player.depth - 12);
            } else {
                sprite.setDepth(sprite.y);
            }
        }
    }

    ajustarEscalaSprite(sprite, alturaAlvo) {
        if (!sprite || !sprite.frame) return;

        const alturaOriginal = sprite.frame.height;
        const escala = alturaAlvo / alturaOriginal;

        sprite.setScale(escala);
    }
}