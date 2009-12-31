/*
  Blox
  Author: Wei Yeh
*/

var Blox = {};

Blox.Speeds = { slowest: 600, medium: 460, fast: 50, fastest: 30 };

Blox.Keys = { down: 83, down_alt: 40, left: 65, left_alt: 37, right: 68, right_alt: 39,
  up: 38, rotate: 38, rotate_alt: 87, drop: 32, drop_alt: 32, pause: 80 };

Blox.States = { game_over: -1, paused: 0, new_game: 1, new_block: 2, moving: 3 };

Blox.Dir = { left: 1, down: 2, right: 3 };

Blox.Game = Class.create({
  
  initialize: function() {
    /* board setup */
    this.container = $("blox");
    this.board = new Blox.Board(this, this.container, 10, 20, 2);
    this.board.setUp();
    
    this.next = new Blox.Board(this, $("next"), 5, 3);
    this.next.setUp();
    
    /* game setup */
    this.speed = Blox.Speeds.slowest;
    this.state = Blox.States.new_game;
    
    this.moveFastInterval = null;
    this.moveFastTimeout = null;
    this.moveFastDir = null;
    
    this.numTimesEncounteredBlock = 0;
    
    /* stats setup */
    this.scoreContainer = $("score");
    this.linesContainer = $("lines");
    this.levelContainer = $("level");
    
    Event.observe(document, "keydown", this.move.bind(this));
    Event.observe(document, "keyup", this.stopMoveFast.bind(this));
    
    this.leaderboard = new Blox.Leaderboard();
    
    /* controls setup */
    this.configureControls();
    $("flip_controls").observe('click', this.flipControls.bind(this));
    
    /* sounds setup */
    //this.music = $("music");
    //this.soundClear = $("sound_clear");
  },
  
  /***** Game Operation *****/
  
  start: function() {
    this.state = Blox.States.new_block;
    this.activeBlock = null;
    this.nextBlockType = null;
    this.board.clearBoard();
    this.next.clearBoard();
    this.resetStats();
    this.startTick();
  },
  
  startTick: function() {
    this.tickRun = setInterval(this.tick.bind(this), this.speed);
    //this.music.Play();
  },
  
  stopTick: function() {
    clearInterval(this.tickRun);
    this.tickRun = null;
    //this.music.Stop();
  },
  
  /** Advances the game. */
  tick: function() {
    while (true) {
      switch (this.state) {
        case Blox.States.new_block:
          this.onNewBlock();
          break;
        case Blox.States.moving:
          if (this.activeBlock.canMoveDown()) {
            this.activeBlock.moveDown();
          } else {
            this.board.clear();
            this.state = Blox.States.new_block;
            continue;
          }
          break;
        default:
          this.onGameOver();
      }
      
      break;  // break while
    }
  },
  
  onNewBlock: function() {
    var x = Math.floor(this.board.width / 2) - 1;
    if (this.nextBlockType) {
      this.activeBlock = new this.nextBlockType(1, x);
    } else {
      this.activeBlock = new (this.randomBlockType())(1, x);
    }
    this.generateNextBlock();
    if (this.board.canFitBlock(this.activeBlock)) {
      this.activeBlock.setUp(this.board);
      this.state = Blox.States.moving;
    } else {
      this.state = Blox.States.game_over;
    }
  },
  
  onGameOver: function() {
    this.state = Blox.States.game_over;
    
    if (this.score >= this.leaderboard.lowestScore) {
      var name = prompt("Congratulations on your high score! What's your name?");
      this.leaderboard.record(name, this.score, this.level);
    } else {
      alert("Game Over!");
    }
    
    this.stopTick();
    Blox.startButton.enable();
  },
  
  move: function(event) {
    if (this.state === Blox.States.moving) {
      switch (event.keyCode) {
        /* Move */
        case Blox.Keys.left:
        case Blox.Keys.left_alt:
          if (this.moveFastDir) return;
          this.activeBlock.moveLeft();
          this.startMoveFast(this.activeBlock.moveLeft);
          break;
        case Blox.Keys.right:
        case Blox.Keys.right_alt:
          if (this.moveFastDir) return;
          this.activeBlock.moveRight();
          this.startMoveFast(this.activeBlock.moveRight);
          break;
        case Blox.Keys.down:
        case Blox.Keys.down_alt:
          if (this.moveFastDir) return;
          this.activeBlock.moveDown();
          this.startMoveFast(this.activeBlock.moveDown);
          break;
        case Blox.Keys.rotate:
        case Blox.Keys.rotate_alt:
          this.activeBlock.rotate();
          break;
        case Blox.Keys.drop:
        case Blox.Keys.drop_alt:
          this.activeBlock.drop();
          break;
        /* Other game control */
        case Blox.Keys.pause:
          this.container.addClassName("paused");
          this.stopTick();
          this.state = Blox.States.paused;
          break;
      }
    } else if (this.state === Blox.States.paused) {
      switch (event.keyCode) {
        case Blox.Keys.pause:
          this.container.removeClassName("paused");
          this.startTick();
          this.state = Blox.States.moving;
          break;
      }
    }
  },
  
  /**
   * Sets up a timeout callback to this.moveFast() to move block when keyis held down.
   * Clears existing timeout to prevent a block from moving fast in more than one direction.
   */
  startMoveFast: function(moveDir) {
    if (this.moveFastTimeout) {
      clearTimeout(this.moveFastTimeout);
      this.moveFastTimeout = null;
    }
    this.moveFastDir = moveDir;
    this.moveFastTimeout = setTimeout(this.moveFast.bind(this), 400);
  },
  
  /**
   * Repeatedly calls the method to move fast in a given direction, if necessary.
   */
  moveFast: function() {
    if (this.moveFastDir) {
      this.moveFastInterval = setInterval(this.moveFastDir.bind(this.activeBlock), 30);
    }
  },
  
  stopMoveFast: function() {
    clearInterval(this.moveFastInterval);
    this.moveFastInterval = null;
    this.moveFastDir = null;
  },
  
  generateNextBlock: function() {
    var previousBlock = this.nextBlockType;
    this.nextBlockType = this.randomBlockType();
    
    if (previousBlock && (previousBlock.cellClass === this.nextBlockType.cellClass)) {
      this.numTimesEncounteredBlock++;
    } else {
      this.numTimesEncounteredBlock = 0;
    }
    
    if (this.numTimesEncounteredBlock >= 2) {
      if (Math.random() > 0.2) {
        this.generateNextBlock();
      }
    }
    
    this.displayNext();
  },
  
  randomBlockType: function() {
    return Blox.BlockTypes[Math.round(Math.random() * (Blox.BlockTypes.length - 1))];
  },
  
  displayNext: function() {
    this.next.clearBoard();
    var block = new this.nextBlockType(0, Math.ceil(this.next.width / 2) - 1);
    block.setUp(this.next);
  },
  
  /** Called whenever a row is cleared to update game stats. */
  updateStats: function(numRowsCleared) {
    if (numRowsCleared === 0) return;
    
    switch (numRowsCleared) {
      case 4:   this.score += 10; break;
      case 3:   this.score += 5; break;
      default:  this.score += numRowsCleared;
    }
    this.scoreContainer.innerHTML = this.score;
    
    var oldLines = this.lines;
    this.lines += numRowsCleared;
    this.linesContainer.innerHTML = this.lines;
    
    if ((this.lines % 10) < (oldLines % 10)) {
      this.level++;
      this.levelContainer.innerHTML = this.level;
      
      /* increase speed */
      var speedIncrease;
      if (this.speed > 200) {
        speedIncrease = 20;
      } else if (this.speed >= Blox.Speeds.fastest) {
        speedIncrease = 5;
      } else {
        speedIncrease = 0;
      }
      this.speed -= speedIncrease;
      
      this.stopTick();
      this.startTick();
    }
  },
  
  resetStats: function() {
    this.score = 0;
    this.scoreContainer.innerHTML = this.score;
    this.lines = 0;
    this.linesContainer.innerHTML = this.lines;
    this.level = 0;
    this.levelContainer.innerHTML = this.level;
  },
  
  /** Loads default controls from cookie. */
  configureControls: function() {
    var rotateButton = readCookie("blox_controls");
    if (!rotateButton) {
      return;
    }
    rotateButton = parseInt(rotateButton);
    if (rotateButton != Blox.Keys.up) {
      this.flipControls();
    }
  },
  
  flipControls: function() {
    var rotateControl = $$("#controls strong")[0];
    var dropControl = $$("#controls strong")[1];
    
    var rotateControlText = rotateControl.innerHTML;
    rotateControl.innerHTML = dropControl.innerHTML;
    dropControl.innerHTML = rotateControlText;
    
    if (Blox.Keys.rotate === Blox.Keys.up) {   // up arrow
      Blox.Keys.rotate = 32;
      Blox.Keys.rotate_alt = 32;
      Blox.Keys.drop = 38;
      Blox.Keys.drop_alt = 87;
    } else {
      Blox.Keys.rotate = 38;
      Blox.Keys.rotate_alt = 87;
      Blox.Keys.drop = 32;
      Blox.Keys.drop_alt = 32;
    }
    
    writeCookie("blox_controls", Blox.Keys.rotate);
  }

});

