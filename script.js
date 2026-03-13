let characters = []
let roundQueue = []
let roundIndex = 0
let currentCharacter = null
let currentImg = null

let attempt = 1
const maxAttempts = 3
const zoomLevels = [4.5, 2.8, 1.5]
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

let roundCorrect = 0
let roundWrong = 0

const image        = document.getElementById("characterImage")
const categoryText = document.getElementById("animeCategory")
const resultText   = document.getElementById("result")
const attemptInfo  = document.getElementById("attemptInfo")
const scoreBoard   = document.getElementById("scoreBoard")
const nextBtn      = document.getElementById("nextBtn")
const skipBtn      = document.getElementById("skipBtn")

// ── HELPERS ───────────────────────────────────────────────────────
async function loadCharacters(){
  const res = await fetch("characters.json")
  characters = await res.json()
}

function shuffle(arr){
  let a = [...arr]
  for(let i = a.length-1; i>0; i--){
    let j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]]
  }
  return a
}

function buildQueue(){
  roundQueue = shuffle(characters).slice(0, Math.min(60, characters.length))
  roundIndex = 0
  roundCorrect = 0
  roundWrong = 0
}

function isCorrectGuess(guess){
  const g = guess.trim().toLowerCase()
  return currentCharacter.names.some(n => n.toLowerCase() === g)
}

function displayName(){
  return currentCharacter.names[0]
}

function randomImg(character){
  const imgs = character.imgs
  return imgs[Math.floor(Math.random() * imgs.length)]
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
  if(roundIndex >= roundQueue.length){
    showRoundSummary()
    return
  }

  currentCharacter = roundQueue[roundIndex++]
  currentImg = randomImg(currentCharacter)

  attempt = 1
  p1Locked = false
  p2Locked = false
  p1Correct = false
  p2Correct = false

  const tempImg = new Image()
  tempImg.onload = function(){
    image.style.transition = "none"
    image.src = currentImg
    setZoom(zoomLevels[0], false)
    categoryText.innerText = "Category: " + currentCharacter.anime
  }
  tempImg.src = currentImg

  resultText.innerText = ""
  nextBtn.style.display = "none"
  skipBtn.style.display = "inline-block"

  if(mode === "solo"){
    document.getElementById("guessInput").value = ""
  } else {
    resetMultiInputs()
  }

  updateAttemptInfo()
}

function setZoom(z, animate = true){
  if(animate){
    image.style.transition = "transform 0.6s ease"
  } else {
    image.style.transition = "none"
  }
  image.style.transform = "scale(" + z + ")"
  let ox = 25 + Math.random() * 50
  let oy = 15 + Math.random() * 70
  image.style.transformOrigin = ox + "% " + oy + "%"
}

