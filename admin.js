// Основные переменные
let tournamentData = {
    tournamentName: "Турнир по настольному теннису",
    tournamentType: "Americano",
    settings: {
        totalPoints: 21,
        courts: 4,
        timezone: "Europe/Moscow",
        allowDraws: false
    },
    players: [],
    matches: [],
    schedule: [],
    currentRound: 1,
    lastUpdated: new Date().toISOString()
};

let currentPlayerId = null;
let currentMatchId = null;

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    loadTournamentData();
    initializeTabs();
    initializeForms();
    initializeEventListeners();
    renderAll();
});

// Загрузка данных
async function loadTournamentData() {
    try {
        // Пробуем загрузить из localStorage
        const savedData = localStorage.getItem('tennisTournamentData');
        if (savedData) {
            tournamentData = JSON.parse(savedData);
        } else {
            // Загружаем из файла или создаем начальные данные
            tournamentData = await getDefaultData();
        }
        
        updateLastUpdated();
        updateCounters();
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        tournamentData = await getDefaultData();
    }
}

// Сохранение данных
function saveTournamentData() {
    try {
        tournamentData.lastUpdated = new Date().toISOString();
        localStorage.setItem('tennisTournamentData', JSON.stringify(tournamentData));
        updateLastUpdated();
        updateCounters();
        
        showNotification('Данные успешно сохранены!', 'success');
        return true;
    } catch (error) {
        console.error('Ошибка сохранения данных:', error);
        showNotification('Ошибка сохранения данных', 'error');
        return false;
    }
}

// Инициализация вкладок
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Убираем активный класс у всех кнопок и панелей
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Добавляем активный класс текущим
            button.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
            
            // Перерисовываем содержимое вкладки
            switch(tabId) {
                case 'players':
                    renderPlayers();
                    break;
                case 'matches':
                    renderMatches();
                    break;
                case 'schedule':
                    renderSchedule();
                    break;
                case 'stats':
                    renderStats();
                    break;
            }
        });
    });
}

// Инициализация форм
function initializeForms() {
    // Форма участника
    const playerForm = document.getElementById('playerForm');
    if (playerForm) {
        playerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            savePlayer();
        });
    }
    
    // Форма настроек
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveSettings();
        });
    }
    
    // Форма матча
    const matchForm = document.getElementById('matchForm');
    if (matchForm) {
        matchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveMatch();
        });
    }
}

// Инициализация обработчиков событий
function initializeEventListeners() {
    // Кнопка сохранения всех данных
    const saveAllBtn = document.getElementById('saveAll');
    if (saveAllBtn) {
        saveAllBtn.addEventListener('click', saveTournamentData);
    }
    
    // Кнопка добавления участника
    const addPlayerBtn = document.getElementById('addPlayer');
    if (addPlayerBtn) {
        addPlayerBtn.addEventListener('click', () => {
            resetPlayerForm();
            document.getElementById('formTitle').textContent = 'Добавить нового участника';
        });
    }
    
    // Кнопка отмены редактирования
    const cancelEditBtn = document.getElementById('cancelEdit');
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', resetPlayerForm);
    }
    
    // Кнопка генерации матчей
    const generateMatchesBtn = document.getElementById('generateMatches');
    if (generateMatchesBtn) {
        generateMatchesBtn.addEventListener('click', generateMatches);
    }
    
    // Кнопка добавления матча
    const addMatchBtn = document.getElementById('addMatch');
    if (addMatchBtn) {
        addMatchBtn.addEventListener('click', () => {
            showMatchModal();
        });
    }
    
    // Кнопка создания расписания
    const generateScheduleBtn = document.getElementById('generateSchedule');
    if (generateScheduleBtn) {
        generateScheduleBtn.addEventListener('click', generateSchedule);
    }
    
    // Кнопка экспорта статистики
    const exportStatsBtn = document.getElementById('exportStats');
    if (exportStatsBtn) {
        exportStatsBtn.addEventListener('click', exportStatistics);
    }
    
    // Кнопка экспорта данных
    const exportDataBtn = document.getElementById('exportData');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', exportData);
    }
    
    // Кнопка обновления названия турнира
    const tournamentNameInput = document.getElementById('tournamentName');
    if (tournamentNameInput) {
        tournamentNameInput.addEventListener('change', function() {
            tournamentData.tournamentName = this.value;
            saveTournamentData();
        });
    }
    
    // Фильтры матчей
    const matchFilter = document.getElementById('matchFilter');
    const roundFilter = document.getElementById('roundFilter');
    
    if (matchFilter) {
        matchFilter.addEventListener('change', renderMatches);
    }
    
    if (roundFilter) {
        roundFilter.addEventListener('change', renderMatches);
    }
    
    // Модальное окно результатов
    const submitResultBtn = document.getElementById('submitResult');
    const cancelResultBtn = document.getElementById('cancelResult');
    const cancelMatchBtn = document.getElementById('cancelMatch');
    
    if (submitResultBtn) {
        submitResultBtn.addEventListener('click', saveMatchResult);
    }
    
    if (cancelResultBtn) {
        cancelResultBtn.addEventListener('click', () => {
            hideModal('resultModal');
        });
    }
    
    if (cancelMatchBtn) {
        cancelMatchBtn.addEventListener('click', () => {
            hideModal('matchModal');
        });
    }
    
    // Обновление счета в реальном времени
    const scoreInputs = ['player1Points', 'player2Points'];
    scoreInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', updateTotalPoints);
        }
    });
}

