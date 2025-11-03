let selectedDeckId = null;
let currentDeck = null;
let questions = [];
let currentIndex = 0;
let selectedAnswer = null;
let results = { correct: 0, wrong: 0 };
let timerInterval = null;
let timePerQuestion = 60;
let timeLeft = 60;
let answeredQuestions = {}; // Track which questions have been answered

loadDeckList();

function loadDeckList() {
    const decks = JSON.parse(localStorage.getItem('flashcard_decks') || '{}');
    const deckIds = Object.keys(decks);
    const deckList = document.getElementById('deckList');
    
    if (deckIds.length === 0) {
        deckList.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">No decks found</div>';
        return;
    }
    
    deckList.innerHTML = deckIds.map(id => {
        let deck = decks[id];
        
        if (typeof deck === 'string') {
            try {
                deck = JSON.parse(deck);
            } catch(e) {
                return '';
            }
        }
        
        const mcqCount = (deck.mcqs || []).filter(mcq => 
            mcq.q && mcq.options && Array.isArray(mcq.options) && mcq.options.length > 0 &&
            typeof mcq.correct === 'number' && mcq.correct >= 0 && mcq.correct < mcq.options.length
        ).length;
        
        if (mcqCount === 0) return '';
        
        const deckName = deck.deckName || deck.name || 'Untitled Deck';
        
        return `
            <div class="deck-item">
                <div>
                    <div style="font-weight: bold; color: #333;">${deckName}</div>
                    <div style="font-size: 0.9em; color: #666;">${mcqCount} MCQ questions</div>
                </div>
                <button class="deck-btn" onclick="selectDeck('${id}')">Select →</button>
            </div>
        `;
    }).filter(html => html !== '').join('');
    
    if (deckList.innerHTML === '') {
        deckList.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">No decks with MCQ questions found.</div>';
    }
}
let savedSessionData = null;

function selectDeck(deckId) {
    selectedDeckId = deckId;
    
    // Check for saved session
    const savedSession = checkForSavedSession();
    
    if (savedSession) {
        // Store session data and show modal
        savedSessionData = savedSession;
        showResumeModal(savedSession);
    } else {
        document.getElementById('deckSelection').classList.add('hidden');
        document.getElementById('difficultySelection').classList.remove('hidden');
    }
}
function startTest(difficulty, continueSession = false) {
    const decks = JSON.parse(localStorage.getItem('flashcard_decks') || '{}');
    let deckData = decks[selectedDeckId];
    
    if (typeof deckData === 'string') {
        deckData = JSON.parse(deckData);
    }
    
    currentDeck = deckData;
    
    // Set time based on difficulty
    if (difficulty === 'easy') {
        timePerQuestion = 60;
    } else if (difficulty === 'medium') {
        timePerQuestion = 45;
    } else if (difficulty === 'hard') {
        timePerQuestion = 30;
    }
    
    // Check if continuing previous session
    if (continueSession) {
        const savedSession = JSON.parse(localStorage.getItem('mcq_session_' + selectedDeckId) || 'null');
        if (savedSession && savedSession.difficulty === difficulty) {
            // Restore previous session
            questions = savedSession.questions;
            currentIndex = savedSession.currentIndex;
            results = savedSession.results;
            answeredQuestions = savedSession.answeredQuestions;
            
            document.getElementById('difficultySelection').classList.add('hidden');
            document.getElementById('testSection').classList.remove('hidden');
            document.getElementById('totalQuestions').textContent = questions.length;
            document.getElementById('correctCount').textContent = results.correct;
            
            renderQuestionNavigation();
            displayQuestion();
            return;
        }
    }
    
    // Start new test
    // Get MCQ questions
    questions = (currentDeck.mcqs || []).filter(mcq => 
        mcq.q && mcq.options && Array.isArray(mcq.options) && mcq.options.length > 0 &&
        typeof mcq.correct === 'number' && mcq.correct >= 0 && mcq.correct < mcq.options.length
    );

    if (questions.length === 0) {
        alert('No valid MCQ questions found!');
        return;
    }

    shuffleArray(questions);
    
    currentIndex = 0;
    selectedAnswer = null;
    results = { correct: 0, wrong: 0 };
    answeredQuestions = {}; // Reset answered questions
    
    // Save initial session
    saveSession(difficulty);
    
    document.getElementById('difficultySelection').classList.add('hidden');
    document.getElementById('testSection').classList.remove('hidden');
    document.getElementById('totalQuestions').textContent = questions.length;
    
    renderQuestionNavigation();
    displayQuestion();
}

function saveSession(difficulty) {
    const sessionData = {
        difficulty: difficulty,
        questions: questions,
        currentIndex: currentIndex,
        results: results,
        answeredQuestions: answeredQuestions,
        timestamp: Date.now()
    };
    localStorage.setItem('mcq_session_' + selectedDeckId, JSON.stringify(sessionData));
}

