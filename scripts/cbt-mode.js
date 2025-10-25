        let currentDeck = null;
        let questions = [];
        let currentIndex = 0;
        let results = { scores: [], excellent: 0, good: 0, fair: 0 };

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
                
                const theoryQuestions = deck.theory || [];
                const validTheoryCount = theoryQuestions.filter(q => 
                    q.q && q.a && q.keywords && Array.isArray(q.keywords) && q.keywords.length > 0
                ).length;
                
                if (validTheoryCount === 0) return '';
                
                const deckName = deck.deckName || deck.name || 'Untitled Deck';
                
                return `
                    <div class="deck-item">
                        <div>
                            <div style="font-weight: bold; color: #333;">${deckName}</div>
                            <div style="font-size: 0.9em; color: #666;">${validTheoryCount} theory questions</div>
                        </div>
                        <button class="deck-btn" onclick="startTest('${id}')">Start →</button>
                    </div>
                `;
            }).filter(html => html !== '').join('');
            
            if (deckList.innerHTML === '') {
                deckList.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">No decks with theory questions found. Upload a deck with a "theory" array.</div>';
            }
        }

        function startTest(deckId) {
            const decks = JSON.parse(localStorage.getItem('flashcard_decks') || '{}');
            let deckData = decks[deckId];
            
            if (typeof deckData === 'string') {
                deckData = JSON.parse(deckData);
            }
            
            currentDeck = deckData;
            questions = currentDeck.theory || [];
            
            questions = questions.filter(q => 
                q.q && q.a && q.keywords && Array.isArray(q.keywords) && q.keywords.length > 0
            );
            
            if (questions.length === 0) {
                alert('This deck has no theory questions!');
                return;
            }
            
            shuffleArray(questions);
            currentIndex = 0;
            results = { scores: [], excellent: 0, good: 0, fair: 0 };
            
            document.getElementById('uploadSection').classList.add('hidden');
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
            const q = questions[currentIndex];
            document.getElementById('questionText').textContent = q.q;
            document.getElementById('answerInput').value = '';
            document.getElementById('gradingSection').classList.add('hidden');
            document.getElementById('submitBtn').disabled = false;
            document.getElementById('currentQuestion').textContent = currentIndex + 1;
        }

        async function submitAnswer() {
            const userAnswer = document.getElementById('answerInput').value.trim();
            if (!userAnswer) {
                alert('Please type an answer!');
                return;
            }

            document.getElementById('submitBtn').disabled = true;
            document.getElementById('gradingSection').classList.remove('hidden');

            const question = questions[currentIndex];
            const grading = gradeAnswer(userAnswer, question.a, question.keywords || []);
            
            displayGrading(grading, userAnswer, question.a);
        }

        function gradeAnswer(userAnswer, modelAnswer, keywords) {
            const userWords = userAnswer.toLowerCase().split(/\W+/).filter(w => w.length > 3);
            const modelWords = modelAnswer.toLowerCase().split(/\W+/).filter(w => w.length > 3);
            
            let keywordsFound = 0;
            keywords.forEach(kw => {
                if (userAnswer.toLowerCase().includes(kw.toLowerCase())) keywordsFound++;
            });
            
            const keywordScore = (keywordsFound / keywords.length) * 60;
            const lengthRatio = Math.min(userWords.length / modelWords.length, 1.2);
            const lengthScore = lengthRatio * 25;
            const detailBonus = userWords.length > 40 ? 15 : 10;
            
            let totalScore = Math.min(Math.round(keywordScore + lengthScore + detailBonus), 100);
            
            let feedback;
            if (totalScore >= 80) {
                feedback = 'Excellent! Strong understanding demonstrated.';
            } else if (totalScore >= 60) {
                feedback = 'Good answer with solid foundation.';
            } else {
                feedback = 'Fair attempt but missing important points.';
            }
            
            const missedKeywords = keywords.filter(kw => !userAnswer.toLowerCase().includes(kw.toLowerCase()));
            
            return {
                score: totalScore,
                feedback,
                keywordsFound,
                totalKeywords: keywords.length,
                keywords: keywords,
                missedKeywords
            };
        }

        function displayGrading(grading, userAnswer, modelAnswer) {
            const scoreBadge = document.getElementById('scoreBadge');
            scoreBadge.textContent = grading.score + '%';
            
            if (grading.score >= 80) {
                scoreBadge.className = 'score-badge score-excellent';
                results.excellent++;
            } else if (grading.score >= 60) {
                scoreBadge.className = 'score-badge score-good';
                results.good++;
            } else {
                scoreBadge.className = 'score-badge score-fair';
                results.fair++;
            }
            
            results.scores.push(grading.score);
            const avg = Math.round(results.scores.reduce((a,b) => a+b) / results.scores.length);
            document.getElementById('avgScore').textContent = avg + '%';
            
            document.getElementById('overallFeedback').textContent = grading.feedback;
            document.getElementById('userAnswerDisplay').textContent = userAnswer;
            document.getElementById('modelAnswerDisplay').textContent = modelAnswer;
            
            document.getElementById('keywordDisplay').innerHTML = `
                <p style="margin-bottom: 10px;"><strong>Found ${grading.keywordsFound}/${grading.totalKeywords} key concepts</strong></p>
                ${grading.keywords.map(kw => {
                    const found = !grading.missedKeywords.includes(kw);
                    return `<span class="keyword ${found ? '' : 'missed'}">${kw}</span>`;
                }).join('')}
            `;
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
            document.getElementById('testSection').classList.add('hidden');
            document.getElementById('resultsSection').classList.remove('hidden');
            
            const avg = Math.round(results.scores.reduce((a,b) => a+b) / results.scores.length);
            document.getElementById('scoreDisplay').textContent = avg + '%';
        }

        function retryTest() {
            shuffleArray(questions);
            currentIndex = 0;
            results = { scores: [], excellent: 0, good: 0, fair: 0 };
            document.getElementById('resultsSection').classList.add('hidden');
            document.getElementById('testSection').classList.remove('hidden');
            displayQuestion();
        }

        function backToLibrary() {
            document.getElementById('resultsSection').classList.add('hidden');
            document.getElementById('uploadSection').classList.remove('hidden');
        }