// Рендеринг всех компонентов
function renderAll() {
    renderPlayers();
    renderMatches();
    renderSchedule();
    renderStats();
    updateCounters();
}

// Рендеринг участников
function renderPlayers() {
    const playersList = document.getElementById('playersList');
    if (!playersList) return;
    
    playersList.innerHTML = '';
    
    if (tournamentData.players.length === 0) {
        playersList.innerHTML = `
            <div class="no-data">
                <i class="fas fa-users"></i>
                <p>Нет зарегистрированных участников</p>
                <button id="addFirstPlayer" class="btn btn-primary" style="margin-top: 15px;">
                    <i class="fas fa-plus"></i> Добавить первого участника
                </button>
            </div>
        `;
        
        const addFirstPlayerBtn = document.getElementById('addFirstPlayer');
        if (addFirstPlayerBtn) {
            addFirstPlayerBtn.addEventListener('click', () => {
                resetPlayerForm();
                document.getElementById('formTitle').textContent = 'Добавить участника';
            });
        }
        return;
    }
    
    tournamentData.players.sort((a, b) => {
        if (a.lastName !== b.lastName) return a.lastName.localeCompare(b.lastName);
        return a.firstName.localeCompare(b.firstName);
    });
    
    tournamentData.players.forEach(player => {
        const playerElement = document.createElement('div');
        playerElement.className = 'player-item';
        playerElement.innerHTML = `
            <div class="player-info">
                <h4>${player.lastName} ${player.firstName} ${player.middleName || ''}</h4>
                <div class="player-meta">
                    ${player.organization ? `<span><i class="fas fa-building"></i> ${player.organization}</span>` : ''}
                    ${player.country ? `<span><i class="fas fa-flag"></i> ${player.country}</span>` : ''}
                    ${player.nationality ? `<span><i class="fas fa-globe"></i> ${player.nationality}</span>` : ''}
                    <span><i class="fas fa-bullseye"></i> Очки: ${player.points || 0}</span>
                    <span><i class="fas fa-gamepad"></i> Матчей: ${player.matchesPlayed || 0}</span>
                </div>
            </div>
            <div class="player-actions">
                <button class="btn btn-primary btn-sm" onclick="editPlayer(${player.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-secondary btn-sm" onclick="deletePlayer(${player.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        playersList.appendChild(playerElement);
    });
}

// Рендеринг матчей
function renderMatches() {
    const matchesList = document.getElementById('matchesList');
    if (!matchesList) return;
    
    matchesList.innerHTML = '';
    
    const statusFilter = document.getElementById('matchFilter')?.value || 'all';
    const roundFilterValue = document.getElementById('roundFilter')?.value || 'all';
    
    // Обновляем список раундов в фильтре
    updateRoundFilter();
    
    let filteredMatches = tournamentData.matches;
    
    // Фильтрация по статусу
    if (statusFilter !== 'all') {
        filteredMatches = filteredMatches.filter(match => {
            if (statusFilter === 'scheduled') return !match.completed && match.status === 'scheduled';
            if (statusFilter === 'live') return match.status === 'live';
            if (statusFilter === 'completed') return match.completed;
            return true;
        });
    }
    
    // Фильтрация по раунду
    if (roundFilterValue !== 'all') {
        const round = parseInt(roundFilterValue);
        filteredMatches = filteredMatches.filter(match => match.round === round);
    }
    
    if (filteredMatches.length === 0) {
        matchesList.innerHTML = `
            <div class="no-data">
                <i class="fas fa-gamepad"></i>
                <p>Нет матчей</p>
                <button onclick="generateMatches()" class="btn btn-primary" style="margin-top: 15px;">
                    <i class="fas fa-cogs"></i> Сгенерировать матчи
                </button>
            </div>
        `;
        return;
    }
    
    filteredMatches.sort((a, b) => {
        if (a.round !== b.round) return a.round - b.round;
        if (a.court !== b.court) return a.court - b.court;
        return new Date(a.startTime) - new Date(b.startTime);
    });
    
    filteredMatches.forEach(match => {
        const player1 = tournamentData.players.find(p => p.id === match.player1Id);
        const player2 = tournamentData.players.find(p => p.id === match.player2Id);
        
        if (!player1 || !player2) return;
        
        const matchElement = document.createElement('div');
        matchElement.className = 'match-item';
        
        let statusClass = 'status-scheduled';
        let statusText = 'Запланирован';
        
        if (match.status === 'live') {
            statusClass = 'status-live';
            statusText = 'В процессе';
        } else if (match.completed) {
            statusClass = 'status-completed';
            statusText = 'Завершен';
        }
        
        matchElement.innerHTML = `
            <div class="match-header">
                <div class="match-round">Раунд ${match.round}</div>
                <div class="match-status ${statusClass}">${statusText}</div>
            </div>
            <div class="match-content">
                <div class="match-player">
                    <div class="player-name">${player1.lastName} ${player1.firstName.charAt(0)}.</div>
                    ${player1.organization ? `<div class="player-organization">${player1.organization}</div>` : ''}
                </div>
                <div class="match-score">
                    ${match.player1Points} : ${match.player2Points}
                </div>
                <div class="match-player">
                    <div class="player-name">${player2.lastName} ${player2.firstName.charAt(0)}.</div>
                    ${player2.organization ? `<div class="player-organization">${player2.organization}</div>` : ''}
                </div>
            </div>
            <div class="match-meta">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                    <span><i class="fas fa-map-marker-alt"></i> Корт ${match.court}</span>
                    <span><i class="fas fa-clock"></i> ${formatDateTime(match.startTime)}</span>
                </div>
            </div>
            <div class="match-actions">
                ${!match.completed ? `
                    <button class="btn btn-success btn-sm" onclick="openResultModal(${match.id})">
                        <i class="fas fa-edit"></i> Ввести результат
                    </button>
                    ${match.status !== 'live' ? `
                        <button class="btn btn-warning btn-sm" onclick="startMatch(${match.id})">
                            <i class="fas fa-play"></i> Начать матч
                        </button>
                    ` : `
                        <button class="btn btn-secondary btn-sm" onclick="pauseMatch(${match.id})">
                            <i class="fas fa-pause"></i> Пауза
                        </button>
                    `}
                ` : `
                    <button class="btn btn-secondary btn-sm" onclick="editResult(${match.id})">
                        <i class="fas fa-redo"></i> Изменить
                    </button>
                `}
                <button class="btn btn-danger btn-sm" onclick="deleteMatch(${match.id})">
                    <i class="fas fa-trash"></i> Удалить
                </button>
            </div>
        `;
        
        matchesList.appendChild(matchElement);
    });
}

// Рендеринг расписания
function renderSchedule() {
    const calendar = document.getElementById('calendar');
    const courtsSchedule = document.getElementById('courtsSchedule');
    
    if (!calendar || !courtsSchedule) return;
    
    // Календарь
    calendar.innerHTML = '<p>Календарь будет реализован в следующей версии</p>';
    
    // Расписание по кортам
    courtsSchedule.innerHTML = '';
    
    const courts = Array.from({length: tournamentData.settings.courts}, (_, i) => i + 1);
    
    courts.forEach(court => {
        const courtMatches = tournamentData.matches
            .filter(match => match.court === court && match.startTime)
            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        
        const courtElement = document.createElement('div');
        courtElement.className = 'court-schedule';
        courtElement.innerHTML = `
            <h4><i class="fas fa-map-marker-alt"></i> Корт ${court}</h4>
        `;
        
        if (courtMatches.length === 0) {
            courtElement.innerHTML += '<p>Нет запланированных матчей</p>';
        } else {
            courtMatches.forEach(match => {
                const player1 = tournamentData.players.find(p => p.id === match.player1Id);
                const player2 = tournamentData.players.find(p => p.id === match.player2Id);
                
                if (player1 && player2) {
                    courtElement.innerHTML += `
                        <div class="scheduled-match">
                            <div class="match-time">${formatTime(match.startTime)}</div>
                            <div class="match-players">
                                ${player1.lastName} ${player1.firstName.charAt(0)}. vs 
                                ${player2.lastName} ${player2.firstName.charAt(0)}.
                            </div>
                            <div class="match-round">Раунд ${match.round}</div>
                        </div>
                    `;
                }
            });
        }
        
        courtsSchedule.appendChild(courtElement);
    });
}

// Рендеринг статистики
function renderStats() {
    renderLeaderboard();
    renderCharts();
    renderRecentMatches();
}

function renderLeaderboard() {
    const leaderboardBody = document.getElementById('leaderboardBody');
    if (!leaderboardBody) return;
    
    leaderboardBody.innerHTML = '';
    
    // Сортируем игроков по очкам
    const sortedPlayers = [...tournamentData.players].sort((a, b) => {
        // Сначала по очкам
        if (b.points !== a.points) return b.points - a.points;
        
        // При равенстве очков - по личным встречам
        const headToHead = compareHeadToHead(a.id, b.id);
        if (headToHead !== 0) return headToHead;
        
        // Затем по разнице побед/поражений
        const diffA = a.wins - a.losses;
        const diffB = b.wins - b.losses;
        if (diffB !== diffA) return diffB - diffA;
        
        // Затем по количеству побед
        if (b.wins !== a.wins) return b.wins - a.wins;
        
        // Наконец по рейтингу
        return b.rating - a.rating;
    });
    
    sortedPlayers.forEach((player, index) => {
        const row = document.createElement('tr');
        
        // Определяем медаль для первых трех мест
        let medal = '';
        if (index === 0) medal = '🥇';
        else if (index === 1) medal = '🥈';
        else if (index === 2) medal = '🥉';
        
        row.innerHTML = `
            <td>${index + 1} ${medal}</td>
            <td>
                <strong>${player.lastName} ${player.firstName}</strong>
                ${player.middleName ? `<br><small>${player.middleName}</small>` : ''}
                ${player.organization ? `<br><small><i class="fas fa-building"></i> ${player.organization}</small>` : ''}
            </td>
            <td><span class="points-badge">${player.points || 0}</span></td>
            <td>${player.matchesPlayed || 0}</td>
            <td>${player.wins || 0}</td>
            <td>${player.losses || 0}</td>
            <td>${player.rating || 1500}</td>
        `;
        
        leaderboardBody.appendChild(row);
    });
}

function renderCharts() {
    const ctx = document.getElementById('pointsChartCanvas');
    if (!ctx) return;
    
    // Создаем график распределения очков
    const points = tournamentData.players.map(p => p.points || 0);
    
    new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: tournamentData.players.map(p => `${p.lastName} ${p.firstName.charAt(0)}.`),
            datasets: [{
                label: 'Очки',
                data: points,
                backgroundColor: 'rgba(74, 111, 165, 0.7)',
                borderColor: 'rgba(74, 111, 165, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Очки'
                    }
                }
            }
        }
    });
}

function renderRecentMatches() {
    const recentMatches = document.getElementById('recentMatches');
    if (!recentMatches) return;
    
    const completedMatches = tournamentData.matches
        .filter(m => m.completed)
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
        .slice(0, 5);
    
    if (completedMatches.length === 0) {
        recentMatches.innerHTML = '<p>Нет завершенных матчей</p>';
        return;
    }
    
    recentMatches.innerHTML = '';
    completedMatches.forEach(match => {
        const player1 = tournamentData.players.find(p => p.id === match.player1Id);
        const player2 = tournamentData.players.find(p => p.id === match.player2Id);
        
        if (player1 && player2) {
            const matchElement = document.createElement('div');
            matchElement.className = 'recent-match';
            matchElement.innerHTML = `
                <div class="match-result">
                    <span class="player">${player1.lastName} ${player1.firstName.charAt(0)}.</span>
                    <span class="score">${match.player1Points} - ${match.player2Points}</span>
                    <span class="player">${player2.lastName} ${player2.firstName.charAt(0)}.</span>
                </div>
                <div class="match-info">
                    <span class="round">Раунд ${match.round}</span>
                    <span class="time">${formatDateTime(match.startTime)}</span>
                </div>
            `;
            recentMatches.appendChild(matchElement);
        }
    });
}

// Обновление счетчиков
function updateCounters() {
    document.getElementById('totalPlayers').textContent = tournamentData.players.length;
    document.getElementById('totalMatches').textContent = tournamentData.matches.length;
    
    const completedMatches = tournamentData.matches.filter(m => m.completed).length;
    document.getElementById('completedMatches')?.textContent = completedMatches;
}

// Обновление времени последнего обновления
function updateLastUpdated() {
    const lastUpdated = document.getElementById('lastUpdated');
    if (lastUpdated && tournamentData.lastUpdated) {
        const date = new Date(tournamentData.lastUpdated);
        lastUpdated.textContent = date.toLocaleString('ru-RU');
    }
}

// Обновление фильтра раундов
function updateRoundFilter() {
    const roundFilter = document.getElementById('roundFilter');
    if (!roundFilter) return;
    
    // Сохраняем текущее значение
    const currentValue = roundFilter.value;
    
    // Получаем уникальные раунды
    const rounds = [...new Set(tournamentData.matches.map(m => m.round))].sort((a, b) => a - b);
    
    // Очищаем опции
    roundFilter.innerHTML = '<option value="all">Все раунды</option>';
    
    // Добавляем опции для каждого раунда
    rounds.forEach(round => {
        const option = document.createElement('option');
        option.value = round;
        option.textContent = `Раунд ${round}`;
        roundFilter.appendChild(option);
    });
    
    // Восстанавливаем выбранное значение, если оно еще существует
    if (rounds.includes(parseInt(currentValue))) {
        roundFilter.value = currentValue;
    }
}

// Работа с участниками
function savePlayer() {
    const lastName = document.getElementById('lastName').value.trim();
    const firstName = document.getElementById('firstName').value.trim();
    const middleName = document.getElementById('middleName').value.trim();
    const organization = document.getElementById('organization').value.trim();
    const nationality = document.getElementById('nationality').value.trim();
    const country = document.getElementById('country').value.trim();
    
    if (!lastName || !firstName) {
        showNotification('Заполните обязательные поля: Фамилия и Имя', 'error');
        return;
    }
    
    if (currentPlayerId) {
        // Редактирование существующего участника
        const playerIndex = tournamentData.players.findIndex(p => p.id === currentPlayerId);
        if (playerIndex !== -1) {
            tournamentData.players[playerIndex] = {
                ...tournamentData.players[playerIndex],
                lastName,
                firstName,
                middleName: middleName || undefined,
                organization: organization || undefined,
                nationality: nationality || undefined,
                country: country || undefined
            };
        }
        currentPlayerId = null;
    } else {
        // Добавление нового участника
        const newPlayer = {
            id: tournamentData.players.length > 0 ? 
                Math.max(...tournamentData.players.map(p => p.id)) + 1 : 1,
            lastName,
            firstName,
            middleName: middleName || undefined,
            organization: organization || undefined,
            nationality: nationality || undefined,
            country: country || undefined,
            points: 0,
            wins: 0,
            losses: 0,
            matchesPlayed: 0,
            rating: 1500
        };
        
        tournamentData.players.push(newPlayer);
    }
    
    resetPlayerForm();
    saveTournamentData();
    renderPlayers();
    
    showNotification('Участник сохранен успешно!', 'success');
}

function editPlayer(playerId) {
    const player = tournamentData.players.find(p => p.id === playerId);
    if (!player) return;
    
    currentPlayerId = playerId;
    
    document.getElementById('lastName').value = player.lastName || '';
    document.getElementById('firstName').value = player.firstName || '';
    document.getElementById('middleName').value = player.middleName || '';
    document.getElementById('organization').value = player.organization || '';
    document.getElementById('nationality').value = player.nationality || '';
    document.getElementById('country').value = player.country || '';
    
    document.getElementById('formTitle').textContent = 'Редактировать участника';
    
    // Прокручиваем к форме
    document.getElementById('playerForm').scrollIntoView({ behavior: 'smooth' });
}

function deletePlayer(playerId) {
    if (!confirm('Вы уверены, что хотите удалить этого участника? Все его матчи также будут удалены.')) {
        return;
    }
    
    // Удаляем участника
    tournamentData.players = tournamentData.players.filter(p => p.id !== playerId);
    
    // Удаляем все матчи с участием этого игрока
    tournamentData.matches = tournamentData.matches.filter(m => 
        m.player1Id !== playerId && m.player2Id !== playerId
    );
    
    saveTournamentData();
    renderAll();
    
    showNotification('Участник удален', 'success');
}

function resetPlayerForm() {
    currentPlayerId = null;
    document.getElementById('playerForm').reset();
    document.getElementById('formTitle').textContent = 'Добавить нового участника';
}

// Работа с матчами
function generateMatches() {
    if (tournamentData.players.length < 2) {
        showNotification('Необходимо как минимум 2 участника для создания матчей', 'error');
        return;
    }
    
    // Для формата Americano создаем матчи между всеми парами участников
    const newMatches = [];
    let matchId = tournamentData.matches.length > 0 ? 
        Math.max(...tournamentData.matches.map(m => m.id)) + 1 : 1;
    
    for (let i = 0; i < tournamentData.players.length; i++) {
        for (let j = i + 1; j < tournamentData.players.length; j++) {
            // Проверяем, не существует ли уже такого матча
            const existingMatch = tournamentData.matches.find(m => 
                (m.player1Id === tournamentData.players[i].id && m.player2Id === tournamentData.players[j].id) ||
                (m.player1Id === tournamentData.players[j].id && m.player2Id === tournamentData.players[i].id)
            );
            
            if (!existingMatch) {
                newMatches.push({
                    id: matchId++,
                    player1Id: tournamentData.players[i].id,
                    player2Id: tournamentData.players[j].id,
                    player1Points: 0,
                    player2Points: 0,
                    totalPoints: 0,
                    court: 1,
                    round: 1,
                    status: 'scheduled',
                    startTime: null,
                    completed: false,
                    winnerId: null
                });
            }
        }
    }
    
    tournamentData.matches.push(...newMatches);
    tournamentData.currentRound = 1;
    
    saveTournamentData();
    renderMatches();
    renderSchedule();
    
    showNotification(`Создано ${newMatches.length} новых матчей`, 'success');
}

function showMatchModal() {
    const player1Select = document.getElementById('matchPlayer1');
    const player2Select = document.getElementById('matchPlayer2');
    const courtSelect = document.getElementById('matchCourt');
    
    // Заполняем список участников
    player1Select.innerHTML = '<option value="">Выберите участника</option>';
    player2Select.innerHTML = '<option value="">Выберите участника</option>';
    
    tournamentData.players.forEach(player => {
        const option1 = document.createElement('option');
        option1.value = player.id;
        option1.textContent = `${player.lastName} ${player.firstName}`;
        player1Select.appendChild(option1.cloneNode(true));
        
        const option2 = option1.cloneNode(true);
        player2Select.appendChild(option2);
    });
    
    // Заполняем список кортов
    courtSelect.innerHTML = '';
    for (let i = 1; i <= tournamentData.settings.courts; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Корт ${i}`;
        courtSelect.appendChild(option);
    }
    
    // Устанавливаем текущую дату и время
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // +30 минут от текущего времени
    document.getElementById('matchTime').value = now.toISOString().slice(0, 16);
    
    showModal('matchModal');
}

function saveMatch() {
    const player1Id = parseInt(document.getElementById('matchPlayer1').value);
    const player2Id = parseInt(document.getElementById('matchPlayer2').value);
    const court = parseInt(document.getElementById('matchCourt').value);
    const round = parseInt(document.getElementById('matchRound').value);
    const startTime = document.getElementById('matchTime').value;
    
    if (!player1Id || !player2Id || player1Id === player2Id) {
        showNotification('Выберите двух разных участников', 'error');
        return;
    }
    
    // Проверяем, не существует ли уже такого матча
    const existingMatch = tournamentData.matches.find(m => 
        (m.player1Id === player1Id && m.player2Id === player2Id) ||
        (m.player1Id === player2Id && m.player2Id === player1Id)
    );
    
    if (existingMatch) {
        showNotification('Матч между этими участниками уже существует', 'error');
        return;
    }
    
    const newMatch = {
        id: tournamentData.matches.length > 0 ? 
            Math.max(...tournamentData.matches.map(m => m.id)) + 1 : 1,
        player1Id,
        player2Id,
        player1Points: 0,
        player2Points: 0,
        totalPoints: 0,
        court,
        round,
        status: 'scheduled',
        startTime: startTime ? new Date(startTime).toISOString() : null,
        completed: false,
        winnerId: null
    };
    
    tournamentData.matches.push(newMatch);
    
    hideModal('matchModal');
    saveTournamentData();
    renderMatches();
    renderSchedule();
    
    showNotification('Матч создан успешно!', 'success');
}

function openResultModal(matchId) {
    const match = tournamentData.matches.find(m => m.id === matchId);
    if (!match) return;
    
    currentMatchId = matchId;
    
    const player1 = tournamentData.players.find(p => p.id === match.player1Id);
    const player2 = tournamentData.players.find(p => p.id === match.player2Id);
    
    if (!player1 || !player2) return;
    
    document.getElementById('matchDetails').innerHTML = `
        <div class="match-info">
            <h4>Раунд ${match.round} | Корт ${match.court}</h4>
            <p>${formatDateTime(match.startTime)}</p>
        </div>
    `;
    
    document.getElementById('player1Name').textContent = 
        `${player1.lastName} ${player1.firstName}`;
    document.getElementById('player2Name').textContent = 
        `${player2.lastName} ${player2.firstName}`;
    
    document.getElementById('player1Points').value = match.player1Points;
    document.getElementById('player2Points').value = match.player2Points;
    
    updateTotalPoints();
    
    showModal('resultModal');
}

function updateTotalPoints() {
    const score1 = parseInt(document.getElementById('player1Points').value) || 0;
    const score2 = parseInt(document.getElementById('player2Points').value) || 0;
    const total = score1 + score2;
    
    document.getElementById('totalMatchPoints').textContent = total;
    
    // Подсвечиваем если сумма очков не равна 21
    const totalElement = document.getElementById('totalMatchPoints').parentElement;
    if (total !== tournamentData.settings.totalPoints) {
        totalElement.style.color = 'var(--danger-color)';
        totalElement.style.fontWeight = 'bold';
    } else {
        totalElement.style.color = 'var(--success-color)';
        totalElement.style.fontWeight = 'normal';
    }
}

function saveMatchResult() {
    const match = tournamentData.matches.find(m => m.id === currentMatchId);
    if (!match) return;
    
    const player1Points = parseInt(document.getElementById('player1Points').value) || 0;
    const player2Points = parseInt(document.getElementById('player2Points').value) || 0;
    const totalPoints = player1Points + player2Points;
    
    // Проверяем сумму очков
    if (totalPoints !== tournamentData.settings.totalPoints) {
        if (!confirm(`Сумма очков (${totalPoints}) не равна ${tournamentData.settings.totalPoints}. Сохранить результат?`)) {
            return;
        }
    }
    
    // Обновляем результат матча
    match.player1Points = player1Points;
    match.player2Points = player2Points;
    match.totalPoints = totalPoints;
    match.completed = true;
    match.status = 'completed';
    match.winnerId = player1Points > player2Points ? match.player1Id : 
                    player2Points > player1Points ? match.player2Id : null;
    
    // Обновляем статистику игроков
    updatePlayerStats(match);
    
    hideModal('resultModal');
    saveTournamentData();
    renderAll();
    
    showNotification('Результат матча сохранен!', 'success');
}

function updatePlayerStats(match) {
    const player1 = tournamentData.players.find(p => p.id === match.player1Id);
    const player2 = tournamentData.players.find(p => p.id === match.player2Id);
    
    if (!player1 || !player2) return;
    
    // Обновляем общую статистику
    player1.matchesPlayed = (player1.matchesPlayed || 0) + 1;
    player2.matchesPlayed = (player2.matchesPlayed || 0) + 1;
    
    player1.points = (player1.points || 0) + match.player1Points;
    player2.points = (player2.points || 0) + match.player2Points;
    
    // Обновляем победы/поражения
    if (match.player1Points > match.player2Points) {
        player1.wins = (player1.wins || 0) + 1;
        player2.losses = (player2.losses || 0) + 1;
        
        // Обновляем рейтинг (простая система ELO)
        updateEloRating(player1, player2, true);
    } else if (match.player2Points > match.player1Points) {
        player2.wins = (player2.wins || 0) + 1;
        player1.losses = (player1.losses || 0) + 1;
        
        updateEloRating(player2, player1, true);
    } else {
        // Ничья
        updateEloRating(player1, player2, false);
    }
}

function updateEloRating(winner, loser, isWin) {
    const K = 32;
    const expectedWin = 1 / (1 + Math.pow(10, (loser.rating - winner.rating) / 400));
    
    if (isWin) {
        winner.rating = Math.round(winner.rating + K * (1 - expectedWin));
        loser.rating = Math.round(loser.rating + K * (0 - (1 - expectedWin)));
    } else {
        // Ничья
        winner.rating = Math.round(winner.rating + K * (0.5 - expectedWin));
        loser.rating = Math.round(loser.rating + K * (0.5 - (1 - expectedWin)));
    }
}

function startMatch(matchId) {
    const match = tournamentData.matches.find(m => m.id === matchId);
    if (match) {
        match.status = 'live';
        saveTournamentData();
        renderMatches();
        showNotification('Матч начат!', 'success');
    }
}

function pauseMatch(matchId) {
    const match = tournamentData.matches.find(m => m.id === matchId);
    if (match) {
        match.status = 'scheduled';
        saveTournamentData();
        renderMatches();
        showNotification('Матч приостановлен', 'info');
    }
}

function deleteMatch(matchId) {
    if (!confirm('Вы уверены, что хотите удалить этот матч?')) {
        return;
    }
    
    tournamentData.matches = tournamentData.matches.filter(m => m.id !== matchId);
    saveTournamentData();
    renderMatches();
    renderSchedule();
    
    showNotification('Матч удален', 'success');
}

function editResult(matchId) {
    const match = tournamentData.matches.find(m => m.id === matchId);
    if (match) {
        match.completed = false;
        match.status = 'scheduled';
        match.winnerId = null;
        
        // Возвращаем очки игрокам
        const player1 = tournamentData.players.find(p => p.id === match.player1Id);
        const player2 = tournamentData.players.find(p => p.id === match.player2Id);
        
        if (player1 && player2) {
            player1.points = Math.max(0, (player1.points || 0) - match.player1Points);
            player2.points = Math.max(0, (player2.points || 0) - match.player2Points);
            
            if (match.winnerId === match.player1Id) {
                player1.wins = Math.max(0, (player1.wins || 0) - 1);
                player2.losses = Math.max(0, (player2.losses || 0) - 1);
            } else if (match.winnerId === match.player2Id) {
                player2.wins = Math.max(0, (player2.wins || 0) - 1);
                player1.losses = Math.max(0, (player1.losses || 0) - 1);
            }
        }
        
        openResultModal(matchId);
    }
}

// Расписание
function generateSchedule() {
    if (tournamentData.matches.length === 0) {
        showNotification('Нет матчей для создания расписания', 'error');
        return;
    }
    
    const courts = tournamentData.settings.courts;
    const matchesPerCourt = Math.ceil(tournamentData.matches.length / courts);
    const matchDuration = tournamentData.settings.matchDuration || 30;
    
    let currentTime = new Date();
    currentTime.setHours(10, 0, 0, 0); // Начинаем с 10:00
    
    let matchIndex = 0;
    const unscheduledMatches = tournamentData.matches.filter(m => !m.startTime);
    
    for (let round = 0; round < matchesPerCourt; round++) {
        for (let court = 1; court <= courts; court++) {
            if (matchIndex < unscheduledMatches.length) {
                const match = unscheduledMatches[matchIndex];
                match.court = court;
                match.startTime = new Date(currentTime).toISOString();
                match.round = tournamentData.currentRound;
                matchIndex++;
            }
        }
        // Увеличиваем время для следующего раунда
        currentTime.setMinutes(currentTime.getMinutes() + matchDuration + 10); // +10 минут на перерыв
    }
    
    saveTournamentData();
    renderMatches();
    renderSchedule();
    
    showNotification('Расписание создано успешно!', 'success');
}

// Настройки
function saveSettings() {
    const totalPoints = parseInt(document.getElementById('totalPoints').value);
    const courtsCount = parseInt(document.getElementById('courtsCount').value);
    const matchDuration = parseInt(document.getElementById('matchDuration').value);
    const timezone = document.getElementById('timezone').value;
    
    tournamentData.settings = {
        totalPoints: totalPoints || 21,
        courts: courtsCount || 4,
        matchDuration: matchDuration || 30,
        timezone: timezone || 'Europe/Moscow',
        allowDraws: tournamentData.settings.allowDraws || false
    };
    
    saveTournamentData();
    showNotification('Настройки сохранены!', 'success');
}

// Экспорт данных
function exportStatistics() {
    const csvContent = convertToCSV(tournamentData.players);
    downloadCSV(csvContent, 'tournament_stats.csv');
    showNotification('Статистика экспортирована в CSV', 'success');
}

function exportData() {
    const dataStr = JSON.stringify(tournamentData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'tournament_data.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('Данные экспортированы в JSON', 'success');
}

function convertToCSV(players) {
    const headers = ['Место', 'Фамилия', 'Имя', 'Организация', 'Очки', 'Матчи', 'Победы', 'Поражения', 'Рейтинг'];
    
    const sortedPlayers = [...players].sort((a, b) => (b.points || 0) - (a.points || 0));
    
    const rows = sortedPlayers.map((player, index) => [
        index + 1,
        player.lastName,
        player.firstName,
        player.organization || '',
        player.points || 0,
        player.matchesPlayed || 0,
        player.wins || 0,
        player.losses || 0,
        player.rating || 1500
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function downloadCSV(content, fileName) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        year: 'numeric',
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

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function showNotification(message, type = 'info') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Добавляем стили для уведомления
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            padding: 15px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            min-width: 300px;
            max-width: 400px;
            border-left: 4px solid #4a6fa5;
        }
        
        .notification-success {
            border-left-color: #28a745;
        }
        
        .notification-error {
            border-left-color: #dc3545;
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 1;
        }
        
        .notification-content i {
            font-size: 20px;
        }
        
        .notification-success .notification-content i {
            color: #28a745;
        }
        
        .notification-error .notification-content i {
            color: #dc3545;
        }
        
        .notification-close {
            background: none;
            border: none;
            cursor: pointer;
            color: #6c757d;
            padding: 5px;
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(notification);
    
    // Автоматическое удаление через 5 секунд
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Функция для получения начальных данных
async function getDefaultData() {
    return {
        tournamentName: "Турнир по настольному теннису",
        tournamentType: "Americano",
        settings: {
            totalPoints: 21,
            courts: 4,
            timezone: "Europe/Moscow",
            allowDraws: false,
            matchDuration: 30
        },
        players: [
            {
                id: 1,
                lastName: "Иванов",
                firstName: "Иван",
                middleName: "Иванович",
                organization: "Спортклуб 'Чемпион'",
                nationality: "Русский",
                country: "Россия",
                points: 0,
                wins: 0,
                losses: 0,
                matchesPlayed: 0,
                rating: 1500
            },
            {
                id: 2,
                lastName: "Петров",
                firstName: "Петр",
                middleName: "Петрович",
                organization: "Клуб 'Молния'",
                nationality: "Русский",
                country: "Россия",
                points: 0,
                wins: 0,
                losses: 0,
                matchesPlayed: 0,
                rating: 1500
            },
            {
                id: 3,
                lastName: "Сидорова",
                firstName: "Анна",
                organization: "Фитнес-центр 'Энергия'",
                nationality: "Русская",
                country: "Россия",
                points: 0,
                wins: 0,
                losses: 0,
                matchesPlayed: 0,
                rating: 1500
            },
            {
                id: 4,
                lastName: "Смирнов",
                firstName: "Алексей",
                organization: "Спорткомплекс 'Олимп'",
                points: 0,
                wins: 0,
                losses: 0,
                matchesPlayed: 0,
                rating: 1500
            }
        ],
        matches: [],
        schedule: [],
        currentRound: 1,
        lastUpdated: new Date().toISOString()
    };
}
