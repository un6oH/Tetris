// Guidelines at https://tetris.wiki/Tetris_Guideline

var gameState; // 0: main menu, 1: playing, 2: game over
var baseLevel = 1, level, score;
var updateSpeed, updateTimer, inputSleep = 0, input;
const initInputDelay = 30, inputDelay = 3;
var paused;

const rows = new Array(30);
const bags = new Array(2);
var bag = 0, bagIndex = 0, holdType = 0, linesCleared = 0, lastAction = 0, comboCount = 0;
var tetrominoHeld = false, canHold = true;
var difficultBonus = false;
var tetromino;

const ui = {};

const I = 0, J = 1, L = 2, O = 3, S = 4, Z = 5, T = 6;
const blockHues = [180, 240, 30, 60, 120, 0, 300];
const WEB_BG_COL = [216, 77, 25];

var highscores = [500000, 400000, 300000, 200000, 100000];

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont(loadFont("data/SEGUIBL.TTF"), 72);

  reset();
  
  resizeUI();
  ui.setBorderHue(true);
  colorMode(HSB, 360, 100, 100, 100);
}

function draw() {
  background(WEB_BG_COL[0], WEB_BG_COL[1], WEB_BG_COL[2]);
  // console.log(inputSleep);
  if (keyIsPressed && gameState == 1 && !paused && inputSleep == 0) {
    inputHandle();
    inputSleep = inputDelay;
  }
  inputSleep = (inputSleep == 0) ? 0 : inputSleep - 1;
  

  ui.drawBox(0, 0, 0, ui.gameWidth, ui.gameHeight);
  ui.drawBox(1, ui.matrixX, ui.matrixY, ui.matrixW, ui.matrixH);
  ui.drawBox(1, ui.sideBoxX, ui.previewBoxY, ui.sideBoxW, ui.previewBoxH);
  ui.drawBox(1, ui.sideBoxX, ui.holdBoxY, ui.sideBoxW, ui.holdBoxH);
  ui.drawBox(1, ui.sideBoxX, ui.scoreBoxY, ui.sideBoxW, ui.scoreBoxH);
  ui.grid();

  if (gameState == 0) {
    fill(0, 0, 100, 50);
    noStroke();
    rect(ui.matrixX, ui.matrixY, ui.matrixW, ui.matrixH);

    fill(0);
    textSize(ui.mainTextSize);
    textAlign(CENTER);
    text("Click to Start", ui.mainTextX, ui.mainTextY);
    ui.displayLevelSelector();

    ui.displayScores(0);
  } else if (gameState <= 2) {
    if (!paused && gameState == 1) {
      if (updateTimer >= updateSpeed) {
        update();
      }
      updateTimer++;
    }

    push();
    translate(ui.matrixX, ui.matrixY + ui.matrixH);
    for (let r = 0; r < 20; r++) {
      for (let c of rows[r].cells) {
        c.display();
      }
    }
    tetromino.display();
    pop();

    ui.displayPreview();
    if (tetrominoHeld) {
      ui.hold.display();
    }

    textSize(ui.infoTextSize);
    fill(0);
    textAlign(CORNER);
    text("Score: " + score, ui.sideBoxX + 15, ui.scoreBoxY + 30);
    text("Lines: " + linesCleared, ui.sideBoxX + 15, ui.scoreBoxY + 55);
    text("Level: " + level, ui.sideBoxX + 15, ui.scoreBoxY + 80);

    if (paused) {
      fill(0, 0, 100, 50);
      noStroke();
      rect(ui.matrixX, ui.matrixY, ui.matrixW, ui.matrixH);

      fill(0);
      textSize(ui.mainTextSize);
      textAlign(CENTER);
      text("Paused", ui.mainTextX, ui.mainTextY);

      ui.drawBox(0, ui.mainTextX - ui.cellW, ui.mainTextY + ui.halfCellW, ui.cellW * 2, ui.cellW);
      textSize(ui.mainTextSize * 0.75);
      fill(0);
      text("Quit", ui.mainTextX, ui.mainTextY + ui.cellW + ui.edge * 2);
    }

    if (gameState == 2) {
      fill(0, 0, 100, 50);
      noStroke();
      rect(ui.matrixX, ui.matrixY, ui.matrixW, ui.matrixH);

      fill(0);
      textSize(40);
      textAlign(CENTER);
      text("Game Over", ui.mainTextX, ui.mainTextY);
      ui.displayLevelSelector();

      ui.displayScores(75);
    }
  }
}

