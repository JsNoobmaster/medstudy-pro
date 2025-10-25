        const fileInput = document.getElementById('fileInput');

        // Load and display decks on page load
        window.addEventListener('DOMContentLoaded', () => {
            displayDecks();
        });

        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
        });

        function handleFiles(files) {
            Array.from(files).forEach(file => {
                if (file.type === 'application/json') {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const data = JSON.parse(e.target.result);
                            processUploadedData(data, file.name);
                        } catch (error) {
                            alert(`Error reading ${file.name}: ${error.message}`);
                        }
                    };
                    reader.readAsText(file);
                }
            });
        }

        function processUploadedData(data, fileName) {
            const deckName = prompt('Enter a name for this deck:', fileName.replace('.json', '')) || fileName;
            
            const deckId = 'deck_' + Date.now();
            const decks = JSON.parse(localStorage.getItem('flashcard_decks') || '{}');
            
            // Count what's in each array
            const counts = {
                flashcards: (data.flashcards || []).length,
                mcqs: (data.mcqs || []).length,
                theory: (data.theory || []).length,
                osce: (data.osce || []).length,
                steeplechase: (data.steeplechase || []).length
            };
            
            // Store the COMPLETE data structure
            decks[deckId] = {
                name: deckName,
                deckName: data.deckName || deckName,
                description: data.description || '',
                
                // ALL mode arrays - preserve everything
                flashcards: data.flashcards || [],
                mcqs: data.mcqs || [],
                theory: data.theory || [],
                osce: data.osce || [],
                steeplechase: data.steeplechase || [],
                
                // Legacy support for old flashcard mode
                cards: data.flashcards || [],
                
                metadata: data.metadata || {},
                createdAt: Date.now(),
                lastStudied: Date.now()
            };
            
            localStorage.setItem('flashcard_decks', JSON.stringify(decks));
            
            // Show what was uploaded
            const summary = Object.entries(counts)
                .filter(([key, count]) => count > 0)
                .map(([key, count]) => `${key}: ${count}`)
                .join('\n');
            
            alert(`✅ Deck "${deckName}" uploaded!\n\n${summary || 'No content found'}`);
            
            // Refresh the deck display
            displayDecks();
        }

        function displayDecks() {
            const deckList = document.getElementById('deckList');
            const decks = JSON.parse(localStorage.getItem('flashcard_decks') || '{}');
            
            if (Object.keys(decks).length === 0) {
                deckList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <p>No decks uploaded yet. Upload JSON files to get started!</p>
                    </div>
                `;
                return;
            }

            deckList.innerHTML = '';
            
            Object.entries(decks).forEach(([deckId, deck]) => {
                const deckItem = document.createElement('div');
                deckItem.className = 'deck-item';
                
                // Count content types
                const contentTypes = [];
                if (deck.flashcards && deck.flashcards.length > 0) {
                    contentTypes.push({ name: 'flashcards', count: deck.flashcards.length, icon: '🧠' });
                }
                if (deck.mcqs && deck.mcqs.length > 0) {
                    contentTypes.push({ name: 'mcqs', count: deck.mcqs.length, icon: '📝' });
                }
                if (deck.theory && deck.theory.length > 0) {
                    contentTypes.push({ name: 'theory', count: deck.theory.length, icon: '📖' });
                }
                if (deck.osce && deck.osce.length > 0) {
                    contentTypes.push({ name: 'osce', count: deck.osce.length, icon: '🩺' });
                }
                if (deck.steeplechase && deck.steeplechase.length > 0) {
                    contentTypes.push({ name: 'steeplechase', count: deck.steeplechase.length, icon: '🏃' });
                }

                const badgesHTML = contentTypes.map(type => 
                    `<span class="badge ${type.name}">${type.icon} ${type.count} ${type.name}</span>`
                ).join('');

                const lastStudied = new Date(deck.lastStudied).toLocaleDateString();
                
                deckItem.innerHTML = `
                    <div class="deck-header">
                        <div class="deck-info">
                            <h3>${deck.name}</h3>
                            <p>${deck.description || 'No description'}</p>
                            <p style="font-size: 0.85em; color: #999; margin-top: 5px;">Last studied: ${lastStudied}</p>
                        </div>
                        <button class="delete-btn" onclick="deleteDeck('${deckId}', event)">🗑️ Delete</button>
                    </div>
                    <div class="content-badges">
                        ${badgesHTML || '<span style="color: #999;">No content available</span>'}
                    </div>
                `;
                
                deckList.appendChild(deckItem);
            });
        }

        function deleteDeck(deckId, event) {
            event.stopPropagation();
            
            const decks = JSON.parse(localStorage.getItem('flashcard_decks') || '{}');
            const deckName = decks[deckId]?.name || 'this deck';
            
            if (confirm(`Are you sure you want to delete "${deckName}"? This cannot be undone.`)) {
                delete decks[deckId];
                localStorage.setItem('flashcard_decks', JSON.stringify(decks));
                displayDecks();
                alert(`✅ Deck "${deckName}" has been deleted.`);
            }
        }

        function navigateToMode(mode) {
            const routes = {
                'flashcard': 'flashcards.html',
                'mcq': 'mcq-mode.html',
                'theory': 'cbt-mode.html',
                'osce': 'osce-mode.html',
                'steeplechase': 'steeplechase-mode.html'
            };
            
            if (routes[mode]) {
                window.location.href = routes[mode];
            }
        }