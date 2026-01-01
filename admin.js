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
                        <button class="btn btn-warning
