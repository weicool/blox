/*
  JSTetris
  Author: Wei Yeh
*/

var Tetris = {};

Tetris.Speeds = { slow: 600, medium: 460, fast: 50 };

Tetris.Keys = { down: 83, down_alt: 40, left: 65, left_alt: 37, right: 68, right_alt: 39, rotate: 32, pause: 80 };

Tetris.States = { game_over: -1, paused: 0, new_game: 1, new_block: 2, moving: 3 };

Tetris.BlockPointingDir = { horizontal: 0, vertical: 1, north: 2, south: 3, east: 4, west: 5 };

Tetris.Dir = { left: 1, down: 2, right: 3 };

Tetris.Game = Class.create({
  
  initialize: function() {
    /* board setup */
    this.boardContainer = $("tetris");
    this.boardWidth = 10;
    this.boardLength = 20;
    this.setUpBoard();
    
    /* game setup */
    this.speed = Tetris.Speeds.fast;
    this.state = Tetris.States.new_game;
    
    this.moveFastInterval = null;
    this.moveFastTimeout = null;
    this.moveFastDir = null;
    this.canAutoMoveFast = navigator.userAgent.match(/WebKit/);
    
    /* stats setup */
    this.scoreContainer = $("score");
    this.levelContainer = $$("#level span")[0];
    
    Event.observe(document, "keydown", this.move.bind(this));
    Event.observe(document, "keyup", function () {
      this.stopMoveFast();
    }.bind(this));
    
    /* sounds setup */
    //this.music = $("music");
    //this.soundClear = $("sound_clear");
  },
  
  /***** Game Operation *****/
  
  start: function() {
    this.state = Tetris.States.new_block;
    this.clearBoard();
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
  
  /**
   * Sets up a timeout callback to this.moveFast() for browsers
   * that don't automatically fire keydown events when a key is held down.
   * Clears existing timeout to prevent a block 
   * from moving fast in more than one direction.
   */
  startMoveFast: function(moveDir) {
    if (!this.canAutoMoveFast) {
      if (this.moveFastTimeout) {
        clearTimeout(this.moveFastTimeout);
        this.moveFastTimeout = null;
      }
      this.moveFastDir = moveDir;
      this.moveFastTimeout = setTimeout(this.moveFast.bind(this), 500);
    }
  },
  
  /**
   * Repeatedly calls the method to move fast in a given direction, if it exists.
   */
  moveFast: function() {
    if (this.moveFastDir != null) {
      this.moveFastInterval = setInterval(this.moveFastDir.bind(this.activeBlock), 40);
    }
  },
  
  stopMoveFast: function() {
    clearInterval(this.moveFastInterval);
    this.moveFastInterval = null;
    this.moveFastDir = null;
  },
  
  /** Advances the game. */
  tick: function() {
    while (true) {
      switch (this.state) {
        
        case Tetris.States.new_block:
          var block = this.newBlock();
          if (this.canFitBlock(block.cells)) {
            this.activeBlock = block;
            this.activeBlock.setUp();
            this.state = Tetris.States.moving;
          } else {
            this.activeBlock = null;
            this.state = Tetris.States.game_over;
          }
          break;
        
        case Tetris.States.moving:
          if (this.activeBlock.canMoveDown()) {
            this.activeBlock.moveDown();
          } else {
            this.clear();
            this.state = Tetris.States.new_block;
            continue;
          }
          break;
        
        default:
          this.state = Tetris.States.game_over;
          alert("Game Over!");
          this.stopTick();
          Tetris.startButton.enable();
      }
      
      break;  // break while
    }
    
  },
  
  move: function(event) {
    if (this.state == Tetris.States.moving) {
      switch (event.keyCode) {
        /* Move */
        case Tetris.Keys.left:
        case Tetris.Keys.left_alt:
          this.activeBlock.moveLeft();
          this.startMoveFast(this.activeBlock.moveLeft);
          break;
        case Tetris.Keys.right:
        case Tetris.Keys.right_alt:
          this.activeBlock.moveRight();
          this.startMoveFast(this.activeBlock.moveRight);
          break;
        case Tetris.Keys.down:
        case Tetris.Keys.down_alt:
          this.activeBlock.moveDown();
          this.startMoveFast(this.activeBlock.moveDown);
          break;
        case Tetris.Keys.rotate:
          this.activeBlock.rotate();
          break;
        /* Other game control */
        case Tetris.Keys.pause:
          this.stopTick();
          this.state = Tetris.States.paused;
          break;
        default:
          ;
      }
    } else if (this.state == Tetris.States.paused) {
      switch (event.keyCode) {
        case Tetris.Keys.pause:
          this.startTick();
          this.state = Tetris.States.moving;
          break;
        default:
          ;
      }
    }
  },
  
  setUpBoard: function() {
    this.board = new Array();
    var row, col;
    for (var y = 0; y < this.boardLength; y++) {
      row = new Element("tr");
      this.board[y] = new Array();
      for (var x = 0; x < this.boardWidth; x++) {
        col = new Element("td");
        row.appendChild(col);
        this.board[y][x] = new Tetris.Cell(y, x, col);
      }
      this.boardContainer.appendChild(row);
    }
  },
  
  clearBoard: function() {
    var row;
    for (var y = 0; y < this.boardLength; y++) {
      row = this.board[y];
      for (var x = 0; x < this.boardWidth; x++) {
        row[x].unmark();
      }
    }
  },
  
  /**
   * Generates a new, random block.
   */
  newBlock: function() {
    var y = 0;
    var x = Math.floor(this.boardWidth / 2) - 1;
    var i = Math.round(Math.random() * (Tetris.BlockTypes.length - 1));
    var block = new Tetris.BlockTypes[i](y, x);
    return block;
  },
  
  /**
   * Is it possible to fit a block with the given cell positions?
   */
  canFitBlock: function(positions) {
    var pos;
    for (var i = 0; i < positions.length; i++) {
      pos = positions[i];
      if (!this.canMarkCell(pos.y, pos.x)) {
        return false;
      }
    }
    return true;
  },
  
  /** 
   * Is it possible to mark the cell at the given coordinates? 
   */
  canMarkCell: function(y, x) {
    if (!this.isValidCell(y, x)) {
      return false;
    }
    var cell = this.board[y][x];
    return !cell.isOccupied();
  },
  
  isValidCell: function(y, x) {
    return (y < this.boardLength) && (x < this.boardWidth) &&
           (y >= 0) && (x >= 0);
  },
  
  /***** Clearing *****/
  
  /**
   * Clears as many rows as possible.
   */
  clear: function() {
    /* Determine which rows to clear. */
    for (var y = this.boardLength - 1; y >= 0;) {
      if (this.rowClearable(y)) {
        this.clearRow(y);
        this.shiftDownFrom(y - 1);
      } else {
        y--;
      }
    }
  },
  
  clearRow: function(rowIndex) {
    var row = this.board[rowIndex];
    var cell, block;
    
    // assert(this.rowClearable(rowIndex), "Row " + rowIndex + " not clearable.");  // DEBUGGING

    for (var x = 0; x < this.boardWidth; x++) {
      cell = row[x];
      block = cell.block;
      block.unmarkCell(cell);
    }
    
    //this.soundClear.Play();
    this.updateStats();
  },
  
  /**
   * Called whenever a row is cleared to update game stats.
   */
  updateStats: function() {
    this.score++;
    this.scoreContainer.innerHTML = this.score;
    if ((this.score % 10) == 0) {
      this.level++;
      
      /* increase speed */
      var speedIncrease = 0;
      if (this.speed > 200) {
        speedIncrease = 20;
      } else if (this.speed > 100) {
        speedIncrease = 4;
      } else if (this.speed > 5) {
        speedIncrease = 2;
      }
      this.speed -= speedIncrease;
      
      this.stopTick();
      this.startTick();
      this.levelContainer.innerHTML = this.level;
    }
  },
  
  resetStats: function() {
    this.score = 0;
    this.scoreContainer.innerHTML = this.score;
    this.level = 0;
    this.levelContainer.innerHTML = this.level;
  },
  
  /**
   * Shifts rows down starting from the row at the given index.
   */
  shiftDownFrom: function(rowIndex) {
    for (var y = rowIndex; y >= 0; y--) {
      this.shiftDown(y);
    }
  },
  
  /**
   * Shifts down each unit on the row at the given row index.
   */
  shiftDown: function(rowIndex) {
    var row = this.board[rowIndex];
    var cell, block;
    for (var x = 0; x < this.boardWidth; x++) {
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
    for (var x = 0; x < this.boardWidth; x++) {
      if (!row[x].isOccupied()) {
        return false;
      }
    }
    return true;
  },
  
  /**
   * Returns true if the row at the given row index is empty.
   */
  rowEmpty: function(rowIndex) {
    var row = this.board[rowIndex];
    for (var x = 0; x < this.boardWidth; x++) {
      if (row[x].isOccupied()) {
        return false;
      }
    }
    return true;
  }
  
});

Tetris.Cell = Class.create({
  
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
Tetris.Block = Class.create({
  
  initialize: function(positions) {
    this.cells = positions;
  },
  
  /**
   * Positions this Block on the board.
   */
  setUp: function() {
    var positions = this.cells;
    this.cells = [];
    var pos;
    for (var i = 0; i < positions.length; i++) {
      pos = positions[i];
      this.cells[this.cells.length] = this.markCell(Tetris.game.board[pos.y][pos.x]);
    }
  },
  
  /** 
   * Marks the given cell at the given coordinates. 
   * Must first confirm canMarkCell(). 
   */
  markCell: function(cell) {
    // assert(Tetris.game.canMarkCell(cell.y, cell.x), "Cell at Y: " + cell.y + ", X: " + cell.x + " cannot be marked!");

    cell.mark(this);
    return cell;
  },
  
  /** 
   * Unmarks the given cell. 
   */
  unmarkCell: function(cell) {
    cell.unmark(this);
    this.cells.splice(this.indexOfCell(cell), 1);
  },
  
  /***** Moving *****/
  
  /** 
   * Moves in the direction implied by the method name. 
   * Must first confirm canMove{DIR}(). 
   */
  moveDown: function () { if (this.canMoveDown()) this.moveTo(this.shiftBy(1, 0)); },
  moveLeft: function () { if (this.canMoveLeft()) this.moveTo(this.shiftBy(0, -1)); },
  moveRight: function () { if (this.canMoveRight()) this.moveTo(this.shiftBy(0, 1)); },
  
  /**
   * Moves a single cell down.
   * In other words, unmark the current cell and mark the cell directly underneath.
   * Pre-condition: Can move down this unit.
   */
  moveDownUnit: function (cell) {  
    this.unmarkCell(cell);
    var newCell = Tetris.game.board[cell.y + 1][cell.x];
    this.cells[this.cells.length] = this.markCell(newCell);
  },

  canMoveDown: function () { return this.canMoveTo(this.shiftBy(1, 0)); },
  canMoveLeft: function () { return this.canMoveTo(this.shiftBy(0, -1)); },
  canMoveRight: function () { return this.canMoveTo(this.shiftBy(0, 1)); },
  
  /**
   * Returns a list of new positions resulting from shifting current cells.
   */
  shiftBy: function (shiftY, shiftX) {
    var newPositions = [];
    for (var i = 0; i < this.cells.length; i++) {
      newPositions[newPositions.length] = {
        "y": this.cells[i].y + shiftY,
        "x": this.cells[i].x + shiftX
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
      cell = Tetris.game.board[newPos.y][newPos.x];
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
      if (!Tetris.game.isValidCell(newY, newX) || 
          (!Tetris.game.canMarkCell(newY, newX) && !this.contains(Tetris.game.board[newY][newX]))) {
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
      if ((pos.y == cell.y) && (pos.x == cell.x)) {
        return i;
      }
    }
    return -1;
  },
  
  /***** Rotation *****/
  
  rotate: function() {}
  
});

Tetris.O = Class.create(Tetris.Block, {
  
  initialize: function($super, y, x) {
    this.cellClass = "block_o";
    $super([
      { "y": y, "x": x },
      { "y": y, "x": x + 1 },
      { "y": y + 1, "x": x },
      { "y": y + 1, "x": x + 1 }
    ]);
  }
  
});

Tetris.I = Class.create(Tetris.Block, {
  
  initialize: function($super, y, x) {
    this.cellClass = "block_i";
    this.state = Tetris.BlockPointingDir.horizontal;
    $super([
      { "y": y, "x": x - 2 },
      { "y": y, "x": x - 1 },
      { "y": y, "x": x },
      { "y": y, "x": x + 1 }
    ]);
  },
  
  rotate: function() {
    var newPositions, newState;
    if (this.state == Tetris.BlockPointingDir.vertical) {
      newPositions = [
        { "y": this.cells[0].y + 2, "x": this.cells[0].x - 2 },
        { "y": this.cells[1].y + 1, "x": this.cells[1].x - 1 },
        { "y": this.cells[2].y, "x": this.cells[2].x },
        { "y": this.cells[3].y - 1, "x": this.cells[3].x + 1 }
      ];
      newState = Tetris.BlockPointingDir.horizontal;
    } else {
      newPositions = [
        { "y": this.cells[0].y - 2, "x": this.cells[0].x + 2 },
        { "y": this.cells[1].y - 1, "x": this.cells[1].x + 1 },
        { "y": this.cells[2].y, "x": this.cells[2].x },
        { "y": this.cells[3].y + 1, "x": this.cells[3].x - 1 }
      ];
      newState = Tetris.BlockPointingDir.vertical;
    }
    
    if (this.canMoveTo(newPositions)) {
      this.moveTo(newPositions);
      this.state = newState;
    }
  }
  
});

Tetris.S = Class.create(Tetris.Block, {
  
  initialize: function($super, y, x) {
    this.cellClass = "block_s";
    this.state = Tetris.BlockPointingDir.horizontal;
    $super([
      { "y": y + 1, "x": x - 1 },
      { "y": y, "x": x },
      { "y": y + 1, "x": x },
      { "y": y, "x": x + 1 }
    ]);
  },
  
  rotate: function() {
    var newPositions, newState;
    if (this.state == Tetris.BlockPointingDir.vertical) {
      newPositions = [
        { "y": this.cells[0].y + 1, "x": this.cells[0].x - 1 },
        { "y": this.cells[1].y - 1, "x": this.cells[1].x - 1 },
        { "y": this.cells[2].y, "x": this.cells[2].x },
        { "y": this.cells[3].y - 2, "x": this.cells[3].x }
      ];
      newState = Tetris.BlockPointingDir.horizontal;
    } else {
      newPositions = [
        { "y": this.cells[0].y - 1, "x": this.cells[0].x + 1 },
        { "y": this.cells[1].y + 1, "x": this.cells[1].x + 1 },
        { "y": this.cells[2].y, "x": this.cells[2].x },
        { "y": this.cells[3].y + 2, "x": this.cells[3].x }
      ];
      newState = Tetris.BlockPointingDir.vertical;
    }
    
    if (this.canMoveTo(newPositions)) {
      this.moveTo(newPositions);
      this.state = newState;
    }
  }
  
});

Tetris.Z = Class.create(Tetris.Block, {
  
  initialize: function($super, y, x) {
    this.cellClass = "block_z";
    this.state = Tetris.BlockPointingDir.horizontal;
    $super([
      { "y": y, "x": x - 1 },
      { "y": y, "x": x },
      { "y": y + 1, "x": x },
      { "y": y + 1, "x": x + 1 }
    ]);
  },
  
  rotate: function() {
    var newPositions, newState;
    if (this.state == Tetris.BlockPointingDir.vertical) {
      newPositions = [
        { "y": this.cells[0].y, "x": this.cells[0].x - 2 },
        { "y": this.cells[1].y - 1, "x": this.cells[1].x - 1 },
        { "y": this.cells[2].y, "x": this.cells[2].x },
        { "y": this.cells[3].y - 1, "x": this.cells[3].x + 1 }
      ];
      newState = Tetris.BlockPointingDir.horizontal;
    } else {
      newPositions = [
        { "y": this.cells[0].y, "x": this.cells[0].x + 2 },
        { "y": this.cells[1].y + 1, "x": this.cells[1].x + 1 },
        { "y": this.cells[2].y, "x": this.cells[2].x },
        { "y": this.cells[3].y + 1, "x": this.cells[3].x - 1 }
      ];
      newState = Tetris.BlockPointingDir.vertical;
    }
    
    if (this.canMoveTo(newPositions)) {
      this.moveTo(newPositions);
      this.state = newState;
    }
  }
  
});

Tetris.T = Class.create(Tetris.Block, {
  
  initialize: function($super, y, x) {
    this.cellClass = "block_t";
    this.state = Tetris.BlockPointingDir.south;
    $super([
      { "y": y, "x": x - 1 },
      { "y": y, "x": x },
      { "y": y, "x": x + 1 },
      { "y": y + 1, "x": x }
    ]);
  },
  
  rotate: function() {
    var newState;
    var newPositions = [
        { "y": this.cells[0].y, "x": this.cells[0].x },
        { "y": this.cells[1].y, "x": this.cells[1].x },
        { "y": this.cells[2].y, "x": this.cells[2].x },
        { "y": this.cells[3].y, "x": this.cells[3].x }
    ];
    
    switch (this.state) {
      case Tetris.BlockPointingDir.south:
        newPositions[2] = { "y": this.cells[2].y - 1, "x": this.cells[2].x - 1 };
        newState = Tetris.BlockPointingDir.west;
        break;
      case Tetris.BlockPointingDir.west:
        newPositions[3] = { "y": this.cells[3].y - 1, "x": this.cells[3].x + 1 };
        newState = Tetris.BlockPointingDir.north;
        break;
      case Tetris.BlockPointingDir.north:
        newPositions[0] = { "y": this.cells[0].y + 1, "x": this.cells[0].x + 1 };
        newState = Tetris.BlockPointingDir.east;
        break;
      default:    /* east */
        /* move cells back to their original slots */
        newPositions = [
          { "y": this.cells[2].y + 1, "x": this.cells[2].x - 1 },
          { "y": this.cells[1].y, "x": this.cells[1].x },
          { "y": this.cells[3].y, "x": this.cells[3].x },
          { "y": this.cells[0].y, "x": this.cells[0].x }
        ];
        newState = Tetris.BlockPointingDir.south;
        break;
    }
    
    if (this.canMoveTo(newPositions)) {
      this.moveTo(newPositions);
      this.state = newState;
    }
  }
  
});

Tetris.J = Class.create(Tetris.Block, {
  
  initialize: function($super, y, x) {
    this.cellClass = "block_j";
    this.state = Tetris.BlockPointingDir.west;
    $super([
      { "y": y, "x": x - 1 },
      { "y": y, "x": x },
      { "y": y, "x": x + 1 },
      { "y": y + 1, "x": x + 1 }
    ]);
  },
  
  rotate: function() {
    var newPositions, newState;
    
    switch (this.state) {
      case Tetris.BlockPointingDir.west:
        newPositions = [
          { "y": this.cells[0].y - 1, "x": this.cells[0].x + 1 },
          { "y": this.cells[1].y, "x": this.cells[1].x },
          { "y": this.cells[2].y + 1, "x": this.cells[2].x - 1 },
          { "y": this.cells[3].y, "x": this.cells[3].x - 2 }
        ];
        newState = Tetris.BlockPointingDir.north;
        break;
      case Tetris.BlockPointingDir.north:
        newPositions = [
          { "y": this.cells[0].y + 1, "x": this.cells[0].x + 1 },
          { "y": this.cells[1].y, "x": this.cells[1].x },
          { "y": this.cells[2].y - 1, "x": this.cells[2].x - 1 },
          { "y": this.cells[3].y - 2, "x": this.cells[3].x }
        ];
        newState = Tetris.BlockPointingDir.east;
        break;
      case Tetris.BlockPointingDir.east:
        newPositions = [
          { "y": this.cells[0].y + 1, "x": this.cells[0].x - 1 },
          { "y": this.cells[1].y, "x": this.cells[1].x },
          { "y": this.cells[2].y - 1, "x": this.cells[2].x + 1 },
          { "y": this.cells[3].y, "x": this.cells[3].x + 2 }
        ];
        newState = Tetris.BlockPointingDir.south;        
        break;
      default:    /* south */
        newPositions = [
          { "y": this.cells[0].y - 1, "x": this.cells[0].x - 1 },
          { "y": this.cells[1].y, "x": this.cells[1].x },
          { "y": this.cells[2].y + 1, "x": this.cells[2].x + 1 },
          { "y": this.cells[3].y + 2, "x": this.cells[3].x }
        ];
        newState = Tetris.BlockPointingDir.west;
        break;
    }
    
    if (this.canMoveTo(newPositions)) {
      this.moveTo(newPositions);
      this.state = newState;
    }
  }
  
});

Tetris.L = Class.create(Tetris.Block, {
  
  initialize: function($super, y, x) {
    this.cellClass = "block_l";
    this.state = Tetris.BlockPointingDir.east;
    $super([
      { "y": y, "x": x + 1 },
      { "y": y, "x": x },
      { "y": y, "x": x - 1 },
      { "y": y + 1, "x": x - 1 }
    ]);
  },
  
  rotate: function() {
    var newPositions, newState;
    
    switch (this.state) {
      case Tetris.BlockPointingDir.west:
        newPositions = [
          { "y": this.cells[0].y - 1, "x": this.cells[0].x + 1 },
          { "y": this.cells[1].y, "x": this.cells[1].x },
          { "y": this.cells[2].y + 1, "x": this.cells[2].x - 1 },
          { "y": this.cells[3].y + 2, "x": this.cells[3].x }
        ];
        newState = Tetris.BlockPointingDir.north;
        break;
      case Tetris.BlockPointingDir.north:
        newPositions = [
          { "y": this.cells[0].y + 1, "x": this.cells[0].x + 1 },
          { "y": this.cells[1].y, "x": this.cells[1].x },
          { "y": this.cells[2].y - 1, "x": this.cells[2].x - 1 },
          { "y": this.cells[3].y, "x": this.cells[3].x - 2 }
        ];
        newState = Tetris.BlockPointingDir.east;
        break;
      case Tetris.BlockPointingDir.east:
        newPositions = [
          { "y": this.cells[0].y + 1, "x": this.cells[0].x - 1 },
          { "y": this.cells[1].y, "x": this.cells[1].x },
          { "y": this.cells[2].y - 1, "x": this.cells[2].x + 1 },
          { "y": this.cells[3].y - 2, "x": this.cells[3].x }
        ];
        newState = Tetris.BlockPointingDir.south;        
        break;
      default:    /* south */
        newPositions = [
          { "y": this.cells[0].y - 1, "x": this.cells[0].x - 1 },
          { "y": this.cells[1].y, "x": this.cells[1].x },
          { "y": this.cells[2].y + 1, "x": this.cells[2].x + 1 },
          { "y": this.cells[3].y, "x": this.cells[3].x + 2 }
        ];
        newState = Tetris.BlockPointingDir.west;
        break;
    }
    
    if (this.canMoveTo(newPositions)) {
      this.moveTo(newPositions);
      this.state = newState;
    }
  }
  
});

Tetris.BlockTypes = [Tetris.O, Tetris.I, Tetris.S, Tetris.Z, Tetris.T, Tetris.J, Tetris.L];

/***** Utility Functions *****/

function assert(condition, msg) {
  if (!condition) {
    alert("Assertion failed!: " + msg);
    throw new Error(msg);
  }
}

document.observe("dom:loaded", function() {
  Tetris.game = new Tetris.Game();
  
  Tetris.startButton = $("start_button");
  Tetris.startButton.observe("click", function () {
    Tetris.startButton.disable();
    Tetris.game.start();
  });
});