function reset() {
  gameState = 0;
  level = baseLevel;
  updateTimer = 0;
  paused = true;
  ui.setBorderHue();
}

function gameStart() {
  gameState = 1;
  paused = false;
  level = baseLevel;
  score = 0;
  linesCleared = 0;

  setUpdateSpeed();
  updateTimer = 0;

  for (let i = 0; i < rows.length; i++) {
    rows[i] = new Row(i);
  }
  bags[0] = [];
  bags[1] = [];
  for (var bag of bags) {
    for (let i = 0; i < 7; i++) {
      bag.push(i);
    }
    shuffle(bag, true);
  }
  bag = 0;
  ui.preview = new Array(4);
  setNewTetromino();

  tetrominoHeld = false;
  canHold = true;

  ui.setBorderHue(true);
}

function gameEnd() {
  gameState = 2;

  for (let i = 0; i < 5; i++) {
    if (score >= highscores[i]) {
      highscores.splice(i, 0, score);
      highscores.pop();
      break;
    }
  }
}

function update() {
  updateTimer = 0;
  tetromino.move(0, -1);
}

function placeTetromino() {
  updateTimer = 0;
  inputSleep = initInputDelay;
  setUpdateSpeed();

  let lines = 0;
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i].filled == 10) {
      rows[i].clear();
      linesCleared++;
      lines++;
    }
  }

  let tspin = false;
  if (tetromino.type == T && lastAction == 1) {
    let r = tetromino.r;
    let c = tetromino.c;
    let occupied = 0;
    if (blocked(r - 1, c + 1)) { occupied++; }
    if (blocked(r + 1, c + 1)) { occupied++; }
    if (blocked(r - 1, c - 1)) { occupied++; }
    if (blocked(r + 1, c - 1)) { occupied++; }
    if (occupied > 2) {
      tspin = true;
    }
  }

  let points = 0;
  switch (lines) {
    case 0:
      if (tspin) {
        points = 400 * level;
      }
      comboCount = 0;
      break;
    case 1:
      points = (!tspin) ? 100 * level : 800 * level;
      break;
    case 2:
      points = (!tspin) ? 300 * level : 1200 * level;
      break;
    case 3:
      points = (!tspin) ? 500 * level : 1600 * level;
      break;
    case 4:
      points = 800 * level;
      break;
  }
  if (!tspin && lines < 4) {
    difficultBonus = false;
  }

  if (difficultBonus) {
    points += points / 2;
  }
  score += points;

  if (lines > 0) {
    comboCount++;
  }
  if (comboCount > 2) {
    score += 50 * comboCount * level;
  }

  if ((lines > 0 && tspin) || lines == 4) {
    difficultBonus = true;
  }

  level = baseLevel + floor(linesCleared / 12);
  ui.setBorderHue(false);

  setNewTetromino();
  canHold = true;
}

class Row {
  constructor(id) {
    this.filled = 0;
    this.index = id;
    this.cells = [];
    for (let i = 0; i < 10; i++) {
      this.cells[i] = new Cell(this.index, i);
    }
  }

  clear() {
    for (let i = this.index; i < rows.length - 2; i++) {
      rows[i].shift(rows[i + 1]);
    }
  }

  shift(r) {
    this.filled = r.filled;
    for (let i = 0; i < 10; i++) {
      this.cells[i] = new Cell(this.index, i);
      if (r.cells[i].blocked) {
        this.cells[i].update(r.cells[i].block);
        this.cells[i].block.r--;
        this.cells[i].block.update();
      }
    }
  }

  updateDisplay() {
    for (let cell of this.cells) {
      cell.updateDisplay();
    }
  }
}

class Cell {
  constructor(r, c) {
    this.r = r;
    this.c = c;
    this.blocked = false;
    this.block;
  }

