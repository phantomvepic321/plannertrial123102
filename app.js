// Success Time PWA JavaScript
class SuccessTimeApp {
    constructor() {
        this.currentDate = new Date();
        this.currentMonth = this.currentDate.getMonth();
        this.currentYear = this.currentDate.getFullYear();
        this.selectedDate = null;
        this.data = {};
        this.memoryStorage = {};
        
        // Default checklist items (fixed)
        this.defaultChecklist = [
            { text: "Yellow Book", completed: false, fixed: true },
            { text: "Worked hard and Happy", completed: false, fixed: true },
            { text: "Prayed and Mindful", completed: false, fixed: true }
        ];
        
        this.init();
    }
    
    async init() {
        await this.initStorage();
        this.setupEventListeners();
        this.renderCalendar();
        this.updateStorageIndicators();
    }
    
    async initStorage() {
        // Initialize IndexedDB
        try {
            await this.initIndexedDB();
        } catch (error) {
            console.warn('IndexedDB failed to initialize:', error);
        }
        
        // Load existing data
        await this.loadData();
    }
    
    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('SuccessTimeDB', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('dailyData')) {
                    db.createObjectStore('dailyData', { keyPath: 'date' });
                }
            };
        });
    }
    
    async loadData() {
        try {
            // Try IndexedDB first
            if (this.db) {
                const transaction = this.db.transaction(['dailyData'], 'readonly');
                const store = transaction.objectStore('dailyData');
                const request = store.getAll();
                
                request.onsuccess = () => {
                    const dbData = request.result;
                    dbData.forEach(item => {
                        this.data[item.date] = item.data;
                    });
                    this.renderCalendar();
                };
            }
            
            // Fallback to localStorage
            const localData = localStorage.getItem('successTimeData');
            if (localData && Object.keys(this.data).length === 0) {
                this.data = JSON.parse(localData);
                this.renderCalendar();
            }
            
        } catch (error) {
            console.warn('Failed to load data:', error);
        }
    }
    
    async saveData(date, dayData) {
        this.data[date] = dayData;
        this.memoryStorage[date] = dayData;
        
        // Save to IndexedDB
        if (this.db) {
            try {
                const transaction = this.db.transaction(['dailyData'], 'readwrite');
                const store = transaction.objectStore('dailyData');
                await store.put({ date, data: dayData });
            } catch (error) {
                console.warn('IndexedDB save failed:', error);
            }
        }
        
        // Save to localStorage
        try {
            localStorage.setItem('successTimeData', JSON.stringify(this.data));
        } catch (error) {
            console.warn('localStorage save failed:', error);
        }
        
        // Save to sessionStorage
        try {
            sessionStorage.setItem('successTimeData', JSON.stringify(this.data));
        } catch (error) {
            console.warn('sessionStorage save failed:', error);
        }
        
        this.updateStorageIndicators();
        this.renderCalendar();
    }
    
    updateStorageIndicators() {
        // IndexedDB indicator
        const idbIndicator = document.getElementById('indexedDBStatus');
        idbIndicator.className = 'storage-indicator' + (this.db ? ' healthy' : '');
        
        // localStorage indicator
        const lsIndicator = document.getElementById('localStorageStatus');
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            lsIndicator.className = 'storage-indicator healthy';
        } catch {
            lsIndicator.className = 'storage-indicator';
        }
        
        // sessionStorage indicator
        const ssIndicator = document.getElementById('sessionStorageStatus');
        try {
            sessionStorage.setItem('test', 'test');
            sessionStorage.removeItem('test');
            ssIndicator.className = 'storage-indicator healthy';
        } catch {
            ssIndicator.className = 'storage-indicator';
        }
    }
    
    setupEventListeners() {
        // Calendar navigation
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentMonth--;
            if (this.currentMonth < 0) {
                this.currentMonth = 11;
                this.currentYear--;
            }
            this.renderCalendar();
        });
        
        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentMonth++;
            if (this.currentMonth > 11) {
                this.currentMonth = 0;
                this.currentYear++;
            }
            this.renderCalendar();
        });
        
        // Modal controls
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });
        
        document.getElementById('toggleToChecklist').addEventListener('click', () => {
            this.showChecklistView();
        });
        
        document.getElementById('toggleToLogs').addEventListener('click', () => {
            this.showLogsView();
        });
        
        document.getElementById('addMoreGoal').addEventListener('click', () => {
            this.addAdditionalGoal();
        });
        
        document.getElementById('saveData').addEventListener('click', () => {
            this.saveCurrentData();
        });
        
        // Close modal when clicking outside
        document.getElementById('dayModal').addEventListener('click', (e) => {
            if (e.target.id === 'dayModal') {
                this.closeModal();
            }
        });
    }
    
    renderCalendar() {
        const grid = document.getElementById('calendarGrid');
        const monthYear = document.getElementById('monthYear');
        
        // Update month/year display
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        monthYear.textContent = `${months[this.currentMonth]} ${this.currentYear}`;
        
        // Clear grid
        grid.innerHTML = '';
        
        // Add day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.className = 'day-week-header';
            header.textContent = day;
            grid.appendChild(header);
        });
        
        // Get first day of month and number of days
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day other-month';
            grid.appendChild(emptyDay);
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            const dateStr = this.formatDate(this.currentYear, this.currentMonth, day);
            const dayData = this.data[dateStr];
            
            // Check if this is current day
            const isCurrentDay = this.isCurrentDay(this.currentYear, this.currentMonth, day);
            if (isCurrentDay) {
                dayElement.classList.add('current-day');
            }
            
            // Apply color logic based on default checklist status
            if (dayData && dayData.defaultChecklist && !isCurrentDay) {
                const allDefaultsChecked = dayData.defaultChecklist.every(item => item.completed);
                const anyDefaultUnchecked = dayData.defaultChecklist.some(item => !item.completed);
                
                if (allDefaultsChecked) {
                    dayElement.classList.add('all-defaults-checked');
                } else if (anyDefaultUnchecked) {
                    dayElement.classList.add('any-default-unchecked');
                }
            }
            
            // Day number
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = day;
            dayElement.appendChild(dayNumber);
            
            // Day stats (W:X L:Y)
            const dayStats = document.createElement('div');
            dayStats.className = 'day-stats';
            if (dayData && (dayData.timeStudied > 0 || dayData.timeWasted > 0)) {
                if (dayData.timeStudied > 0) {
                    const studiedDiv = document.createElement('div');
                    studiedDiv.textContent = `W:${dayData.timeStudied}`;
                    dayStats.appendChild(studiedDiv);
                }
                if (dayData.timeWasted > 0) {
                    const wastedDiv = document.createElement('div');
                    wastedDiv.textContent = `L:${dayData.timeWasted}`;
                    dayStats.appendChild(wastedDiv);
                }
            }
            dayElement.appendChild(dayStats);
            
            // Add click listener
            dayElement.addEventListener('click', () => {
                this.openDayModal(this.currentYear, this.currentMonth, day);
            });
            
            grid.appendChild(dayElement);
        }
    }
    
    isCurrentDay(year, month, day) {
        const today = new Date();
        return year === today.getFullYear() && 
               month === today.getMonth() && 
               day === today.getDate();
    }
    
    formatDate(year, month, day) {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    
    openDayModal(year, month, day) {
        this.selectedDate = this.formatDate(year, month, day);
        const dayData = this.data[this.selectedDate] || this.getDefaultDayData();
        
        // Update modal title
        const date = new Date(year, month, day);
        document.getElementById('modalDate').textContent = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Load data into modal
        this.loadModalData(dayData);
        
        // Show modal
        document.getElementById('dayModal').classList.remove('hidden');
        
        // Show checklist view by default
        this.showChecklistView();
    }
    
    closeModal() {
        document.getElementById('dayModal').classList.add('hidden');
        this.selectedDate = null;
    }
    
    getDefaultDayData() {
        return {
            defaultChecklist: [...this.defaultChecklist],
            additionalGoals: [
                { text: "", completed: false },
                { text: "", completed: false },
                { text: "", completed: false },
                { text: "", completed: false },
                { text: "", completed: false }
            ],
            timeStudied: 0,
            timeWasted: 0
        };
    }
    
    loadModalData(dayData) {
        // Load default checklist
        dayData.defaultChecklist.forEach((item, index) => {
            const checkbox = document.getElementById(`default-${index + 1}`);
            if (checkbox) {
                checkbox.checked = item.completed;
            }
        });
        
        // Load additional goals
        this.renderAdditionalGoals(dayData.additionalGoals);
        
        // Load logs
        document.getElementById('timeStudied').value = dayData.timeStudied || 0;
        document.getElementById('timeWasted').value = dayData.timeWasted || 0;
    }
    
    renderAdditionalGoals(goals) {
        const container = document.getElementById('additionalGoals');
        container.innerHTML = '';
        
        goals.forEach((goal, index) => {
            const goalDiv = document.createElement('div');
            goalDiv.className = 'additional-goal-item';
            
            const textInput = document.createElement('input');
            textInput.type = 'text';
            textInput.className = 'form-control';
            textInput.placeholder = `Goal ${index + 1}`;
            textInput.value = goal.text;
            textInput.dataset.index = index;
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = goal.completed;
            checkbox.dataset.index = index;
            
            goalDiv.appendChild(textInput);
            goalDiv.appendChild(checkbox);
            
            // Add remove button for goals beyond the initial 5
            if (index >= 5) {
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-goal';
                removeBtn.innerHTML = '×';
                removeBtn.addEventListener('click', () => {
                    this.removeAdditionalGoal(index);
                });
                goalDiv.appendChild(removeBtn);
            }
            
            container.appendChild(goalDiv);
        });
    }
    
    addAdditionalGoal() {
        const currentData = this.getCurrentModalData();
        currentData.additionalGoals.push({ text: "", completed: false });
        this.renderAdditionalGoals(currentData.additionalGoals);
    }
    
    removeAdditionalGoal(index) {
        const currentData = this.getCurrentModalData();
        currentData.additionalGoals.splice(index, 1);
        this.renderAdditionalGoals(currentData.additionalGoals);
    }
    
    showChecklistView() {
        document.getElementById('checklistView').classList.remove('hidden');
        document.getElementById('logsView').classList.add('hidden');
        document.getElementById('toggleToChecklist').classList.add('active');
        document.getElementById('toggleToLogs').classList.remove('active');
    }
    
    showLogsView() {
        document.getElementById('checklistView').classList.add('hidden');
        document.getElementById('logsView').classList.remove('hidden');
        document.getElementById('toggleToChecklist').classList.remove('active');
        document.getElementById('toggleToLogs').classList.add('active');
    }
    
    getCurrentModalData() {
        const data = {
            defaultChecklist: [],
            additionalGoals: [],
            timeStudied: parseFloat(document.getElementById('timeStudied').value) || 0,
            timeWasted: parseFloat(document.getElementById('timeWasted').value) || 0
        };
        
        // Get default checklist data
        this.defaultChecklist.forEach((item, index) => {
            const checkbox = document.getElementById(`default-${index + 1}`);
            data.defaultChecklist.push({
                text: item.text,
                completed: checkbox ? checkbox.checked : false,
                fixed: true
            });
        });
        
        // Get additional goals data
        const goalInputs = document.querySelectorAll('#additionalGoals .additional-goal-item');
        goalInputs.forEach(goalDiv => {
            const textInput = goalDiv.querySelector('input[type="text"]');
            const checkbox = goalDiv.querySelector('input[type="checkbox"]');
            data.additionalGoals.push({
                text: textInput.value,
                completed: checkbox.checked
            });
        });
        
        return data;
    }
    
    saveCurrentData() {
        if (!this.selectedDate) return;
        
        const data = this.getCurrentModalData();
        this.saveData(this.selectedDate, data);
        this.closeModal();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SuccessTimeApp();
});

// Register service worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('data:text/javascript;base64,c2VsZi5hZGRFdmVudExpc3RlbmVyKCdpbnN0YWxsJywgZXZlbnQgPT4gewogIGV2ZW50LndhaXRVbnRpbChzZWxmLnNraXBXYWl0aW5nKCkpOwp9KTsKCnNlbGYuYWRkRXZlbnRMaXN0ZW5lcignZmV0Y2gnLCBldmVudCA9PiB7CiAgZXZlbnQucmVzcG9uZFdpdGgoZmV0Y2goZXZlbnQucmVxdWVzdCkpOwp9KTs=')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
