        let selectedDecks = new Set();
        let allQuestions = [];
        let currentQuestion = null;
        let currentAnswer = '';
        let score = 0;
        let combo = 0;
        let maxCombo = 0;
        let correctAnswers = 0;
        let wrongAnswers = 0;
        let timer = 30;
        let timerInterval = null;
        let questionIndex = 0;
        let timePerQuestion = 30;
        let gameActive = false;

        // Load decks on page load
        window.addEventListener('DOMContentLoaded', loadDecks);

        function loadDecks() {
            const decks = JSON.parse(localStorage.getItem('flashcard_decks') || '{}');
            const deckList = document.getElementById('deckList');

            if (Object.keys(decks).length === 0) {
                deckList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <p>No decks found. Please upload decks from the hub.</p>
                    </div>
                `;
                return;
            }

            deckList.innerHTML = '';

            Object.entries(decks).forEach(([deckId, deck]) => {
                const steeplechaseCount = (deck.steeplechase && Array.isArray(deck.steeplechase)) ? deck.steeplechase.length : 0;
                const flashcardCount = (deck.flashcards && Array.isArray(deck.flashcards)) ? deck.flashcards.length : 
                                      (deck.cards && Array.isArray(deck.cards)) ? deck.cards.length : 0;
                const mcqCount = (deck.mcqs && Array.isArray(deck.mcqs)) ? deck.mcqs.length : 0;
                const totalCount = steeplechaseCount + flashcardCount + mcqCount;

                console.log(`Deck "${deck.name}": ${totalCount} total (${steeplechaseCount} steeplechase, ${flashcardCount} flashcards, ${mcqCount} mcqs)`);

                if (totalCount === 0) return;

                const deckItem = document.createElement('div');
                deckItem.className = 'deck-checkbox-item';
                deckItem.onclick = () => toggleDeck(deckId, deckItem);

                deckItem.innerHTML = `
                    <input type="checkbox" class="deck-checkbox" id="deck-${deckId}" 
                           onchange="toggleDeck('${deckId}', this.parentElement)">
                    <div class="deck-info-select">
                        <div class="deck-name-select">${deck.name}</div>
                        <div class="deck-count">${totalCount} questions available</div>
                    </div>
                `;

                deckList.appendChild(deckItem);
            });
        }

        function toggleDeck(deckId, element) {
            const checkbox = element.querySelector('input[type="checkbox"]');
            checkbox.checked = !checkbox.checked;

            if (checkbox.checked) {
                selectedDecks.add(deckId);
                element.classList.add('selected');
            } else {
                selectedDecks.delete(deckId);
                element.classList.remove('selected');
            }

            updateSelectionSummary();
        }

        function selectAllDecks() {
            const decks = JSON.parse(localStorage.getItem('flashcard_decks') || '{}');
            document.querySelectorAll('.deck-checkbox-item').forEach(item => {
                const checkbox = item.querySelector('input[type="checkbox"]');
                const deckId = checkbox.id.replace('deck-', '');
                checkbox.checked = true;
                item.classList.add('selected');
                selectedDecks.add(deckId);
            });
            updateSelectionSummary();
        }

        function deselectAllDecks() {
            document.querySelectorAll('.deck-checkbox-item').forEach(item => {
                const checkbox = item.querySelector('input[type="checkbox"]');
                checkbox.checked = false;
                item.classList.remove('selected');
            });
            selectedDecks.clear();
            updateSelectionSummary();
        }

        function updateSelectionSummary() {
            const summary = document.getElementById('selectionSummary');
            const continueBtn = document.getElementById('continueBtn');
            const totalQuestionsEl = document.getElementById('totalQuestions');

            if (selectedDecks.size === 0) {
                summary.classList.add('hidden');
                continueBtn.disabled = true;
                return;
            }

            const decks = JSON.parse(localStorage.getItem('flashcard_decks') || '{}');
            let totalQuestions = 0;

            selectedDecks.forEach(deckId => {
                const deck = decks[deckId];
                if (deck) {
                    // Count steeplechase
                    if (deck.steeplechase && Array.isArray(deck.steeplechase)) {
                        totalQuestions += deck.steeplechase.length;
                    }
                    
                    // Count flashcards
                    if (deck.flashcards && Array.isArray(deck.flashcards)) {
                        totalQuestions += deck.flashcards.length;
                    } else if (deck.cards && Array.isArray(deck.cards)) {
                        totalQuestions += deck.cards.length;
                    }
                    
                    // Count MCQs
                    if (deck.mcqs && Array.isArray(deck.mcqs)) {
                        totalQuestions += deck.mcqs.length;
                    }
                }
            });

            console.log('Total questions in selection:', totalQuestions);
            totalQuestionsEl.textContent = totalQuestions;
            summary.classList.remove('hidden');
            continueBtn.disabled = totalQuestions === 0;
        }

        function showDifficultySelection() {
            document.getElementById('deckSelectionScreen').classList.add('hidden');
            document.getElementById('difficultyScreen').classList.remove('hidden');
        }

        function startGame(difficulty) {
            // Set timer based on difficulty
            const timers = { easy: 30, medium: 20, hard: 15, beast: 10 };
            timePerQuestion = timers[difficulty];

            // Load questions from selected decks
            loadQuestions();

            if (allQuestions.length === 0) {
                alert('No questions available in selected decks!');
                return;
            }

            // Shuffle questions
            allQuestions = shuffleArray(allQuestions);

            // Initialize game
            score = 0;
            combo = 0;
            maxCombo = 0;
            correctAnswers = 0;
            wrongAnswers = 0;
            questionIndex = 0;
            gameActive = true;

            // Show game screen
            document.getElementById('difficultyScreen').classList.add('hidden');
            document.getElementById('gameScreen').classList.remove('hidden');

            loadNextQuestion();
        }

        function loadQuestions() {
            allQuestions = [];
            const decks = JSON.parse(localStorage.getItem('flashcard_decks') || '{}');

            console.log('Selected deck IDs:', Array.from(selectedDecks));
            console.log('Available decks:', Object.keys(decks));

            selectedDecks.forEach(deckId => {
                const deck = decks[deckId];
                if (!deck) {
                    console.warn(`Deck ${deckId} not found`);
                    return;
                }

                console.log(`Processing deck: ${deck.name}`, deck);

                // Add steeplechase questions - they can have various formats
                if (deck.steeplechase && Array.isArray(deck.steeplechase)) {
                    console.log(`Found ${deck.steeplechase.length} steeplechase items`);
                    deck.steeplechase.forEach((q, idx) => {
                        console.log(`Steeplechase question ${idx}:`, q);
                        
                        // Handle different possible formats
                        let question = null;
                        let answer = null;
                        
                        if (typeof q === 'object' && q !== null) {
                            // Try different field names for question
                            question = q.question || q.text || q.prompt || q.q;
                            // Try different field names for answer
                            answer = q.answer || q.correctAnswer || q.solution || q.a;
                            
                            // For MCQ format in steeplechase
                            if (!answer && q.options && q.correctAnswer !== undefined) {
                                answer = q.options[q.correctAnswer];
                            }
                        } else if (typeof q === 'string') {
                            // If it's just a string, skip it
                            console.warn('Steeplechase item is a string, skipping:', q);
                            return;
                        }
                        
                        if (question && answer) {
                            allQuestions.push({ 
                                question: question,
                                answer: answer,
                                type: 'steeplechase', 
                                deckName: deck.name 
                            });
                        } else {
                            console.warn('Steeplechase item missing question or answer:', q);
                        }
                    });
                }

                // Add flashcards as questions
                if (deck.flashcards && Array.isArray(deck.flashcards)) {
                    console.log(`Found ${deck.flashcards.length} flashcards`);
                    deck.flashcards.forEach(card => {
                        if (card && card.front && card.back) {
                            allQuestions.push({
                                question: card.front,
                                answer: card.back,
                                type: 'flashcard',
                                deckName: deck.name
                            });
                        }
                    });
                }

                // Also check legacy 'cards' field
                if (deck.cards && Array.isArray(deck.cards) && deck.cards.length > 0) {
                    console.log(`Found ${deck.cards.length} cards (legacy field)`);
                    deck.cards.forEach(card => {
                        if (card && card.front && card.back) {
                            // Check if not already added from flashcards
                            const exists = allQuestions.some(q => 
                                q.question === card.front && q.answer === card.back
                            );
                            if (!exists) {
                                allQuestions.push({
                                    question: card.front,
                                    answer: card.back,
                                    type: 'flashcard',
                                    deckName: deck.name
                                });
                            }
                        }
                    });
                }

                // Add MCQs
                if (deck.mcqs && Array.isArray(deck.mcqs)) {
                    console.log(`Found ${deck.mcqs.length} MCQs`);
                    deck.mcqs.forEach(mcq => {
                        if (mcq && mcq.question && mcq.options && mcq.correctAnswer !== undefined) {
                            allQuestions.push({
                                question: mcq.question,
                                options: mcq.options,
                                correctAnswer: mcq.correctAnswer,
                                answer: mcq.options[mcq.correctAnswer],
                                type: 'mcq',
                                deckName: deck.name
                            });
                        }
                    });
                }
            });

            console.log('Total loaded questions:', allQuestions.length);
            if (allQuestions.length > 0) {
                console.log('Sample questions:', allQuestions.slice(0, 3));
            } else {
                console.error('NO QUESTIONS LOADED! Check your deck structure.');
                console.log('First deck structure:', decks[Array.from(selectedDecks)[0]]);
            }
        }

        function loadNextQuestion() {
            if (questionIndex >= allQuestions.length) {
                endGame();
                return;
            }

            currentQuestion = allQuestions[questionIndex];
            console.log('Loading question:', currentQuestion);
            questionIndex++;

            // Reset timer
            timer = timePerQuestion;
            document.getElementById('timer').textContent = timer;
            document.getElementById('timer').classList.remove('warning');

            // Clear feedback
            document.getElementById('feedbackBar').classList.add('hidden');

            // Update question display
            const questionTypeEl = document.getElementById('questionType');
            const questionTextEl = document.getElementById('questionText');
            
            questionTypeEl.textContent = 
                currentQuestion.type.charAt(0).toUpperCase() + currentQuestion.type.slice(1);
            
            // Make sure question text is displayed
            questionTextEl.textContent = currentQuestion.question || 'No question text available';
            questionTextEl.style.display = 'block';
            questionTextEl.style.visibility = 'visible';

            // Setup answer area based on question type
            const answerArea = document.getElementById('answerArea');
            
            if (currentQuestion.type === 'mcq' && currentQuestion.options) {
                answerArea.innerHTML = `
                    <div class="mcq-options">
                        ${currentQuestion.options.map((opt, idx) => `
                            <div class="mcq-option" onclick="selectMCQOption(${idx})">
                                ${String.fromCharCode(65 + idx)}. ${opt}
                            </div>
                        `).join('')}
                    </div>
                `;
            } else {
                answerArea.innerHTML = `
                    <input type="text" class="answer-input" id="answerInput" 
                           placeholder="Type your answer..." 
                           onkeypress="if(event.key==='Enter') submitAnswer()">
                `;
                setTimeout(() => {
                    const input = document.getElementById('answerInput');
                    if (input) input.focus();
                }, 100);
            }

            currentAnswer = '';

            // Enable submit button
            document.getElementById('submitBtn').disabled = false;

            // Start timer
            startTimer();
        }

        function selectMCQOption(index) {
            document.querySelectorAll('.mcq-option').forEach((opt, idx) => {
                opt.classList.toggle('selected', idx === index);
            });
            currentAnswer = index;
        }

        function startTimer() {
            if (timerInterval) clearInterval(timerInterval);

            timerInterval = setInterval(() => {
                timer--;
                document.getElementById('timer').textContent = timer;

                if (timer <= 5) {
                    document.getElementById('timer').classList.add('warning');
                }

                if (timer <= 0) {
                    clearInterval(timerInterval);
                    submitAnswer(true);
                }
            }, 1000);
        }

        function submitAnswer(timeout = false) {
            if (!gameActive) return;

            // Prevent multiple submissions
            const submitBtn = document.getElementById('submitBtn');
            if (submitBtn.disabled && !timeout) return;

            clearInterval(timerInterval);

            let userAnswer = '';
            let correct = false;

            if (currentQuestion.type === 'mcq') {
                userAnswer = currentAnswer;
                if (userAnswer === '') {
                    alert('Please select an answer');
                    startTimer();
                    return;
                }
                correct = userAnswer === currentQuestion.correctAnswer;
            } else {
                const input = document.getElementById('answerInput');
                userAnswer = input ? input.value.trim().toLowerCase() : '';
                
                if (userAnswer === '' && !timeout) {
                    alert('Please enter an answer');
                    startTimer();
                    return;
                }
                
                const correctAnswer = (currentQuestion.answer || '').toString().toLowerCase();
                correct = userAnswer === correctAnswer || 
                         correctAnswer.includes(userAnswer) || 
                         userAnswer.includes(correctAnswer);
            }

            // Update stats
            if (correct) {
                correctAnswers++;
                combo++;
                maxCombo = Math.max(maxCombo, combo);
                score += 100 + (combo * 10) + (timer * 5);
            } else {
                wrongAnswers++;
                combo = 0;
            }

            // Update display
            document.getElementById('score').textContent = score;
            document.getElementById('combo').textContent = combo;

            // Show feedback
            const feedbackBar = document.getElementById('feedbackBar');
            feedbackBar.classList.remove('hidden', 'correct', 'wrong');
            
            const correctAnswerText = currentQuestion.answer || 'N/A';
            
            if (timeout) {
                feedbackBar.classList.add('wrong');
                feedbackBar.textContent = `⏰ Time's up! The answer was: ${correctAnswerText}`;
            } else if (correct) {
                feedbackBar.classList.add('correct');
                feedbackBar.textContent = `✅ Correct! +${100 + (combo * 10) + (timer * 5)} points`;
            } else {
                feedbackBar.classList.add('wrong');
                feedbackBar.textContent = `❌ Wrong! The correct answer was: ${correctAnswerText}`;
            }

            // Disable submit button and inputs
            document.getElementById('submitBtn').disabled = true;
            const input = document.getElementById('answerInput');
            if (input) input.disabled = true;
            
            document.querySelectorAll('.mcq-option').forEach(opt => {
                opt.style.pointerEvents = 'none';
            });

            // Auto-advance after 2 seconds
            setTimeout(() => {
                document.getElementById('submitBtn').disabled = false;
                loadNextQuestion();
            }, 2000);
        }

        function endGame() {
            gameActive = false;
            clearInterval(timerInterval);

            // Calculate accuracy
            const total = correctAnswers + wrongAnswers;
            const accuracy = total > 0 ? Math.round((correctAnswers / total) * 100) : 0;

            // Update results screen
            document.getElementById('finalScore').textContent = score;
            document.getElementById('correctCount').textContent = correctAnswers;
            document.getElementById('wrongCount').textContent = wrongAnswers;
            document.getElementById('maxCombo').textContent = maxCombo;
            document.getElementById('accuracy').textContent = accuracy + '%';

            // Performance message
            let message = '';
            if (accuracy >= 90) {
                message = '🌟 Outstanding! You\'re a medical genius!';
            } else if (accuracy >= 75) {
                message = '🎯 Great job! You really know your stuff!';
            } else if (accuracy >= 60) {
                message = '👍 Good effort! Keep practicing!';
            } else {
                message = '💪 Don\'t give up! Review and try again!';
            }
            document.getElementById('performanceMessage').textContent = message;

            // Show results screen
            document.getElementById('gameScreen').classList.add('hidden');
            document.getElementById('resultsScreen').classList.remove('hidden');
        }

        function restartGame() {
            // Reset to deck selection
            selectedDecks.clear();
            document.querySelectorAll('.deck-checkbox-item').forEach(item => {
                const checkbox = item.querySelector('input[type="checkbox"]');
                checkbox.checked = false;
                item.classList.remove('selected');
            });

            document.getElementById('resultsScreen').classList.add('hidden');
            document.getElementById('deckSelectionScreen').classList.remove('hidden');
            
            updateSelectionSummary();
            loadDecks();
        }

        function goHome() {
            window.location.href = 'index.html';
        }

        function shuffleArray(array) {
            const shuffled = [...array];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        }