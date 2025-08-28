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

    // Checkboxes (Default Goals)
    this.studyGoal = document.getElementById('studyGoal'); // Daily Planner
    this.wasteGoal = document.getElementById('wasteGoal'); // Worked Hard and Happy
    this.sleepGoal = document.getElementById('sleepGoal'); // Prayed and Mindful

    // Number entries
    this.studyHours = document.getElementById('studyHours'); // Studied Hours (S)
    this.wasteHours = document.getElementById('wasteHours'); // Time Wasted (W)

    // Additional goals
    this.additionalGoals = document.getElementById('additionalGoals');
    this.newGoalInput = document.getElementById('newGoalInput');
    this.addGoalBtn = document.getElementById('addGoalBtn');
    this.additionalGoalsIndicator = document.getElementById('additionalGoalsIndicator');

    // Significance
    this.significanceDisplay = document.getElementById('significanceDisplay');
    this.newSignificanceInput = document.getElementById('newSignificanceInput');
    this.addSignificanceBtn = document.getElementById('addSignificanceBtn');

    // Logs
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

    // Checkbox changes update indicators
    [this.studyGoal, this.wasteGoal, this.sleepGoal].forEach(goal => {
      goal.addEventListener('change', () => this.updateAdditionalGoalsIndicator());
    });

    // Additional goals events
    this.addGoalBtn.addEventListener('click', () => this.addAdditionalGoal());
    this.newGoalInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addAdditionalGoal();
    });

    // Significance events
    this.addSignificanceBtn.addEventListener('click', () => this.addSignificance());
    this.newSignificanceInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addSignificance();
    });

    // ESC closes modal
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

    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    this.monthTitle.textContent = `${monthNames[month]} ${year}`;

    // Clear prior days (keep headers)
    this.calendarGrid.querySelectorAll('.calendar-day').forEach(el => el.remove());

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();

    // Trailing previous month
    const prevMonth = new Date(year, month, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonth.getDate() - i;
      const date = new Date(year, month - 1, day);
      this.createDayElement(date, true);
    }

    // Current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      this.createDayElement(date, false);
    }

    // Leading next month to fill 6 rows
    const totalCells = this.calendarGrid.children.length - 7; // minus headers
    const remainingCells = 42 - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      this.createDayElement(date, true);
    }
  }

  createDayElement(date, isOtherMonth) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    if (isOtherMonth) dayEl.classList.add('other-month');

    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      dayEl.classList.add('current-day');
    }

    const dayData = this.getDayData(date);

    // Visual classes based on defaults
    const defaultsComplete = dayData.defaults.study && dayData.defaults.waste && dayData.defaults.sleep;
    const anyDefaults = dayData.defaults.study || dayData.defaults.waste || dayData.defaults.sleep;
    if (defaultsComplete) {
      dayEl.classList.add('completed');   // map to green border in CSS
    } else if (anyDefaults) {
      dayEl.classList.add('incomplete');  // map to red border in CSS
    }

    // Significance highlight
    if (dayData.significances && dayData.significances.length > 0) {
      dayEl.classList.add('has-significance'); // map to yellow in CSS
    }

    // Day number
    const dayNum = document.createElement('div');
    dayNum.className = 'day-number';
    dayNum.textContent = date.getDate();

    // Hours (S/W) shown in the grid
    const dayHours = document.createElement('div');
    dayHours.className = 'day-hours';
    if (dayData.studyHours > 0 || dayData.wasteHours > 0) {
      dayHours.textContent = `S:${dayData.studyHours || 0} W:${dayData.wasteHours || 0}`;
    }

    // Additional goals top-right indicator
    const addCircle = document.createElement('div');
    addCircle.className = 'day-additional-indicator';
    if (dayData.additionalGoals && dayData.additionalGoals.length > 0) {
      addCircle.classList.add('has-additional'); // red circle by CSS
      const allComplete = dayData.additionalGoals.every(g => g.completed);
      if (allComplete) addCircle.classList.add('additional-complete'); // green circle by CSS
    }

    // Up to 3 significances inline (optional)
    const sigWrap = document.createElement('div');
    sigWrap.className = 'day-significances';
    if (dayData.significances && dayData.significances.length > 0) {
      const n = Math.min(3, dayData.significances.length);
      for (let i = 0; i < n; i++) {
        const s = document.createElement('span');
        s.className = 'significance-item';
        s.textContent = dayData.significances[i];
        sigWrap.appendChild(s);
      }
    }

    dayEl.appendChild(dayNum);
    dayEl.appendChild(addCircle);
    dayEl.appendChild(sigWrap);
    dayEl.appendChild(dayHours);

    dayEl.addEventListener('click', () => this.openModal(date));
    this.calendarGrid.appendChild(dayEl);
  }

  openModal(date) {
    this.selectedDate = date;
    const dayData = this.getDayData(date);

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    this.modalTitle.textContent = date.toLocaleDateString(undefined, options);

    // Checkboxes
    this.studyGoal.checked = dayData.defaults.study; // Daily Planner
    this.wasteGoal.checked = dayData.defaults.waste; // Worked Hard and Happy
    this.sleepGoal.checked = dayData.defaults.sleep; // Prayed and Mindful

    // Number entries
    this.studyHours.value = dayData.studyHours || '';
    this.wasteHours.value = dayData.wasteHours || '';

    // Lists
    this.renderAdditionalGoals(dayData.additionalGoals || []);
    this.renderSignificances(dayData.significances || []);

    // Indicators
    this.updateAdditionalGoalsIndicator();

    // Logs
    this.renderLogs(dayData);

    // Show modal
    this.modal.classList.remove('hidden');

    setTimeout(() => {
      if (!this.studyGoal.checked) this.studyGoal.focus();
      else if (this.studyHours.value === '') this.studyHours.focus();
    }, 100);
  }

  closeModal() {
    this.modal.classList.add('hidden');
    this.selectedDate = null;
    this.newGoalInput.value = '';
    this.newSignificanceInput.value = '';
    this.switchTab('tracking');
  }

  switchTab(tabName) {
    this.tabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
    this.trackingTab.classList.toggle('active', tabName === 'tracking');
    this.logsTab.classList.toggle('active', tabName === 'logs');
  }

  updateAdditionalGoalsIndicator() {
    if (!this.selectedDate) return;
    const dayData = this.getDayData(this.selectedDate);
    const circle = this.additionalGoalsIndicator.querySelector('.goal-circle');
    circle.classList.remove('has-additional', 'additional-complete');
    if (dayData.additionalGoals && dayData.additionalGoals.length > 0) {
      circle.classList.add('has-additional');
      const allComplete = dayData.additionalGoals.every(g => g.completed);
      if (allComplete) circle.classList.add('additional-complete');
    }
  }

  renderAdditionalGoals(goals) {
    this.additionalGoals.innerHTML = '';
    goals.forEach((goal, index) => {
      const row = document.createElement('div');
      row.className = 'additional-goal-item';
      row.innerHTML = `
        <label>
          <input type="checkbox" ${goal.completed ? 'checked' : ''} onchange="studyPlanner.toggleAdditionalGoal(${index})"/>
          <span class="checkmark"></span>
          ${goal.text}
        </label>
        <button class="remove-goal-btn" onclick="studyPlanner.removeAdditionalGoal(${index})">×</button>
      `;
      this.additionalGoals.appendChild(row);
    });
  }

  addAdditionalGoal() {
    const text = this.newGoalInput.value.trim();
    if (!text) return;
    const dayData = this.getDayData(this.selectedDate);
    if (!dayData.additionalGoals) dayData.additionalGoals = [];
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
    significances.forEach((sig, index) => {
      const row = document.createElement('div');
      row.className = 'significance-item-display';
      row.innerHTML = `
        <span class="significance-text">${sig}</span>
        <button class="remove-significance-btn" onclick="studyPlanner.removeSignificance(${index})">×</button>
      `;
      this.significanceDisplay.appendChild(row);
    });
  }

  addSignificance() {
    const text = this.newSignificanceInput.value.trim();
    if (!text) return;
    const dayData = this.getDayData(this.selectedDate);
    if (!dayData.significances) dayData.significances = [];
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
    const completed = [];
    if (dayData.defaults.study) completed.push('Daily Planner');
    if (dayData.defaults.waste) completed.push('Worked Hard and Happy');
    if (dayData.defaults.sleep) completed.push('Prayed and Mindful');
    if (completed.length) logs.push(`✅ Completed: ${completed.join(', ')}`);

    if (dayData.studyHours > 0) logs.push(`📚 Studied Hours (S): ${dayData.studyHours}`);
    if (dayData.wasteHours > 0) logs.push(`⏰ Time Wasted (W): ${dayData.wasteHours}`);

    if (dayData.additionalGoals?.length) {
      const done = dayData.additionalGoals.filter(g => g.completed).length;
      logs.push(`🎯 Additional Goals: ${done}/${dayData.additionalGoals.length} completed`);
    }
    if (dayData.significances?.length) {
      logs.push(`⭐ Significances: ${dayData.significances.length} marked`);
    }

    this.logsDisplay.innerHTML = logs.length
      ? logs.map(l => `<div class="log-item">${l}</div>`).join('')
      : '<div class="log-item">No activity recorded for this day.</div>';
  }

  saveData() {
    if (!this.selectedDate) return;
    const dayData = this.getDayData(this.selectedDate);

    // Save checkboxes
    dayData.defaults.study = this.studyGoal.checked; // Daily Planner
    dayData.defaults.waste = this.wasteGoal.checked; // Worked Hard and Happy
    dayData.defaults.sleep = this.sleepGoal.checked; // Prayed and Mindful

    // Save numbers
    dayData.studyHours = parseFloat(this.studyHours.value) || 0; // Studied Hours (S)
    dayData.wasteHours = parseFloat(this.wasteHours.value) || 0; // Time Wasted (W)

    // Persist and refresh
    this.saveDataToStorage();
    this.renderCalendar();
    this.closeModal();
  }
}

// Initialize
let studyPlanner;
document.addEventListener('DOMContentLoaded', () => {
  studyPlanner = new StudyPlanner();
});

// SW registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registered:', reg))
      .catch(err => console.log('SW registration failed:', err));
  });
}