Blox.Board = Class.create({
  
  initialize: function(game, container, width, length, headerLength) {
    this.game = game;
    this.container = container;
    this.width = width;
    this.headerLength = headerLength === undefined ? 0 : headerLength;
    this.length = length + this.headerLength;
  },
  
  setUp: function() {
    this.board = [];
    var row, col;
    for (var y = 0; y < this.length; y++) {
      row = new Element("tr");
      if (y < this.headerLength) {
        row.hide();
      }
      this.board[y] = new Array();
      for (var x = 0; x < this.width; x++) {
        col = new Element("td");
        row.appendChild(col);
        this.board[y][x] = new Blox.Cell(y, x, col);
      }
      this.container.appendChild(row);
    }
  },
  
  clearBoard: function() {
    var row;
    for (var y = 0; y < this.length; y++) {
      row = this.board[y];
      for (var x = 0; x < this.width; x++) {
        row[x].unmark();
      }
    }
  },
  
  /**
   * Is it possible to fit a block with the given cell positions?
   */
  canFitBlock: function(block) {
    var positions = block.positions;
    var pos;
    for (var i = 0; i < positions.length; i++) {
      pos = positions[i];
      if (!this.canMarkCell(block.centerY + pos.y, block.centerX + pos.x)) {
        return false;
      }
    }
    return true;
  },
  
  /** Is it possible to mark the cell at the given coordinates? */
  canMarkCell: function(y, x) {
    if (!this.isValidCell(y, x)) {
      return false;
    }
    var cell = this.board[y][x];
    return !cell.isOccupied();
  },
  
  isValidCell: function(y, x) {
    return (y < this.length) && (x < this.width) && (y >= 0) && (x >= 0);
  },
  
  /***** Clearing *****/
  
  /** Clears as many rows as possible. */
  clear: function() {
    var numRowsCleared = 0;
    /* Determine which rows to clear. */
    for (var y = this.length - 1; y >= 0;) {
      if (this.rowClearable(y)) {
        this.clearRow(y);
        this.shiftDownFrom(y - 1);
        numRowsCleared++;
      } else {
        y--;
      }
    }
    
    this.game.updateStats(numRowsCleared);
  },
  
  clearRow: function(rowIndex) {
    var row = this.board[rowIndex];
    var cell, block;

    for (var x = 0; x < this.width; x++) {
      cell = row[x];
      block = cell.block;
      block.unmarkCell(cell);
    }
  },
  
  /** Shifts rows down starting from the row at the given index. */
  shiftDownFrom: function(rowIndex) {
    for (var y = rowIndex; y >= 0; y--) {
      this.shiftDown(y);
    }
  },
  
  /** Shifts down each unit on the row at the given row index. */
  shiftDown: function(rowIndex) {
    var row = this.board[rowIndex];
    var cell, block;
    for (var x = 0; x < this.width; x++) {
      cell = row[x];
      if (cell.isOccupied() && this.canMarkCell(cell.y + 1, cell.x)) {
        block = cell.block;
        block.moveDownUnit(cell);
      }
    }
  },
  
  /**
   * Returns true if the row at the given row index is clearable.
   * That is, all columns are occupied.
   */
  rowClearable: function(rowIndex) {
    var row = this.board[rowIndex];
    for (var x = 0; x < this.width; x++) {
      if (!row[x].isOccupied()) {
        return false;
      }
    }
    return true;
  },
  
  /** Returns true if the row at the given row index is empty. */
  rowEmpty: function(rowIndex) {
    var row = this.board[rowIndex];
    for (var x = 0; x < this.width; x++) {
      if (row[x].isOccupied()) {
        return false;
      }
    }
    return true;
  }

});

