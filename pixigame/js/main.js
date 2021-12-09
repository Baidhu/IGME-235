// We will use `strict mode`, which helps us by having the browser catch many common JS mistakes
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
"use strict";
const app = new PIXI.Application({
    width: 600,
    height: 600
});
document.body.appendChild(app.view);

// constants
const sceneWidth = app.view.width;
const sceneHeight = app.view.height;	

// pre-load the images
app.loader.
    add([
        "images/tiger.png",
        "images/sky.jpg"
    ]);
app.loader.onProgress.add(e => { console.log(`progress=${e.progress}`) });
app.loader.onComplete.add(setup);
app.loader.load();

// aliases
let stage;

// game variables
let startScene;
let gameScene,tiger,scoreLabel,lifeLabel,shootSound,hitSound;
let gameOverScene;

let circles = [];
let bullets = [];
let aliens = [];
let explosions = [];
let explosionTextures;
let score = 0;
let life = 100;
let levelNum = 1;
let paused = true;

function setup() {
	stage = app.stage;
	// #1 - Create the `start` scene
	startScene = new PIXI.Container();
    stage.addChild(startScene);

	// #2 - Create the main `game` scene and make it invisible
    gameScene = new PIXI.Container();
    gameScene.visible = false;
    stage.addChild(gameScene);

	// #3 - Create the `gameOver` scene and make it invisible
    gameOverScene = new PIXI.Container();
    gameOverScene.visible = false;
    stage.addChild(gameOverScene);

	// #4 - Create labels for all 3 scenes
	createLabelsAndButtons();

	// #5 - Create tiger
	tiger = new Player();
    gameScene.addChild(tiger);

	// #6 - Load Sounds
	shootSound = new Howl({
        src: ['sounds/shoot.wav']
    });

    hitSound = new Howl({
        src: ['sounds/hit.mp3']
    });

	// #7 - Load sprite sheet
		
	// #8 - Start update loop
    app.ticker.add(gameLoop);
	
	// #9 - Start listening for click events on the canvas
	
	// Now our `startScene` is visible
	// Clicking the button calls startGame()
}

function createLabelsAndButtons() {
    let buttonStyle = new PIXI.TextStyle({
        fill: 0xF76902,
        fontSize: 48,
        fontFamily: "Futura"
    });

    // 1 - set up `startScene`
    // 1A - make top start label
    let startLabel1 = new PIXI.Text("Ritchie's Escape!");
    startLabel1.style = new PIXI.TextStyle({
        fill: 0xF76902,
        fontSize: 70,
        fontFamily: "Futura",
        stroke: 0x000000,
        strokeThickness: 6
    });
    startLabel1.x = 50;
    startLabel1.y = 120;
    startScene.addChild(startLabel1);

    // 1B - make middle start label
    let startLabel2 = new PIXI.Text("Can you help our friend escape?");
    startLabel2.style = new PIXI.TextStyle({
        fill: 0xF76902,
        fontSize: 32,
        fontFamily: "Futura",
        fontStyle: "italic",
        stroke: 0x000000,
        strokeThickness: 6
    });
    startLabel2.x = 90;
    startLabel2.y = 300;
    startScene.addChild(startLabel2);

    // 1C - make start game button
    let startButton = new PIXI.Text("Run!");
    startButton.style = buttonStyle;
    startButton.x = 230;
    startButton.y = sceneHeight - 150;
    startButton.interactive = true;
    startButton.buttonMode = true;
    startButton.on("pointerup", startGame); // startGame is a function reference
    startButton.on('pointerover', e => e.target.alpha = 0.7); // concise arrow function with no brackets
    startButton.on('pointerout', e => e.currentTarget.alpha = 1.0); // ditto
    startScene.addChild(startButton);

    // 2 - set up `gameScene`
    let textStyle = new PIXI.TextStyle({
        fill: 0xF76902,
        fontSize: 18,
        fontFamily: "Futura",
        stroke: 0x000000,
        strokeThickness: 4
    });
    // 2A - make score label
    scoreLabel = new PIXI.Text();
    scoreLabel.style = textStyle;
    scoreLabel.x = 5;
    scoreLabel.y = 5;
    gameScene.addChild(scoreLabel);
    increaseScoreBy(0);

    // 2B - make life label
    lifeLabel = new PIXI.Text();
    lifeLabel.style = textStyle;
    lifeLabel.x = 5;
    lifeLabel.y = 26;
    gameScene.addChild(lifeLabel);
    decreaseLifeBy(0);

    // 3 - set up `gameOverScene`
    // 3A - make game over text
    let gameOverText = new PIXI.Text("Game Over!\n        :-O");
    textStyle = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 64,
        fontFamily: "Futura",
        stroke: 0xFF0000,
        strokeThickness: 6
    });
    gameOverText.style = textStyle;
    gameOverText.x = 100;
    gameOverText.y = sceneHeight/2 - 160;
    gameOverScene.addChild(gameOverText);

    // 3B - make "play again?" button
    let playAgainButton = new PIXI.Text("Play Again?");
    playAgainButton.style = buttonStyle;
    playAgainButton.x = 150;
    playAgainButton.y = sceneHeight - 100;
    playAgainButton.interactive = true;
    playAgainButton.buttonMode = true;
    playAgainButton.on("pointerup",startGame); // startGame is a function reference
    playAgainButton.on('pointerover',e=>e.target.alpha = 0.7); // concise arrow function with no brackets
    playAgainButton.on('pointerout',e=>e.currentTarget.alpha = 1.0); // ditto
    gameOverScene.addChild(playAgainButton);

}

