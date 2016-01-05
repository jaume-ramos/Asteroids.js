/******************************************************************************
 *                                                                            *
 * Variables Globalss                                                         *
 *                                                                            *
 ******************************************************************************
 */

// Elements gràfics
var nau,
    asteroides,
    explosions,
    bales,
    fonsNebulosa, fonsPedres;

// Sons del joc
var musica_sound,
    accelera_sound,
    explota_sound;

// Temps fins mostrar un altre element gràfic
var seguentBala = 0,
    seguentAsteroide = 0;

// Informació del joc
var puntsString = 'Punts: ',
    videsString = 'Vides: ',
    textPunts,
    textVides,
    textEstat,
    punts = 0,
    vides,
    jugant = false;

// Control del joc
var cursors,
    teclaDisparar,
    touchDreta,
    touchEsquerra,
    touchEsquerraPosInicial = new Phaser.Point(0, 0),
    cercleEsquerra, cercleDreta;

// Mida del joc
var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
var h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;


/******************************************************************************
 *                                                                            *
 * Crea el Joc. Un cop creat tot el procés té lloc a les funcions definides   *
 *                                                                            * 
 ******************************************************************************
 */
var game = new Phaser.Game(w, h, Phaser.CANVAS, '',
    {init: init, preload: preload, create: create, update: update});


/*              
 * Inicialitza la mida del joc per tal que s'adapti als canvis de mida  
 * entre els diferents dispositius: mòbils, tablets, PC...
 */
function init() {
    game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
}

/*
 * Abans de començar carrega tots els elements necessàris
 */
function preload() {

    // Carrega les animacions, formades per una imatge amb la seqüencia que generarà l'animació
    game.load.spritesheet('explosio', 'assets/explosio.png', 128, 128);
    
    // Carrega les imatges
    game.load.spritesheet('nau', 'assets/nau-x2.png', 90, 90);
    game.load.image('bala', 'assets/bala.png');
    game.load.image('asteroide', 'assets/asteroide.png');
    game.load.image('nebulosa', 'assets/nebulosa.png');
    game.load.image('pedres', 'assets/pedres.png');

    // Carrega els sons    
    game.load.audio('musica', 'assets/musica.ogg');
    game.load.audio('accelera', 'assets/accelera.ogg');
    game.load.audio('explosio', 'assets/explosio.ogg');
}

/*
 * Un cop els elements elements gràfics i els sons, els afegeix al joc
 */
function create() {

    //  Crea els elements d'audio        
    musica_sound = game.add.audio('musica', 1, true);
    accelera_sound = game.add.audio('accelera');
    explosio_sound = game.add.audio('explosio');
    
    //  Posa el fonsPedres del joc
    game.stage.backgroundColor = '#000000';
    fonsNebulosa = game.add.tileSprite(0, 0, game.width, game.height, 'nebulosa');
    fonsPedres = game.add.tileSprite(0, 0, game.width, game.height, 'pedres');

    // Neteja el canvas abans de dibuixar
    game.renderer.clearBeforeRender = true;

    // Indica quin control volem sobre elements del joc.
    // Physics.ARCADE proporciona uns controls bàsics però
    // suficients per un joc tipus arcade com aquest
    game.physics.startSystem(Phaser.Physics.ARCADE);

    // Dibuixa la nau
    nau = game.add.sprite(game.width / 2, game.height / 2, 'nau');
    nau.anchor.x = 0.5;
    nau.anchor.y = 0.5;
    game.physics.enable(nau, Phaser.Physics.ARCADE);

    // Defineix el fregament de la nau
    nau.body.drag.set(100);
    // Defineix la màxima velocitat de la nau
    nau.body.maxVelocity.set(200);

    //  Crea conjunts d'elements que reutilitzarem
    //  Això és més eficient que crear cada cop els elements
    bales = game.add.group();
    bales.enableBody = true;
    bales.physicsBodyType = Phaser.Physics.ARCADE;
    bales.createMultiple(30, 'bala');
    bales.setAll('anchor.x', 0.5);
    bales.setAll('anchor.y', 1);

    asteroides = game.add.group();
    asteroides.enableBody = true;
    asteroides.physicsBodyType = Phaser.Physics.ARCADE;
    asteroides.createMultiple(12, 'asteroide');
    asteroides.setAll('anchor.x', 0.5);
    asteroides.setAll('anchor.y', 0.5);

    explosions = game.add.group();
    explosions.createMultiple(30, 'explosio');
    explosions.setAll('anchor.x', 0.5);
    explosions.setAll('anchor.y', 0.5);
    explosions.forEach(function (explosio) {
        explosio.animations.add('explosio');
    }, this);

    // Dibuixa asteroides per començar la partida
    creaAsteroides();

    //  Puntuació obtinguda
    textPunts = game.add.text(10, 10, puntsString + punts, {font: '34px Arial', fill: '#fff'});

    //  Mostra el nombre de vides amb imatges
    textVides = game.add.text(game.width - 150, 10, videsString, {font: '34px Arial', fill: '#fff'});
    vides = game.add.group();
    vides.x = game.width - 130;
    for (var i = 0; i < 3; i++) {
        var vida = vides.create((30 * i), 60, 'nau');
        vida.width = 30;
        vida.height = 30;
        vida.anchor.setTo(0.5, 0.5);
        vida.angle = -90;
        vida.alpha = 0.4;
    }

    //  Missatge per donar informació
    textEstat = game.add.text(game.world.centerX, game.world.centerY, ' ', {font: '30px Arial', fill: '#fff'});
    textEstat.anchor.setTo(0.5, 0.5);
    textEstat.visible = false;

    //  Controla les tecles utilitzades pel joc
    cursors = game.input.keyboard.createCursorKeys();
    teclaDisparar = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

    // Defineix els callbacks pels dispositius mòbils
    if (game.device.desktop === false) {
        game.input.onDown.add(touchDown, this);
        game.input.onUp.add(touchUp, this);
    }
    
    // Comença el joc
    musica_sound.play();
    jugant = true;
}

