/*
  Blox
  Author: Wei Yeh
*/

var Blox = {};

Blox.Speeds = { slow: 600, medium: 460, fast: 50 };

Blox.Keys = { down: 83, down_alt: 40, left: 65, left_alt: 37, right: 68, right_alt: 39, rotate: 32, pause: 80 };

Blox.States = { game_over: -1, paused: 0, new_game: 1, new_block: 2, moving: 3 };

Blox.BlockPointingDir = { horizontal: 0, vertical: 1, north: 2, south: 3, east: 4, west: 5 };

Blox.Dir = { left: 1, down: 2, right: 3 };

Blox.Game = Class.create({
  
  initialize: function() {
    /* board setup */
    this.boardContainer = $("blox");
    this.boardWidth = 10;
    this.boardLength = 20;
    this.setUpBoard();
    
    /* game setup */
    this.speed = Blox.Speeds.medium;
    this.state = Blox.States.new_game;
    
    this.moveFastInterval = null;
    this.moveFastTimeout = null;
    this.moveFastDir = null;
    
    /* stats setup */
    this.scoreContainer = $("score");
    this.levelContainer = $$("#level span")[0];
    
    Event.observe(document, "keydown", this.move.bind(this));
    Event.observe(document, "keyup", this.stopMoveFast.bind(this));
    
    /* sounds setup */
    //this.music = $("music");
    //this.soundClear = $("sound_clear");
  },
  
  /***** Game Operation *****/
  
  start: function() {
    this.state = Blox.States.new_block;
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
  
  /** Advances the game. */
  tick: function() {
    while (true) {
      switch (this.state) {
        case Blox.States.new_block:
          var block = this.newBlock();
          if (this.canFitBlock(block.cells)) {
            this.activeBlock = block;
            this.activeBlock.setUp();
            this.state = Blox.States.moving;
          } else {
            this.activeBlock = null;
            this.state = Blox.States.game_over;
          }
          break;
        case Blox.States.moving:
          if (this.activeBlock.canMoveDown()) {
            this.activeBlock.moveDown();
          } else {
            this.clear();
            this.state = Blox.States.new_block;
            continue;
          }
          break;
        default:
          this.state = Blox.States.game_over;
          alert("Game Over!");
          this.stopTick();
          Blox.startButton.enable();
      }
      
      break;  // break while
    }
  },
  
  move: function(event) {
    if (this.state == Blox.States.moving) {
      switch (event.keyCode) {
        /* Move */
        case Blox.Keys.left:
        case Blox.Keys.left_alt:
          this.activeBlock.moveLeft();
          this.startMoveFast(this.activeBlock.moveLeft);
          break;
        case Blox.Keys.right:
        case Blox.Keys.right_alt:
          this.activeBlock.moveRight();
          this.startMoveFast(this.activeBlock.moveRight);
          break;
        case Blox.Keys.down:
        case Blox.Keys.down_alt:
          this.activeBlock.moveDown();
          this.startMoveFast(this.activeBlock.moveDown);
          break;
        case Blox.Keys.rotate:
          this.activeBlock.rotate();
          break;
        /* Other game control */
        case Blox.Keys.pause:
          this.stopTick();
          this.state = Blox.States.paused;
          break;
      }
    } else if (this.state == Blox.States.paused) {
      switch (event.keyCode) {
        case Blox.Keys.pause:
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
    this.moveFastTimeout = setTimeout(this.moveFast.bind(this), 500);
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
  
  setUpBoard: function() {
    this.board = [];
    var row, col;
    for (var y = 0; y < this.boardLength; y++) {
      row = new Element("tr");
      this.board[y] = new Array();
      for (var x = 0; x < this.boardWidth; x++) {
        col = new Element("td");
        row.appendChild(col);
        this.board[y][x] = new Blox.Cell(y, x, col);
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
    var i = Math.round(Math.random() * (Blox.BlockTypes.length - 1));
    var block = new Blox.BlockTypes[i](y, x);
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
      this.cells[this.cells.length] = this.markCell(Blox.game.board[pos.y][pos.x]);
    }
  },
  
  /** 
   * Marks the given cell at the given coordinates. 
   * Must first confirm canMarkCell(). 
   */
  markCell: function(cell) {
    // assert(Blox.game.canMarkCell(cell.y, cell.x), "Cell at Y: " + cell.y + ", X: " + cell.x + " cannot be marked!");

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
    var newCell = Blox.game.board[cell.y + 1][cell.x];
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
      cell = Blox.game.board[newPos.y][newPos.x];
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
      if (!Blox.game.isValidCell(newY, newX) || 
          (!Blox.game.canMarkCell(newY, newX) && !this.contains(Blox.game.board[newY][newX]))) {
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

Blox.O = Class.create(Blox.Block, {
  
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

Blox.I = Class.create(Blox.Block, {
  
  initialize: function($super, y, x) {
    this.cellClass = "block_i";
    this.state = Blox.BlockPointingDir.horizontal;
    $super([
      { "y": y, "x": x - 2 },
      { "y": y, "x": x - 1 },
      { "y": y, "x": x },
      { "y": y, "x": x + 1 }
    ]);
  },
  
  rotate: function() {
    var newPositions, newState;
    if (this.state == Blox.BlockPointingDir.vertical) {
      newPositions = [
        { "y": this.cells[0].y + 2, "x": this.cells[0].x - 2 },
        { "y": this.cells[1].y + 1, "x": this.cells[1].x - 1 },
        { "y": this.cells[2].y, "x": this.cells[2].x },
        { "y": this.cells[3].y - 1, "x": this.cells[3].x + 1 }
      ];
      newState = Blox.BlockPointingDir.horizontal;
    } else {
      newPositions = [
        { "y": this.cells[0].y - 2, "x": this.cells[0].x + 2 },
        { "y": this.cells[1].y - 1, "x": this.cells[1].x + 1 },
        { "y": this.cells[2].y, "x": this.cells[2].x },
        { "y": this.cells[3].y + 1, "x": this.cells[3].x - 1 }
      ];
      newState = Blox.BlockPointingDir.vertical;
    }
    
    if (this.canMoveTo(newPositions)) {
      this.moveTo(newPositions);
      this.state = newState;
    }
  }
  
});

Blox.S = Class.create(Blox.Block, {
  
  initialize: function($super, y, x) {
    this.cellClass = "block_s";
    this.state = Blox.BlockPointingDir.horizontal;
    $super([
      { "y": y + 1, "x": x - 1 },
      { "y": y, "x": x },
      { "y": y + 1, "x": x },
      { "y": y, "x": x + 1 }
    ]);
  },
  
  rotate: function() {
    var newPositions, newState;
    if (this.state == Blox.BlockPointingDir.vertical) {
      newPositions = [
        { "y": this.cells[0].y + 1, "x": this.cells[0].x - 1 },
        { "y": this.cells[1].y - 1, "x": this.cells[1].x - 1 },
        { "y": this.cells[2].y, "x": this.cells[2].x },
        { "y": this.cells[3].y - 2, "x": this.cells[3].x }
      ];
      newState = Blox.BlockPointingDir.horizontal;
    } else {
      newPositions = [
        { "y": this.cells[0].y - 1, "x": this.cells[0].x + 1 },
        { "y": this.cells[1].y + 1, "x": this.cells[1].x + 1 },
        { "y": this.cells[2].y, "x": this.cells[2].x },
        { "y": this.cells[3].y + 2, "x": this.cells[3].x }
      ];
      newState = Blox.BlockPointingDir.vertical;
    }
    
    if (this.canMoveTo(newPositions)) {
      this.moveTo(newPositions);
      this.state = newState;
    }
  }
  
});

Blox.Z = Class.create(Blox.Block, {
  
  initialize: function($super, y, x) {
    this.cellClass = "block_z";
    this.state = Blox.BlockPointingDir.horizontal;
    $super([
      { "y": y, "x": x - 1 },
      { "y": y, "x": x },
      { "y": y + 1, "x": x },
      { "y": y + 1, "x": x + 1 }
    ]);
  },
  
  rotate: function() {
    var newPositions, newState;
    if (this.state == Blox.BlockPointingDir.vertical) {
      newPositions = [
        { "y": this.cells[0].y, "x": this.cells[0].x - 2 },
        { "y": this.cells[1].y - 1, "x": this.cells[1].x - 1 },
        { "y": this.cells[2].y, "x": this.cells[2].x },
        { "y": this.cells[3].y - 1, "x": this.cells[3].x + 1 }
      ];
      newState = Blox.BlockPointingDir.horizontal;
    } else {
      newPositions = [
        { "y": this.cells[0].y, "x": this.cells[0].x + 2 },
        { "y": this.cells[1].y + 1, "x": this.cells[1].x + 1 },
        { "y": this.cells[2].y, "x": this.cells[2].x },
        { "y": this.cells[3].y + 1, "x": this.cells[3].x - 1 }
      ];
      newState = Blox.BlockPointingDir.vertical;
    }
    
    if (this.canMoveTo(newPositions)) {
      this.moveTo(newPositions);
      this.state = newState;
    }
  }
  
});

Blox.T = Class.create(Blox.Block, {
  
  initialize: function($super, y, x) {
    this.cellClass = "block_t";
    this.state = Blox.BlockPointingDir.south;
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
      case Blox.BlockPointingDir.south:
        newPositions[2] = { "y": this.cells[2].y - 1, "x": this.cells[2].x - 1 };
        newState = Blox.BlockPointingDir.west;
        break;
      case Blox.BlockPointingDir.west:
        newPositions[3] = { "y": this.cells[3].y - 1, "x": this.cells[3].x + 1 };
        newState = Blox.BlockPointingDir.north;
        break;
      case Blox.BlockPointingDir.north:
        newPositions[0] = { "y": this.cells[0].y + 1, "x": this.cells[0].x + 1 };
        newState = Blox.BlockPointingDir.east;
        break;
      default:    /* east */
        /* move cells back to their original slots */
        newPositions = [
          { "y": this.cells[2].y + 1, "x": this.cells[2].x - 1 },
          { "y": this.cells[1].y, "x": this.cells[1].x },
          { "y": this.cells[3].y, "x": this.cells[3].x },
          { "y": this.cells[0].y, "x": this.cells[0].x }
        ];
        newState = Blox.BlockPointingDir.south;
        break;
    }
    
    if (this.canMoveTo(newPositions)) {
      this.moveTo(newPositions);
      this.state = newState;
    }
  }
  
});

Blox.J = Class.create(Blox.Block, {
  
  initialize: function($super, y, x) {
    this.cellClass = "block_j";
    this.state = Blox.BlockPointingDir.west;
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
      case Blox.BlockPointingDir.west:
        newPositions = [
          { "y": this.cells[0].y - 1, "x": this.cells[0].x + 1 },
          { "y": this.cells[1].y, "x": this.cells[1].x },
          { "y": this.cells[2].y + 1, "x": this.cells[2].x - 1 },
          { "y": this.cells[3].y, "x": this.cells[3].x - 2 }
        ];
        newState = Blox.BlockPointingDir.north;
        break;
      case Blox.BlockPointingDir.north:
        newPositions = [
          { "y": this.cells[0].y + 1, "x": this.cells[0].x + 1 },
          { "y": this.cells[1].y, "x": this.cells[1].x },
          { "y": this.cells[2].y - 1, "x": this.cells[2].x - 1 },
          { "y": this.cells[3].y - 2, "x": this.cells[3].x }
        ];
        newState = Blox.BlockPointingDir.east;
        break;
      case Blox.BlockPointingDir.east:
        newPositions = [
          { "y": this.cells[0].y + 1, "x": this.cells[0].x - 1 },
          { "y": this.cells[1].y, "x": this.cells[1].x },
          { "y": this.cells[2].y - 1, "x": this.cells[2].x + 1 },
          { "y": this.cells[3].y, "x": this.cells[3].x + 2 }
        ];
        newState = Blox.BlockPointingDir.south;        
        break;
      default:    /* south */
        newPositions = [
          { "y": this.cells[0].y - 1, "x": this.cells[0].x - 1 },
          { "y": this.cells[1].y, "x": this.cells[1].x },
          { "y": this.cells[2].y + 1, "x": this.cells[2].x + 1 },
          { "y": this.cells[3].y + 2, "x": this.cells[3].x }
        ];
        newState = Blox.BlockPointingDir.west;
        break;
    }
    
    if (this.canMoveTo(newPositions)) {
      this.moveTo(newPositions);
      this.state = newState;
    }
  }
  
});

Blox.L = Class.create(Blox.Block, {
  
  initialize: function($super, y, x) {
    this.cellClass = "block_l";
    this.state = Blox.BlockPointingDir.east;
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
      case Blox.BlockPointingDir.west:
        newPositions = [
          { "y": this.cells[0].y - 1, "x": this.cells[0].x + 1 },
          { "y": this.cells[1].y, "x": this.cells[1].x },
          { "y": this.cells[2].y + 1, "x": this.cells[2].x - 1 },
          { "y": this.cells[3].y + 2, "x": this.cells[3].x }
        ];
        newState = Blox.BlockPointingDir.north;
        break;
      case Blox.BlockPointingDir.north:
        newPositions = [
          { "y": this.cells[0].y + 1, "x": this.cells[0].x + 1 },
          { "y": this.cells[1].y, "x": this.cells[1].x },
          { "y": this.cells[2].y - 1, "x": this.cells[2].x - 1 },
          { "y": this.cells[3].y, "x": this.cells[3].x - 2 }
        ];
        newState = Blox.BlockPointingDir.east;
        break;
      case Blox.BlockPointingDir.east:
        newPositions = [
          { "y": this.cells[0].y + 1, "x": this.cells[0].x - 1 },
          { "y": this.cells[1].y, "x": this.cells[1].x },
          { "y": this.cells[2].y - 1, "x": this.cells[2].x + 1 },
          { "y": this.cells[3].y - 2, "x": this.cells[3].x }
        ];
        newState = Blox.BlockPointingDir.south;        
        break;
      default:    /* south */
        newPositions = [
          { "y": this.cells[0].y - 1, "x": this.cells[0].x - 1 },
          { "y": this.cells[1].y, "x": this.cells[1].x },
          { "y": this.cells[2].y + 1, "x": this.cells[2].x + 1 },
          { "y": this.cells[3].y, "x": this.cells[3].x + 2 }
        ];
        newState = Blox.BlockPointingDir.west;
        break;
    }
    
    if (this.canMoveTo(newPositions)) {
      this.moveTo(newPositions);
      this.state = newState;
    }
  }
  
});

Blox.BlockTypes = [Blox.O, Blox.I, Blox.S, Blox.Z, Blox.T, Blox.J, Blox.L];

/***** Utility Functions *****/

function assert(condition, msg) {
  if (!condition) {
    alert("Assertion failed!: " + msg);
    throw new Error(msg);
  }
}

document.observe("dom:loaded", function() {
  Blox.game = new Blox.Game();
  
  Blox.startButton = $("start_button");
  Blox.startButton.observe("click", function () {
    Blox.startButton.disable();
    Blox.game.start();
  });
});