  update(b) {
    this.blocked = true;
    this.block = new Block(b.r, b.c, b.type);
    // this.block.r = b.r;
    // this.block.c = b.c;
    // this.block.type = b.type;
  }

  display() {
    if (this.blocked) {
      this.block.display();
    }
  }

  updateDisplay() {
    if (this.blocked) 
      this.block.updateDisplay();
  }
}

class Tetromino {
  constructor(t) {
    this.r = 20;
    this.c = 4;
    this.state = 0;
    this.type = t;
    this.aboveBlock = false;
    this.hardDropState = false;
    this.blocks = new Array(4);
    for (let i = 0; i < 4; i++) {
      this.blocks[i] = new Block(this.r + blockMatrix[t][0][i][1], this.c + blockMatrix[t][0][i][0], t);
    }

    this.ghost = new GhostTetromino(this.type);
  }

  update() {
    for (let i = 0; i < 4; i++) {
      this.blocks[i].r = this.r + blockMatrix[this.type][this.state][i][1];
      this.blocks[i].c = this.c + blockMatrix[this.type][this.state][i][0];
      this.blocks[i].update();
    }
    this.aboveBlock = false;
    for (let b of this.blocks) {
      if (blocked(b.r - 1, b.c)) {
        updateSpeed = 30;
        updateTimer = 0;
        this.aboveBlock = true;
        break;
      }
    }
    if (!this.aboveBlock) setUpdateSpeed();
    this.ghost.update(this.r, this.c, this.state);
  }

  move(x, y) {
    let isBlocked = false;
    for (let b of this.blocks) {
      if (blocked(b.r + y, b.c + x)) {
        isBlocked = true;
        break;
      }
    }

    if (!isBlocked) {
      this.r += y;
      this.c += x;
      this.update();
      lastAction = 0;
    } else if (y == -1) {
      this.place();
    }
  }

  rotate(d) {
    let init = this.state;
    if (this.type != O) {
      if (d == 1) {
        this.state = (this.state < 3) ? this.state + 1 : 0;
      } else {
        this.state = (this.state > 0) ? this.state - 1 : 3;
      }
      for (let i = 0; i < 4; i++) {
        this.blocks[i].r = this.r + blockMatrix[this.type][this.state][i][1];
        this.blocks[i].c = this.c + blockMatrix[this.type][this.state][i][0];
      }
    }

    let validSpace = false;
    let xkick = 0;
    let ykick = 0;
    let test = 0;
    if (this.type != O) {
      while (!validSpace && test < 5) {
        let table = int(this.type == I);
        let index = (d == 1) ? init : (init != 0) ? init - 1 : 3;
        xkick = wallKick[table][index][test][0] * d;
        ykick = wallKick[table][index][test][1] * d;

        validSpace = true;
        for (let b of this.blocks) {
          if (blocked(b.r + ykick, b.c + xkick)) {
            validSpace = false;
            test++;
            break;
          }
        }
      }
    }

    if (validSpace) {
      this.move(xkick, ykick);
      lastAction = 1;
    } else {
      this.state = init;
    }
    this.update();
  }

  place() {
    if (this.r == 20) {
      gameEnd();
    }
    for (let b of this.blocks) {
      rows[b.r].cells[b.c].update(b);
      rows[b.r].filled++;
    }
    this.hardDropState = false;
    placeTetromino();
  }

  hardDrop() {
    this.hardDropState = true;
    let dist = 0;
    while (this.hardDropState) {
      this.move(0, -1);
      dist++;
    }
    score += 2 * dist;
  }

  display() {
    this.ghost.display();
    if (this.aboveBlock) {
      for (let b of this.blocks) {
        if (b.y > -ui.matrixH) {
          noFill();
          stroke(0, 0, 100);
          strokeWeight(4);
          rect(b.x, b.y, ui.cellW, ui.cellW);
        }
      }
    }
    for (let b of this.blocks) {
      b.display();
    }
  }

  updateDisplay() {
    this.ghost.updateDisplay();
    for (let block of this.blocks) {
      block.updateDisplay();
    }
  }
}

class Block {
  constructor(r, c, t) {
    this.r = r;
    this.c = c;
    this.type = t;
    this.hue = blockHues[t];
    this.updateDisplay();
    console.log("Block created");
  }