/*
 * Dibuixa cada frame del joc.
 * Controla la posició de tots els elements i els dibuixa. 
 */
function update() {

    //  Mou cap cap a la dreta les pedres
    fonsPedres.tilePosition.x += 0.5;

    // Mostra cercles per indicar la posició dels controls tàctils
    if (cercleEsquerra) {
        cercleEsquerra.destroy();
    }
    if (touchEsquerra) {
        cercleEsquerra = game.add.graphics(0, 0);
        cercleEsquerra.lineStyle(6, 0x00ff00);
        cercleEsquerra.drawCircle(touchEsquerraPosInicial.x, touchEsquerraPosInicial.y, 40);

        cercleEsquerra.lineStyle(2, 0x00ff00);
        cercleEsquerra.drawCircle(touchEsquerraPosInicial.x, touchEsquerraPosInicial.y, 60);

    }
    if (cercleDreta) {
        cercleDreta.destroy();
    }
    if (touchDreta) {
        cercleDreta = game.add.graphics(0, 0);
        cercleDreta.lineStyle(6, 0xff0000);
        cercleDreta.drawCircle(touchDreta.x, touchDreta.y, 40);

        cercleDreta.lineStyle(2, 0xff0000);
        cercleDreta.drawCircle(touchDreta.x, touchDreta.y, 60);
    }

    // Si la nau és activa controla el moviment
    if (nau.alive) {
        // Controls tàctils
        if (touchEsquerra) {
            var ang = touchEsquerraPosInicial.angle(touchEsquerra);
            //nau.rotation = ang;
            ang *= 50;
            nau.body.angularVelocity = ang;
            var vel = touchEsquerraPosInicial.distance(touchEsquerra, true) * 30;
            game.physics.arcade.accelerationFromRotation(nau.rotation, vel, nau.body.acceleration);
        } else {
            if (cursors.up.isDown) {
                //  Tecla amunt fa accelerar la nau 
                game.physics.arcade.accelerationFromRotation(nau.rotation, 200, nau.body.acceleration);
                nau.frame = 1;
                accelera_sound.play();
            } else {
                nau.body.acceleration.set(0);
                nau.frame = 0;
            }

            // Tecles dreta i esquerra fan rotar la nau
            if (cursors.left.isDown) {
                nau.body.angularVelocity = -300;
            } else if (cursors.right.isDown) {
                nau.body.angularVelocity = 300;
            } else {
                nau.body.angularVelocity = 0;
            }
        }

        // Dispara
        if (touchDreta) {        
            dispararBala();
        } else if (teclaDisparar.isDown) {
            dispararBala();
        }

        // Comprova el temporitzador per crear un nou asteroide
        if (game.time.now > seguentAsteroide) {
            creaAsteroide();
        }

        //  Revisa les colisions entre elements del joc
        game.physics.arcade.overlap(bales, asteroides, balaTocaAsteroide, null, this);

        game.physics.arcade.overlap(asteroides, nau, asteroideTocaNau, null, this);

        // Controla si algun dels elements surt de la pantalla
        surtPantalla(nau);
        bales.forEachExists(surtPantalla, this);
        asteroides.forEachExists(surtPantalla, this);
    }


}

/******************************************************************************
 *                                                                            *
 * Funcions auxiliars                                                         * 
 *                                                                            *
 ******************************************************************************
 */

/*
 * Callback per quan es prem la pantalla en un dispositiu tàctil
 */
function touchDown(punter) {
    if (jugant && (punter.pointerMode == 3 || punter.punterMode == Phaser.PointerMode.CONTACT)) {
        if (punter.positionDown.x < game.world.centerX && !touchEsquerra) {
            touchEsquerra = punter;
            touchEsquerraPosInicial.copyFrom(punter.positionDown);
        } else if (punter.positionDown.x > game.world.centerY && !touchDreta) {
            touchDreta = punter;
        }
    }
}

/*
 * Callback per quan es deixa de prèmer la pantalla en un dispositiu tàctil
 */
