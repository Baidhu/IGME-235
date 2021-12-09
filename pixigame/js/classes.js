class Player extends PIXI.Sprite {
    constructor(x = 0, y = 0) {
        super(app.loader.resources["images/tiger.png"].texture);
        this.anchor.set(.5, .5); // position, scaling, rotating etc are now from center of sprite
        this.scale.set(0.1);
        this.x = x;
        this.y = y;
    }
}

class Circle extends PIXI.Graphics{
    constructor(radius, color=0xFF0000, x=0, y=0){
        super();
        this.beginFill(color);
        this.drawCircle(0,0,radius);
        this.endFill();
        this.x = x;
        this.y = y;
        this.radius = radius;
        // variables
        this.fwd = getRandomUnitVector();
        this.speed = 50;
        this.isAlive = true;
    }

    move(dt=1/60){
        this.x -= this.fwd.x * this.speed * dt;
        this.y += this.fwd.y * this.speed * dt;
    }

    reflectY(){
        this.fwd.y *= -1;
    }
}