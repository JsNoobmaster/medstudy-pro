 let selectedDecks = new Set();
        let allDecks = {};

        loadAvailableDecks();

        function loadAvailableDecks() {
            const decks = JSON.parse(window.localStorage.getItem('flashcard_decks') || '{}');
            allDecks = decks;
            const deckIds = Object.keys(decks);
            const container = document.getElementById('deckSelection');

            if (deckIds.length === 0) {
                container.innerHTML = '<div class="empty-state">No decks available. Create some decks first!</div>';
                return;
            }

            container.innerHTML = '';
            deckIds.forEach(deckId => {
                const deck = decks[deckId];
                const deckItem = document.createElement('div');
                deckItem.className = 'deck-checkbox-item';
                deckItem.onclick = function() {
                    toggleDeckSelection(deckId);
                };
                
                deckItem.innerHTML = `
                    <input 
                        type="checkbox" 
                        class="deck-checkbox" 
                        id="checkbox-${deckId}"
                        onclick="event.stopPropagation(); toggleDeckSelection('${deckId}')"
                    >
                    <div class="deck-info">
                        <div class="deck-name">${deck.name}</div>
                        <div class="deck-stats">${deck.cards.length} cards</div>
                    </div>
                `;
                container.appendChild(deckItem);
            });
        }

        function toggleDeckSelection(deckId) {
            const checkbox = document.getElementById(`checkbox-${deckId}`);
            const item = checkbox.closest('.deck-checkbox-item');
            
            if (selectedDecks.has(deckId)) {
                selectedDecks.delete(deckId);
                checkbox.checked = false;
                item.classList.remove('selected');
            } else {
                selectedDecks.add(deckId);
                checkbox.checked = true;
                item.classList.add('selected');
            }
            
            updateSelectionSummary();
        }

        function toggleSelectAll() {
            const deckIds = Object.keys(allDecks);
            const selectAllText = document.getElementById('selectAllText');
            
            if (selectedDecks.size === deckIds.length) {
                selectedDecks.clear();
                deckIds.forEach(deckId => {
                    const checkbox = document.getElementById(`checkbox-${deckId}`);
                    const item = checkbox.closest('.deck-checkbox-item');
                    checkbox.checked = false;
                    item.classList.remove('selected');
                });
                selectAllText.textContent = '✓ Select All';
            } else {
                deckIds.forEach(deckId => {
                    selectedDecks.add(deckId);
                    const checkbox = document.getElementById(`checkbox-${deckId}`);
                    const item = checkbox.closest('.deck-checkbox-item');
                    checkbox.checked = true;
                    item.classList.add('selected');
                });
                selectAllText.textContent = '✗ Deselect All';
            }
            
            updateSelectionSummary();
        }

        function updateSelectionSummary() {
            const summary = document.getElementById('selectionSummary');
            const nameSection = document.getElementById('nameInputSection');
            const createBtn = document.getElementById('createBtn');
            const selectedCount = document.getElementById('selectedCount');
            const totalCardsCount = document.getElementById('totalCardsCount');
            const selectAllText = document.getElementById('selectAllText');
            
            if (selectedDecks.size > 0) {
                summary.style.display = 'block';
                nameSection.style.display = 'block';
                
                let totalCards = 0;
                selectedDecks.forEach(deckId => {
                    totalCards += allDecks[deckId].cards.length;
                });
                
                selectedCount.textContent = selectedDecks.size;
                totalCardsCount.textContent = totalCards;
                
                const nameInput = document.getElementById('deckNameInput');
                if (nameInput.value.trim()) {
                    createBtn.disabled = false;
                } else {
                    createBtn.disabled = selectedDecks.size < 2;
                }
                
                if (selectedDecks.size === Object.keys(allDecks).length) {
                    selectAllText.textContent = '✗ Deselect All';
                } else {
                    selectAllText.textContent = '✓ Select All';
                }
            } else {
                summary.style.display = 'none';
                nameSection.style.display = 'none';
                createBtn.disabled = true;
                selectAllText.textContent = '✓ Select All';
            }
        }

        document.getElementById('deckNameInput').addEventListener('input', updateSelectionSummary);

        function createCombinedDeck() {
            if (selectedDecks.size < 2) {
                alert('Please select at least 2 decks to combine.');
                return;
            }

            const nameInput = document.getElementById('deckNameInput');
            let deckName = nameInput.value.trim();
            
            if (!deckName) {
                const deckNames = Array.from(selectedDecks).map(id => allDecks[id].name);
                deckName = `Combined: ${deckNames.slice(0, 2).join(' + ')}${deckNames.length > 2 ? ` +${deckNames.length - 2} more` : ''}`;
            }

            const combinedCards = [];
            const sourceDecks = [];

            selectedDecks.forEach(deckId => {
                const deck = allDecks[deckId];
                sourceDecks.push(deck.name);
                deck.cards.forEach(card => {
                    combinedCards.push({
                        ...card,
                        sourceDeck: deck.name
                    });
                });
            });

            const newDeckId = 'deck_combined_' + Date.now();
            const decks = JSON.parse(window.localStorage.getItem('flashcard_decks') || '{}');
            
            decks[newDeckId] = {
                name: deckName,
                cards: combinedCards,
                createdAt: Date.now(),
                lastStudied: Date.now(),
                isCombined: true,
                sourceDecks: sourceDecks
            };

            window.localStorage.setItem('flashcard_decks', JSON.stringify(decks));

            const successMsg = document.getElementById('successMessage');
            successMsg.classList.remove('hidden');

            setTimeout(() => {
                const choice = confirm(
                    `Combined deck "${deckName}" created with ${combinedCards.length} cards!\n\n` +
                    `What would you like to do?\n\n` +
                    `OK - Start studying with flashcards\n` +
                    `Cancel - Go back to deck library`
                );

                if (choice) {
                    window.location.href = `flashcards.html`;
                } else {
                    window.location.href = 'flashcards.html';
                }
            }, 1000);
        }

        function goBack() {
            window.history.back();
        }