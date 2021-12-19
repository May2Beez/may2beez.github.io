class Game {
    lastTime;
    constructor(canvas, ctx, gameLoop) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.gameLoop = gameLoop;
        this.player1Score = 0;
        this.player2Score = 0;
        this.reset();
        this.drawCanvas();
        this.showStartMenu();
    }

    showStartMenu() {
        this.ctx.beginPath();
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        this.ctx.textAlign = "center";
        this.ctx.font = "52px roboto";
        this.ctx.fillText("Press 1 for single player", this.canvas.width / 2, this.canvas.height / 2 - 30);
        this.ctx.fillText("Press 2 for two players", this.canvas.width / 2, this.canvas.height / 2 + 30);
        this.ctx.stroke();
        this.function = this.function = (function(e) {
            this.chooseMode(e, this);
        }).bind(this);
        window.addEventListener("keypress",  this.function);
    }

    chooseMode(e, client) {
        if (e.code == "Digit1") {
            client.spawnPlayers(1);
        }
        if (e.code == "Digit2") {
            client.spawnPlayers(2);
        }
    }

    spawnPlayers(mode) {
        window.removeEventListener("keypress", this.function);
        this.ball = new Ball(this, this.ctx, this.canvas);
        switch (mode) {
            case 1: {
                this.player1 = new Player(this.ctx, this.canvas, 50, false, this.ball, 1);
                this.player2 = new Player(this.ctx, this.canvas, this.canvas.width - 50, true, this.ball, 0);
                break;
            }
            case 2: {
                this.player1 = new Player(this.ctx, this.canvas, 50, false, this.ball, 1);
                this.player2 = new Player(this.ctx, this.canvas, this.canvas.width - 50, false, this.ball, 2);
                break;
            }
        }
        this.gameLoop(0);

    }

    reset() {
        this.lastTime = null;
        this.canvas.height = window.innerHeight;
        this.canvas.width = window.innerWidth;
        if (this.player1 != null && this.player2 != null && this.ball != null) {
            this.player1.y = this.canvas.height / 2;
            this.player2.y = this.canvas.height / 2;
            this.ball.reset();
        }
    }

    drawCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.ctx.beginPath();
        this.ctx.fillStyle = "rgba(0,0,0, 0.3)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.closePath();
    }

    drawScore() {
        const centerX = this.canvas.width / 2;
        this.ctx.font = "48px Roboto";
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        this.ctx.textAlign = "center";
        this.ctx.fillText(this.player1Score, centerX - centerX / 6, 50);
        this.ctx.fillText("-", centerX, 50);
        this.ctx.fillText(this.player2Score, centerX + centerX / 6, 50);
    }

    isCollision(rect1, rect2) {
        return (
            rect1.left <= rect2.right &&
            rect1.right >= rect2.left &&
            rect1.top <= rect2.bottom &&
            rect1.bottom >= rect2.top
        )
    }

    update(time) {
        if (this.lastTime == null) {
            this.lastTime = time;
            return;
        }

        const delta = time - this.lastTime;

        this.drawCanvas();
        this.drawScore();

        if (this.player1 != null && this.player2 != null && this.ball != null) {
            this.player1.update(delta);
            this.player2.update(delta);
            this.ball.update(delta);
    
            if (this.isCollision(this.player1.getBounding(), this.ball.getBounding()) || this.isCollision(this.player2.getBounding(), this.ball.getBounding())) {
                this.ball.direction.x *= -1;
            }
        }

        this.lastTime = time;
    }
}

class Ball {
    INITIAL_VELOCITY = 0.45
    VELOCITY_INCREASE = 0.00001

    constructor(game, ctx, canvas) {
        this.game = game;
        this.ctx = ctx;
        this.canvas = canvas;
        this.reset();
    }

