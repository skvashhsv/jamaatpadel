// Данные турнира
let tournamentData = {
    tournamentName: "Турнир по настольному теннису",
    players: [],
    matches: [],
    settings: {},
    currentRound: 1,
    lastUpdated: null
};

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    loadTournamentData();
    initializeEventListeners();
    renderPublicPage();
    
    // Автообновление каждые 30 секунд
    setInterval(() => {
        loadTournamentData();
    }, 30000);
});

// Загрузка данных
async function loadTournamentData() {
    try {
        // Загружаем из localStorage
        const savedData = localStorage.getItem('tennisTournamentData');
        if (savedData) {
            const data = JSON.parse(savedData);
            tournamentData = {
                tournamentName: data.tournamentName || "Турнир по настольному теннису",
                players: data.players || [],
                matches: data.matches || [],
                settings: data.settings || {},
                currentRound: data.currentRound || 1,
                lastUpdated: data.lastUpdated || new Date().toISOString()
            };
            
            renderPublicPage();
        }
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

// Инициализация обработчиков событий
function initializeEventListeners() {
    // Кнопка обновления данных
    const refreshBtn = document.getElementById('refreshData');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadTournamentData();
            showPublicNotification('Данные обновлены', 'success');
        });
    }
    
    // Фильтры расписания
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            renderMatchSchedule(this.getAttribute('data-filter'));
        });
    });
}

// Рендеринг публичной страницы
function renderPublicPage() {
    updatePublicInfo();
    renderPublicLeaderboard();
    renderCurrentMatches();
    renderMatchSchedule('today');
    renderMatchHistory();
    renderNextRound();
    renderStatistics();
}

// Обновление общей информации
function updatePublicInfo() {
    document.getElementById('tournamentTitle').textContent = tournamentData.tournamentName;
    document.getElementById('currentRound').textContent = tournamentData.currentRound;
    document.getElementById('courtsCount').textContent = tournamentData.settings.courts || 4;
    document.getElementById('playersCount').textContent = tournamentData.players.length;
    
    if (tournamentData.lastUpdated) {
        const date = new Date(tournamentData.lastUpdated);
        document.getElementById('publicLastUpdated').textContent = 
            date.toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
    }
}

// Рендеринг таблицы лидеров
function renderPublicLeaderboard() {
    const leaderboardBody = document.getElementById('publicLeaderboard');
    if (!leaderboardBody) return;
    
    leaderboardBody.innerHTML = '';
    
    if (tournamentData.players.length === 0) {
        leaderboardBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    <i class="fas fa-users" style="font-size: 2rem; color: #dee2e6; margin-bottom: 10px; display: block;"></i>
                    <p>Нет данных об участниках</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Сортируем игроков
    const sortedPlayers = [...tournamentData.players].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        
        // При равенстве очков - по личным встречам
        const headToHead = compareHeadToHead(a.id, b.id);
        if (headToHead !== 0) return headToHead;
        
        // Затем по разнице побед/поражений
        const diffA = (a.wins || 0) - (a.losses || 0);
        const diffB = (b.wins || 0) - (b.losses || 0);
        if (diffB !== diffA) return diffB - diffA;
        
        // Затем по количеству побед
        if ((b.wins || 0) !== (a.wins || 0)) return (b.wins || 0) - (a.wins || 0);
        
        return (b.rating || 1500) - (a.rating || 1500);
    });
    
    sortedPlayers.forEach((player, index) => {
        const row = document.createElement('tr');
        
        // Определяем иконку для первых трех мест
        let medalIcon = '';
        let medalClass = '';
        
        if (index === 0) {
            medalIcon = '<i class="fas fa-crown" style="color: #FFD700;"></i>';
            medalClass = 'first-place';
        } else if (index === 1) {
            medalIcon = '<i class="fas fa-medal" style="color: #C0C0C0;"></i>';
            medalClass = 'second-place';
        } else if (index === 2) {
            medalIcon = '<i class="fas fa-medal" style="color: #CD7F32;"></i>';
            medalClass = 'third-place';
        }
        
        row.innerHTML = `
            <td>
                <span class="position ${medalClass}">${index + 1}</span>
                ${medalIcon}
            </td>
            <td>
                <div class="player-name">
                    <strong>${player.lastName} ${player.firstName}</strong>
                    ${player.middleName ? `<br><small>${player.middleName}</small>` : ''}
                </div>
                ${player.organization ? `
                    <div class="player-org">
                        <i class="fas fa-building"></i> ${player.organization}
                    </div>
                ` : ''}
                ${player.country ? `
                    <div class="player-country">
                        <i class="fas fa-flag"></i> ${player.country}
                    </div>
                ` : ''}
            </td>
            <td>
                <span class="points-display">${player.points || 0}</span>
            </td>
            <td>${player.matchesPlayed || 0}</td>
            <td>
                <span class="wins">${player.wins || 0}</span>
            </td>
            <td>
                <span class="losses">${player.losses || 0}</span>
            </td>
            <td>
                <span class="rating">${player.rating || 1500}</span>
            </td>
        `;
        
        leaderboardBody.appendChild(row);
    });
}