function checkForSavedSession() {
    const savedSession = JSON.parse(localStorage.getItem('mcq_session_' + selectedDeckId) || 'null');
    if (savedSession && savedSession.currentIndex < savedSession.questions.length) {
        // Show continue option
        return savedSession;
    }
    return null;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function renderQuestionNavigation() {
    const navContainer = document.getElementById('questionNavigation');
    navContainer.innerHTML = '';
    
    for (let i = 0; i < questions.length; i++) {
        const navBox = document.createElement('div');
        navBox.className = 'nav-box';
        navBox.textContent = i + 1;
        navBox.onclick = () => jumpToQuestion(i);
        
        if (i === currentIndex) {
            navBox.classList.add('active');
        }
        if (answeredQuestions[i] !== undefined) {
            navBox.classList.add(answeredQuestions[i] ? 'answered-correct' : 'answered-wrong');
        }
        
        navContainer.appendChild(navBox);
    }
}

function jumpToQuestion(index) {
    if (index === currentIndex) return;
    
    clearInterval(timerInterval);
    currentIndex = index;
    displayQuestion();
    renderQuestionNavigation();
    
    // Close navigation after jumping to question
    toggleNavigation();
}

function displayQuestion() {
    const question = questions[currentIndex];
    
    document.getElementById('questionText').textContent = question.q;
    document.getElementById('currentQuestion').textContent = currentIndex + 1;
    
    const container = document.getElementById('optionsContainer');
    const letters = ['A', 'B', 'C', 'D', 'E'];
    
    container.innerHTML = question.options.map((option, index) => `
        <div class="option" onclick="selectOption(${index})">
            <div class="option-letter">${letters[index]}</div>
            <div style="flex: 1;">${option}</div>
        </div>
    `).join('');

    // Check if this question was already answered
    if (answeredQuestions[currentIndex] !== undefined) {
        // Show the previous answer
        const previousAnswer = questions[currentIndex].userAnswer;
        selectedAnswer = previousAnswer;
        
        // Highlight the answer
        const options = document.querySelectorAll('.option');
        options[previousAnswer].classList.add('selected');
        
        // Show results immediately
        showQuestionResult(false);
    } else {
        // New question
        selectedAnswer = null;
        document.getElementById('submitBtn').disabled = true;
        document.getElementById('submitBtn').classList.remove('hidden');
        document.getElementById('nextBtn').classList.add('hidden');
        document.getElementById('explanationSection').classList.add('hidden');
        
        // Start timer
        timeLeft = timePerQuestion;
        updateTimer();
        startTimer();
    }
}

function startTimer() {
    clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimer();
        
        if (timeLeft <= 10) {
            document.getElementById('timer').classList.add('warning');
        }
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            if (selectedAnswer === null) {
                handleTimeout();
            }
        }
    }, 1000);
}

function updateTimer() {
    document.getElementById('timer').textContent = timeLeft;
    
    if (timeLeft > 10) {
        document.getElementById('timer').classList.remove('warning');
    }
}

function selectOption(index) {
    // Only allow selection if question hasn't been answered yet
    if (answeredQuestions[currentIndex] !== undefined) return;
    
    const options = document.querySelectorAll('.option');
    options.forEach(opt => opt.classList.remove('selected'));
    options[index].classList.add('selected');
    
    selectedAnswer = index;
    document.getElementById('submitBtn').disabled = false;
}

function submitAnswer() {
    if (selectedAnswer === null) return;
    
    // Mark question as answered
    questions[currentIndex].userAnswer = selectedAnswer;
    
    showQuestionResult(true);
}

function showQuestionResult(isNewAnswer) {
    clearInterval(timerInterval);
    
    const question = questions[currentIndex];
    const isCorrect = selectedAnswer === question.correct;
    
    // Only update score if this is a new answer
    if (isNewAnswer) {
        if (isCorrect) {
            results.correct++;
            document.getElementById('correctCount').textContent = results.correct;
            answeredQuestions[currentIndex] = true;
        } else {
            results.wrong++;
            answeredQuestions[currentIndex] = false;
        }
        
        // Save progress after each answer
        saveSession(timePerQuestion === 60 ? 'easy' : timePerQuestion === 45 ? 'medium' : 'hard');
    }

    const options = document.querySelectorAll('.option');
    options.forEach((opt, idx) => {
        opt.style.pointerEvents = 'none'; // NOW disable clicking
        if (idx === question.correct) {
            opt.classList.add('correct');
        } else if (idx === selectedAnswer) {
            opt.classList.add('wrong');
        }
    });

    const explanationSection = document.getElementById('explanationSection');
    const resultText = document.getElementById('resultText');
    const explanationText = document.getElementById('explanationText');
    
    if (isCorrect) {
        resultText.textContent = '✅ Correct!';
        resultText.style.color = '#2b8a3e';
    } else {
        resultText.textContent = '❌ Incorrect';
        resultText.style.color = '#c92a2a';
    }
    
    explanationText.textContent = question.explanation || 'No explanation available.';
    explanationSection.classList.remove('hidden');

    document.getElementById('submitBtn').classList.add('hidden');
    document.getElementById('nextBtn').classList.remove('hidden');
    
    // Update navigation boxes
    renderQuestionNavigation();
}

