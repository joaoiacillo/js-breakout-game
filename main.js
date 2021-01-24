/**
 * @author      João Pedro <joaopiacillo@outlook.com.br>
 * @copyright   2020 – João Pedro
 * @license     MIT
 */

window.onload = function() {
  BreakoutGame.start();
}

/**
 * The representation of a position in a 2D space.
 *
 * @name Vector2
 * @constructor
 * @param {number|undefined} x - X component.
 * @param {number|undefined} y - Y component.
 */
const Vector2 = function(x=0, y=undefined) {
  /**
   * The x component of this vector.
   *
   * @name Vector2#x
   * @type {number}
   * @default 0
   */
  this.x = x || 0;

  /**
   * The y component of this vector;
   *
   * @name Vector2#y
   * @type {number}
   * @default [x]
   */
  this.y = y || this.x;

  /**
   * Sums both X and Y components from this vector using another vector and
   * returns it.
   *
   * @name Vector2#add
   * @method
   * @param {Vector2} vec - Vector to be summed with this vector.
   * @returns {Vector2} The sum of this vector with another vector.
   */
  this.add = function(vec) {
    return new Vector2(this.x + vec.x, this.y + vec.y);
  }
}

/**
 * The Breakout game itself.
 * 
 * **HOW TO PLAY?**
 * Move your paddle around your game to guide the ball and make it hit the
 * top bricks. If the ball hit the bottom part of your screen, it's Game Over!
 * 
 * @name BreakoutGame
 */
const BreakoutGame = (function() {
  /**
   * The canvas element used to render the game gfx.
   * 
   * @name screen
   * @type {HTMLCanvasElement}
   * @constant
   */
  this.screen = document.getElementById("game-screen");

  // Detects if the browser does not support canvas rendering
  if(typeof this.screen.getContext === undefined) {
    this.screen.style.display = "none";
    document.writeln("<strong>Your browser does not support this game. Please use a different browser such as </strong> <a href=\"https://www.google.com/intl/pt-BR/chrome/\">Google Chrome</a>");
    return;
  }

  /**
   * The canvas element used to render the game gfx.
   * 
   * @name ctx
   * @type {CanvasRenderingContext2D}
   * @constant
   */
  const ctx = this.screen.getContext("2d");

  /**
   * All active entities used by the game.
   * 
   * @name entities
   * @type {Entity[]}
   * @constant
   */
  this.entities = [];

  /**
   * Current mouse position inside the document.
   *
   * @name mousePosition
   * @type {Vector2}
   */
  this.mousePosition = new Vector2();

  document.onmousemove = (function(event) {
    this.mousePosition.x = event.pageX - this.screen.getBoundingClientRect().x;
    this.mousePosition.y = event.pageY - this.screen.getBoundingClientRect().y;
  }.bind(this));

  /**
   * Holds if the game is running or not.
   *
   * @name isRunning
   * @type {boolean}
   * @default false
   */
  let isRunning = false;

  /**
   * Main loop for the game.
   * 
   * @name BreakoutGame~gameLoop
   * @method
   * @param {number} delta - Time in ms since the last frame was rendered.
   */
  const gameLoop = function(delta) {
    // Returns if the game isn't running.
    if(!isRunning) return;

    ctx.clearRect(0, 0, screen.width, screen.height);
    for (let entity of this.entities) {
      entity.update(delta);
      entity.render(ctx);
    }

    requestAnimationFrame(gameLoop);
  };

  /**
   * Starts the game
   * 
   * @name start
   * @method
   */
  this.start = function() {
    // Returns if the game is already running.
    if(isRunning) return;
    isRunning = true;
    generateBricks();
    requestAnimationFrame(gameLoop);
  }

  /**
   * Stops the game
   * 
   * @name stop
   * @method
   */
  this.stop = function() {
    isRunning = false;
  }

  /**
   * Stops the game execution and shows an game over message.
   * 
   * @name gameOver
   * @method
   */
  this.gameOver = function() {
    const gameOverContainer = document.querySelector("#game-over");

    isRunning = false;
    this.screen.style.display = "none";
    gameOverContainer.style.display = "block";
  }

  return this;
})();

/**
 * An game active entity.
 * 
 * @name Entity
 * @constructor
 * 
 * @param {CallableFunction} update - A callback for updating the entity data.
 * @param {CallableFunction} render - A callback for rendering the entity gfx.
 * @param {object} data - Custom entity properties and methods.
 */
const Entity = function(update, render, data) {
  /**
   * The current absolute position of this entity.
   * 
   * @name Entity#position
   * @type {Vector2}
   */
  this.position = new Vector2();

  if(typeof data !== undefined && typeof data.position !== undefined) {
    this.position = data.position;
  }

  /**
   * Custom properties and methods for the entity.
   * 
   * @name Entity#data
   * @type {object}
   * @constant
   */
  this.data = data;

  if(this.data == null) {
    this.data = {};
  }

  /**
   * A function invoked by the game for when the entity should update it's
   * data.
   * 
   * Custom propeties and methods inserted into `data` are binded with this
   * callback.
   * 
   * @name Entity#update
   * @type {CallableFunction}
   * @callback
   * @constant
   */
  this.update = update.bind({...this.data, position: this.position});

  /**
   * A function invoked by the game for when the entity should render it's
   * graphics.
   * 
   * Custom propeties and methods inserted into `data` are binded with this
   * callback.
   * 
   * @name Entity#render
   * @type {CallableFunction}
   * @callback
   * @constant
   */
  this.render = render.bind({...this.data, position: this.position});
}

/**
 * Returns true if an entity is colliding with a target.
 *
 * @name isEntityCollidingWith
 * @function
 * @returns {boolean} If the entity is colliding with the target.
 */
