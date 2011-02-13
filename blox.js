/*
  Blox
  Author: Wei Yeh
*/

var Blox = {};

Blox.Speeds = { slowest: 550, fastest: 40 };

Blox.Keys = { down: 83, down_alt: 40, left: 65, left_alt: 37, right: 68, right_alt: 39,
  up: 38, rotate: 38, rotate_alt: 87, drop: 32, drop_alt: 32, pause: 80 };

Blox.Commands = { left: 1, down: 2, right: 3, rotate: 4, drop: 5, pause: 6 };

Blox.States = { game_over: -1, paused: 0, new_game: 1, new_block: 2, moving: 3 };

Blox.Game = Class.create({
  
  initialize: function() {
    /* board setup */
    this.container = $("blox");
    this.board = new Blox.Board(this, this.container, 10, 20, 3);
    this.board.setUp();
    
    this.next = new Blox.Board(this, $("next"), 5, 3);
    this.next.setUp();
    
    /* game setup */
    this.state = Blox.States.new_game;
    
    this.moveFastInterval = null;
    this.moveFastTimeout = null;
    this.moveFastDir = null;
    
    this.numTimesEncounteredBlock = 0;
    
    /* stats setup */
    this.scoreContainer = $("score");
    this.linesContainer = $("lines");
    this.levelContainer = $("level");
    
    Event.observe(document, "keydown", this.keyPressed.bind(this));
    Event.observe(document, "keyup", this.stopMoveFast.bind(this));
    
    this.leaderboard = new Blox.Leaderboard();
    
    /* controls setup */
    this.configureControls();
    var flip_controls = $("flip_controls");
    if (flip_controls) {
      flip_controls.observe('click', this.flipControls.bind(this));
    }
    
    /* audio setup */
    this.audio = new Blox.Audio();
  },
  
  /***** Game Operation *****/
  
  start: function() {
    this.state = Blox.States.new_block;
    this.speed = Blox.Speeds.slowest;
    this.activeBlock = null;
    this.nextBlockType = null;
    this.board.clearBoard();
    this.next.clearBoard();
    this.resetStats();
    this.startTick();
  },
  
  startTick: function() {
    this.startTickInterval();
    this.audio.play(Blox.Sounds.bg);
  },
  
  startTickInterval: function() {
    this.tickRun = setInterval(this.tick.bind(this), this.speed);
  },
  
  stopTick: function() {
    this.stopTickInterval();
    this.audio.stop(Blox.Sounds.bg);
  },
  
  stopTickInterval: function() {
    if (this.tickRun) {
      clearInterval(this.tickRun);
      this.tickRun = null;
    }
  },
  
  /** Advances the game. */
  tick: function() {
    if (!this.tickRun) return;
    
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
        }
        break;
      default:
        this.onGameOver();
    }
  },
  
  onNewBlock: function() {
    var x = Math.floor(this.board.width / 2) - 1;
    if (this.nextBlockType) {
      this.activeBlock = new this.nextBlockType(2, x);
    } else {
      this.activeBlock = new (this.randomBlockType())(2, x);
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
  
  keyPressed: function(event) {
    switch (event.keyCode) {
      case Blox.Keys.left:
      case Blox.Keys.left_alt:
        this.move(Blox.Commands.left);
        break;
      case Blox.Keys.right:
      case Blox.Keys.right_alt:
        this.move(Blox.Commands.right);
        break;
      case Blox.Keys.down:
      case Blox.Keys.down_alt:
        this.move(Blox.Commands.down);
        break;
      case Blox.Keys.rotate:
      case Blox.Keys.rotate_alt:
        this.move(Blox.Commands.rotate);
        break;
      case Blox.Keys.drop:
      case Blox.Keys.drop_alt:
        this.move(Blox.Commands.drop);
        break;
      case Blox.Keys.pause:
        this.move(Blox.Commands.pause);
        break;
    }
  },
  
  move: function(command) {
    if (this.state === Blox.States.moving) {
      switch (command) {
        /* Move */
        case Blox.Commands.left:
          event.stop();
          if (this.moveFastDir) return;
          this.activeBlock.moveLeft();
          this.startMoveFast(this.activeBlock.moveLeft);
          break;
        case Blox.Commands.right:
          event.stop();
          if (this.moveFastDir) return;
          this.activeBlock.moveRight();
          this.startMoveFast(this.activeBlock.moveRight);
          break;
        case Blox.Commands.down:
          event.stop();
          if (this.moveFastDir) return;
          this.activeBlock.moveDown();
          this.startMoveFast(this.activeBlock.moveDown);
          break;
        case Blox.Commands.rotate:
          event.stop();
          this.audio.play(Blox.Sounds.rotate);
          this.activeBlock.rotate();
          break;
        case Blox.Commands.drop:
          event.stop();
          this.activeBlock.drop();
          break;
        /* Other game control */
        case Blox.Commands.pause:
          this.container.addClassName("paused");
          this.stopTick();
          this.state = Blox.States.paused;
          break;
      }
    } else if (this.state === Blox.States.paused) {
      switch (command) {
        case Blox.Commands.pause:
          this.container.removeClassName("paused");
          this.startTick();
          this.state = Blox.States.moving;
          break;
      }
    }
  },
  
  /**
   * Sets up a timeout callback to this.moveFast() to move block when key is held down.
   * Clears existing timeout to prevent a block from moving fast in more than one direction.
   */
  startMoveFast: function(moveDir) {
    if (this.moveFastTimeout) {
      clearTimeout(this.moveFastTimeout);
      this.moveFastTimeout = null;
    }
    this.moveFastDir = moveDir;
    this.moveFastTimeout = setTimeout(this.moveFast.bind(this), 100);
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
      case 4:   this.score += 100; break;
      case 3:   this.score += 50; break;
      default:  this.score += numRowsCleared * 10;
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
        speedIncrease = 25;
      } else if (this.speed >= Blox.Speeds.fastest) {
        speedIncrease = 5;
      } else {
        speedIncrease = 0;
      }
      this.speed -= speedIncrease;
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
    
    if (!rotateControl) return;
    
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


/** Board */
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
    this.rows = [];
    var row, col;
    for (var y = 0; y < this.length; y++) {
      row = new Element("tr");
      this.rows[y] = row;
      if (y < this.headerLength) {
        row.hide();
      }
      this.board[y] = [];
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
    this.rowsToClear = [];
    
    /* Determine which rows to clear. */
    for (var y = this.length - 1; y >= 0; y--) {
      if (this.rowClearable(y)) {
        this.rowsToClear[this.rowsToClear.length] = y;
      }
    }
    
    if (this.rowsToClear.length > 0) {
      this.game.stopTickInterval();
      
      this.animateClear();
      
      var sound = this.rowsToClear.length == 4 ? Blox.Sounds.clear_tetris : Blox.Sounds.clear;
      Blox.game.audio.play(sound);
    }
  },
  
  clearRows: function() {
    var numRowsToClear = this.rowsToClear.length;
    
    for (var i = numRowsToClear - 1; i >= 0; i--) {
      this.clearRow(this.rowsToClear[i]);
    }
    
    this.game.updateStats(numRowsToClear);
    
    this.game.startTickInterval();
  },
  
  clearRow: function(rowIndex) {
    var row = this.board[rowIndex];
    var cell, block;

    for (var x = 0; x < this.width; x++) {
      cell = row[x];
      block = cell.block;
      block.unmarkCell(cell);
    }
    
    this.shiftDownFrom(rowIndex - 1);
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
  },
  
  /** Animates the clearing of rows and calls clearRows() upon completion. */
  animateClear: function() {
    this.blinkCount = 4;
    this.blink();
    this.blinkInterval = setInterval(this.blink.bind(this), 100);
  },
  
  blink: function() {
    if (this.blinkCount <= 0) {
      this.blinkCount = 0;
      clearInterval(this.blinkInterval);
      this.blinkInterval = null;
      this.clearRows();
      return;
    }

    var hide = this.blinkCount % 2 == 0;
    var row;
    for (var i = 0; i < this.rowsToClear.length; i++) {
      row = this.rows[this.rowsToClear[i]];
      if (hide) {
        row.addClassName("hidden");
      } else {
        row.removeClassName("hidden");
      } 
    }
    
    this.blinkCount--;
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
    this.dropping = false;
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
    
    this.dropping = true;
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
  
  moveLeft: function () {
    if (this.dropping && this.canMoveLeft()) {
      this.moveTo(this.shiftBy(0, -1));
    }
  },
  
  moveRight: function () {
    if (this.dropping && this.canMoveRight()) {
      this.moveTo(this.shiftBy(0, 1));
    }
  },
  
  drop: function() {
    while (this.canMoveDown()) {
      this.moveTo(this.shiftBy(1, 0));
    }
    this.dropping = false;
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
    $super([{ y: 0, x: 0 }, { y: 0, x: -1 }, { y: 1, x: 0 }, { y: 1, x: -1 }], initY, initX);
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


/** Audio */

Blox.Sounds = { bg: 1, rotate: 2, clear: 3, clear_tetris: 4 };

Blox.Audio = Class.create({
  
  initialize: function() {
    this.bgmusic = null;
    this.soundRotate = $("sound_rotate");
    this.soundClear = $("sound_clear");
    this.soundClearTetris = $("sound_clear_tetris");
    
    this.mute = false;
    $("mute").observe('change', this.toggleMute.bind(this));
  },
  
  play: function(sound) {
    if (this.mute) return;
    
    var sound;
    switch (sound) {
      case Blox.Sounds.bg: sound = this.bgmusic; break;
      case Blox.Sounds.rotate: sound = this.soundRotate; break;
      case Blox.Sounds.clear: sound = this.soundClear; break;
      case Blox.Sounds.clear_tetris: sound = this.soundClearTetris; break;
    }
    
    if (sound && sound.Play !== undefined) {
      sound.Play();
    }
  },
  
  stop: function(sound) {
    var sound;
    switch (sound) {
      case Blox.Sounds.bg: sound = this.bgmusic; break;
    }
    
    if (sound && sound.Play !== undefined) {
      sound.Stop();
    }
  },
  
  toggleMute: function() {
    this.mute = !this.mute;
    if (this.mute) {
      this.stop(Blox.Sounds.bg);
    } else if (Blox.game.state >= Blox.States.new_block) {
      this.play(Blox.Sounds.bg);
    }
  }
  
});


/** Leaderboard */
Blox.Leaderboard = Class.create({
  
  initialize: function() {
    this.container = $('leaderboard');
    this.lowestScore = 4000000000;
    this.findLowestScore();
  },
  
  record: function(name, score, level) {
    if (!(this.container && name)) return;
    
    new Ajax.Updater('leaderboard', 'leaderboard.php', {
      parameters: { 'name': name, 'score': score, 'level': level, 'cert': this.cert },
      onComplete: this.findLowestScore.bind(this)
    });
  },
  
  findLowestScore: function() {
    if (!this.container) return;
    
    this.lowestScore = Math.min(this.lowestScore,
      this.container.select("td.score").min(function(score) {
        return parseInt(score.innerHTML);
      }));
    this.lowestScore = this.lowestScore || 0;
    
    this.cert = $('cert').innerHTML;
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
