//Guidelines at https://tetris.wiki/Tetris_Guideline

import { blockMatrix, wallKick } from "./tetromino_matrices_LUT.js";

var gameState, baseLevel, level, score;
var defaultUpdateSpeed, updateSpeed, updateTimer;
var paused = true;

Row[] rows = new Row[30];
IntList[] bags = new IntList[2];
var bag, bagIndex, holdType, linesCleared, lastAction, comboCount;
var tetrominoHeld, canHold;
var difficultBonus;
Tetromino tetromino;

const cellW = 40;
var ui;

const I = 0, J = 1, L = 2, O = 3, S = 4, Z = 5, T = 6;
const blockHues = [180, 240, 30, 60, 120, 0, 300];

Block test;

var highscores = new Array[5];

function setup () {
  createCanvas(660, 840);
  textFont(loadFont("data/SEGUIBL.TTF", 20));
  
  baseLevel = 1;
  
  cellW = 40;
  ui = new ui();
  
  colorMode(HSB, 360, 100, 100);
}

function draw () {
  background(255);
  
  ui.box(0, 0, 0, width, height);
  ui.box(1, ui.matrixX, ui.matrixY, ui.matrixW, ui.matrixH);
  ui.box(1, ui.previewBoxX, ui.previewBoxY, ui.previewBoxW, ui.previewBoxH);
  ui.box(1, ui.holdBoxX, ui.holdBoxY, ui.holdBoxW, ui.holdBoxH);
  ui.box(1, ui.scoreBoxX, ui.scoreBoxY, ui.scoreBoxW, ui.scoreBoxH);
  ui.grid();
  
  if (gameState == 0) {
    fill(0, 0, 100, 50);
    noStroke();
    rect(ui.matrixX, ui.matrixY, ui.matrixW, ui.matrixH);
    
    fill(0);
    textSize(40);
    textAlign(CENTER);
    text("Click to Start", ui.mainTextX, ui.mainTextY);
    ui.displayLevelSelector();
    
    ui.displayScores(0);
  } else if (gameState <= 2) {
    if (!paused && gameState == 1) {
      if (updateTimer >= updateSpeed) {
        update();
      }
      updateTimer ++;
    }
    
    pushMatrix();
    translate(ui.matrixX, ui.matrixY+ui.matrixH);
    for (let r of rows) {
      for (let c of r.cells) {
        c.display();
      }
    }
    tetromino.display();
    popMatrix();
    
    ui.displayPreview();
    if (tetrominoHeld) {
      ui.hold.display();
    }
    
    textSize(20);
    fill(0);
    textAlign(CORNER);
    text("Score: "+score, ui.scoreBoxX+15, ui.scoreBoxY+30);
    text("Lines: "+linesCleared, ui.scoreBoxX+15, ui.scoreBoxY+55);
    text("Level: "+level, ui.scoreBoxX+15, ui.scoreBoxY+80);
    
    if (paused) {
      fill(0, 0, 100, 50);
      noStroke();
      rect(ui.matrixX, ui.matrixY, ui.matrixW, ui.matrixH);
      
      fill(0);
      textSize(40);
      textAlign(CENTER);
      text("Paused", ui.mainTextX, ui.mainTextY);
      
      ui.box(0, ui.mainTextX-40, ui.mainTextY+15, 80, 40);
      textSize(30);
      fill(0);
      text("Quit", ui.mainTextX, ui.mainTextY+45);
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

void reset () {
  gameState = 0;
}

void gameStart () {
  gameState = 1;
  level = baseLevel;
  score = 0;
  linesCleared = 0;

  updateSpeed = 60;
  updateTimer = 0;
  
  for (int i=0; i<rows.length; i++) {
    rows[i] = new Row(i);
  }
  bags[0] = new IntList(7);
  bags[1] = new IntList(7);
  for (IntList bag: bags) {
    for (int i=0; i<7; i++){
      bag.append(i);
    }
    bag.shuffle();
  }
  bag = 0;
  setNewTetromino();
  
  tetrominoHeld = false;
  canHold = true;
  
  ui.hue = 12 * baseLevel + linesCleared * 2;
}

void gameEnd () {
  gameState = 2;
  
  if (score > highscores[4]) {
    IntList scores = new IntList(6);
    for (int i: highscores) {
      scores.append(i);
    }
    scores.append(score);
    scores.sortReverse();
    String[] saveData = new String[5];
    for (int i=0; i<5; i++) {
      highscores[i] = scores.get(i);
      saveData[i] = Integer.toString(scores.get(i));
    }
    saveStrings("highscores.txt", saveData);
  }
}

void update () {
  updateTimer = 0;
  tetromino.move(0, -1);
}

void tetrominoPlaced () {
  updateTimer = 0;
  setUpdateSpeed();
  if (updateSpeed == 0) {
    updateSpeed = 2;
  }
  
  int lines = 0;
  for (int i=rows.length-1; i>=0; i--) {
    if (rows[i].filled == 10) {
      rows[i].clear();
      linesCleared ++;
      lines ++;
    }
  }
  
  boolean tspin = false;
  if (tetromino.type == T && lastAction == 1) {
    int r = tetromino.r;
    int c = tetromino.c;
    int occupied = 0;
    if (blocked(r-1, c+1)) { occupied ++; }
    if (blocked(r+1, c+1)) { occupied ++; }
    if (blocked(r-1, c-1)) { occupied ++; }
    if (blocked(r+1, c-1)) { occupied ++; }
    if (occupied > 2) {
      tspin = true;
    }
  }
  
  int points = 0;
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
    comboCount ++;
  }
  if (comboCount > 2) {
    score += 50 * comboCount * level;
  }
  
  if ((lines > 0 && tspin) || lines == 4) {
    difficultBonus = true;
  }
  
  level = baseLevel + int(linesCleared / 12) + 1;
  ui.hue = 12*baseLevel + linesCleared * 2;
  
  setNewTetromino();
  canHold = true;
}

class Row {
  constructor (id) {
    this.filled = 0;
    this.index = id;
    this.cells = new Array(10);
    for (let i = 0; i < 10; i++) {
      cells[i] = new Cell(index, i);
    }
  }
  
  clear () {
    for (let i = index; i < rows.length-2; i++) {
      rows[i].shift(rows[i+1]);
    }
  }
  
  void shift (Row r) {
    filled = r.filled;
    for (int i=0; i<10; i++) {
      cells[i] = new Cell(index, i);
      if (r.cells[i].blocked) {
        cells[i].update(r.cells[i].block);
        cells[i].block.r--;
        cells[i].block.update();
      }
    }
  }
}

class Cell {
  int r, c;
  boolean blocked;
  float x, y;
  Block block;
  Cell (int r_, int c_) {
    r = r_;
    c = c_;
    blocked = false;
    x = c * cellW;
    y = -r * cellW - cellW;
  }
  
  void update (Block b) {
    blocked = true;
    block = new Block(b.r, b.c, b.type);
  }
  
  void display () {
    if (blocked) {
      block.display();
    }
  }
}

class Tetromino {
  int r = 20;
  int c = 4;
  int state = 0;
  int type;
  boolean hardDrop = false;
  boolean aboveBlock = false;
  Block[] blocks = new Block[4];
  GhostTetromino ghost;
  Tetromino (int t) {
    type = t;
    for (int i=0; i<4; i++) {
      blocks[i] = new Block(r+blockMatrix[t][0][i][1], c+blockMatrix[t][0][i][0], t);
    }
    ghost = new GhostTetromino(type);
  }
  
  void update () {
    for (int i=0; i<4; i++) {
      blocks[i].r = r+blockMatrix[type][state][i][1];
      blocks[i].c = c+blockMatrix[type][state][i][0];
      blocks[i].update();
    }
    aboveBlock = false;
    setUpdateSpeed();
    for (Block b: blocks) {
      if (blocked(b.r-1, b.c)) {
        updateSpeed = 30;
        updateTimer = 0;
        aboveBlock = true;
      }
    }
    ghost.update(r, c, state);
  }
  
  void move (int x, int y) {
    boolean blocked = false;
    for (Block b: blocks) {
      if (blocked(b.r+y, b.c+x)) {
        blocked = true;
        break;
      }
    }
    
    if (!blocked) {
      r += y;
      c += x;
      update();
      lastAction = 0;
    } else if (y == -1) {
      place();
    }
  }
  
  void rotate (int d) {
    int init = state;
    if (type != O) {
      if (d == 1) {
        state = (state < 3) ? state + 1 : 0;
      } else {
        state = (state > 0) ? state - 1 : 3;
      }
      for (int i=0; i<4; i++) {
        blocks[i].r = r+blockMatrix[type][state][i][1];
        blocks[i].c = c+blockMatrix[type][state][i][0];
      }
    }
    
    boolean validSpace = false;
    int xkick = 0;
    int ykick = 0;
    int test = 0;
    if (type != O) {
      while (!validSpace && test < 5) {
        int table = int(type == I);
        int index = (d == 1) ? init : (init != 0 ) ? init - 1 : 3;
        xkick = wallKick[table][index][test][0]*d;
        ykick = wallKick[table][index][test][1]*d;
        
        validSpace = true;
        for (Block b: blocks) {
          if (blocked(b.r+ykick, b.c+xkick)) {
            validSpace = false;
            test++;
            break;
          }
        }
      }
    }
    
    if (validSpace) {
      move(xkick, ykick);
      lastAction = 1;
    } else {
      state = init;
    }
    update();
  }
  
  void place () {
    if (r == 20) {
      gameEnd();
    }
    for (Block b: blocks) {
      rows[b.r].cells[b.c].update(b);
      rows[b.r].filled++;
    }
    hardDrop = false;
    tetrominoPlaced();
  }
  
  void hardDrop () {
    hardDrop = true;
    int dist = 0;
    while (hardDrop == true) {
      move(0, -1);
      dist ++;
    }
    score += 2 * dist;
  }
  
  void display () {
    ghost.display();
    if (aboveBlock) {
      for (Block b: blocks) {
        if (b.y > -ui.matrixH) {
          noFill();
          stroke(0, 0, 100);
          strokeWeight(4);
          rect(b.x, b.y, cellW, cellW);
        }
      }
    }
    for (Block b: blocks) {
      b.display();
    }
  }
}

class Block {
  int r, c, type, hue;
  float x, y, x1, y1;
  Block (int r_, int c_, int t) {
    r = r_;
    c = c_;
    type = t;
    hue = blockHues[t];
    x = c * cellW; 
    y = -r * cellW - cellW;
    x1 = x + cellW;
    y1 = y + cellW;
  }
  
  void update () {
    x = c * cellW;
    y = -r * cellW - cellW;
    x1 = x + cellW;
    y1 = y + cellW;
  }
  
  void display () {
    if (r < 20) {
      noStroke();
      fill(hue, 80, 100);
      triangle(x, y, x1, y, x, y1);
      fill(hue, 100, 80);
      triangle(x, y1, x1, y, x1, y1);
      fill(hue, 90, 90);
      rect(x+cellW/8, y+cellW/8, cellW*0.75, cellW*0.75);
    }
  }
}

class GhostTetromino {
  int r = 0;
  int c = 4;
  int type;
  GhostBlock[] blocks = new GhostBlock[4];
  GhostTetromino (int t) {
    type = t;
    for (int i=0; i<4; i++) {
      blocks[i] = new GhostBlock(r+blockMatrix[t][0][i][1], c+blockMatrix[t][0][i][0]);
    }
    update(20, 4, 0);
  }
  
  void update (int r_, int c_, int s) {
    c = c_;
    int placePos = r_;
    
    boolean blocked = false;
    while (!blocked) {
      blocked = false;
      for (int i=0; i<4; i++) {
        if (blocked(placePos+blockMatrix[type][s][i][1], c+blockMatrix[type][s][i][0])) {
          blocked = true;
          placePos ++;
          break;
        }
      }
      if (!blocked) {
        placePos --;
      }
    }
    
    r = placePos;
    for (int i=0; i<4; i++) {
      blocks[i].r = r + blockMatrix[type][s][i][1];
      blocks[i].c = c + blockMatrix[type][s][i][0];
      blocks[i].update();
    } 
  }
  
  void display () {
    for (GhostBlock b: blocks) {
      b.display();
    }
  }
}

class GhostBlock {
  int r, c, type, hue;
  float x, x1, y, y1;
  GhostBlock (int r_, int c_) {
    r = r_;
    c = c_;
    x = c * cellW;
    x1 = c + cellW;
    y1 = -r * cellW;
    y = y1 - cellW;
  }
  
  void update () {
    x = c * cellW;
    x1 = x + cellW;
    y1 = -r * cellW;
    y = y1 - cellW;
  }
  
  void display () {
    if (r < 20) {
      noStroke();
      fill(0, 0, 0, 30);
      rect(x, y, cellW, cellW);
      fill(0, 0, 0, 20);
      rect(x+cellW/8, y+cellW/8, cellW*0.75, cellW*0.75);
    }
  }
}

void setNewTetromino () {
  tetromino = new Tetromino(bags[bag].get(0));
  bags[bag].remove(0);
  if (bags[bag].size() == 0) {
    for (int i=0; i<7; i++) {
      bags[bag].append(i);
    }
    bags[bag].shuffle();
    bag = (bag == 0) ? 1 : 0;
  }
  updatePreview();
  
  updateTimer = 100;
}

void updatePreview () {
  int count = 0;
  int[] queue = new int[4];
  for (int i: bags[bag]) {
    if (count > 3) {
      break;
    }
    queue[count] = i;
    count++;
  }
  for (int i: bags[(bag==0) ? 1 : 0]) {
    if (count > 3) {
      break;
    }
    queue[count] = i;
    count++;
  }
  
  for (int i=0; i<4; i++) {
    ui.preview[i] = new DisplayTetromino(540, 80+i*100, queue[i]);
  }
}

boolean blocked (int r, int c) {
  if (c < 0 || c > 9 || r < 0) {
    return true;
  } else if (rows[r].cells[c].blocked) {
    return true;
  } else {
    return false;
  }
}

void updateHold (int type) {
  if (!tetrominoHeld) {
    setNewTetromino();
    tetrominoHeld = true;
  } else {
    tetromino = new Tetromino(holdType);
  }
  holdType = type;
  ui.hold = new DisplayTetromino(540, 520, type);
  
  canHold = false;
}

void setUpdateSpeed () {
  updateSpeed = (level < 13) ? 65 - 5 * level : 2;
}

void mouseClicked () {
  if (gameState != 1) {
    if (mouseX > 300 && mouseY > 215 && mouseX < 330 && mouseY < 245) {
      baseLevel = (baseLevel > 1) ? baseLevel -  1 : 1;
    } else if (mouseX > 335 && mouseY > 215 && mouseX < 365 && mouseY < 245) {
      baseLevel ++;
    } else {
      gameStart();
    }
  } else {
    if (paused && mouseX > 180 && mouseY > 215 && mouseX < 260 && mouseY < 255) {
      reset();
      paused = false;
    } else {
      paused = (paused) ? false : true;
    }
  }
}

void keyPressed () {
  if (gameState == 1) {
    if (key == CODED) {
      switch (keyCode) {
        case LEFT:
          tetromino.move(-1, 0);
          break;
        case RIGHT:
          tetromino.move(1, 0);
          break;
        case UP:
          tetromino.rotate(1);
          break;
        case DOWN:
          tetromino.move(0, -1);
          score ++;
          break;
        case BACKSPACE:
          
      }
    } else {
      if (key == ' ') {
        tetromino.hardDrop();
      } else if (key == 'z' || key == ';') {
        tetromino.rotate(-1);
      } else if (key == 'x' || key == 'q') {
        tetromino.rotate(1);
      } else if (key == 'c' || key == 'j') {
        if (canHold) { 
          updateHold(tetromino.type); 
        }
      }
    }
  }
}

class ui {
  float edge = cellW/8;
  
  float matrixX = 20;
  float matrixY = 20;
  float matrixW = 400;
  float matrixH = 800;
  
  float previewBoxX = 440;
  float previewBoxY = 20;
  float previewBoxW = 200;
  float previewBoxH = 420;
  
  float holdBoxX = 440;
  float holdBoxY = 460;
  float holdBoxW = 200;
  float holdBoxH = 120;
  
  float scoreBoxX = 440;
  float scoreBoxY = 600;
  float scoreBoxW = 200;
  float scoreBoxH = 220;
  
  float mainTextX = matrixX+matrixW/2;
  float mainTextY = matrixY+matrixH/5 + cellW/2;
  
  int hue = 0;
  
  DisplayTetromino[] preview = new DisplayTetromino[4];
  DisplayTetromino hold;
  
  void box (int type, float x, float y, float w, float h) {
    rectMode(CORNER);
    noStroke();
    float x1 = x + w;
    float y1 = y + h;
    float edge2 = edge * 2;
    color light = color(hue, 35, 95);
    color border = color(hue, 50, 90);
    color dark = color(hue, 50, 80);
    color fill = color(hue, 10, 100);
    if (type == 0) {
      fill(light);
      rect(x, y, w, edge);
      rect(x, y, edge, h);
      fill(dark);
      rect(x1-edge, y+edge, edge, h-edge);
      rect(x+edge, y1-edge, w-edge, edge);
      triangle(x1, y, x1-edge2, y+edge2, x1, y+edge2);
      triangle(x, y1, x+edge2, y1, x+edge2, y1-edge2);
      fill(border);
      rect(x+edge, y+edge, w-edge2, h-edge2);
    } else {
      fill(dark);
      rect(x-edge, y-edge, w+edge2, edge);
      rect(x-edge, y-edge, edge, h+edge2);
      fill(light);
      rect(x1, y, edge, h+edge);
      rect(x, y1, w+edge, edge);
      triangle(x1+edge, y-edge, x1+edge, y+edge, x1-edge, y+edge);
      triangle(x-edge, y1+edge, x+edge, y1+edge, x+edge, y1-edge);
      fill(fill);
      rect(x, y, w, h);
    }
  }
  
  void grid () {
    stroke(hue, 10, 75);
    strokeWeight(2);
    for (int i=0; i<=10; i++) {
      line(matrixX+i*cellW, matrixY, matrixX+i*cellW, matrixY+matrixH);
    }
    for (int i=0; i<=20; i++) {
      line(matrixX, matrixY+i*cellW, matrixX+matrixW, matrixY+i*cellW);
    }
  }
  
  void displayPreview () {
    for (DisplayTetromino t: preview) {
      t.display();
    }
  }
  
  void displayScores (int y) {
    textAlign(CORNER);
    textSize(20);
    fill(0);
    for (int i=0; i<5; i++) {
      text((i+1)+": "+highscores[i], scoreBoxX+15, scoreBoxY+y+30+25*i);
    }
  }
  
  void displayLevelSelector () {
    textAlign(CENTER);
    textSize(30);
    fill(0);
    text("Level: "+baseLevel, mainTextX, mainTextY + 40);
    
    box(0, mainTextX + 80, mainTextY + 15, 30, 30);
    fill(0);
    text("-", mainTextX + 95, mainTextY + 38);
    box(0, mainTextX + 115, mainTextY + 15, 30, 30);
    fill(0);
    text("+", mainTextX + 130, mainTextY + 38);
  }
}

class DisplayTetromino {
  float x, y;
  int type;
  Block[] blocks=new Block[4];
  DisplayTetromino (float x_, float y_, int t) {
    x = (!(t == 0 || t == 3)) ? x_-cellW/2 : x_-cellW;
    y = (t != 0) ? y_+cellW : y_+cellW/2;
    type = t;
    for (int i=0; i<4; i++) {
      blocks[i] = new Block(blockMatrix[t][0][i][1], blockMatrix[t][0][i][0], t);
    }
  }
  
  void display () {
    pushMatrix();
    translate(x, y);
    for (Block b: blocks) {
      b.display();
    }
    popMatrix();
  }
}