  update() {
    this.x = this.c * ui.cellW;
    this.y = -this.r * ui.cellW - ui.cellW;
    this.x1 = this.x + ui.cellW;
    this.y1 = this.y + ui.cellW;
  }

  display() {
    if (this.r < 20) {
      noStroke();
      fill(this.hue, 80, 100);
      triangle(this.x, this.y, this.x1, this.y, this.x, this.y1);
      fill(this.hue, 100, 80);
      triangle(this.x, this.y1, this.x1, this.y, this.x1, this.y1);
      fill(this.hue, 90, 90);
      rect(this.x + ui.cellW / 8, this.y + ui.cellW / 8, ui.cellW * 0.75, ui.cellW * 0.75);
    }
  }

  updateDisplay() {
    this.x = this.c * ui.cellW;
    this.y = -this.r * ui.cellW - ui.cellW;
    this.x1 = this.x + ui.cellW;
    this.y1 = this.y + ui.cellW;
  }
}

class GhostTetromino {
  constructor(t) {
    this.r = 0;
    this.c = 0
    this.type = t;
    this.blocks = new Array(4);
    for (let i = 0; i < 4; i++) {
      this.blocks[i] = new GhostBlock(this.r + blockMatrix[t][0][i][1], this.c + blockMatrix[t][0][i][0]);
    }
    this.update(20, 4, 0);
  }

  update(r, c, s) {
    this.c = c;
    let placePos = r;

    let isBlocked = false;
    while (!isBlocked) {
      isBlocked = false;
      for (let i = 0; i < 4; i++) {
        if (blocked(placePos + blockMatrix[this.type][s][i][1], this.c + blockMatrix[this.type][s][i][0])) {
          isBlocked = true;
          placePos++;
          break;
        }
      }
      if (!isBlocked) {
        placePos--;
      }
    }

    this.r = placePos;
    for (let i = 0; i < 4; i++) {
      this.blocks[i].r = this.r + blockMatrix[this.type][s][i][1];
      this.blocks[i].c = this.c + blockMatrix[this.type][s][i][0];
      this.blocks[i].update();
    }
  }

  display() {
    for (let b of this.blocks) {
      b.display();
    }
  }

  updateDisplay() {
    for (let block of this.blocks) {
      block.updateDisplay();
    }
  }
}

class GhostBlock {
  constructor(r, c) {
    this.r = r;
    this.c = c;
    this.update();
  }

  update() {
    this.x = this.c * ui.cellW;
    this.x1 = this.x + ui.cellW;
    this.y1 = -this.r * ui.cellW;
    this.y = this.y1 - ui.cellW;
  }

  display() {
    if (this.r < 20) {
      noStroke();
      fill(0, 0, 0, 30);
      rect(this.x, this.y, ui.cellW, ui.cellW);
      fill(0, 0, 0, 20);
      rect(this.x + ui.cellW / 8, this.y + ui.cellW / 8, ui.cellW * 0.75, ui.cellW * 0.75);
    }
  }

  updateDisplay() {
    this.update();
  }
}

function setNewTetromino() {
  tetromino = new Tetromino(bags[bag][0]);
  bags[bag].shift();
  if (bags[bag].length == 0) {
    for (let i = 0; i < 7; i++) {
      bags[bag].push(i);
    }
    shuffle(bags[bag], true);
    bag = (bag == 0) ? 1 : 0;
  }
  updatePreview();

  updateTimer = 100;
}

function updatePreview() {
  let count = 0;
  let queue = new Array(4);
  for (let i of bags[bag]) {
    if (count > 3) {
      break;
    }
    queue[count] = i;
    count++;
  }
  for (let i of bags[(bag == 0) ? 1 : 0]) {
    if (count > 3) {
      break;
    }
    queue[count] = i;
    count++;
  }

  for (let i = 0; i < 4; i++) {
    ui.preview[i] = new DisplayTetromino(i, queue[i]);
  }
}

function blocked(r, c) {
  if (c < 0 || c > 9 || r < 0) {
    return true;
  } else if (rows[r].cells[c].blocked) {
    return true;
  } else {
    return false;
  }
}

