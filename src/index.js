var urlIcon = require("file!./assets/icon.png");
var urlAsteroid = require("file!./assets/asteroidIcon.png");
var urlFail1 = require("file!./assets/fail1.m4a");
var urlFail2 = require("file!./assets/fail2.m4a");
var urlFail3 = require("file!./assets/fail3.m4a");
var urlFail4 = require("file!./assets/fail4.m4a");
var urlFail5 = require("file!./assets/fail5.m4a");
var urlFail6 = require("file!./assets/fail6.m4a");
var urlFail7 = require("file!./assets/fail7.m4a");
var urlFail8 = require("file!./assets/fail8.m4a");
var urlFail9 = require("file!./assets/fail9.m4a");
var urlMusic = require("file!./assets/nyan.m4a");
var urlLaser = require("file!./assets/laser.m4a");
console.log(urlIcon);

'use strict';
var moment = require('moment'),
Ship = require('./ship'),
BoundingBox = require('./boundingBox'),
Obstacle = require('./obstacle'),
TraceElement = require('./traceElement'),
GameState = require('./gameState'),
Projectile = require('./projectile'),
GameResources = require('./gameResources');

var context2D, canvas;
var gameSpeed = 1;
var lastFrame = moment();
var lastShot = moment();
var lastAddedProjectile = moment();
var colorArray = ["red", "orange", "yellow", "green", "blue"];
var canvas, context2D;
var keys = {};
var listener;
var gameState;
if (localStorage.getItem('localHighScore')){var highScore = parseInt(localStorage.getItem('localHighScore'));} else {  var highScore = 0;}
if (localStorage.getItem('localTotalAttemps')){var totalAttemps = parseInt(localStorage.getItem('localTotalAttemps'));} else {  var totalAttemps = 0;}
if (localStorage.getItem('localTotalTime')){var totalTime = parseInt(localStorage.getItem('localTotalTime'));} else {  var totalTime = 0;}
if (localStorage.getItem('localShortestGame')){var shortestGame = parseInt(localStorage.getItem('localShortestGame'));} else {  var shortestGame = -1;}


var resources = new GameResources({
  images: {
    asteroid: urlAsteroid,
    ship: urlIcon
  },
  sounds: {
    music: urlMusic,
    laser: urlLaser,
  },
  fails : {
    fail1: urlFail1,
    fail2: urlFail2,
    fail3: urlFail3,
    fail4: urlFail4,
    fail5: urlFail5,
    fail6: urlFail6,
    fail7: urlFail7,
    fail8: urlFail8,
    fail9: urlFail9
  }
});

var resourcesLoaded = resources.load();

document.addEventListener('DOMContentLoaded', function() {
  canvas = document.getElementById("myCanvas");
  context2D = canvas.getContext("2d");
  document.onkeydown = function(event) {
    keys[event.code] = true;
  };
  document.onkeyup = function(event) {keys[event.code] = false;};
  document.addEventListener("keydown", function(e) {
    if (e.keyCode == 13) {
      toggleFullScreen();
    }
  }, false);
});

function startGame(){
  resourcesLoaded.then(function() {
    var difficultyElement = document.getElementById('defaultSlider');
    var overlay = document.getElementById('overlay');
    overlay.style.display = 'none';
    gameState =  new GameState([0,0], [801,801], difficultyElement.value);
    gameSpeed = 0.8 + 0.2 * gameState.difficulty;
    resources.sounds.music.load();
    resources.sounds.music.play();
    listener = setInterval(function(){
      drawCanvas();
      gameTick();
    }, 10);
  });
}

function displayStats(){
  writeStats();
  var statsOverlay = document.getElementById('statsOverlay');
  statsOverlay.style.display = 'block';
}
function undisplayStats(){
  var statsOverlay = document.getElementById('statsOverlay');
  statsOverlay.style.display = 'none';
}