function handleTimeout() {
    results.wrong++;
    answeredQuestions[currentIndex] = false;
    questions[currentIndex].userAnswer = -1; // Mark as timed out
    
    const question = questions[currentIndex];
    const options = document.querySelectorAll('.option');
    
    options.forEach((opt, idx) => {
        opt.style.pointerEvents = 'none';
        if (idx === question.correct) {
            opt.classList.add('correct');
        }
    });

    const explanationSection = document.getElementById('explanationSection');
    const resultText = document.getElementById('resultText');
    const explanationText = document.getElementById('explanationText');
    
    resultText.textContent = '⏰ Time\'s Up!';
    resultText.style.color = '#e67700';
    explanationText.textContent = question.explanation || 'No explanation available.';
    explanationSection.classList.remove('hidden');

    document.getElementById('submitBtn').classList.add('hidden');
    document.getElementById('nextBtn').classList.remove('hidden');
    
    // Update navigation boxes
    renderQuestionNavigation();
}

function nextQuestion() {
    if (currentIndex < questions.length - 1) {
        currentIndex++;
        displayQuestion();
        renderQuestionNavigation();
    } else {
        showResults();
    }
}

function showResults() {
    clearInterval(timerInterval);
    
    // Clear saved session when test is complete
    localStorage.removeItem('mcq_session_' + selectedDeckId);
    
    document.getElementById('testSection').classList.add('hidden');
    document.getElementById('resultsSection').classList.remove('hidden');
    
    const total = questions.length;
    const score = Math.round((results.correct / total) * 100);
    
    const scoreDisplay = document.getElementById('scoreDisplay');
    scoreDisplay.textContent = score + '%';
    
    if (score >= 70) {
        scoreDisplay.className = 'score-display excellent';
    } else if (score >= 50) {
        scoreDisplay.className = 'score-display good';
    } else {
        scoreDisplay.className = 'score-display poor';
    }
    
    document.getElementById('finalCorrect').textContent = results.correct;
    document.getElementById('finalTotal').textContent = total;
}

function retryTest() {
    document.getElementById('resultsSection').classList.add('hidden');
    document.getElementById('difficultySelection').classList.remove('hidden');
}

function backToDecks() {
    document.getElementById('resultsSection').classList.add('hidden');
    document.getElementById('testSection').classList.add('hidden');
    document.getElementById('difficultySelection').classList.add('hidden');
    document.getElementById('deckSelection').classList.remove('hidden');
    loadDeckList();
}

function toggleNavigation() {
    const navSection = document.getElementById('navigationSection');
    const icon = document.getElementById('navToggleIcon');
    
    if (navSection.classList.contains('hidden')) {
        navSection.classList.remove('hidden');
        icon.textContent = '✖️';
        
        // Add backdrop on mobile
        if (window.innerWidth <= 768) {
            const backdrop = document.createElement('div');
            backdrop.className = 'nav-backdrop active';
            backdrop.id = 'navBackdrop';
            backdrop.onclick = toggleNavigation; // Close when clicking backdrop
            document.body.appendChild(backdrop);
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        }
    } else {
        navSection.classList.add('hidden');
        icon.textContent = '📋';
        
        // Remove backdrop
        const backdrop = document.getElementById('navBackdrop');
        if (backdrop) {
            backdrop.remove();
            document.body.style.overflow = ''; // Restore scrolling
        }
    }
}

function showResumeModal(session) {
    const difficultyName = session.difficulty.charAt(0).toUpperCase() + session.difficulty.slice(1);
    const progress = session.currentIndex + 1;
    const total = session.questions.length;
    const score = session.results.correct;
    
    document.getElementById('modalDifficulty').textContent = difficultyName;
    document.getElementById('modalProgress').textContent = `${progress}/${total} questions`;
    document.getElementById('modalScore').textContent = `${score} correct`;
    
    document.getElementById('resumeModal').classList.remove('hidden');
}

function continueSession() {
    document.getElementById('resumeModal').classList.add('hidden');
    document.getElementById('deckSelection').classList.add('hidden'); // ADD THIS LINE
    startTest(savedSessionData.difficulty, true);
}

function startNewSession() {
    document.getElementById('resumeModal').classList.add('hidden');
    localStorage.removeItem('mcq_session_' + selectedDeckId);
    document.getElementById('deckSelection').classList.add('hidden');
    document.getElementById('difficultySelection').classList.remove('hidden');
}