// Рендеринг текущих матчей
function renderCurrentMatches() {
    const currentMatchesContainer = document.getElementById('currentMatches');
    const noCurrentMatches = document.getElementById('noCurrentMatches');
    
    if (!currentMatchesContainer || !noCurrentMatches) return;
    
    const currentMatches = tournamentData.matches.filter(match => 
        match.status === 'live' || (!match.completed && match.status === 'scheduled' && 
        new Date(match.startTime) <= new Date())
    );
    
    if (currentMatches.length === 0) {
        currentMatchesContainer.innerHTML = '';
        noCurrentMatches.style.display = 'block';
        return;
    }
    
    noCurrentMatches.style.display = 'none';
    currentMatchesContainer.innerHTML = '';
    
    currentMatches.forEach(match => {
        const player1 = tournamentData.players.find(p => p.id === match.player1Id);
        const player2 = tournamentData.players.find(p => p.id === match.player2Id);
        
        if (!player1 || !player2) return;
        
        const matchCard = document.createElement('div');
        matchCard.className = `match-card ${match.status === 'live' ? 'live' : 'scheduled'}`;
        
        matchCard.innerHTML = `
            <div class="match-header">
                <div class="match-round">Раунд ${match.round}</div>
                <div class="match-status">
                    <i class="fas ${match.status === 'live' ? 'fa-play-circle' : 'fa-clock'}"></i>
                    ${match.status === 'live' ? 'В процессе' : 'Начинается'}
                </div>
            </div>
            
            <div class="match-time">
                <i class="fas fa-clock"></i>
                ${formatDateTime(match.startTime)}
                <span class="court-badge">
                    <i class="fas fa-map-marker-alt"></i> Корт ${match.court}
                </span>
            </div>
            
            <div class="match-players">
                <div class="player-with-score">
                    <span class="player-name">${player1.lastName} ${player1.firstName.charAt(0)}.</span>
                    ${match.status === 'live' ? `
                        <span class="score-badge">${match.player1Points}</span>
                    ` : ''}
                </div>
                
                <div class="vs">VS</div>
                
                <div class="player-with-score">
                    ${match.status === 'live' ? `
                        <span class="score-badge">${match.player2Points}</span>
                    ` : ''}
                    <span class="player-name">${player2.lastName} ${player2.firstName.charAt(0)}.</span>
                </div>
            </div>
            
            ${match.status === 'live' ? `
                <div class="match-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(match.totalPoints / (tournamentData.settings.totalPoints || 21)) * 100}%"></div>
                    </div>
                    <div class="progress-text">
                        Общий счет: ${match.totalPoints}/${tournamentData.settings.totalPoints || 21}
                    </div>
                </div>
            ` : ''}
        `;
        
        currentMatchesContainer.appendChild(matchCard);
    });
}