function gameOver(){
  var overlay = document.getElementById('overlay');
  var highScoreButton = document.getElementById('button1');
  var scoreButton = document.getElementById('button2');
  var gameOverBlink = document.getElementById('gameOver');



  resources.sounds.music.pause();
  resources.sounds.music.load();
  var keys = Object.keys(resources.fails);
  var randomSound =  resources.fails[keys[keys.length*Math.random() << 0]];
  console.log(randomSound);
  randomSound.play();
  clearInterval(listener);
  var score = Math.floor((moment()-gameState.beginTime)/10)/100;
  if (score > highScore){
    highScore = score;
    gameOverBlink.innerHTML = "NEW HIGH SCORE"
    gameOverBlink.style.color = "green";
    localStorage.setItem('localHighScore', highScore);
  } else {
    gameOverBlink.innerHTML = "GAME OVER"
    gameOverBlink.style.color = "red";
  }
  if(shortestGame < 0 || score < shortestGame){
    shortestGame = score;
    localStorage.setItem('localShortestGame', shortestGame);
  }
  totalTime += score;
  overlay.style.display = 'block';
  localStorage.setItem('localTotalTime', totalTime);
  totalAttemps += 1;
  localStorage.setItem('localTotalAttemps', totalAttemps);

  highScoreButton.style.visibility = 'visible';
  scoreButton.style.visibility = 'visible';
  gameOverBlink.style.visibility = 'visible';

  scoreButton.innerHTML = "Score: " + score + " s";
  highScoreButton.innerHTML = "Highscore: " + localStorage.getItem('localHighScore') + " s";

  writeStats();

}
function drawCanvas(){

  var rgb1 = makeColorGradient(0.6,0.6,0.6, 0,2,4, (moment()-gameState.beginTime)/1000);
  var rgb2 = makeColorGradient(0.6,0.6,0.6, 0,2,4, (moment()-gameState.beginTime+1000)/1000);

  var backgroundColor1 = RGB2Color(rgb1[0], rgb1[1], rgb1[2]);
  var backgroundColor2 = RGB2Color(rgb2[0], rgb2[1], rgb2[2]);


  var linear = context2D.createLinearGradient(0,400, 400,0);
  linear.addColorStop(0,backgroundColor1);
  linear.addColorStop(1,backgroundColor2);


  context2D.clearRect(0, 0, canvas.width, canvas.height);

  context2D.fillStyle = linear;
  context2D.fillRect(0,0,800, 800);

    context2D.fillStyle = "white";
  for(var i = 0; i < gameState.obstacles.length; i++) {
    context2D.drawImage(resources.images.asteroid, gameState.obstacles[i].position[0], gameState.obstacles[i].position[1]);
  }
  for(var i = 0; i < gameState.projectiles.length; i++) {
    context2D.fillStyle = gameState.projectiles[i].color;
    context2D.fillRect(gameState.projectiles[i].position[0], gameState.projectiles[i].position[1], 12, 6);
  }

  context2D.fillStyle = backgroundColor1;

  context2D.fillStyle = "white";
  context2D.font = "25px Arial";
  context2D.fillText(Math.floor((moment()-gameState.beginTime)/10)/100 + " s",725,28);
  context2D.fillText(gameState.shootsLeft + " shoots left",20,780);

  for(var i = 0; i < gameState.trail.length; i++) {
    context2D.fillStyle = colorArray[0];
    context2D.fillRect(gameState.trail[i].position[0]+5, gameState.trail[i].position[1], 6, 4);
    context2D.fillStyle = colorArray[1];
    context2D.fillRect(gameState.trail[i].position[0]+5, gameState.trail[i].position[1]+4, 6, 4);
    context2D.fillStyle = colorArray[2];
    context2D.fillRect(gameState.trail[i].position[0]+5, gameState.trail[i].position[1]+8, 6, 4);
    context2D.fillStyle = colorArray[3];
    context2D.fillRect(gameState.trail[i].position[0]+5, gameState.trail[i].position[1]+12, 6, 4);
    context2D.fillStyle = colorArray[4];
    context2D.fillRect(gameState.trail[i].position[0]+5, gameState.trail[i].position[1]+16, 6, 4);
  }
  context2D.drawImage(resources.images.ship, Math.round(gameState.ship.position[0]-5), Math.round(gameState.ship.position[1])-5);

}

