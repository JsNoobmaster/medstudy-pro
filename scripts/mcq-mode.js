        let selectedDeckId = null;
        let currentDeck = null;
        let questions = [];
        let currentIndex = 0;
        let selectedAnswer = null;
        let results = { correct: 0, wrong: 0 };
        let timerInterval = null;
        let timePerQuestion = 60;
        let timeLeft = 60;

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

        function selectDeck(deckId) {
            selectedDeckId = deckId;
            document.getElementById('deckSelection').classList.add('hidden');
            document.getElementById('difficultySelection').classList.remove('hidden');
        }

        function startTest(difficulty) {
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
            
            document.getElementById('difficultySelection').classList.add('hidden');
            document.getElementById('testSection').classList.remove('hidden');
            document.getElementById('totalQuestions').textContent = questions.length;
            
            displayQuestion();
        }

        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
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
            if (selectedAnswer !== null) return;
            
            const options = document.querySelectorAll('.option');
            options.forEach(opt => opt.classList.remove('selected'));
            options[index].classList.add('selected');
            
            selectedAnswer = index;
            document.getElementById('submitBtn').disabled = false;
        }

        function submitAnswer() {
            if (selectedAnswer === null) return;
            
            clearInterval(timerInterval);
            
            const question = questions[currentIndex];
            const isCorrect = selectedAnswer === question.correct;
            
            if (isCorrect) {
                results.correct++;
                document.getElementById('correctCount').textContent = results.correct;
            } else {
                results.wrong++;
            }

            const options = document.querySelectorAll('.option');
            options.forEach((opt, idx) => {
                opt.style.pointerEvents = 'none';
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
        }

        function handleTimeout() {
            results.wrong++;
            
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
        }

        function nextQuestion() {
            if (currentIndex < questions.length - 1) {
                currentIndex++;
                displayQuestion();
            } else {
                showResults();
            }
        }

        function showResults() {
            clearInterval(timerInterval);
            
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