function updateHold(type) {
  if (!tetrominoHeld) {
    setNewTetromino();
    tetrominoHeld = true;
  } else {
    tetromino = new Tetromino(holdType);
  }
  holdType = type;
  ui.hold = new DisplayTetromino(4, type);

  canHold = false;
}

function setUpdateSpeed() {
  updateSpeed = (level < 13) ? 65 - 5 * level : 2;
  if (updateSpeed == 0) {
    updateSpeed = 2;
  }
}

function mouseClicked() {
  if (gameState != 1) {
    if (mouseX > ui.mainTextX + ui.cellW * 2 && mouseX < ui.mainTextX + ui.cellW * 2.75 && mouseY > ui.mainTextY + ui.edge * 2 && mouseY < ui.mainTextY + ui.cellW) {
      baseLevel = (baseLevel > 1) ? baseLevel - 1 : 1;
      ui.setBorderHue(true);
    } else if (mouseX > ui.mainTextX + ui.cellW * 3 && mouseX < ui.mainTextX + ui.cellW * 3.75 && mouseY > ui.mainTextY + ui.edge * 2 && mouseY < ui.mainTextY + ui.cellW) {
      baseLevel++;
      ui.setBorderHue(true);
    } else {
      gameStart();
    }
  } else {
    if (paused && mouseX > ui.mainTextX - ui.cellW && mouseX < ui.mainTextX + ui.cellW && mouseY > ui.mainTextY + ui.halfCellW && mouseY < ui.mainTextY + ui.cellW * 1.5) {
      reset();
      paused = false;
    } else {
      paused = (paused) ? false : true;
    }
  }
}

function keyPressed() {
  // console.log("keyPressed()");
  input = keyCode;
  if (gameState == 1 && !paused) inputHandle();
  inputSleep = initInputDelay;
}