function gameTick(){
  moveThings();
  if(keys.ArrowUp) {
    if(gameState.ship.speed[1] >= -40){
      gameState.ship.speed[1] -= 0.8;
    }
  } else {
    if(gameState.ship.speed[1] <= -0.5){gameState.ship.speed[1]+=1.2;}
    else if (gameState.ship.speed[1] <= 0.5) {gameState.ship.speed[1]=0;}
  }
  if(keys.ArrowRight) {
    if(gameState.ship.speed[1] <= 40){
      gameState.ship.speed[0] += 0.8;
    }
  } else {
    if(gameState.ship.speed[0] >= 0.5){gameState.ship.speed[0]-=1.2;}
    else if (gameState.ship.speed[0] >= -0.5) {gameState.ship.speed[0]=0;}
  }
  if(keys.ArrowLeft) {
    if(gameState.ship.speed[1] >= -40){
      gameState.ship.speed[0] -= 0.8;
    }
  } else {
    if(gameState.ship.speed[0] <= -0.5){gameState.ship.speed[0]+=1.2;}
    else if (gameState.ship.speed[0] <= 0.5) {gameState.ship.speed[0]=0;}
  }
  if(keys.ArrowDown) {
    if(gameState.ship.speed[1] <= 40){
      gameState.ship.speed[1] += 0.8;
    }
  } else {
    if(gameState.ship.speed[1] >= 0.5){gameState.ship.speed[1]-=1.2;}
    else if (gameState.ship.speed[1] >= -0.5) {gameState.ship.speed[1]=0;}
  }
  if(keys.Space) {
    if(moment() - lastShot >= 200 && gameState.shootsLeft > 0) {
      shoot();
      lastShot = moment();
      gameState.addShoot(-1);
    }
  }
  addTraceElement();
  checkCollisionShip();
  checkCollisionProjectiles();
  gameState.ship.move(moment()-lastFrame, gameSpeed);
  addObstacle();
  addProjectile();
  gameState.cleanse();
  lastFrame = moment();
}
function checkCollisionShip(){
  for (var i = 0; i < gameState.obstacles.length; i++) {
    if (gameState.ship.position[0] < gameState.obstacles[i].position[0] + gameState.obstacles[i].width && gameState.ship.position[0] + 20 > gameState.obstacles[i].position[0] && gameState.ship.position[1] < gameState.obstacles[i].position[1] +gameState.obstacles[i].height && gameState.ship.position[1]+20 > gameState.obstacles[i].position[1] ){
      gameOver();
    }
  }
}
function checkCollisionProjectiles(){
  for (var i = 0; i < gameState.obstacles.length; i++) {
    for (var j = 0; j < gameState.projectiles.length; j++) {
      if(Math.sqrt(Math.pow((gameState.obstacles[i].position[0] + gameState.obstacles[i].width/2) - (gameState.projectiles[j].position[0]+2) ,2) + Math.pow((gameState.obstacles[i].position[1]+gameState.obstacles[i].height/2) - (gameState.projectiles[j].position[1]+2),2)) <= Math.sqrt(Math.pow(gameState.obstacles[i].width/2 + 4,2)+Math.pow(gameState.obstacles[i].height/2+2,2))) {
        gameState.projectiles.splice(j,1);
        gameState.obstacles.splice(i,1);
      }
    }
  }
}
function addObstacle(){
  gameState.obstacles.push(new Obstacle(800,Math.random()*(15000-6000*Math.sqrt(gameState.difficulty))));
  gameState.obstacles.push(new Obstacle(800,Math.random()*(15000-6000*Math.sqrt(gameState.difficulty))));
}
function restart(){

}
function shoot(){
  gameState.projectiles.push(new Projectile(gameState.ship.position[0],gameState.ship.position[1]+10, colorArray[Math.floor(Math.random()*5)]));
  resources.sounds.laser.play();
}

function addProjectile(){
  if(moment() - lastAddedProjectile > Math.floor((2000/gameSpeed)+1500*(gameState.difficulty-1))){
    gameState.addShoot(+1);
    lastAddedProjectile = moment();
  }
}
function addTraceElement(){
  gameState.trail.push(new TraceElement(gameState.ship.position[0]-5, gameState.ship.position[1]));
}

function moveThings(){
  for(var i = 0; i < gameState.obstacles.length; i++) {
    gameState.obstacles[i].move(gameSpeed);
  }
  for(var i = 0; i < gameState.projectiles.length; i++) {
    gameState.projectiles[i].move(gameSpeed);
  }
  for(var i = 0; i < gameState.trail.length; i++) {
    gameState.trail[i].move(gameSpeed);
  }
}

function makeColorGradient(frequency1, frequency2, frequency3,
  phase1, phase2, phase3, time){
    var center = 128;
    var width = 127;

    var red = Math.sin(frequency1*time + phase1) * width + center;
    var grn = Math.sin(frequency2*time + phase2) * width + center;
    var blu = Math.sin(frequency3*time + phase3) * width + center;
    return [red, grn, blu];
  }
  function RGB2Color(r,g,b) {
    return '#' + byte2Hex(r) + byte2Hex(g) + byte2Hex(b);
  }
  function byte2Hex(n)
  {
    var nybHexString = "0123456789ABCDEF";
    return String(nybHexString.substr((n >> 4) & 0x0F,1)) + nybHexString.substr(n & 0x0F,1);
  }
  function toggleFullScreen() {
  if (!document.fullscreenElement &&    // alternative standard method
      !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {  // current working methods
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}

function writeStats(){
  var statHigh = document.getElementById('high');
  var statTotalA = document.getElementById('totalA');
  var statTotalT = document.getElementById('totalT');
  var statShortest = document.getElementById('shortest');

  statHigh.innerHTML = "Highscore: " + localStorage.getItem('localHighScore') + " s";
  statTotalT.innerHTML = "Total time played: " + localStorage.getItem('localTotalTime') + " s";
  statTotalA.innerHTML = "Total attemps: " + localStorage.getItem('localTotalAttemps');
  statShortest.innerHTML = "Shortest Game: " + localStorage.getItem('localShortestGame') + " s";
}
window.startGame = startGame;
window.displayStats = displayStats;
window.undisplayStats = undisplayStats;