Blox.Cell = Class.create({
  
  initialize: function(y, x, tableCell) {
    this.y = y;
    this.x = x;
    this.tableCell = tableCell;
    this.block = null;
  },
  
  mark: function(block) {
    this.block = block;
    this.tableCell.className = block.cellClass;
  },
  
  unmark: function() {
    this.block = null;
    this.tableCell.className = "";
  },
  
  isOccupied: function() {
    return this.block != null;
  }
  
});

/** Blocks */
Blox.Block = Class.create({
  
  initialize: function(positions, initY, initX) {
    this.cells = [];
    this.positions = positions;
    this.centerY = initY;
    this.centerX = initX;
    this.clockwise = true;
  },
  
  /** Positions this Block on the given board. */
  setUp: function(board) {
    this.cells = [];
    var pos, cell;
    for (var i = 0; i < this.positions.length; i++) {
      pos = this.positions[i];
      cell = board.board[this.centerY + pos.y][this.centerX + pos.x];
      this.cells[this.cells.length] = this.markCell(cell);
    }
  },
  
  /** 
   * Marks the given cell at the given coordinates. Must first confirm canMarkCell(). 
   */
  markCell: function(cell) {
    cell.mark(this);
    return cell;
  },
  
  /** Unmarks the given cell. */
  unmarkCell: function(cell) {
    cell.unmark(this);
    this.cells.splice(this.indexOfCell(cell), 1);
  },
  
  /***** Moving *****/
  
  /** Moves in the direction implied by the method name. */
  moveDown: function () { if (this.canMoveDown()) this.moveTo(this.shiftBy(1, 0)); },
  moveLeft: function () { if (this.canMoveLeft()) this.moveTo(this.shiftBy(0, -1)); },
  moveRight: function () { if (this.canMoveRight()) this.moveTo(this.shiftBy(0, 1)); },
  
  drop: function() {
    while (this.canMoveDown()) {
      this.moveTo(this.shiftBy(1, 0));
    }
  },
  
  /**
   * Moves a single cell down.
   * In other words, unmark the current cell and mark the cell directly underneath.
   * Pre-condition: Can move down this unit.
   */
  moveDownUnit: function (cell) {  
    this.unmarkCell(cell);
    var newCell = Blox.game.board.board[cell.y + 1][cell.x];
    this.cells[this.cells.length] = this.markCell(newCell);
  },

  canMoveDown: function () { return this.canMoveTo(this.shiftBy(1, 0)); },
  canMoveLeft: function () { return this.canMoveTo(this.shiftBy(0, -1)); },
  canMoveRight: function () { return this.canMoveTo(this.shiftBy(0, 1)); },
  
  /** Returns a list of new positions resulting from shifting current cells. */
  shiftBy: function(shiftY, shiftX) {
    var newPositions = [];
    for (var i = 0; i < this.cells.length; i++) {
      newPositions[newPositions.length] = {
        y: this.cells[i].y + shiftY,
        x: this.cells[i].x + shiftX
      };
    }
    return newPositions;
  },
  
  moveTo: function(newPositions) {
    /* unmark old cells */
    for (var i = 0; i < this.cells.length; i++) {
      this.cells[i].unmark();
    }
    
    /* move cells to new positions */
    var newPos, cell;
    for (var i = 0; i < this.cells.length; i++) {
      newPos = newPositions[i];
      cell = Blox.game.board.board[newPos.y][newPos.x];
      this.cells[i] = this.markCell(cell);
    }
  },
  
  canMoveTo: function(newPositions) {
    var newPos;
    var newY, newX;
    for (var i = 0; i < this.cells.length; i++) {
      newPos = newPositions[i];
      newY = newPos.y;
      newX = newPos.x;
      if (!Blox.game.board.isValidCell(newY, newX) || 
          (!Blox.game.board.canMarkCell(newY, newX) && !this.contains(Blox.game.board.board[newY][newX]))) {
        return false;
      }
    }
    return true;
  },
  
  /***** Utility *****/
  
  contains: function(cell) {
    return this.indexOfCell(cell) != -1;
  },
  
  indexOfCell: function(cell) {
    var pos, index;
    for (var i = 0; i < this.cells.length; i++) {
      pos = this.cells[i];
      if ((pos.y === cell.y) && (pos.x === cell.x)) {
        return i;
      }
    }
    return -1;
  },
  
  /***** Rotation *****/
  
  rotate: function() {
    var newPositions = [];
    var pos;
    for (var i = 0; i < this.positions.length; i++) {
      pos = this.positions[i];
      if (this.clockwise) {
        this.positions[i] = { y:  pos.x, x: -pos.y }
      } else {
        this.positions[i] = { y: -pos.x, x:  pos.y }
      }
      newPositions[newPositions.length] = { 
        y: this.cells[0].y + this.positions[i].y, 
        x: this.cells[0].x + this.positions[i].x
      }
    }

    if (this.canMoveTo(newPositions)) {
      this.moveTo(newPositions);
    }
  }
  
});