function touchUp(punter) {
    if (jugant && (punter.pointerMode == 3 || punter.punterMode == Phaser.PointerMode.CONTACT)) {
        if (touchEsquerra && punter.id == touchEsquerra.id) {
            touchEsquerra = null;
            touchEsquerraPosInicial.setTo(0, 0);
        } else if (touchDreta && punter.id == touchDreta.id) {
            touchDreta = null;
        }
    }
}

/*
 * Controla si un objecte surt de la pantalla
 * El fa aparèixer a l'altra banda del canvas
 */
function surtPantalla(sprite) {

    // Comprova si surt horitzontalment
    if (sprite.x < 0) {
        sprite.x = game.width;
    } else if (sprite.x > game.width) {
        sprite.x = 0;
    }

    // Comprova si surt verticalment
    if (sprite.y < 0) {
        sprite.y = game.height;
    } else if (sprite.y > game.height) {
        sprite.y = 0;
    }
}

/*
 * Al principi del joc posem 5 asteroides
 * Cada segon n'apareix un altre
 */
function creaAsteroides() {
    for (var y = 0; y < 5; y++) {
        creaAsteroide();
    }
}
function creaAsteroide() {
    var asteroid = asteroides.getFirstExists(false);

    if (asteroid) {
        //  Evita que l'asteroide surti massa prop de la nau
        do {
            asteroid.reset(game.rnd.integerInRange(0, game.width), game.rnd.integerInRange(0, game.height));
        } while (game.physics.arcade.distanceBetween(asteroid, nau) < 100);

        asteroid.body.angularVelocity = game.rnd.integerInRange(-300, 300);
        asteroid.body.velocity.setTo(game.rnd.integerInRange(-30, 60), game.rnd.integerInRange(-30, 60));
        seguentAsteroide = game.time.now + 1000;
    }

}

/*
 * Controla la col·lisió bales-asteroides 
 *      Actualitza el comptador de punts
 *      Mostra una explosió
 */
function balaTocaAsteroide(bala, asteroide) {

    //  Amaga la bala i l'asteroide
    bala.kill();
    asteroide.kill();

    //  Suma punts
    punts += 10;
    textPunts.text = puntsString + punts;

    //  Crea una explosió
    var explosio = explosions.getFirstExists(false);
    explosio.reset(asteroide.body.x, asteroide.body.y);
    explosio.play('explosio', 30, false, true);
    explosio.kill;
    explosio_sound.play();
}

/*
 * Controla la col·lisió nau-bales
 *      Descompta una vida.
 *      Controla el nombre de vides per acabar el joc. * 
 */
function asteroideTocaNau(nau, asteroide) {

    // Fa desapareixer l'asteroide
    asteroide.kill();

    // Mostra una explosicó
    var explosio = explosions.getFirstExists(false);
    explosio.reset(asteroide.body.x, asteroide.body.y);
    explosio.play('explosio', 30, false, true);
    explosio_sound.play();

    // Elimina una vida
    vida = vides.getFirstAlive();
    if (vida) {
        vida.kill();
    }

    // Controla si ja no queden vides i reinicia el joc
    if (vides.countLiving() < 1) {
        aturarJoc();
        textEstat.text = " GAME OVER \n Clic per tornar a jugar";
        textEstat.visible = true;
        game.input.onTap.addOnce(reiniciarJoc, this);
    }
}

/*
 * Dispara una bala. No en surt un altra fins després de 80ms
 */
function dispararBala() {

    if (game.time.now > seguentBala) {
        bala = bales.getFirstExists(false);

        if (bala) {
            bala.reset(nau.body.x + (nau.body.width / 2), nau.body.y + (nau.body.height / 2));
            bala.lifespan = 1000;
            bala.rotation = nau.rotation;
            game.physics.arcade.velocityFromRotation(nau.rotation, 400, bala.body.velocity);
            seguentBala = game.time.now + 80;
        }
    }
}

/*
 * Reinicia el joc un cop acabades les vides
 *      Reinicialitza els comptadors
 *      Amaga tots els asteroides i en deixa 5 com al començament
 */
function reiniciarJoc() {

    // Reinicia el comptador de punts
    punts = 0;
    textPunts.text = puntsString + punts;
    textEstat.visible = false;

    // Recupera les tres vides
    vides.callAll('revive');

    // Amaga tots els asteroides i en mostra 5
    asteroides.callAll('kill');
    creaAsteroides();

    // Fa aparèixer la nau    
    nau.reset(game.world.centerX, game.world.centerY);
    nau.body.acceleration.set(0);
    nau.body.velocity.set(0);
    nau.body.angularVelocity = 0;
    nau.angle = -90;
    nau.revive();
    jugant = true;
}

/*
 * Amaga els elements gràfics un cop no queden vides.
 */
function aturarJoc() {
    
    touchDreta = null;
    touchEsquerra = null;
    if (cercleEsquerra) {
        cercleEsquerra.destroy();
    }
    if (cercleDreta) {
        cercleDreta.destroy();
    }
    vides.callAll('kill');
    asteroides.callAll('kill');
    nau.kill();
    jugant = false;
}