    reset() {
        this.x = window.innerWidth / 2;
        this.y = window.innerHeight / 2;
        this.direction = { x: 0 };
        while (
            Math.abs(this.direction.x) <= 0.2 ||
            Math.abs(this.direction.x) >= 0.9
        ) {
            const heading = this.randomNumberBetween(0, 2 * Math.PI);
            this.direction = { x: Math.cos(heading), y: Math.sin(heading) };
        }
        this.velocity = this.INITIAL_VELOCITY;
    }

    randomNumberBetween(min, max) {
        return Math.random() * (max - min) + min
    }

    drawBall() {
        this.ctx.beginPath();
        this.ctx.lineWidth = 4;
        this.ctx.fillStyle = "rgba(20, 20, 200, 0.7)";
        this.ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.fill();
    }

    update(delta) {
        this.x += this.direction.x * this.velocity * delta
        this.y += this.direction.y * this.velocity * delta
        this.velocity += this.VELOCITY_INCREASE * delta

        if (this.y + 15 >= this.canvas.height || this.y - 15 <= 0)
            this.direction.y *= -1;

        if (this.x - 15 < 0 || this.x + 15 > this.canvas.width)
            this.nextRound();

        this.drawBall();
    }

    getBounding() {
        return { top: this.y - 15, right: this.x + 15, bottom: this.y + 15, left: this.x - 15 }
    }

    nextRound() {
        if (this.x - 15 <= 0)
            this.game.player2Score += 1;
        if (this.x + 15 >= this.canvas.width)
            this.game.player1Score += 1;

        this.game.reset();
    }
}

class Player {
    MAX_SPEED = 0.004;

    constructor(ctx, canvas, x, isComputer, ball, type) {
        this.ball = ball;
        this.x = x;
        this.y = window.innerHeight / 2;
        this.ctx = ctx;
        this.canvas = canvas;
        this.isComputer = isComputer;
        this.mouseY = window.innerHeight / 2;
        this.type = type;
        this.lastKey = null;
        this.hold = false;
        if (!isComputer && this.type == 1) {
            window.addEventListener("mousemove", e => {
                this.setMousePosition(e);
            })
        } else if (!isComputer && this.type == 2) {
            window.addEventListener("keydown", e => {
                if (e.code == "ArrowUp" || e.code == "ArrowDown")
                {
                    this.hold = true;
                    this.lastKey = e.code;
                }
            })
            window.addEventListener("keyup", e => {
                if (e.code == "ArrowUp" || e.code == "ArrowDown")
                {
                    this.hold = false;
                    this.lastKey = null;
                }
            })
        }
    }

    setMousePosition(e) {
        this.mouseY = e.y;
    }

    setKeyPosition() {
        if (this.lastKey == "ArrowUp")
            this.mouseY = this.y - 150;
        else if (this.lastKey == "ArrowDown")
            this.mouseY = this.y + 150;
    }

    drawPlayer() {
        this.ctx.beginPath();
        this.ctx.rect(this.x - 25, this.y - 100, 50, 200);
        this.ctx.lineWidth = 4;
        this.ctx.fillStyle = "rgba(20, 20, 200, 0.8)";
        this.ctx.stroke();
        this.ctx.fill();
    }

    update(delta) {
        this.drawPlayer();

        if (this.type == 2 && this.hold) {
            this.setKeyPosition();
        }

        if (this.isComputer) {
            this.y += this.MAX_SPEED * delta * (this.ball.y - this.y);
        } else {
            this.move(this.mouseY, delta);
        }
    }

    move(y, delta) {
        if (this.y + this.MAX_SPEED * delta * (y - this.y) - 100 < 0 || this.y + this.MAX_SPEED * delta * (y - this.y) + 100 > this.canvas.height)
            return;
        this.y += this.MAX_SPEED * delta * (y - this.y);
    }

    getBounding() {
        return { top: this.y - 100, right: this.x + 25, bottom: this.y + 100, left: this.x - 25 }
    }
}

let game;

function newGame() {
    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");
    game = new Game(canvas, ctx, gameLoop);
}

function gameLoop(time) {
    game.update(time)
    window.requestAnimationFrame(gameLoop)
}

document.addEventListener("DOMContentLoaded", newGame);
