let characters = []
let roundQueue = []         // shuffled list of 20 (or all) for this round
let roundIndex = 0          // which one we're on
let currentCharacter = null

let attempt = 1
const maxAttempts = 3
const zoomLevels = [4.5, 2.8, 1.5]   // attempt 1 = very zoomed, 3 = nearest
const pointsPerAttempt = [4, 2, 1]

let mode = "solo"
let p1Name = "Player 1"
let p2Name = "Player 2"
let p1Score = 0
let p2Score = 0
let p1Locked = false
let p2Locked = false
let p1Correct = false
let p2Correct = false

const image        = document.getElementById("characterImage")
const categoryText = document.getElementById("animeCategory")
const resultText   = document.getElementById("result")
const attemptInfo  = document.getElementById("attemptInfo")
const scoreBoard   = document.getElementById("scoreBoard")
const nextBtn      = document.getElementById("nextBtn")

// ── LOAD ──────────────────────────────────────────────────────────
async function loadCharacters(){
  const res = await fetch("characters.json")
  characters = await res.json()
}

// ── SHUFFLE UTILITY ───────────────────────────────────────────────
function shuffle(arr){
  let a = [...arr]
  for(let i = a.length - 1; i > 0; i--){
    let j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Build a shuffled queue of up to 20 characters, no repeats
function buildQueue(){
  let shuffled = shuffle(characters)
  roundQueue = shuffled.slice(0, Math.min(20, shuffled.length))
  roundIndex = 0
}

// ── MODE SELECT ───────────────────────────────────────────────────
function setSolo(){
  mode = "solo"
  document.getElementById("modeScreen").style.display = "none"
  document.getElementById("gameScreen").style.display = "block"
  document.getElementById("soloGuess").style.display = "block"
  document.getElementById("multiGuess").style.display = "none"
  p1Score = 0
  updateScoreBoard()
  buildQueue()
  beginRound()
}

function setMulti(){
  mode = "multi"
  document.getElementById("modeScreen").style.display = "none"
  document.getElementById("multiSetup").style.display = "block"
}

function startMulti(){
  p1Name = document.getElementById("p1Name").value.trim() || "Player 1"
  p2Name = document.getElementById("p2Name").value.trim() || "Player 2"
  document.getElementById("p1Label").innerText = p1Name
  document.getElementById("p2Label").innerText = p2Name
  p1Score = 0
  p2Score = 0
  document.getElementById("multiSetup").style.display = "none"
  document.getElementById("gameScreen").style.display = "block"
  document.getElementById("soloGuess").style.display = "none"
  document.getElementById("multiGuess").style.display = "flex"
  updateScoreBoard()
  buildQueue()
  beginRound()
}

// ── ROUND ─────────────────────────────────────────────────────────
function beginRound(){
  // If we've used all characters, reshuffle
  if(roundIndex >= roundQueue.length){
    buildQueue()
  }

  currentCharacter = roundQueue[roundIndex]
  roundIndex++

  attempt = 1
  p1Locked = false
  p2Locked = false
  p1Correct = false
  p2Correct = false

  // preload image silently, then set zoom AFTER it loads
  // this prevents the "zoom out flash" on image swap
  const tempImg = new Image()
  tempImg.onload = function(){
    image.style.transition = "none"         // no transition while setting up
    image.src = currentCharacter.img
    setZoom(zoomLevels[0], false)           // snap instantly, no animation
    categoryText.innerText = "Category: " + currentCharacter.anime
  }
  tempImg.src = currentCharacter.img

  resultText.innerText = ""
  nextBtn.style.display = "none"

  if(mode === "solo"){
    document.getElementById("guessInput").value = ""
  } else {
    resetMultiInputs()
  }

  updateAttemptInfo()
}

// setZoom(value, animate)
// animate=false = instant snap, animate=true = smooth transition
function setZoom(z, animate = true){
  currentZoom = z
  if(animate){
    image.style.transition = "transform 0.6s ease"
  } else {
    image.style.transition = "none"
  }
  image.style.transform = "scale(" + z + ")"

  // random origin so it shows a random crop each round
  let ox = 25 + Math.random() * 50
  let oy = 15 + Math.random() * 70
  image.style.transformOrigin = ox + "% " + oy + "%"
}

function revealFull(){
  image.style.transition = "transform 0.6s ease"
  image.style.transform = "scale(1)"
  image.style.transformOrigin = "center center"
}

function updateAttemptInfo(){
  attemptInfo.innerText = "Attempt " + attempt + " / " + maxAttempts
    + "   •   Round " + roundIndex + " / " + roundQueue.length
}

function updateScoreBoard(){
  if(mode === "solo"){
    scoreBoard.innerText = "Score: " + p1Score
  } else {
    scoreBoard.innerText = p1Name + ": " + p1Score + "   |   " + p2Name + ": " + p2Score
  }
}

// ── SOLO ──────────────────────────────────────────────────────────
function submitSolo(){
  if(!currentCharacter) return
  const guess = document.getElementById("guessInput").value.trim().toLowerCase()
  if(!guess) return

  if(guess === currentCharacter.name.toLowerCase()){
    const pts = pointsPerAttempt[attempt - 1]
    p1Score += pts
    updateScoreBoard()
    revealFull()
    resultText.innerText = "✅ Correct! It was " + currentCharacter.name + "  (+" + pts + " pts)"
    nextBtn.style.display = "inline-block"

  } else {
    if(attempt < maxAttempts){
      attempt++
      updateAttemptInfo()
      // snap directly to next zoom level, no flash
      setZoom(zoomLevels[attempt - 1], true)
      resultText.innerText = "❌ Wrong! Zoom out — attempt " + attempt
      document.getElementById("guessInput").value = ""
    } else {
      revealFull()
      resultText.innerText = "❌ Out of attempts! It was " + currentCharacter.name
      nextBtn.style.display = "inline-block"
    }
  }
}

// ── MULTIPLAYER ───────────────────────────────────────────────────
function submitP1(){
  if(p1Locked) return
  const guess = document.getElementById("p1Input").value.trim().toLowerCase()
  if(!guess) return
  p1Locked = true
  document.getElementById("p1Input").disabled = true
  p1Correct = guess === currentCharacter.name.toLowerCase()
  document.getElementById("p1Status").innerText = p1Correct ? "✅" : "❌"
  checkBothGuessed()
}

function submitP2(){
  if(p2Locked) return
  const guess = document.getElementById("p2Input").value.trim().toLowerCase()
  if(!guess) return
  p2Locked = true
  document.getElementById("p2Input").disabled = true
  p2Correct = guess === currentCharacter.name.toLowerCase()
  document.getElementById("p2Status").innerText = p2Correct ? "✅" : "❌"
  checkBothGuessed()
}

function checkBothGuessed(){
  if(!p1Locked || !p2Locked) return

  const pts = pointsPerAttempt[attempt - 1]
  if(p1Correct) p1Score += pts
  if(p2Correct) p2Score += pts
  updateScoreBoard()

  if(p1Correct || p2Correct){
    revealFull()
    let msg = ""
    if(p1Correct && p2Correct) msg = "🎉 Both correct! +" + pts + " pts each"
    else if(p1Correct)         msg = "🎉 " + p1Name + " got it! +" + pts + " pts"
    else                       msg = "🎉 " + p2Name + " got it! +" + pts + " pts"
    resultText.innerText = msg + "  —  " + currentCharacter.name
    nextBtn.style.display = "inline-block"

  } else {
    if(attempt < maxAttempts){
      attempt++
      updateAttemptInfo()
      setZoom(zoomLevels[attempt - 1], true)   // smooth zoom, no flash
      resultText.innerText = "❌ Both wrong! Attempt " + attempt
      resetMultiInputs()
    } else {
      revealFull()
      resultText.innerText = "❌ Both out! It was " + currentCharacter.name
      nextBtn.style.display = "inline-block"
    }
  }
}

function resetMultiInputs(){
  p1Locked = false
  p2Locked = false
  p1Correct = false
  p2Correct = false
  document.getElementById("p1Input").value = ""
  document.getElementById("p2Input").value = ""
  document.getElementById("p1Input").disabled = false
  document.getElementById("p2Input").disabled = false
  document.getElementById("p1Status").innerText = ""
  document.getElementById("p2Status").innerText = ""
}

function nextRound(){
  beginRound()
}

// ── INIT ──────────────────────────────────────────────────────────
loadCharacters()