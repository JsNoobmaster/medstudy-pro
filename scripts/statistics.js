 function loadStatistics() {
            const decks = JSON.parse(window.localStorage.getItem('flashcard_decks') || '{}');
            const deckIds = Object.keys(decks);

            if (deckIds.length === 0) {
                return;
            }

            let totalCards = 0;
            let totalStudied = 0;
            let totalMastered = 0;
            let allWeakCards = [];
            let deckPerformanceData = [];

            deckIds.forEach(deckId => {
                const deck = decks[deckId];
                const progress = JSON.parse(window.localStorage.getItem(`progress_${deckId}`) || '{}');
                
                totalCards += deck.cards.length;
                
                if (progress.seenCards) {
                    totalStudied += progress.seenCards.length;
                }

                if (progress.cardStats) {
                    const stats = progress.cardStats;
                    const mastered = Object.values(stats).filter(s => s.confidence >= 2).length;
                    const weakCards = Object.entries(stats)
                        .filter(([id, s]) => s.confidence < 0)
                        .map(([id, s]) => ({
                            deckName: deck.name,
                            question: deck.cards[id]?.q || 'Unknown',
                            confidence: s.confidence,
                            timesShown: s.timesShown
                        }));

                    totalMastered += mastered;
                    allWeakCards.push(...weakCards);

                    const successRate = progress.seenCards ? 
                        Math.round((mastered / progress.seenCards.length) * 100) : 0;
                    
                    deckPerformanceData.push({
                        name: deck.name,
                        successRate: successRate,
                        studied: progress.seenCards?.length || 0,
                        total: deck.cards.length,
                        mastered: mastered
                    });
                }
            });

            document.getElementById('totalDecks').textContent = deckIds.length;
            document.getElementById('totalCards').textContent = totalCards;
            document.getElementById('cardsStudied').textContent = totalStudied;
            document.getElementById('cardsMastered').textContent = totalMastered;
            
            const studyPercentage = totalCards > 0 ? Math.round((totalStudied / totalCards) * 100) : 0;
            document.getElementById('studyPercentage').textContent = studyPercentage + '% completed';

            const streak = calculateStreak(deckIds, decks);
            document.getElementById('streakBadge').textContent = `🔥 ${streak} day streak`;

            displayDeckPerformance(deckPerformanceData);
            displayWeakCards(allWeakCards);
            displayActivityTimeline(deckIds, decks);
            displayActivityChart(deckIds, decks);
        }

        function calculateStreak(deckIds, decks) {
            const studyDates = [];
            
            deckIds.forEach(deckId => {
                const deck = decks[deckId];
                if (deck.lastStudied) {
                    studyDates.push(new Date(deck.lastStudied));
                }
            });

            if (studyDates.length === 0) return 0;

            studyDates.sort((a, b) => b - a);
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            let streak = 0;
            let currentDate = new Date(today);

            for (let i = 0; i < 30; i++) {
                const hasStudy = studyDates.some(date => {
                    const studyDate = new Date(date);
                    studyDate.setHours(0, 0, 0, 0);
                    return studyDate.getTime() === currentDate.getTime();
                });

                if (hasStudy) {
                    streak++;
                    currentDate.setDate(currentDate.getDate() - 1);
                } else {
                    break;
                }
            }

            return streak;
        }

        function displayDeckPerformance(data) {
            const container = document.getElementById('deckPerformance');
            
            if (data.length === 0) {
                container.innerHTML = '<div class="empty-state">No performance data yet.</div>';
                return;
            }

            data.sort((a, b) => b.successRate - a.successRate);

            container.innerHTML = data.map(deck => `
                <div class="performance-item">
                    <div class="deck-name-stat">${deck.name}</div>
                    <div class="performance-bar">
                        <div class="performance-fill" style="width: ${deck.successRate}%">
                            ${deck.successRate}%
                        </div>
                    </div>
                    <div class="performance-stats">
                        ${deck.studied}/${deck.total} studied<br>
                        ${deck.mastered} mastered
                    </div>
                </div>
            `).join('');
        }

        function displayWeakCards(cards) {
            const container = document.getElementById('weakCards');
            
            if (cards.length === 0) {
                container.innerHTML = '<div class="empty-state">Great job! No struggling cards yet.</div>';
                return;
            }

            cards.sort((a, b) => a.confidence - b.confidence);
            const topWeak = cards.slice(0, 10);

            container.innerHTML = topWeak.map(card => `
                <div class="weak-card-item">
                    <div class="weak-card-question">${card.question}</div>
                    <div class="weak-card-stats">
                        ${card.deckName} • Shown ${card.timesShown} times • Confidence: ${card.confidence}
                    </div>
                </div>
            `).join('');
        }

        function displayActivityTimeline(deckIds, decks) {
            const container = document.getElementById('activityTimeline');
            const activities = [];

            deckIds.forEach(deckId => {
                const deck = decks[deckId];
                const progress = JSON.parse(window.localStorage.getItem(`progress_${deckId}`) || '{}');
                
                if (deck.lastStudied) {
                    activities.push({
                        date: deck.lastStudied,
                        deckName: deck.name,
                        cardsStudied: progress.seenCards?.length || 0
                    });
                }
            });

            if (activities.length === 0) {
                container.innerHTML = '<div class="empty-state">No recent activity.</div>';
                return;
            }

            activities.sort((a, b) => b.date - a.date);
            const recent = activities.slice(0, 10);

            container.innerHTML = recent.map(activity => `
                <div class="activity-item">
                    <div class="activity-date">${formatDate(activity.date)}</div>
                    <div class="activity-details">Studied ${activity.deckName}</div>
                    <div class="activity-badge">${activity.cardsStudied} cards</div>
                </div>
            `).join('');
        }

        function displayActivityChart(deckIds, decks) {
            const container = document.getElementById('activityChart');
            const last7Days = [];
            const today = new Date();

            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);
                last7Days.push({
                    date: date,
                    label: i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' }),
                    count: 0
                });
            }

            deckIds.forEach(deckId => {
                const deck = decks[deckId];
                if (deck.lastStudied) {
                    const studyDate = new Date(deck.lastStudied);
                    studyDate.setHours(0, 0, 0, 0);
                    
                    const dayData = last7Days.find(d => d.date.getTime() === studyDate.getTime());
                    if (dayData) {
                        dayData.count++;
                    }
                }
            });

            const maxCount = Math.max(...last7Days.map(d => d.count), 1);

            container.innerHTML = last7Days.map(day => {
                const height = (day.count / maxCount) * 100;
                return `
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                        <div class="chart-bar" style="height: ${height}%">
                            <div class="chart-value">${day.count}</div>
                        </div>
                        <div class="chart-label">${day.label}</div>
                    </div>
                `;
            }).join('');
        }

        function formatDate(timestamp) {
            const date = new Date(timestamp);
            const now = new Date();
            const diff = now - date;
            
            if (diff < 60000) return 'Just now';
            if (diff < 3600000) return Math.floor(diff / 60000) + ' mins ago';
            if (diff < 86400000) return Math.floor(diff / 3600000) + ' hours ago';
            if (diff < 172800000) return 'Yesterday';
            
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        }

        function refreshStats() {
            loadStatistics();
        }

        loadStatistics();