function inputHandle() {
  // console.log("input " + input + ", inputSleep = " + inputSleep);
  switch (input) {
    case LEFT_ARROW:
      tetromino.move(-1, 0);
      break;
    case RIGHT_ARROW:
      tetromino.move(1, 0);
      break;
    case UP_ARROW:
      tetromino.rotate(1);
      break;
    case DOWN_ARROW:
      tetromino.move(0, -1);
      score++;
      break;
    case 32:
      tetromino.hardDrop();
    break;
    case 90:
    case 59:
      tetromino.rotate(-1);
      break;
    case 88:
    case 81:
      tetromino.rotate(1);
      break;
    case 67:
    case 74:
      if (canHold) {
        updateHold(tetromino.type);
      }
      break;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  resizeUI();
  if (gameState != 0)
    ui.updateDisplay();
}

function resizeUI() {
  if (windowWidth / windowHeight > 0.785714286) {
    ui.gameHeight = windowHeight;
    ui.gameWidth = ui.gameHeight * 0.785714286;
  } else {
    ui.gameWidth = windowWidth;
    ui.gameHeight = ui.gameWidth * 1.272727273;
  }
  console.log("UI resized with width " + ui.gameWidth);

  ui.cellW = ui.gameHeight / 21;
  ui.edge = ui.cellW / 8;
  ui.halfCellW = ui.cellW / 2;

  ui.matrixX = ui.halfCellW;
  ui.matrixY = ui.halfCellW;
  ui.matrixW = ui.cellW * 10;
  ui.matrixH = ui.cellW * 20;

  ui.sideBoxX = ui.cellW * 11;
  ui.sideBoxW = ui.cellW * 5;

  ui.previewBoxY = ui.halfCellW;
  ui.previewBoxH = ui.cellW * 10.5;

  ui.holdBoxY = ui.cellW * 11.5;
  ui.holdBoxH = ui.cellW * 3;

  ui.scoreBoxY = ui.cellW * 15;
  ui.scoreBoxH = ui.cellW * 5.5;

  ui.mainTextSize = ui.cellW;
  ui.infoTextSize = ui.cellW / 2;
  ui.mainTextX = ui.matrixX + ui.matrixW / 2;
  ui.mainTextY = ui.matrixY + ui.cellW * 5 - ui.edge;

  ui.hue;
}

ui.updateDisplay = function() {
  for (let row of rows) {
    row.updateDisplay();
  }
  for (let dt of this.preview) {
    dt.updateDisplay();
  }
  if (tetrominoHeld)
    this.hold.updateDisplay();
  tetromino.updateDisplay();
}

ui.setBorderHue = function(newGame) {
  ui.hue = newGame ? 12 * (baseLevel - 1) : 12 * (baseLevel - 1) + linesCleared;
}

ui.drawBox = function(type, x, y, w, h) {
  rectMode(CORNER);
  noStroke();
  let x1 = x + w;
  let y1 = y + h;
  let edge2 = this.edge * 2;
  let light = color(this.hue, 35, 95);
  let border = color(this.hue, 50, 90);
  let dark = color(this.hue, 50, 80);
  let fillCol = color(this.hue, 10, 100);
  if (type == 0) {
    fill(light);
    rect(x, y, w, this.edge);
    rect(x, y, this.edge, h);
    fill(dark);
    rect(x1 - this.edge, y + this.edge, this.edge, h - this.edge);
    rect(x + this.edge, y1 - this.edge, w - this.edge, this.edge);
    triangle(x1, y, x1 - edge2, y + edge2, x1, y + edge2);
    triangle(x, y1, x + edge2, y1, x + edge2, y1 - edge2);
    fill(border);
    rect(x + this.edge, y + this.edge, w - edge2, h - edge2);
  } else {
    fill(dark);
    rect(x - this.edge, y - this.edge, w + edge2, this.edge);
    rect(x - this.edge, y - this.edge, this.edge, h + edge2);
    fill(light);
    rect(x1, y, this.edge, h + this.edge);
    rect(x, y1, w + this.edge, this.edge);
    triangle(x1 + this.edge, y - this.edge, x1 + this.edge, y + this.edge, x1 - this.edge, y + this.edge);
    triangle(x - this.edge, y1 + this.edge, x + this.edge, y1 + this.edge, x + this.edge, y1 - this.edge);
    fill(fillCol);
    rect(x, y, w, h);
  }
}

ui.grid = function() {
  stroke(this.hue, 10, 75);
  strokeWeight(2);
  for (let i = 0; i <= 10; i++) {
    line(this.matrixX + i * ui.cellW, this.matrixY, this.matrixX + i * ui.cellW, this.matrixY + this.matrixH);
  }
  for (let i = 0; i <= 20; i++) {
    line(this.matrixX, this.matrixY + i * ui.cellW, this.matrixX + this.matrixW, this.matrixY + i * ui.cellW);
  }
}

ui.displayPreview = function() {
  for (let t of this.preview) {
    t.display();
  }
}

ui.displayScores = function(y) {
  textAlign(CORNER);
  textSize(20);
  fill(0);
  for (let i = 0; i < 5; i++) {
    text((i + 1) + ": " + highscores[i], this.sideBoxX + 15, this.scoreBoxY + y + 30 + 25 * i);
  }
}

ui.displayLevelSelector = function() {
  textAlign(CENTER);
  textSize(ui.mainTextSize * 0.75);
  fill(0);
  text("Level: " + baseLevel, this.mainTextX, this.mainTextY + ui.cellW - ui.edge);

  this.drawBox(0, this.mainTextX + ui.cellW * 2, this.mainTextY + ui.edge * 2, ui.cellW * 0.75, ui.cellW * 0.75);
  fill(0);
  text("-", this.mainTextX + ui.cellW * 2 + ui.edge * 3, this.mainTextY + ui.cellW * 0.8125);
  this.drawBox(0, this.mainTextX + ui.cellW * 3, this.mainTextY + ui.edge * 2, ui.cellW * 0.75, ui.cellW * 0.75);
  fill(0);
  text("+", this.mainTextX + ui.cellW * 3 + ui.edge * 3, this.mainTextY + ui.cellW * 0.8125);
}

class DisplayTetromino {
  constructor(pos, t) {
    this.pos = pos;
    let x = ui.sideBoxX + ui.sideBoxW / 2;
    this.x = !(t == I || t == O) ? x - ui.cellW / 2 : x - ui.cellW;
    if (pos < 4) {
      let y = ui.previewBoxY + ui.cellW * 1.5 + ui.cellW * 2.5 * pos;
      this.y = (t != I) ? y + ui.cellW : y + ui.cellW / 2;
    } else {
      let y = ui.holdBoxY + ui.holdBoxH / 2
      this.y = (t != I) ? y + ui.cellW : y + ui.cellW / 2;
    }
    this.type = t;
    this.blocks = new Array(4);
    for (let i = 0; i < 4; i++) {
      this.blocks[i] = new Block(blockMatrix[t][0][i][1], blockMatrix[t][0][i][0], t);
    }
  }

  display() {
    push();
    translate(this.x, this.y);
    for (let b of this.blocks) {
      b.display();
    }
    pop();
  }

  updateDisplay() {
    console.log("DisplayTetromino::updateDisplay()");
    let x = ui.sideBoxX + ui.sideBoxW / 2;
    this.x = !(this.type == I || this.type == O) ? x - ui.cellW / 2 : x - ui.cellW;
    if (this.pos < 4) {
      let y = ui.previewBoxY + ui.cellW * 1.5 + ui.cellW * 2.5 * this.pos;
      this.y = (this.type != I) ? y + ui.cellW : y + ui.cellW / 2;
    } else {
      let y = ui.holdBoxY + ui.holdBoxH / 2
      this.y = (this.type != I) ? y + ui.cellW : y + ui.cellW / 2;
    }
    for (let block of this.blocks) {
      block.updateDisplay();
    }
  }
}

// matrices for all tetrominos in all rotations
// blockMatrix[type][state][block][0:x, 1:y]
const blockMatrix = [
  /*I*/ [
  [[-1, 0], [0, 0], [1, 0], [2, 0]],
  [[1, 1], [1, 0], [1, -1], [1, -2]],
  [[-1, -1], [0, -1], [1, -1], [2, -1]],
  [[0, 1], [0, 0], [0, -1], [0, -2]]],
  /*J*/ [
  [[-1, 1], [-1, 0], [0, 0], [1, 0]],
  [[0, 1], [1, 1], [0, 0], [0, -1]],
  [[-1, 0], [0, 0], [1, 0], [1, -1]],
  [[0, 1], [0, 0], [-1, -1], [0, -1]]],
  /*L*/ [
  [[1, 1], [-1, 0], [0, 0], [1, 0]],
  [[0, 1], [0, 0], [0, -1], [1, -1]],
  [[-1, 0], [0, 0], [1, 0], [-1, -1]],
  [[-1, 1], [0, 1], [0, 0], [0, -1]]],
  /*O*/ [
  [[0, 1], [1, 1], [0, 0], [1, 0]],
  [[0, 1], [1, 1], [0, 0], [1, 0]],
  [[0, 1], [1, 1], [0, 0], [1, 0]],
  [[0, 1], [1, 1], [0, 0], [1, 0]]],
  /*S*/ [
  [[0, 1], [1, 1], [-1, 0], [0, 0]],
  [[0, 1], [0, 0], [1, 0], [1, -1]],
  [[0, 0], [1, 0], [-1, -1], [0, -1]],
  [[-1, 1], [-1, 0], [0, 0], [0, -1]]],
  /*Z*/ [
  [[-1, 1], [0, 1], [0, 0], [1, 0]],
  [[1, 1], [0, 0], [1, 0], [0, -1]],
  [[-1, 0], [0, 0], [0, -1], [1, -1]],
  [[0, 1], [-1, 0], [0, 0], [-1, -1]]],
  /*T*/ [
  [[0, 1], [-1, 0], [0, 0], [1, 0]],
  [[0, 1], [0, 0], [1, 0], [0, -1]],
  [[-1, 0], [0, 0], [1, 0], [0, -1]],
  [[0, 1], [-1, 0], [0, 0], [0, -1]]]
];

// SRS wall kick matrix: wallKick[type][state][test][x or y]
const wallKick = [
[
[[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
[[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
[[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
[[0, 0], [-1, 0], [-1, -1], [0, 2], [1, -2]]
], 
[
[[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
[[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
[[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
[[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]]
]
];