function revealFull(){
  image.style.transition = "transform 0.6s ease"
  image.style.transform = "scale(1)"
  image.style.transformOrigin = "center center"
  skipBtn.style.display = "none"
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

// ── SKIP ──────────────────────────────────────────────────────────
function skipAttempt(){
  if(attempt >= maxAttempts){
    roundWrong++
    revealFull()
    resultText.innerText = "⏭ Skipped! It was " + displayName()
    nextBtn.style.display = "inline-block"
    skipBtn.style.display = "none"
    if(mode === "multi") resetMultiInputs()
    return
  }
  attempt++
  updateAttemptInfo()
  setZoom(zoomLevels[attempt - 1], true)
  resultText.innerText = "⏭ Skipped to attempt " + attempt
    + " — max " + pointsPerAttempt[attempt - 1] + " pts now"

  if(mode === "solo"){
    document.getElementById("guessInput").value = ""
  } else {
    resetMultiInputs()
  }

  if(attempt >= maxAttempts){
    skipBtn.style.display = "none"
  }
}

// ── SOLO ──────────────────────────────────────────────────────────
function submitSolo(){
  if(!currentCharacter) return
  const guess = document.getElementById("guessInput").value
  if(!guess.trim()) return

  if(isCorrectGuess(guess)){
    roundCorrect++
    const pts = pointsPerAttempt[attempt - 1]
    p1Score += pts
    updateScoreBoard()
    revealFull()
    resultText.innerText = "✅ Correct! It was " + displayName() + "  (+" + pts + " pts)"
    nextBtn.style.display = "inline-block"
  } else {
    if(attempt < maxAttempts){
      attempt++
      updateAttemptInfo()
      setZoom(zoomLevels[attempt - 1], true)
      resultText.innerText = "❌ Wrong! Attempt " + attempt
      document.getElementById("guessInput").value = ""
      if(attempt >= maxAttempts) skipBtn.style.display = "none"
    } else {
      roundWrong++
      revealFull()
      resultText.innerText = "❌ Out of attempts! It was " + displayName()
      nextBtn.style.display = "inline-block"
    }
  }
}

// ── MULTIPLAYER ───────────────────────────────────────────────────
function submitP1(){
  if(p1Locked) return
  const guess = document.getElementById("p1Input").value
  if(!guess.trim()) return
  p1Locked = true
  document.getElementById("p1Input").disabled = true
  p1Correct = isCorrectGuess(guess)
  document.getElementById("p1Status").innerText = p1Correct ? "✅" : "❌"
  checkBothGuessed()
}

function submitP2(){
  if(p2Locked) return
  const guess = document.getElementById("p2Input").value
  if(!guess.trim()) return
  p2Locked = true
  document.getElementById("p2Input").disabled = true
  p2Correct = isCorrectGuess(guess)
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
    roundCorrect++
    revealFull()
    let msg = ""
    if(p1Correct && p2Correct) msg = "🎉 Both correct! +" + pts + " pts each"
    else if(p1Correct)         msg = "🎉 " + p1Name + " got it! +" + pts + " pts"
    else                       msg = "🎉 " + p2Name + " got it! +" + pts + " pts"
    resultText.innerText = msg + "  —  " + displayName()
    nextBtn.style.display = "inline-block"
  } else {
    if(attempt < maxAttempts){
      attempt++
      updateAttemptInfo()
      setZoom(zoomLevels[attempt - 1], true)
      resultText.innerText = "❌ Both wrong! Attempt " + attempt
      resetMultiInputs()
      if(attempt >= maxAttempts) skipBtn.style.display = "none"
    } else {
      roundWrong++
      revealFull()
      resultText.innerText = "❌ Both out! It was " + displayName()
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

// ── NEXT / SUMMARY ────────────────────────────────────────────────
function nextRound(){
  if(roundIndex >= roundQueue.length){
    showRoundSummary()
    return
  }
  beginRound()
}

function showRoundSummary(){
  document.getElementById("gameContainer").style.display = "none"
  document.getElementById("soloGuess").style.display = "none"
  document.getElementById("multiGuess").style.display = "none"
  document.getElementById("animeCategory").style.display = "none"
  skipBtn.style.display = "none"
  nextBtn.style.display = "none"
  attemptInfo.innerText = ""
  scoreBoard.innerText = ""

  let summary = ""
  if(mode === "solo"){
    summary = `
      <h2>Round Over!</h2>
      <p>✅ Correct: <strong>${roundCorrect}</strong></p>
      <p>❌ Wrong / Skipped: <strong>${roundWrong}</strong></p>
      <p>🏆 Final Score: <strong>${p1Score}</strong></p>
      <button onclick="restartGame()">Play Again</button>
    `
  } else {
    const winner = p1Score > p2Score
      ? "👑 " + p1Name + " wins!"
      : p2Score > p1Score
      ? "👑 " + p2Name + " wins!"
      : "🤝 It's a tie!"
    summary = `
      <h2>Round Over!</h2>
      <p>✅ Correct rounds: <strong>${roundCorrect}</strong></p>
      <p>❌ Wrong / Skipped rounds: <strong>${roundWrong}</strong></p>
      <p>🏆 ${p1Name}: <strong>${p1Score}</strong> pts</p>
      <p>🏆 ${p2Name}: <strong>${p2Score}</strong> pts</p>
      <p><strong>${winner}</strong></p>
      <button onclick="restartGame()">Play Again</button>
    `
  }

  resultText.innerHTML = summary
}

function restartGame(){
  document.getElementById("gameContainer").style.display = "block"
  document.getElementById("animeCategory").style.display = "block"
  document.getElementById("gameScreen").style.display = "none"
  document.getElementById("modeScreen").style.display = "block"
  resultText.innerHTML = ""
  p1Score = 0
  p2Score = 0
  roundCorrect = 0
  roundWrong = 0
}

// ── ENTER KEY ─────────────────────────────────────────────────────
document.getElementById("guessInput").addEventListener("keydown", function(e){
  if(e.key === "Enter") submitSolo()
})

document.getElementById("p1Input").addEventListener("keydown", function(e){
  if(e.key === "Enter") submitP1()
})

document.getElementById("p2Input").addEventListener("keydown", function(e){
  if(e.key === "Enter") submitP2()
})

// ── INIT ──────────────────────────────────────────────────────────
loadCharacters()