Blox.O = Class.create(Blox.Block, {
  
  initialize: function($super, initY, initX) {
    this.cellClass = "block_o";
    $super([{ y: 0, x: 0 }, { y: 0, x: 1 }, { y: 1, x: 0 }, { y: 1, x: 1 }], initY, initX);
  },
  
  rotate: function() {}
  
});

Blox.I = Class.create(Blox.Block, {
  
  initialize: function($super, initY, initX) {
    this.cellClass = "block_i";
    $super([{ y: 0, x: 0 }, { y: 0, x: -2 }, { y: 0, x: -1 }, { y: 0, x: 1 }], initY, initX);
  },
  
  rotate: function($super) {
    $super();
    this.clockwise = !this.clockwise;
  }
  
});

Blox.S = Class.create(Blox.Block, {
  
  initialize: function($super, initY, initX) {
    this.cellClass = "block_s";
    $super([{ y: 0, x: 0 }, { y: 1, x: -1 }, { y: 1, x: 0 }, { y: 0, x: 1 }], initY, initX);
  },
  
  rotate: function($super) {
    $super();
    this.clockwise = !this.clockwise;
  }
  
});

Blox.Z = Class.create(Blox.Block, {
  
  initialize: function($super, initY, initX) {
    this.cellClass = "block_z";
    $super([{ y: 0, x: 0 }, { y: 0, x: -1 }, { y: 1, x: 0 }, { y: 1, x: 1 }], initY, initX);
  },
  
  rotate: function($super) {
    $super();
    this.clockwise = !this.clockwise;
  }
  
});