function startGame(){
    startScene.visible = false;
    gameOverScene.visible = false;
    gameScene.visible = true;
    levelNum = 1;
    score = 0;
    life = 100;
    increaseScoreBy(0);
    decreaseLifeBy(0);
    tiger.x = 300;
    tiger.y = 550;
    loadLevel();
}

function increaseScoreBy(value){
    score += value;
    scoreLabel.text = `Score  ${score}`;
}

function decreaseLifeBy(value){
    life -= value;
    life = parseInt(life);
    lifeLabel.text = `Life     ${life}%`;
}

function gameLoop(){
	if (paused) return;
	
	// #1 - Calculate "delta time"
    let dt = 1/app.ticker.FPS;
    if (dt > 1/12) dt=1/12;
	
	// #2 - Move Player
    let mousePosition = app.renderer.plugins.interaction.mouse.global;
    tiger.position = mousePosition;
	
    let amt = 6 * dt; // at 60 FPS would move about 10% of distance per update

    // lerp (linear interpolate) the x & y values with lerp()
    let newX = lerp(tiger.x, mousePosition.x, amt);
    let newY = lerp(tiger.y, mousePosition.y, amt);

    // keep the tiger on the screen with clamp()
    let w2 = tiger.width/2;
    let h2 = tiger.height/2;
    tiger.x = clamp(newX,0+w2,sceneWidth-w2);
    tiger.y = clamp(newY,0+h2,sceneHeight-h2);
	
	// #3 - Move Circles
	for(let c of circles){
        c.move(dt);
        if(c.x <= c.radius || c.x >= sceneWidth-c.radius){
            c.isAlive = false;
        }

        if(c.y <= c.radius || c.y >= sceneHeight-c.radius){
            c.reflectY();
            c.move(dt);
        }
    }
	
	// #4 - Move Bullets

	
	// #5 - Check for Collisions
	for(let c of circles){
        // #5A - circles & bullets
        // TODO

        // #5B - circles & tiger
        if (c.isAlive && rectsIntersect(c,tiger)){
            hitSound.play();
            gameScene.removeChild(c);
            c.isAlive = false;
            decreaseLifeBy(20);
        }
    }
	
	// #6 - Now do some clean up
	
    // get rid of dead bullets
    bullets = bullets.filter(b=>b.isAlive);

    // get rid of dead circles
    circles = circles.filter(c=>c.isAlive);

    // get rid of explosion
    explosions = explosions.filter(e=>e.playing);
	
	// #7 - Is game over?
    if (life <= 0){
	    end();
	    return; // return here so we skip #8 below
    }
	
	// #8 - Start update loop
    app.ticker.add(gameLoop);
}

function createCircles(numCircles){
    for(let i=0;i<numCircles;i++){
        let c = new Circle(10,0xB87333);
        c.x = Math.random() * (sceneWidth - 600) + 570;
        c.y = Math.random() * (sceneHeight - 50) + 25;
        circles.push(c);
        gameScene.addChild(c);
    }
}

function loadLevel(){
	createCircles(levelNum * 5);
	paused = false;
}

function end() {
    paused = true;
    // clear out level
    circles.forEach(c=>gameScene.removeChild(c)); // concise arrow function with no brackets and no return
    circles = [];

    bullets.forEach(b=>gameScene.removeChild(b)); // ditto
    bullets = [];

    explosions.forEach(e=>gameScene.removeChild(e)); // ditto
    explosions = [];

    gameOverScene.visible = true;
    gameScene.visible = false;
}