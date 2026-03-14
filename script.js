let characters = []
let roundQueue = []
let roundIndex = 0
let currentCharacter = null
let currentImg = null

let attempt = 1
let maxAttempts = 3
let zoomLevels = [4.5, 2.8, 1.5]
let pointsPerAttempt = [4, 2, 1]
let roundSize = 60

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

// settings
let settingMaxAttempts = 3
let settingRoundSize = 60
let settingPoints = [4, 2, 1]
let settingEnabledCategories = []   // filled after load

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
  // collect all unique categories
  const cats = [...new Set(characters.map(c => c.anime))]
  settingEnabledCategories = [...cats]
  buildCategoryCheckboxes(cats)
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
  const filtered = characters.filter(c => settingEnabledCategories.includes(c.anime))
  roundQueue = shuffle(filtered).slice(0, Math.min(settingRoundSize, filtered.length))
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

function focusInput(){
  if(mode === "solo"){
    const inp = document.getElementById("guessInput")
    inp.focus()
    inp.select()
  }
}

// ── SCREENS ───────────────────────────────────────────────────────
function showScreen(id){
  const screens = ["modeScreen","multiSetup","gameScreen","settingsScreen"]
  screens.forEach(s => document.getElementById(s).style.display = "none")
  document.getElementById(id).style.display = "block"
}

// ── MODE SELECT ───────────────────────────────────────────────────
function setSolo(){
  mode = "solo"
  applySettings()
  showScreen("gameScreen")
  document.getElementById("soloGuess").style.display = "block"
  document.getElementById("multiGuess").style.display = "none"
  document.getElementById("settingsBtn").style.display = "inline-block"
  p1Score = 0
  updateScoreBoard()
  buildQueue()
  beginRound()
}

function setMulti(){
  mode = "multi"
  showScreen("multiSetup")
}

function startMulti(){
  p1Name = document.getElementById("p1Name").value.trim() || "Player 1"
  p2Name = document.getElementById("p2Name").value.trim() || "Player 2"
  document.getElementById("p1Label").innerText = p1Name
  document.getElementById("p2Label").innerText = p2Name
  p1Score = 0
  p2Score = 0
  showScreen("gameScreen")
  document.getElementById("soloGuess").style.display = "none"
  document.getElementById("multiGuess").style.display = "flex"
  document.getElementById("settingsBtn").style.display = "none"
  updateScoreBoard()
  buildQueue()
  beginRound()
}

// ── SETTINGS ──────────────────────────────────────────────────────
function openSettings(){
  showScreen("settingsScreen")
  // populate fields with current settings
  document.getElementById("setAttempts").value = settingMaxAttempts
  document.getElementById("setRoundSize").value = settingRoundSize
  updatePointFields(settingMaxAttempts)
}

function applySettings(){
  settingMaxAttempts = parseInt(document.getElementById("setAttempts")?.value) || 3
  settingRoundSize   = parseInt(document.getElementById("setRoundSize")?.value) || 60
  maxAttempts = settingMaxAttempts

  // read points fields
  settingPoints = []
  zoomLevels = []
  const baseZooms = [4.5, 3.5, 2.8, 2.2, 1.8, 1.5]
  for(let i = 0; i < maxAttempts; i++){
    const pts = parseInt(document.getElementById("pts_" + i)?.value) || (maxAttempts - i)
    settingPoints.push(pts)
    zoomLevels.push(baseZooms[i] || 1.5)
  }
  pointsPerAttempt = settingPoints

  // read categories
  settingEnabledCategories = []
  document.querySelectorAll(".catCheck:checked").forEach(cb => {
    settingEnabledCategories.push(cb.value)
  })
  if(settingEnabledCategories.length === 0){
    // if nothing checked, enable all
    settingEnabledCategories = [...new Set(characters.map(c => c.anime))]
  }
}

function saveSettings(){
  applySettings()
  showScreen("gameScreen")
  focusInput()
}

function updatePointFields(n){
  n = parseInt(n)
  const container = document.getElementById("pointFields")
  container.innerHTML = ""
  const defaults = [4, 2, 1, 1, 1, 1]
  for(let i = 0; i < n; i++){
    const val = settingPoints[i] !== undefined ? settingPoints[i] : (defaults[i] || 1)
    container.innerHTML += `
      <div>
        <label>Attempt ${i+1} points:</label>
        <input type="number" id="pts_${i}" value="${val}" min="0" max="99" style="width:60px">
      </div>`
  }
}

function buildCategoryCheckboxes(cats){
  const container = document.getElementById("categoryChecks")
  if(!container) return
  container.innerHTML = ""
  cats.forEach(cat => {
    container.innerHTML += `
      <label style="display:block;margin:4px 0">
        <input type="checkbox" class="catCheck" value="${cat}" checked>
        ${cat}
      </label>`
  })
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

  // auto focus input
  setTimeout(() => focusInput(), 100)
}

function setZoom(z, animate = true){
  image.style.transition = animate ? "transform 0.6s ease" : "none"
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
    // auto next after 2s
    setTimeout(() => beginRound(), 2000)
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

  if(attempt >= maxAttempts) skipBtn.style.display = "none"

  setTimeout(() => focusInput(), 100)
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
    // auto next after 1.5s
    setTimeout(() => beginRound(), 1500)

  } else {
    if(attempt < maxAttempts){
      attempt++
      updateAttemptInfo()
      setZoom(zoomLevels[attempt - 1], true)
      resultText.innerText = "❌ Wrong! Attempt " + attempt
      document.getElementById("guessInput").value = ""
      if(attempt >= maxAttempts) skipBtn.style.display = "none"
      setTimeout(() => focusInput(), 100)
    } else {
      roundWrong++
      revealFull()
      resultText.innerText = "❌ Out of attempts! It was " + displayName()
      // auto next after 2s
      setTimeout(() => beginRound(), 2000)
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
    setTimeout(() => beginRound(), 1500)
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
      setTimeout(() => beginRound(), 2000)
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

// ── SUMMARY ───────────────────────────────────────────────────────
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
      <button onclick="restartGame()">🔁 Play Again</button>
      <button onclick="returnToMenu()">🏠 Menu</button>
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
      <p>❌ Wrong / Skipped: <strong>${roundWrong}</strong></p>
      <p>🏆 ${p1Name}: <strong>${p1Score}</strong> pts</p>
      <p>🏆 ${p2Name}: <strong>${p2Score}</strong> pts</p>
      <p><strong>${winner}</strong></p>
      <button onclick="restartGame()">🔁 Play Again</button>
      <button onclick="returnToMenu()">🏠 Menu</button>
    `
  }
  resultText.innerHTML = summary
}

// ── RETURN / RESET ────────────────────────────────────────────────
function returnToMenu(){
  document.getElementById("gameContainer").style.display = "block"
  document.getElementById("animeCategory").style.display = "block"
  resultText.innerHTML = ""
  p1Score = 0
  p2Score = 0
  roundCorrect = 0
  roundWrong = 0
  showScreen("modeScreen")
}

function resetRound(){
  p1Score = 0
  p2Score = 0
  roundCorrect = 0
  roundWrong = 0
  document.getElementById("gameContainer").style.display = "block"
  document.getElementById("animeCategory").style.display = "block"
  resultText.innerHTML = ""
  updateScoreBoard()
  buildQueue()
  beginRound()
}

function restartGame(){
  returnToMenu()
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