// Рендеринг расписания матчей
function renderMatchSchedule(filter = 'today') {
    const scheduleContainer = document.getElementById('matchSchedule');
    if (!scheduleContainer) return;
    
    scheduleContainer.innerHTML = '';
    
    let filteredMatches = tournamentData.matches.filter(match => match.startTime);
    
    if (filter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        filteredMatches = filteredMatches.filter(match => {
            const matchDate = new Date(match.startTime);
            return matchDate >= today && matchDate < tomorrow;
        });
    } else if (filter === 'tomorrow') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
        
        filteredMatches = filteredMatches.filter(match => {
            const matchDate = new Date(match.startTime);
            return matchDate >= tomorrow && matchDate < dayAfterTomorrow;
        });
    }
    
    // Сортируем по времени
    filteredMatches.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    
    if (filteredMatches.length === 0) {
        scheduleContainer.innerHTML = `
            <div class="no-data">
                <i class="fas fa-calendar-times"></i>
                <p>Нет запланированных матчей</p>
            </div>
        `;
        return;
    }
    
    // Группируем матчи по времени
    const matchesByTime = {};
    filteredMatches.forEach(match => {
        const timeKey = formatTime(match.startTime);
        if (!matchesByTime[timeKey]) {
            matchesByTime[timeKey] = [];
        }
        matchesByTime[timeKey].push(match);
    });
    
    // Отображаем сгруппированные матчи
    Object.keys(matchesByTime).sort().forEach(time => {
        const timeSection = document.createElement('div');
        timeSection.className = 'time-section';
        
        timeSection.innerHTML = `
            <div class="time-header">
                <i class="fas fa-clock"></i> ${time}
            </div>
        `;
        
        matchesByTime[time].forEach(match => {
            const player1 = tournamentData.players.find(p => p.id === match.player1Id);
            const player2 = tournamentData.players.find(p => p.id === match.player2Id);
            
            if (player1 && player2) {
                const matchItem = document.createElement('div');
                matchItem.className = 'schedule-match';
                
                matchItem.innerHTML = `
                    <div class="match-info">
                        <div class="court-info">
                            <i class="fas fa-map-marker-alt"></i> Корт ${match.court}
                        </div>
                        <div class="match-round">Раунд ${match.round}</div>
                    </div>
                    <div class="players-info">
                        <span class="player">${player1.lastName} ${player1.firstName.charAt(0)}.</span>
                        <span class="vs">vs</span>
                        <span class="player">${player2.lastName} ${player2.firstName.charAt(0)}.</span>
                    </div>
                    <div class="match-status ${match.completed ? 'completed' : 'scheduled'}">
                        ${match.completed ? 'Завершен' : 'Запланирован'}
                    </div>
                `;
                
                timeSection.appendChild(matchItem);
            }
        });
        
        scheduleContainer.appendChild(timeSection);
    });
}

