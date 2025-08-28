class StudyPlanner {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.data = this.loadData();
        
        this.initializeElements();
        this.bindEvents();
        this.renderCalendar();
    }

    initializeElements() {
        // Calendar elements
        this.monthTitle = document.getElementById('monthTitle');
        this.prevMonthBtn = document.getElementById('prevMonth');
        this.nextMonthBtn = document.getElementById('nextMonth');
        this.calendarGrid = document.querySelector('.calendar-grid');

        // Modal elements
        this.modal = document.getElementById('dayModal');
        this.modalOverlay = document.getElementById('modalOverlay');
        this.modalClose = document.getElementById('modalClose');
        this.modalTitle = document.getElementById('modalTitle');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.saveBtn = document.getElementById('saveBtn');

        // Tab elements
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.trackingTab = document.getElementById('trackingTab');
        this.logsTab = document.getElementById('logsTab');

        // Goal elements
        this.studyGoal = document.getElementById('studyGoal');
        this.wasteGoal = document.getElementById('wasteGoal');
        this.sleepGoal = document.getElementById('sleepGoal');
        this.studyHours = document.getElementById('studyHours');
        this.wasteHours = document.getElementById('wasteHours');
        
        // Additional goals elements
        this.additionalGoals = document.getElementById('additionalGoals');
        this.newGoalInput = document.getElementById('newGoalInput');
        this.addGoalBtn = document.getElementById('addGoalBtn');
        this.additionalGoalsIndicator = document.getElementById('additionalGoalsIndicator');

        // Significance elements
        this.significanceDisplay = document.getElementById('significanceDisplay');
        this.newSignificanceInput = document.getElementById('newSignificanceInput');
        this.addSignificanceBtn = document.getElementById('addSignificanceBtn');

        // Logs elements
        this.logsDisplay = document.getElementById('logsDisplay');
    }

    bindEvents() {
        // Calendar navigation
        this.prevMonthBtn.addEventListener('click', () => this.navigateMonth(-1));
        this.nextMonthBtn.addEventListener('click', () => this.navigateMonth(1));

        // Modal events
        this.modalOverlay.addEventListener('click', () => this.closeModal());
        this.modalClose.addEventListener('click', () => this.closeModal());
        this.cancelBtn.addEventListener('click', () => this.closeModal());
        this.saveBtn.addEventListener('click', () => this.saveData());

        // Tab switching
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Goal events
        [this.studyGoal, this.wasteGoal, this.sleepGoal].forEach(goal => {
            goal.addEventListener('change', () => this.updateGoalIndicator());
        });

        // Additional goals
        this.addGoalBtn.addEventListener('click', () => this.addAdditionalGoal());
        this.newGoalInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addAdditionalGoal();
        });

        // Significance events
        this.addSignificanceBtn.addEventListener('click', () => this.addSignificance());
        this.newSignificanceInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addSignificance();
        });

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                this.closeModal();
            }
        });
    }

    loadData() {
        const saved = localStorage.getItem('studyPlannerData');
        return saved ? JSON.parse(saved) : {};
    }

    saveDataToStorage() {
        localStorage.setItem('studyPlannerData', JSON.stringify(this.data));
    }

    getDateKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    getDayData(date) {
        const key = this.getDateKey(date);
        if (!this.data[key]) {
            this.data[key] = {
                defaults: { study: false, waste: false, sleep: false },
                studyHours: 0,
                wasteHours: 0,
                additionalGoals: [],
                significances: []
            };
        }
        return this.data[key];
    }

    navigateMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderCalendar();
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Update month title
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        this.monthTitle.textContent = `${monthNames[month]} ${year}`;

        // Clear existing days (keep headers)
        const dayElements = this.calendarGrid.querySelectorAll('.calendar-day');
        dayElements.forEach(el => el.remove());

        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        // Add previous month's trailing days
        const prevMonth = new Date(year, month - 1, 0);
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            const day = prevMonth.getDate() - i;
            const date = new Date(year, month - 1, day);
            this.createDayElement(date, true);
        }

        // Add current month's days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            this.createDayElement(date, false);
        }

        // Add next month's leading days
        const totalCells = this.calendarGrid.children.length - 7; // Subtract headers
        const remainingCells = 42 - totalCells; // 6 rows * 7 days - current cells
        
        for (let day = 1; day <= remainingCells; day++) {
            const date = new Date(year, month + 1, day);
            this.createDayElement(date, true);
        }
    }

    createDayElement(date, isOtherMonth) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }

        // Check if it's today
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            dayElement.classList.add('current-day');
        }

        const dayData = this.getDayData(date);
        
        // Check completion status
        const defaultsComplete = dayData.defaults.study && dayData.defaults.waste && dayData.defaults.sleep;
        const hasDefaults = dayData.defaults.study || dayData.defaults.waste || dayData.defaults.sleep;
        
        if (defaultsComplete) {
            dayElement.classList.add('completed');
        } else if (hasDefaults) {
            dayElement.classList.add('incomplete');
        }

        // Check if has significance
        if (dayData.significances && dayData.significances.length > 0) {
            dayElement.classList.add('has-significance');
        }

        // Create day content
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = date.getDate();

        const dayHours = document.createElement('div');
        dayHours.className = 'day-hours';
        if (dayData.studyHours > 0 || dayData.wasteHours > 0) {
            dayHours.textContent = `S:${dayData.studyHours || 0} W:${dayData.wasteHours || 0}`;
        }

        // Additional goals indicator
        const additionalIndicator = document.createElement('div');
        additionalIndicator.className = 'day-additional-indicator';
        
        if (dayData.additionalGoals && dayData.additionalGoals.length > 0) {
            additionalIndicator.classList.add('has-additional');
            const allComplete = dayData.additionalGoals.every(goal => goal.completed);
            if (allComplete) {
                additionalIndicator.classList.add('additional-complete');
            }
        }

        // Significances display
        const significancesDiv = document.createElement('div');
        significancesDiv.className = 'day-significances';
        if (dayData.significances && dayData.significances.length > 0) {
            const displayCount = Math.min(3, dayData.significances.length);
            for (let i = 0; i < displayCount; i++) {
                const sigSpan = document.createElement('span');
                sigSpan.className = 'significance-item';
                sigSpan.textContent = dayData.significances[i];
                significancesDiv.appendChild(sigSpan);
            }
        }

        dayElement.appendChild(dayNumber);
        dayElement.appendChild(additionalIndicator);
        dayElement.appendChild(significancesDiv);
        dayElement.appendChild(dayHours);

        // Add click event
        dayElement.addEventListener('click', () => this.openModal(date));

        this.calendarGrid.appendChild(dayElement);
    }

    openModal(date) {
        this.selectedDate = date;
        const dayData = this.getDayData(date);
        
        // Update modal title
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        this.modalTitle.textContent = date.toLocaleDateString(undefined, options);

        // Populate form data
        this.studyGoal.checked = dayData.defaults.study;
        this.wasteGoal.checked = dayData.defaults.waste;
        this.sleepGoal.checked = dayData.defaults.sleep;
        this.studyHours.value = dayData.studyHours || '';
        this.wasteHours.value = dayData.wasteHours || '';

        // Render additional goals
        this.renderAdditionalGoals(dayData.additionalGoals || []);
        
        // Render significances
        this.renderSignificances(dayData.significances || []);
        
        // Update indicators
        this.updateGoalIndicator();
        this.updateAdditionalGoalsIndicator();

        // Render logs
        this.renderLogs(dayData);

        // Show modal
        this.modal.classList.remove('hidden');
        
        // Focus first input
        setTimeout(() => {
            if (!this.studyGoal.checked) {
                this.studyGoal.focus();
            } else if (this.studyHours.value === '') {
                this.studyHours.focus();
            }
        }, 100);
    }

    closeModal() {
        this.modal.classList.add('hidden');
        this.selectedDate = null;
        
        // Reset form
        this.newGoalInput.value = '';
        this.newSignificanceInput.value = '';
        
        // Switch back to tracking tab
        this.switchTab('tracking');
    }

    switchTab(tabName) {
        // Update tab buttons
        this.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        this.trackingTab.classList.toggle('active', tabName === 'tracking');
        this.logsTab.classList.toggle('active', tabName === 'logs');
    }

    updateGoalIndicator() {
        // This is handled by CSS classes, but we can add additional logic here if needed
    }

    updateAdditionalGoalsIndicator() {
        if (!this.selectedDate) return;
        
        const dayData = this.getDayData(this.selectedDate);
        const circle = this.additionalGoalsIndicator.querySelector('.goal-circle');
        
        // Reset classes
        circle.classList.remove('has-additional', 'additional-complete');
        
        if (dayData.additionalGoals && dayData.additionalGoals.length > 0) {
            circle.classList.add('has-additional');
            const allComplete = dayData.additionalGoals.every(goal => goal.completed);
            if (allComplete) {
                circle.classList.add('additional-complete');
            }
        }
    }

    renderAdditionalGoals(goals) {
        this.additionalGoals.innerHTML = '';
        
        goals.forEach((goal, index) => {
            const goalDiv = document.createElement('div');
            goalDiv.className = 'additional-goal-item';
            
            goalDiv.innerHTML = `
                <label>
                    <input type="checkbox" ${goal.completed ? 'checked' : ''} 
                           onchange="studyPlanner.toggleAdditionalGoal(${index})">
                    <span class="checkmark"></span>
                    ${goal.text}
                </label>
                <button class="remove-goal-btn" onclick="studyPlanner.removeAdditionalGoal(${index})">×</button>
            `;
            
            this.additionalGoals.appendChild(goalDiv);
        });
    }

    addAdditionalGoal() {
        const text = this.newGoalInput.value.trim();
        if (!text) return;

        const dayData = this.getDayData(this.selectedDate);
        if (!dayData.additionalGoals) {
            dayData.additionalGoals = [];
        }
        
        dayData.additionalGoals.push({ text, completed: false });
        this.renderAdditionalGoals(dayData.additionalGoals);
        this.updateAdditionalGoalsIndicator();
        
        this.newGoalInput.value = '';
        this.newGoalInput.focus();
    }

    toggleAdditionalGoal(index) {
        const dayData = this.getDayData(this.selectedDate);
        dayData.additionalGoals[index].completed = !dayData.additionalGoals[index].completed;
        this.updateAdditionalGoalsIndicator();
    }

    removeAdditionalGoal(index) {
        const dayData = this.getDayData(this.selectedDate);
        dayData.additionalGoals.splice(index, 1);
        this.renderAdditionalGoals(dayData.additionalGoals);
        this.updateAdditionalGoalsIndicator();
    }

    renderSignificances(significances) {
        this.significanceDisplay.innerHTML = '';
        
        significances.forEach((significance, index) => {
            const sigDiv = document.createElement('div');
            sigDiv.className = 'significance-item-display';
            
            sigDiv.innerHTML = `
                <span class="significance-text">${significance}</span>
                <button class="remove-significance-btn" onclick="studyPlanner.removeSignificance(${index})">×</button>
            `;
            
            this.significanceDisplay.appendChild(sigDiv);
        });
    }

    addSignificance() {
        const text = this.newSignificanceInput.value.trim();
        if (!text) return;

        const dayData = this.getDayData(this.selectedDate);
        if (!dayData.significances) {
            dayData.significances = [];
        }
        
        dayData.significances.push(text);
        this.renderSignificances(dayData.significances);
        
        this.newSignificanceInput.value = '';
        this.newSignificanceInput.focus();
    }

    removeSignificance(index) {
        const dayData = this.getDayData(this.selectedDate);
        dayData.significances.splice(index, 1);
        this.renderSignificances(dayData.significances);
    }

    renderLogs(dayData) {
        const logs = [];
        
        // Default goals status
        if (dayData.defaults.study || dayData.defaults.waste || dayData.defaults.sleep) {
            const completed = [];
            if (dayData.defaults.study) completed.push('Study Hours');
            if (dayData.defaults.waste) completed.push('Waste Hours');
            if (dayData.defaults.sleep) completed.push('Good Sleep');
            logs.push(`✅ Completed: ${completed.join(', ')}`);
        }

        // Hours logged
        if (dayData.studyHours > 0) {
            logs.push(`📚 Study Hours: ${dayData.studyHours}`);
        }
        if (dayData.wasteHours > 0) {
            logs.push(`⏰ Waste Hours: ${dayData.wasteHours}`);
        }

        // Additional goals
        if (dayData.additionalGoals && dayData.additionalGoals.length > 0) {
            const completed = dayData.additionalGoals.filter(goal => goal.completed);
            logs.push(`🎯 Additional Goals: ${completed.length}/${dayData.additionalGoals.length} completed`);
        }

        // Significances
        if (dayData.significances && dayData.significances.length > 0) {
            logs.push(`⭐ Significances: ${dayData.significances.length} marked`);
        }

        // Display logs
        this.logsDisplay.innerHTML = logs.length > 0 
            ? logs.map(log => `<div class="log-item">${log}</div>`).join('')
            : '<div class="log-item">No activity recorded for this day.</div>';
    }

    saveData() {
        if (!this.selectedDate) return;

        const dayData = this.getDayData(this.selectedDate);
        
        // Save default goals
        dayData.defaults.study = this.studyGoal.checked;
        dayData.defaults.waste = this.wasteGoal.checked;
        dayData.defaults.sleep = this.sleepGoal.checked;
        
        // Save hours
        dayData.studyHours = parseFloat(this.studyHours.value) || 0;
        dayData.wasteHours = parseFloat(this.wasteHours.value) || 0;

        // Save to localStorage
        this.saveDataToStorage();
        
        // Re-render calendar to update visual indicators
        this.renderCalendar();
        
        // Close modal
        this.closeModal();
    }
}

// Initialize the app
let studyPlanner;
document.addEventListener('DOMContentLoaded', () => {
    studyPlanner = new StudyPlanner();
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