Blox.T = Class.create(Blox.Block, {
  
  initialize: function($super, initY, initX) {
    this.cellClass = "block_t";
    $super([{ y: 0, x: 0 }, { y: 0, x: -1 }, { y: 0, x: 1 }, { y: 1, x: 0 }], initY, initX);
  }
  
});

Blox.J = Class.create(Blox.Block, {
  
  initialize: function($super, initY, initX) {
    this.cellClass = "block_j";
    $super([{ y: 0, x: 0 }, { y: 0, x: -1 }, { y: 0, x: 1 }, { y: 1, x: 1 }], initY, initX);
  }
  
});

Blox.L = Class.create(Blox.Block, {
  
  initialize: function($super, initY, initX) {
    this.cellClass = "block_l";
    $super([{ y: 0, x: 0 }, { y: 0, x: 1 }, { y: 0, x: -1 }, { y: 1, x: -1 }], initY, initX);
  }

});

Blox.BlockTypes = [Blox.O, Blox.I, Blox.S, Blox.Z, Blox.T, Blox.J, Blox.L];

/** Leaderboard */
Blox.Leaderboard = Class.create({
  
  initialize: function() {
    this.container = $('leaderboard');
    this.lowestScore = 4000000000;
    this.findLowestScore();
  },
  
  record: function(name, score, level) {
    if (!name) return;
    
    new Ajax.Updater('leaderboard', 'leaderboard.php', {
      parameters: { 'name': name, 'score': score, 'level': level },
      onComplete: this.findLowestScore.bind(this)
    });
  },
  
  findLowestScore: function() {
    this.lowestScore = Math.min(this.lowestScore,
      this.container.select("td.score").min(function(score) {
        return parseInt(score.innerHTML);
      }) || this.lowestScore);
  }
  
});

/***** Utility Functions *****/

function assert(condition, msg) {
  if (!condition) {
    alert("Assertion failed!: " + msg);
    throw new Error(msg);
  }
}

function writeCookie(name, value) {
  var expires = "; expires=" + (new Date(2030, 0, 3)).toGMTString();
  document.cookie = name + "=" + value + expires + "; path=/";
}

function readCookie(name) {
  var cookies = document.cookie.split(";");
  var cookie;
  for (var i = 0; i < cookies.length; i++) {
    cookie = cookies[i].strip().split("=");
    if (cookie[0] == name) {
      return cookie[1];
    }
  }
  return null;
}

/***** Main *****/

document.observe("dom:loaded", function() {
  Blox.game = new Blox.Game();
  
  Blox.startButton = $("start_button");
  Blox.startButton.observe("click", function () {
    Blox.startButton.disable();
    Blox.game.start();
  });
});