// Рендеринг истории матчей
function renderMatchHistory() {
    const historyContainer = document.getElementById('matchHistory');
    if (!historyContainer) return;
    
    const completedMatches = tournamentData.matches
        .filter(match => match.completed)
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
        .slice(0, 10);
    
    if (completedMatches.length === 0) {
        historyContainer.innerHTML = `
            <div class="no-data">
                <i class="fas fa-history"></i>
                <p>Нет завершенных матчей</p>
            </div>
        `;
        return;
    }
    
    historyContainer.innerHTML = '';
    
    completedMatches.forEach(match => {
        const player1 = tournamentData.players.find(p => p.id === match.player1Id);
        const player2 = tournamentData.players.find(p => p.id === match.player2Id);
        
        if (!player1 || !player2) return;
        
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const winner = match.winnerId === match.player1Id ? player1 : 
                      match.winnerId === match.player2Id ? player2 : null;
        
        historyItem.innerHTML = `
            <div class="match-result">
                <div class="player-result ${winner && winner.id === player1.id ? 'winner' : ''}">
                    <span class="player-name">${player1.lastName} ${player1.firstName.charAt(0)}.</span>
                    <span class="player-score">${match.player1Points}</span>
                </div>
                <div class="vs">-</div>
                <div class="player-result ${winner && winner.id === player2.id ? 'winner' : ''}">
                    <span class="player-score">${match.player2Points}</span>
                    <span class="player-name">${player2.lastName} ${player2.firstName.charAt(0)}.</span>
                </div>
            </div>
            <div class="match-details">
                <span class="round">Раунд ${match.round}</span>
                <span class="court">Корт ${match.court}</span>
                <span class="time">${formatDateTime(match.startTime)}</span>
            </div>
        `;
        
        historyContainer.appendChild(historyItem);
    });
}

// Рендеринг следующего раунда
function renderNextRound() {
    const nextRoundInfo = document.getElementById('nextRoundInfo');
    const nextRoundPairs = document.getElementById('nextRoundPairs');
    
    if (!nextRoundInfo || !nextRoundPairs) return;
    
    // Определяем следующий раунд
    const nextRound = tournamentData.currentRound + 1;
    
    // Находим незавершенные матчи текущего раунда
    const currentRoundMatches = tournamentData.matches.filter(match => 
        match.round === tournamentData.currentRound && !match.completed
    );
    
    nextRoundInfo.innerHTML = `
        <div class="round-header">
            <h3>Раунд ${nextRound}</h3>
            <div class="round-status">
                ${currentRoundMatches.length === 0 ? 
                    'Готов к началу' : 
                    `Ожидается завершение ${currentRoundMatches.length} матчей`}
            </div>
        </div>
        <div class="round-progress">
            <div class="progress-stats">
                <div class="stat">
                    <i class="fas fa-play-circle"></i>
                    <span>Текущий раунд: ${tournamentData.currentRound}</span>
                </div>
                <div class="stat">
                    <i class="fas fa-check-circle"></i>
                    <span>Завершено матчей: ${tournamentData.matches.filter(m => m.completed).length}</span>
                </div>
                <div class="stat">
                    <i class="fas fa-users"></i>
                    <span>Участников: ${tournamentData.players.length}</span>
                </div>
            </div>
        </div>
    `;
    
    // Для формата Americano следующий раунд - продолжение пар всех со всеми
    // Показываем предполагаемые пары на основе текущих результатов
    nextRoundPairs.innerHTML = '';
    
    if (tournamentData.players.length >= 2) {
        // Берем топ-8 игроков по очкам для показа предполагаемых пар
        const topPlayers = [...tournamentData.players]
            .sort((a, b) => (b.points || 0) - (a.points || 0))
            .slice(0, Math.min(8, tournamentData.players.length));
        
        for (let i = 0; i < topPlayers.length; i += 2) {
            if (topPlayers[i + 1]) {
                const pairCard = document.createElement('div');
                pairCard.className = 'pair-card';
                
                pairCard.innerHTML = `
                    <div class="pair-players">
                        <div class="player">
                            <span class="player-rank">${i + 1}</span>
                            <span class="player-name">${topPlayers[i].lastName} ${topPlayers[i].firstName.charAt(0)}.</span>
                            <span class="player-points">${topPlayers[i].points || 0} очков</span>
                        </div>
                        <div class="vs">VS</div>
                        <div class="player">
                            <span class="player-rank">${i + 2}</span>
                            <span class="player-name">${topPlayers[i + 1].lastName} ${topPlayers[i + 1].firstName.charAt(0)}.</span>
                            <span class="player-points">${topPlayers[i + 1].points || 0} очков</span>
                        </div>
                    </div>
                `;
                
                nextRoundPairs.appendChild(pairCard);
            }
        }
    } else {
        nextRoundPairs.innerHTML = `
            <div class="no-pairs">
                <i class="fas fa-user-friends"></i>
                <p>Недостаточно участников для формирования пар</p>
            </div>
        `;
    }
}