function isEntityCollidingWith(ePos, tPos, tSize) {
  let tTotalX = tPos.x + tSize.x;
  let tTotalY = tPos.y + tSize.y;

  let isInsideXrange = ePos.x > tPos.x && ePos.x < tTotalX;
  let isInsideYrange = ePos.y > tPos.y && ePos.y < tTotalY;

  return isInsideXrange && isInsideYrange;
}

/**
 * The ball entity.
 *
 * @name ballEntity
 * @constant
 */
const ballEntity = new Entity(
  // update
  function(delta) {
    let nextPosition = this.position.add(this.vel);

    // Bouncing the ball whenever the ball hits either left or right sides.
    if (nextPosition.x > BreakoutGame.screen.width - this.radius ||
        nextPosition.x < this.radius) {
      this.vel.x = -this.vel.x;
    }
    // Bouncing the ball whenever the ball hits the up side.
    if (this.position.y + this.vel.y < this.radius) {
      this.vel.y = -this.vel.y;
    }

    const paddle = BreakoutGame.entities[1];
    const paddleSize = new Vector2(paddle.data.width, paddle.data.height);

    // Is the ball colliding with the player paddle?
    if (isEntityCollidingWith(nextPosition, paddle.position, paddleSize)) {
      this.vel.y = -this.vel.y;

      // Generate new bricks for the game if all the bricks were destroyed.
      if(BreakoutGame.entities.length == 2)
        generateBricks();
      
      let paddleCenterX = paddle.position.x + paddleSize.x / 2;

      let difference = this.position.x - paddleCenterX;
      this.vel.x = Math.max(-2, Math.min(difference, 2));
    }

    if (this.position.y + this.vel.y > BreakoutGame.screen.height - this.radius) {
      BreakoutGame.gameOver();
    }
    
    // // Whenever the ball is at the exact Y cord of the paddle or lower.
    // if (this.position.y + this.vel.y > paddle.position.y) {
    //   if (this.position.x > paddle.position.x && this.position.x < paddle.position.x + paddle.data.width) {
    //     this.vel.y = -this.vel.y;

    //     if(BreakoutGame.entities.length == 2) {
    //       generateBricks();
    //     }
        
    //     let paddleXCenter = paddle.position.x + paddle.data.width / 2;
    //     if (this.position.x > paddleXCenter) {
    //       this.vel.x = 2;
    //     } else {
    //       this.vel.x = -2;
    //     }
    //   }
    //   // Stops the game and shows a Game Over screen if the ball hits the bottom side.
    //   if (this.position.y + this.vel.y > BreakoutGame.screen.height - this.radius) {
    //     BreakoutGame.stop();

    //     let gameOverScreen = document.querySelector("#game-over");
    //     BreakoutGame.screen.style.display = "none";
    //     gameOverScreen.style.display = "block";
    //   }
    // }

    this.position.x += this.vel.x;
    this.position.y += this.vel.y;
  },

  // render
  function(ctx) {
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#6930C3";
    ctx.fill();
    ctx.closePath();
  },

  // data
  {
    position: new Vector2(BreakoutGame.screen.width / 2, BreakoutGame.screen.height - 30),
    
    vel: new Vector2(0, -2),
    radius: 10,
  }
);
ballEntity.data.vel.x = Math.random() < 0.5 ? 2 : -2;
BreakoutGame.entities.push(ballEntity);

/**
 * The player paddle entity.
 *
 * @name paddleEntity
 * @constant
 */
const paddleEntity = new Entity(
  // update
  function(delta) {
    this.position.x = BreakoutGame.mousePosition.x - this.width / 2;
    this.position.x = Math.max(0, Math.min(this.position.x, BreakoutGame.screen.width - this.width));
  },

  // render
  function(ctx) {
    ctx.beginPath();
    ctx.rect(this.position.x, this.position.y, this.width, this.height);
    ctx.fillStyle = "#6930C3";
    ctx.fill();
    ctx.closePath();
  },

  // data
  {
    position: new Vector2((BreakoutGame.screen.width - 75) / 2,
                           BreakoutGame.screen.height - 25),
    
    width: 75,
    height: 10,
  }
);
BreakoutGame.entities.push(paddleEntity);

/**
 * Generates a new brick entity.
 *
 * @name Brick
 */
const Brick = function(x, y, width, height, index) {
  return new Entity(
    // update
    function(delta) {
      let ball = BreakoutGame.entities[0];
      let brickSize = new Vector2(this.width, this.height);

      if (isEntityCollidingWith(ball.position, this.position, brickSize)) {
        ball.data.vel.y = -ball.data.vel.y;
        BreakoutGame.entities = BreakoutGame.entities.filter(e => e.data.index !== this.index);
      }
    },

    // render
    function(ctx) {
      ctx.beginPath();
      ctx.rect(this.position.x, this.position.y, this.width, this.height);
      ctx.fillStyle = "#6930C3";
      ctx.fill();
      ctx.closePath();
    },

    // data
    {
      position: new Vector2(x, y),
      width: width,
      height: height,
      index: index
    }
  );
}

/**
 * Generate entities for all the bricks.
 * 
 * @name generateBricks
 * @function
 */
function generateBricks() {
  const rowCount = 3;
  const columnCount = 5;
  const padding = 10;

  const offsetTop = 30;
  const offsetLeft = 30;

  const width = 75;
  const height = 20;

  let i = 0;
  // For each column
  for (let c = 0; c < columnCount; c++) {
    // For each row
    for (let r = 0; r < rowCount; r++) {
      let x = (c * (width + padding)) + offsetLeft;
      let y = (r * (height + padding)) + offsetTop;

      let brick = Brick(x, y, 75, 20, i);
      BreakoutGame.entities.push(brick);
      i++;
    }
  }
}
