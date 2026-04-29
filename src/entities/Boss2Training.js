export class Boss2Training {
    static preload(scene) {
        scene.load.image("boss2_idle", "assets/Boss 2/idle.png");

        scene.load.image("boss2_car1", "assets/Boss 2/car1.png");
        scene.load.image("boss2_car2", "assets/Boss 2/car2.png");
        scene.load.image("boss2_car3", "assets/Boss 2/car3.png");
        scene.load.image("boss2_car4", "assets/Boss 2/car4.png");

        scene.load.image("boss2_damage0", "assets/Boss 2/damage0.png");
        scene.load.image("boss2_damage1", "assets/Boss 2/damage1.png");
        scene.load.image("boss2_damage2", "assets/Boss 2/damage2.png");
        scene.load.image("boss2_damage3", "assets/Boss 2/damage3.png");
        scene.load.image("boss2_damage4", "assets/Boss 2/damage4.png");

        scene.load.image("boss2_raio", "assets/Boss 2/car4.png");
        scene.load.image("boss2_raio2", "assets/Boss 2/raio2.png");
    }

    static createAnimations(scene) {
        if (!scene.anims.exists("boss2_charge")) {
            scene.anims.create({
                key: "boss2_charge",
                frames: [
                    { key: "boss2_car1" },
                    { key: "boss2_car2" }
                ],
                frameRate: 4,
                repeat: -1
            });
        }

        if (!scene.anims.exists("boss2_prepare")) {
            scene.anims.create({
                key: "boss2_prepare",
                frames: [
                    { key: "boss2_car3" },
                    { key: "boss2_car4" }
                ],
                frameRate: 4,
                repeat: -1
            });
        }

        if (!scene.anims.exists("boss2_defeated")) {
            scene.anims.create({
                key: "boss2_defeated",
                frames: [
                    { key: "boss2_damage1" },
                    { key: "boss2_damage2" },
                    { key: "boss2_damage3" },
                    { key: "boss2_damage4" }
                ],
                frameRate: 6,
                repeat: 0
            });
        }
    }

    constructor(scene, x, y, config = {}) {
        this.scene = scene;

        this.worldWidth = config.worldWidth ?? 1280;
        this.floorTop = config.floorTop ?? 470;
        this.floorBottom = config.floorBottom ?? 675;

        // Altura normal da boss
        this.alturaBoss = config.alturaBoss ?? 245;

        // Altura menor para os sprites de derrota
        // Ajuste esse valor se quiser ela ainda menor/maior na morte.
        this.alturaBossDefeated = config.alturaBossDefeated ?? 185;

        this.sprite = scene.physics.add.sprite(x, y, "boss2_idle");
        this.sprite.setOrigin(0.5, 1);
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setFlipX(true);

        this.ajustarEscalaSprite();

        this.sprite.on(Phaser.Animations.Events.ANIMATION_UPDATE, () => {
            this.ajustarEscalaSprite();
        });

        this.data = {
            maxHp: 360,
            currentHp: 360,

            isDead: false,
            isAttacking: false,
            isHurt: false,

            // Compatibilidade com LeonaPlayer
            isBeingThrown: false,
            isReturning: false,

            hurtReturnEvent: null
        };

        this.state = "idle";

        this.charge = 0;
        this.chargeDuration = 3600;
        this.prepareDuration = 900;
        this.castDuration = 4600;
        this.castInterval = 650;
        this.postCastDelay = 700;

        this.stateStartedAt = scene.time.now;
        this.nextStrikeAt = 0;

        this.hpBarBg = scene.add.graphics().setDepth(10000);
        this.hpBarFill = scene.add.graphics().setDepth(10001);

        this.raioBarBg = scene.add.graphics().setDepth(10000);
        this.raioBarFill = scene.add.graphics().setDepth(10001);

        this.activeWarnings = [];
        this.activeRaios = [];

        // Guarda de qual lado veio o último golpe para arremessar ao morrer
        this.lastDamageFromX = x - 100;

        this.startDelayEvent = scene.time.delayedCall(600, () => {
            this.iniciarCarregamento();
        });

        this.loreInfo = config.loreInfo ?? {
            nome: "Kayla, a Condutora de Raios",
            titulo: "Dossiê desbloqueado",
            texto:
                "Kayla era uma das executoras da Aurora, treinada para transformar dor em energia. " +
                "Sua técnica canalizava descargas elétricas pelo próprio corpo, criando tempestades curtas, " +
                "mas violentas. Derrotá-la revelou que a Aurora estava usando guerreiros modificados " +
                "como barreiras vivas para proteger algo maior."
        };
    }

    update(player, aiEnabled = true) {
        if (!this.sprite || !this.sprite.active) return;

        this.sprite.body.setVelocity(0, 0);

        if (this.data.isDead) {
            this.atualizarBarras();
            return;
        }

        if (!aiEnabled) {
            const delta = this.scene.game.loop.delta || 0;
            this.stateStartedAt += delta;
            this.nextStrikeAt += delta;
            this.atualizarBarras();
            return;
        }

        this.atualizarEstado(player);
        this.atualizarBarras();
    }

    atualizarEstado(player) {
        const now = this.scene.time.now;

        if (this.state === "idle") {
            if (this.sprite.texture.key !== "boss2_idle") {
                this.sprite.anims.stop();
                this.sprite.setTexture("boss2_idle");
                this.ajustarEscalaSprite();
            }
            return;
        }

        if (this.state === "charging") {
            const elapsed = now - this.stateStartedAt;
            this.charge = Phaser.Math.Clamp(elapsed / this.chargeDuration, 0, 1);

            if (!this.data.isHurt && this.sprite.anims.currentAnim?.key !== "boss2_charge") {
                this.sprite.play("boss2_charge", true);
                this.ajustarEscalaSprite();
            }

            if (this.charge >= 1) {
                this.iniciarPreparacao();
            }

            return;
        }

        if (this.state === "preparing") {
            const elapsed = now - this.stateStartedAt;

            if (!this.data.isHurt && this.sprite.anims.currentAnim?.key !== "boss2_prepare") {
                this.sprite.play("boss2_prepare", true);
                this.ajustarEscalaSprite();
            }

            if (elapsed >= this.prepareDuration) {
                this.iniciarRaios();
            }

            return;
        }

        if (this.state === "casting") {
            const elapsed = now - this.stateStartedAt;

            // Agora a boss é vulnerável durante o casting.
            // Então, se ela estiver em damage0, não força voltar para car4 imediatamente.
            if (!this.data.isHurt && this.sprite.texture.key !== "boss2_raio") {
                this.sprite.anims.stop();
                this.sprite.setTexture("boss2_raio");
                this.ajustarEscalaSprite();
            }

            if (now >= this.nextStrikeAt) {
                this.invocarGrupoDeRaios(player);
                this.nextStrikeAt = now + this.castInterval;
            }

            if (elapsed >= this.castDuration) {
                this.encerrarRaios();
            }

            return;
        }

        if (this.state === "post_cast") {
            const elapsed = now - this.stateStartedAt;

            if (this.sprite.texture.key !== "boss2_idle") {
                this.sprite.anims.stop();
                this.sprite.setTexture("boss2_idle");
                this.ajustarEscalaSprite();
            }

            if (elapsed >= this.postCastDelay) {
                this.iniciarCarregamento();
            }
        }
    }

    iniciarCarregamento() {
        if (this.data.isDead) return;

        this.state = "charging";
        this.stateStartedAt = this.scene.time.now;
        this.charge = 0;

        this.data.isAttacking = false;
        this.data.isHurt = false;

        this.sprite.play("boss2_charge", true);
        this.ajustarEscalaSprite();
    }

    iniciarPreparacao() {
        if (this.data.isDead) return;

        this.state = "preparing";
        this.stateStartedAt = this.scene.time.now;
        this.charge = 1;

        this.data.isAttacking = true;
        this.data.isHurt = false;

        this.sprite.play("boss2_prepare", true);
        this.ajustarEscalaSprite();
    }

    iniciarRaios() {
        if (this.data.isDead) return;

        this.state = "casting";
        this.stateStartedAt = this.scene.time.now;
        this.nextStrikeAt = this.scene.time.now;

        this.data.isAttacking = true;
        this.data.isHurt = false;

        this.sprite.anims.stop();
        this.sprite.setTexture("boss2_raio");
        this.ajustarEscalaSprite();
    }

    encerrarRaios() {
        if (this.data.isDead) return;

        this.state = "post_cast";
        this.stateStartedAt = this.scene.time.now;
        this.charge = 0;

        this.data.isAttacking = false;
        this.data.isHurt = false;

        this.sprite.anims.stop();
        this.sprite.setTexture("boss2_idle");
        this.ajustarEscalaSprite();
    }

    invocarGrupoDeRaios(player) {
            if (!player || !player.sprite || player.isDead) return;

            const playerGroundY = player.getGroundY ? player.getGroundY() : player.sprite.y;
            const pressionando = this.playerEstaPressionando(player);

            const margemXPrincipal = pressionando ? 18 : 45;
            const margemYPrincipal = pressionando ? 10 : 22;

            const distanciaLateralMin = pressionando ? 85 : 150;
            const distanciaLateralMax = pressionando ? 170 : 260;

            const atrasoEntreRaios = pressionando ? 65 : 90;

            const pontos = [
                // Raio principal: quando a Leona está batendo, cai quase em cima dela.
                {
                    x: Phaser.Math.Clamp(
                        player.sprite.x + Phaser.Math.Between(-margemXPrincipal, margemXPrincipal),
                        80,
                        this.worldWidth - 80
                    ),
                    y: Phaser.Math.Clamp(
                        playerGroundY + Phaser.Math.Between(-margemYPrincipal, margemYPrincipal),
                        this.floorTop,
                        this.floorBottom
                    ),
                    pressao: pressionando
                },

                // Raio lateral direita, mais próximo quando ela está pressionando a boss.
                {
                    x: Phaser.Math.Clamp(
                        player.sprite.x + Phaser.Math.Between(distanciaLateralMin, distanciaLateralMax),
                        80,
                        this.worldWidth - 80
                    ),
                    y: Phaser.Math.Clamp(
                        playerGroundY + Phaser.Math.Between(-38, 38),
                        this.floorTop,
                        this.floorBottom
                    ),
                    pressao: false
                },

                // Raio lateral esquerda.
                {
                    x: Phaser.Math.Clamp(
                        player.sprite.x - Phaser.Math.Between(distanciaLateralMin, distanciaLateralMax),
                        80,
                        this.worldWidth - 80
                    ),
                    y: Phaser.Math.Clamp(
                        playerGroundY + Phaser.Math.Between(-38, 38),
                        this.floorTop,
                        this.floorBottom
                    ),
                    pressao: false
                }
            ];

            pontos.forEach((ponto, index) => {
                this.scene.time.delayedCall(index * atrasoEntreRaios, () => {
                    this.criarRaioNoPonto(ponto.x, ponto.y, player, {
                        pressao: ponto.pressao
                    });
                });
            });
        }

    criarRaioNoPonto(x, y, player, opcoes = {}) {
            if (this.data.isDead || this.state !== "casting") return;

            const pressao = opcoes.pressao === true;

            const raioAvisoTamanho = pressao ? 39 : 34;
            const avisoDuracao = pressao ? 115 : 150;
            const avisoRepeat = pressao ? 0 : 1;

            const aviso = this.scene.add.circle(x, y - 6, raioAvisoTamanho, 0xffffff, 0.25)
                .setStrokeStyle(2, 0x7efcff, 0.9)
                .setDepth(y + 40);

            this.activeWarnings.push(aviso);

            this.scene.tweens.add({
                targets: aviso,
                alpha: 0.78,
                scaleX: pressao ? 1.15 : 1.25,
                scaleY: pressao ? 1.15 : 1.25,
                duration: avisoDuracao,
                yoyo: true,
                repeat: avisoRepeat,
                onComplete: () => {
                    this.activeWarnings = this.activeWarnings.filter((item) => item !== aviso);
                    aviso.destroy();

                    if (this.data.isDead || this.state !== "casting") return;

                    const raio = this.scene.add.image(x, y + 10, "boss2_raio2")
                        .setOrigin(0.5, 1)
                        .setDepth(y + 80)
                        .setAlpha(0.95);

                    this.ajustarAlturaImagem(raio, pressao ? 250 : 230);
                    this.activeRaios.push(raio);

                    this.verificarDanoRaio(x, y, player, {
                        pressao
                    });

                    this.scene.tweens.add({
                        targets: raio,
                        alpha: 0,
                        scaleX: raio.scaleX * 1.08,
                        scaleY: raio.scaleY * 1.08,
                        duration: 260,
                        onComplete: () => {
                            this.activeRaios = this.activeRaios.filter((item) => item !== raio);
                            raio.destroy();
                        }
                    });
                }
            });
        }

      verificarDanoRaio(x, y, player, opcoes = {}) {
            if (!player || player.isDead) return;

            const playerGroundY = player.getGroundY ? player.getGroundY() : player.sprite.y;

            const dx = Math.abs(player.sprite.x - x);
            const dy = Math.abs(playerGroundY - y);

            const pressao = opcoes.pressao === true;

            const hitboxX = pressao ? 78 : 66;
            const hitboxY = pressao ? 64 : 56;

            if (dx <= hitboxX && dy <= hitboxY) {
                player.receberDano(14, x);
            }
        }

    receberDano(valor, opcoes = {}) {
        if (!this.sprite || !this.sprite.active) return false;
        if (this.data.isDead) return false;

        // Só toma dano no carregamento
        if (!this.estaVulneravel()) {
            this.feedbackInvulneravel();
            return false;
        }

        const player = opcoes.player;

        if (player?.sprite) {
            this.lastDamageFromX = player.sprite.x;
        }

        this.data.currentHp -= valor;
        if (this.data.currentHp < 0) {
            this.data.currentHp = 0;
        }

        this.data.isHurt = true;

        this.sprite.anims.stop();
        this.sprite.setTexture("boss2_damage0");
        this.ajustarEscalaSprite();

        this.scene.tocarSom?.(this.scene.sfxEnemyDamage, true);

        if (player) {
            const empurraoPequeno = player.sprite.flipX ? -8 : 8;
            this.sprite.x += empurraoPequeno;
            this.sprite.x = Phaser.Math.Clamp(this.sprite.x, 80, this.worldWidth - 80);
        }

        if (this.data.hurtReturnEvent) {
            this.data.hurtReturnEvent.remove(false);
            this.data.hurtReturnEvent = null;
        }

        if (this.data.currentHp <= 0) {
            this.derrotar();
            return true;
        }

        this.data.hurtReturnEvent = this.scene.time.delayedCall(180, () => {
            if (this.data.isDead) return;

            this.data.isHurt = false;

            if (this.state === "charging") {
                this.sprite.play("boss2_charge", true);
            } else if (this.state === "preparing") {
                this.sprite.play("boss2_prepare", true);
            } else if (this.state === "casting") {
                this.sprite.anims.stop();
                this.sprite.setTexture("boss2_raio");
            } else {
                this.sprite.anims.stop();
                this.sprite.setTexture("boss2_idle");
            }

            this.ajustarEscalaSprite();
        });

        return true;
    }

        estaVulneravel() {
            // Nova regra:
            // carregando/preparando = invulnerável
            // soltando raios = vulnerável
            return this.state === "casting" && !this.data.isDead;
        }

    feedbackInvulneravel() {
        if (!this.sprite || !this.sprite.active) return;

        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.45,
            duration: 55,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                if (this.sprite?.active) {
                    this.sprite.setAlpha(1);
                }
            }
        });
    }

    liberarHitstun() {
            if (!this.sprite || !this.sprite.active) return;
            if (this.data.isDead) return;

            if (this.data.hurtReturnEvent) {
                this.data.hurtReturnEvent.remove(false);
                this.data.hurtReturnEvent = null;
            }

            this.data.hurtReturnEvent = this.scene.time.delayedCall(120, () => {
                if (this.data.isDead) return;

                this.data.isHurt = false;

                if (this.state === "charging") {
                    this.sprite.play("boss2_charge", true);
                } else if (this.state === "preparing") {
                    this.sprite.play("boss2_prepare", true);
                } else if (this.state === "casting") {
                    this.sprite.anims.stop();
                    this.sprite.setTexture("boss2_raio");
                } else {
                    this.sprite.anims.stop();
                    this.sprite.setTexture("boss2_idle");
                }

                this.ajustarEscalaSprite();
            });
        }

    arremessar() {
        this.liberarHitstun();
    }

    atacar() {
        this.forcarRaio();
    }

    forcarRaio() {
        if (this.data.isDead) return;

        this.charge = 1;
        this.iniciarPreparacao();
    }

    derrotar() {
        if (this.data.isDead) return;

        this.data.isDead = true;
        this.data.isAttacking = false;
        this.data.isHurt = false;

        this.state = "defeated";
        this.charge = 0;

        if (this.data.hurtReturnEvent) {
            this.data.hurtReturnEvent.remove(false);
            this.data.hurtReturnEvent = null;
        }

        this.limparRaiosAtivos();

        this.sprite.body.setVelocity(0, 0);
        this.sprite.anims.stop();

        // Primeiro quadro de dano antes da queda
        this.sprite.setTexture("boss2_damage0");
        this.ajustarEscalaSprite();

        this.sprite.anims.stop();
        this.sprite.setTexture("boss2_damage4");
        this.ajustarEscalaSprite();

        this.scene.events.emit("boss:lore", this.loreInfo);

        this.scene.events.emit("boss2:derrotada", {
            nome: "Kayla, a Condutora de Raios",
            titulo: "Dossiê desbloqueado",
            texto:
                "Antes de dominar os raios, Kayla era uma guerreira obcecada por controle. " +
                "Sua técnica canalizava energia através da própria dor, criando tempestades breves, " +
                "mas violentas. Derrotá-la não encerra a tempestade — apenas revela que alguém maior " +
                "ensinou essa força a ela."
        });

        // Decide para qual lado ela será arremessada
        // Se o player estava à esquerda, ela vai para a direita; e vice-versa.
        const direcao = this.lastDamageFromX < this.sprite.x ? 1 : -1;

        const xInicial = this.sprite.x;
        const yInicial = this.sprite.y;

        const xPico = Phaser.Math.Clamp(
            xInicial + direcao * 60,
            80,
            this.worldWidth - 80
        );

        const yPico = Phaser.Math.Clamp(
            yInicial - 26,
            this.floorTop,
            this.floorBottom
        );

        const xFinal = Phaser.Math.Clamp(
            xInicial + direcao * 95,
            80,
            this.worldWidth - 80
        );

        const yFinal = Phaser.Math.Clamp(
            yInicial + 8,
            this.floorTop,
            this.floorBottom
        );

        this.scene.tweens.killTweensOf(this.sprite);

        // Pequeno arremesso para trás
        this.scene.tweens.add({
            targets: this.sprite,
            x: xPico,
            y: yPico,
            duration: 150,
            ease: "Quad.Out",
            onComplete: () => {
                if (!this.sprite || !this.sprite.active) return;

                // Começa a animação de derrota
                this.sprite.play("boss2_defeated", true);
                this.ajustarEscalaSprite();

                this.scene.tweens.add({
                    targets: this.sprite,
                    x: xFinal,
                    y: yFinal,
                    duration: 260,
                    ease: "Quad.In",
                    onUpdate: () => {
                        this.ajustarEscalaSprite();
                    },
                    onComplete: () => {
                        if (!this.sprite || !this.sprite.active) return;

                        // Garante o último frame de morte e escala correta
                        this.sprite.anims.stop();
                        this.sprite.setTexture("boss2_damage4");
                        this.ajustarEscalaSprite();
                    }
                });
            }
        });
    }

    playerEstaPressionando(player) {
        if (!player) return false;

        return (
            player.inAction ||
            player.isPunching ||
            player.isAirKicking ||
            player.comboWaitingForInput ||
            player.isComboActive?.()
        );
    }

    atualizarBarras() {
        this.hpBarBg.clear();
        this.hpBarFill.clear();
        this.raioBarBg.clear();
        this.raioBarFill.clear();

        if (!this.sprite || !this.sprite.active) return;

        const bounds = this.sprite.getBounds();

        const largura = 190;
        const altura = 10;

        const x = this.sprite.x - largura / 2;
        const yHp = bounds.top - 24;
        const yRaio = yHp + 15;

        const hpPercent = Phaser.Math.Clamp(
            this.data.currentHp / this.data.maxHp,
            0,
            1
        );

        const raioPercent = Phaser.Math.Clamp(this.charge, 0, 1);

        this.hpBarBg.setDepth(this.sprite.depth + 20);
        this.hpBarFill.setDepth(this.sprite.depth + 21);
        this.raioBarBg.setDepth(this.sprite.depth + 20);
        this.raioBarFill.setDepth(this.sprite.depth + 21);

        this.hpBarBg.fillStyle(0x111111, 0.9);
        this.hpBarBg.fillRoundedRect(x, yHp, largura, altura, 4);

        this.hpBarFill.fillStyle(0xb30000, 1);
        this.hpBarFill.fillRoundedRect(
            x + 1,
            yHp + 1,
            (largura - 2) * hpPercent,
            altura - 2,
            3
        );

        this.raioBarBg.fillStyle(0x111111, 0.9);
        this.raioBarBg.fillRoundedRect(x, yRaio, largura, altura, 4);

        this.raioBarFill.fillStyle(0x7efcff, 1);
        this.raioBarFill.fillRoundedRect(
            x + 1,
            yRaio + 1,
            (largura - 2) * raioPercent,
            altura - 2,
            3
        );
    }

    reset(x, y) {
        if (this.startDelayEvent) {
            this.startDelayEvent.remove(false);
            this.startDelayEvent = null;
        }

        if (this.data.hurtReturnEvent) {
            this.data.hurtReturnEvent.remove(false);
            this.data.hurtReturnEvent = null;
        }

        this.scene.tweens.killTweensOf(this.sprite);
        this.limparRaiosAtivos();

        this.sprite.setPosition(x, y);
        this.sprite.setAlpha(1);
        this.sprite.setFlipX(true);
        this.sprite.anims.stop();
        this.sprite.setTexture("boss2_idle");
        this.ajustarEscalaSprite();

        this.data.currentHp = this.data.maxHp;
        this.data.isDead = false;
        this.data.isAttacking = false;
        this.data.isHurt = false;
        this.data.isBeingThrown = false;
        this.data.isReturning = false;

        this.state = "idle";
        this.charge = 0;
        this.stateStartedAt = this.scene.time.now;
        this.nextStrikeAt = 0;

        this.lastDamageFromX = x - 100;

        this.startDelayEvent = this.scene.time.delayedCall(600, () => {
            this.iniciarCarregamento();
        });
    }

    limparRaiosAtivos() {
        this.activeWarnings.forEach((item) => {
            if (item?.active) {
                this.scene.tweens.killTweensOf(item);
                item.destroy();
            }
        });

        this.activeRaios.forEach((item) => {
            if (item?.active) {
                this.scene.tweens.killTweensOf(item);
                item.destroy();
            }
        });

        this.activeWarnings = [];
        this.activeRaios = [];
    }

    getAlturaAtualSprite() {
        if (!this.sprite || !this.sprite.texture) return this.alturaBoss;

        const key = this.sprite.texture.key;

        const texturasDefeat = [
            "boss2_damage1",
            "boss2_damage2",
            "boss2_damage3",
            "boss2_damage4"
        ];

        if (texturasDefeat.includes(key)) {
            return this.alturaBossDefeated;
        }

        return this.alturaBoss;
    }

    ajustarEscalaSprite() {
        if (!this.sprite || !this.sprite.frame) return;

        const alturaOriginal = this.sprite.frame.height;
        const alturaDesejada = this.getAlturaAtualSprite();
        const escala = alturaDesejada / alturaOriginal;

        this.sprite.setScale(escala);
    }

    ajustarAlturaImagem(img, alturaAlvo) {
        if (!img || !img.width || !img.height) return;

        const escala = alturaAlvo / img.height;
        img.setScale(escala);
    }

    destroy() {
        if (this.startDelayEvent) {
            this.startDelayEvent.remove(false);
            this.startDelayEvent = null;
        }

        if (this.data?.hurtReturnEvent) {
            this.data.hurtReturnEvent.remove(false);
            this.data.hurtReturnEvent = null;
        }

        this.limparRaiosAtivos();

        this.hpBarBg?.destroy();
        this.hpBarFill?.destroy();
        this.raioBarBg?.destroy();
        this.raioBarFill?.destroy();

        if (this.sprite) {
            this.scene.tweens.killTweensOf(this.sprite);
            this.sprite.destroy();
        }
    }
}