// Рендеринг статистики
function renderStatistics() {
    renderTopScorers();
    renderLatestResults();
}

function renderTopScorers() {
    const topScorersContainer = document.getElementById('topScorers');
    if (!topScorersContainer) return;
    
    const topPlayers = [...tournamentData.players]
        .sort((a, b) => (b.points || 0) - (a.points || 0))
        .slice(0, 3);
    
    if (topPlayers.length === 0) {
        topScorersContainer.innerHTML = '<p>Нет данных</p>';
        return;
    }
    
    topScorersContainer.innerHTML = '';
    
    topPlayers.forEach((player, index) => {
        const scorerItem = document.createElement('div');
        scorerItem.className = 'scorer-item';
        
        let medal = '';
        if (index === 0) medal = '🥇';
        else if (index === 1) medal = '🥈';
        else if (index === 2) medal = '🥉';
        
        scorerItem.innerHTML = `
            <div class="scorer-rank">${medal} ${index + 1}</div>
            <div class="scorer-name">${player.lastName} ${player.firstName.charAt(0)}.</div>
            <div class="scorer-points">${player.points || 0} очков</div>
        `;
        
        topScorersContainer.appendChild(scorerItem);
    });
}

function renderLatestResults() {
    const latestResultsContainer = document.getElementById('latestResults');
    if (!latestResultsContainer) return;
    
    const latestMatches = tournamentData.matches
        .filter(match => match.completed)
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
        .slice(0, 3);
    
    if (latestMatches.length === 0) {
        latestResultsContainer.innerHTML = '<p>Нет результатов</p>';
        return;
    }
    
    latestResultsContainer.innerHTML = '';
    
    latestMatches.forEach(match => {
        const player1 = tournamentData.players.find(p => p.id === match.player1Id);
        const player2 = tournamentData.players.find(p => p.id === match.player2Id);
        
        if (!player1 || !player2) return;
        
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        
        resultItem.innerHTML = `
            <div class="result-score">
                ${match.player1Points} - ${match.player2Points}
            </div>
            <div class="result-players">
                ${player1.lastName} ${player1.firstName.charAt(0)}. vs 
                ${player2.lastName} ${player2.firstName.charAt(0)}.
            </div>
        `;
        
        latestResultsContainer.appendChild(resultItem);
    });
}

// Вспомогательные функции
function compareHeadToHead(player1Id, player2Id) {
    const matches = tournamentData.matches.filter(m => 
        m.completed && (
            (m.player1Id === player1Id && m.player2Id === player2Id) ||
            (m.player1Id === player2Id && m.player2Id === player1Id)
        )
    );
    
    if (matches.length === 0) return 0;
    
    let player1Wins = 0;
    let player2Wins = 0;
    
    matches.forEach(match => {
        if (match.winnerId === player1Id) player1Wins++;
        else if (match.winnerId === player2Id) player2Wins++;
    });
    
    return player2Wins - player1Wins;
}

function formatDateTime(dateString) {
    if (!dateString) return 'Не указано';
    
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTime(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showPublicNotification(message, type = 'info') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `public-notification public-notification-${type}`;
    notification.innerHTML = `
        <div class="public-notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Добавляем стили
    const style = document.createElement('style');
    style.textContent = `
        .public-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            padding: 12px 20px;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            min-width: 250px;
            border-left: 4px solid #4a6fa5;
        }
        
        .public-notification-success {
            border-left-color: #28a745;
        }
        
        .public-notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .public-notification-content i {
            font-size: 18px;
        }
        
        .public-notification-success .public-notification-content i {
            color: #28a745;
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(notification);
    
    // Автоматическое удаление через 3 секунды
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 3000);
}
