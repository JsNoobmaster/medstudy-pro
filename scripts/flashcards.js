let flashcards = [];
        let currentIndex = 0;
        let studyMode = 'normal';
        let cardStats = {};
        let seenCards = new Set();
        let reviewQueue = [];
        let currentDeckId = null;
        let saveTimeout = null;
        
        const fileInput = document.getElementById('fileInput');
        const uploadSection = document.getElementById('uploadSection');
        const flashcardSection = document.getElementById('flashcardSection');
        const flashcard = document.getElementById('flashcard');
        const questionEl = document.getElementById('question');
        const answerEl = document.getElementById('answer');
        const questionImage = document.getElementById('questionImage');
        const answerImage = document.getElementById('answerImage');
        const currentEl = document.getElementById('current');
        const totalEl = document.getElementById('total');
        const progressBar = document.getElementById('progressBar');
        const modeText = document.getElementById('modeText');
        const repeatBadge = document.getElementById('repeatBadge');
        const repeatBadgeBack = document.getElementById('repeatBadgeBack');
        const masteredCount = document.getElementById('masteredCount');
        const reviewCount = document.getElementById('reviewCount');
        const seenCount = document.getElementById('seenCount');
        const deckList = document.getElementById('deckList');
        const currentDeckName = document.getElementById('currentDeckName');
        const saveIndicator = document.getElementById('saveIndicator');

        loadDeckList();

        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                loadFlashcardsFromFile(file);
            }
        });

        function loadFlashcardsFromFile(file) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (data.flashcards && Array.isArray(data.flashcards)) {
                        const deckName = prompt('Enter a name for this deck:', file.name.replace('.json', ''));
                        if (!deckName) return;
                        
                        const deckId = 'deck_' + Date.now();
                        saveDeck(deckId, deckName, data.flashcards);
                        loadDeck(deckId);
                    } else {
                        alert('Invalid JSON format. Please use: {"flashcards": [{"q": "...", "a": "..."}, ...]}');
                    }
                } catch (error) {
                    alert('Error reading JSON file: ' + error.message);
                }
            };
            
            reader.readAsText(file);
        }

        function saveDeck(deckId, deckName, cards) {
            const decks = JSON.parse(window.localStorage.getItem('flashcard_decks') || '{}');
            decks[deckId] = {
                name: deckName,
                cards: cards,
                createdAt: Date.now(),
                lastStudied: Date.now()
            };
            window.localStorage.setItem('flashcard_decks', JSON.stringify(decks));
            loadDeckList();
        }

        function loadDeck(deckId) {
            const decks = JSON.parse(window.localStorage.getItem('flashcard_decks') || '{}');
            const deck = decks[deckId];
            
            if (!deck) {
                alert('Deck not found!');
                return;
            }
            
            currentDeckId = deckId;
            flashcards = deck.cards.map((card, index) => ({
                ...card,
                id: index
            }));
            
            loadProgress(deckId);
            
            totalEl.textContent = flashcards.length;
            currentIndex = 0;
            currentDeckName.textContent = `- ${deck.name}`;
            
            uploadSection.classList.add('hidden');
            flashcardSection.classList.remove('hidden');
            
            deck.lastStudied = Date.now();
            window.localStorage.setItem('flashcard_decks', JSON.stringify(decks));
            
            displayCard();
        }

        function loadProgress(deckId) {
            const savedProgress = window.localStorage.getItem(`progress_${deckId}`);
            if (savedProgress) {
                const data = JSON.parse(savedProgress);
                cardStats = data.cardStats || {};
                seenCards = new Set(data.seenCards || []);
                studyMode = data.studyMode || 'normal';
                currentIndex = data.currentIndex || 0;
                reviewQueue = data.reviewQueue || [];
            } else {
                initializeStats();
            }
            updateStats();
        }

        function saveProgress() {
            if (!currentDeckId) return;
            
            const progress = {
                cardStats: cardStats,
                seenCards: Array.from(seenCards),
                studyMode: studyMode,
                currentIndex: currentIndex,
                reviewQueue: reviewQueue,
                lastSaved: Date.now()
            };
            
            window.localStorage.setItem(`progress_${currentDeckId}`, JSON.stringify(progress));
            showSaveIndicator();
        }

        function showSaveIndicator() {
            saveIndicator.style.opacity = '1';
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                saveIndicator.style.opacity = '0.5';
            }, 1500);
        }

        function autoSave() {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                saveProgress();
            }, 2000);
        }

        function deleteDeck(deckId) {
            if (!confirm('Are you sure you want to delete this deck? This cannot be undone.')) {
                return;
            }
            
            const decks = JSON.parse(window.localStorage.getItem('flashcard_decks') || '{}');
            delete decks[deckId];
            window.localStorage.setItem('flashcard_decks', JSON.stringify(decks));
            window.localStorage.removeItem(`progress_${deckId}`);
            loadDeckList();
        }

        function loadDeckList() {
            const decks = JSON.parse(window.localStorage.getItem('flashcard_decks') || '{}');
            const deckIds = Object.keys(decks);
            
            if (deckIds.length === 0) {
                deckList.innerHTML = '<div class="empty-state">No saved decks yet. Upload a deck to get started!</div>';
                return;
            }
            
            deckList.innerHTML = '';
            deckIds.forEach(deckId => {
                const deck = decks[deckId];
                const progress = JSON.parse(window.localStorage.getItem(`progress_${deckId}`) || '{}');
                const seenCount = progress.seenCards ? progress.seenCards.length : 0;
                const totalCards = deck.cards.length;
                
                const deckItem = document.createElement('div');
                deckItem.className = 'deck-item';
                deckItem.innerHTML = `
                    <div class="deck-info">
                        <div class="deck-name">${deck.name}</div>
                        <div class="deck-stats">
                            ${totalCards} cards • ${seenCount} studied • Last: ${formatDate(deck.lastStudied)}
                        </div>
                    </div>
                    <div class="deck-actions">
                        <button class="deck-btn load" onclick="loadDeck('${deckId}')">📖 Study</button>
                        <button class="deck-btn delete" onclick="deleteDeck('${deckId}')">🗑️ Delete</button>
                    </div>
                `;
                deckList.appendChild(deckItem);
            });
        }

        function formatDate(timestamp) {
            const date = new Date(timestamp);
            const now = new Date();
            const diff = now - date;
            
            if (diff < 60000) return 'Just now';
            if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
            if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
            return Math.floor(diff / 86400000) + 'd ago';
        }

        function initializeStats() {
            cardStats = {};
            seenCards = new Set();
            reviewQueue = [];
            flashcards.forEach(card => {
                cardStats[card.id] = {
                    timesShown: 0,
                    confidence: 0,
                    lastRating: null
                };
            });
            updateStats();
        }

        function updateStats() {
            const mastered = Object.values(cardStats).filter(s => s.confidence >= 2).length;
            const needReview = Object.values(cardStats).filter(s => s.confidence < 0).length;
            
            masteredCount.textContent = mastered;
            reviewCount.textContent = needReview;
            seenCount.textContent = seenCards.size;
        }

        function displayCard() {
            if (flashcards.length === 0) return;
            
            const card = flashcards[currentIndex];
            
            // Reset flip state FIRST and wait for animation
            if (flashcard.classList.contains('flipped')) {
                flashcard.classList.remove('flipped');
            }
            
            // Update text content immediately
            questionEl.textContent = card.q;
            answerEl.textContent = card.a;
            currentEl.textContent = currentIndex + 1;
            
            // Clear old event handlers
            questionImage.onload = null;
            questionImage.onerror = null;
            answerImage.onload = null;
            answerImage.onerror = null;
            
            // Wait for flip animation to complete before loading images
            setTimeout(() => {
                // Handle question image
                if (card.qImage && card.qImage.trim() !== '') {
                    questionImage.onload = function() {
                        this.classList.remove('hidden');
                        this.style.display = 'block';
                    };
                    questionImage.onerror = function() {
                        console.error('Failed to load question image:', card.qImage);
                        this.classList.add('hidden');
                        this.style.display = 'none';
                    };
                    questionImage.src = card.qImage;
                } else {
                    questionImage.classList.add('hidden');
                    questionImage.style.display = 'none';
                    questionImage.src = '';
                }
                
                // Handle answer image
                if (card.aImage && card.aImage.trim() !== '') {
                    answerImage.onload = function() {
                        this.classList.remove('hidden');
                        this.style.display = 'block';
                    };
                    answerImage.onerror = function() {
                        console.error('Failed to load answer image:', card.aImage);
                        this.classList.add('hidden');
                        this.style.display = 'none';
                    };
                    answerImage.src = card.aImage;
                } else {
                    answerImage.classList.add('hidden');
                    answerImage.style.display = 'none';
                    answerImage.src = '';
                }
            }, 100);
            
            const progress = (seenCards.size / flashcards.length) * 100;
            progressBar.style.width = progress + '%';
            
            const needsReview = cardStats[card.id] && cardStats[card.id].confidence < 0;
            repeatBadge.classList.toggle('hidden', !needsReview);
            repeatBadgeBack.classList.toggle('hidden', !needsReview);
            
            seenCards.add(card.id);
            if (cardStats[card.id]) {
                cardStats[card.id].timesShown++;
            }
            updateStats();
            autoSave();
        }

        flashcard.addEventListener('click', function() {
            this.classList.toggle('flipped');
        });

        function rateCard(difficulty) {
            const card = flashcards[currentIndex];
            const stats = cardStats[card.id];
            
            switch(difficulty) {
                case 'easy':
                    stats.confidence += 2;
                    break;
                case 'medium':
                    stats.confidence += 1;
                    break;
                case 'hard':
                    stats.confidence -= 1;
                    if (Math.random() < 0.7) {
                        reviewQueue.push(card.id);
                    }
                    break;
            }
            
            stats.lastRating = difficulty;
            updateStats();
            saveProgress();
            
            setTimeout(() => {
                nextCard();
            }, 300);
        }

        function nextCard() {
            if (flashcards.length === 0) return;
            
            if (studyMode === 'smart') {
                const needReview = flashcards.filter(card => 
                    cardStats[card.id] && cardStats[card.id].confidence < 1
                );
                
                if (needReview.length > 0 && Math.random() < 0.6) {
                    const randomReview = needReview[Math.floor(Math.random() * needReview.length)];
                    currentIndex = flashcards.findIndex(c => c.id === randomReview.id);
                } else if (reviewQueue.length > 0 && Math.random() < 0.4) {
                    const reviewId = reviewQueue.shift();
                    currentIndex = flashcards.findIndex(c => c.id === reviewId);
                } else {
                    currentIndex = (currentIndex + 1) % flashcards.length;
                }
            } else {
                if (reviewQueue.length > 0 && Math.random() < 0.3) {
                    const reviewId = reviewQueue.shift();
                    currentIndex = flashcards.findIndex(c => c.id === reviewId);
                } else {
                    currentIndex = (currentIndex + 1) % flashcards.length;
                }
            }
            
            displayCard();
        }

        function previousCard() {
            if (flashcards.length === 0) return;
            currentIndex = (currentIndex - 1 + flashcards.length) % flashcards.length;
            displayCard();
        }

        function shuffleCards() {
            if (flashcards.length === 0) return;
            for (let i = flashcards.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [flashcards[i], flashcards[j]] = [flashcards[j], flashcards[i]];
            }
            currentIndex = 0;
            displayCard();
        }

        function toggleMode() {
            studyMode = studyMode === 'normal' ? 'smart' : 'normal';
            const text = studyMode === 'smart' ? '🎯 Smart Mode: Focus on Weak Cards' : '📚 Study Mode: Normal';
            modeText.textContent = text;
            saveProgress();
        }

        function backToLibrary() {
            saveProgress();
            flashcardSection.classList.add('hidden');
            uploadSection.classList.remove('hidden');
            loadDeckList();
            fileInput.value = '';
        }

        document.addEventListener('keydown', function(e) {
            if (flashcards.length === 0) return;
            
            if (e.key === 'ArrowRight') nextCard();
            if (e.key === 'ArrowLeft') previousCard();
            if (e.key === ' ') {
                e.preventDefault();
                flashcard.classList.toggle('flipped');
            }
            if (e.key === '1') rateCard('hard');
            if (e.key === '2') rateCard('medium');
            if (e.key === '3') rateCard('easy');
        });

        // Auto-save every 30 seconds
        setInterval(() => {
            if (currentDeckId) {
                saveProgress();
            }
             }, 30000);