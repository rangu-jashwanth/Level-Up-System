/**
 * SYSTEM // SELF-MASTERY OS — CORE CLIENT RUNTIME (app.js)
 * Architecture: Modular ES6+ with Event-Driven Design & Local-First Persistence.
 * Zero hardcoded tasks, routines, or personal goals. The user commands the system.
 */

(() => {
  'use strict';

  /* ==========================================================================
     1. SOUND SYNTHESIS ENGINE (WEB AUDIO API)
     ========================================================================== */
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.enabled = localStorage.getItem('apex_sound_enabled') === 'true';
    }

    init() {
      if (!this.ctx && typeof (window.AudioContext || window.webkitAudioContext) !== 'undefined') {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('apex_sound_enabled', this.enabled.toString());
      if (this.enabled) {
        this.init();
        this.playBeep(720, 0.06, 'sine', 0.08);
      }
      return this.enabled;
    }

    playBeep(freq = 600, duration = 0.05, type = 'sine', gainVal = 0.06) {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {}
    }

    playSuccessChime() {
      if (!this.enabled) return;
      this.playBeep(523.25, 0.1, 'sine', 0.08); // C5
      setTimeout(() => this.playBeep(659.25, 0.1, 'sine', 0.08), 90); // E5
      setTimeout(() => this.playBeep(783.99, 0.2, 'sine', 0.1), 180); // G5
    }
  }

  const sound = new SoundEngine();

  /* ==========================================================================
     2. APP STATE MANAGEMENT & LOCAL STORAGE
     ========================================================================== */
  class AppState {
    constructor() {
      this.todayStr = this.getTodayDateString();
      this.initStorage();
    }

    getTodayDateString() {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    initStorage() {
      if (!localStorage.getItem('apex_tasks')) {
        localStorage.setItem('apex_tasks', JSON.stringify([]));
      }
      if (!localStorage.getItem('apex_fitness_activities')) {
        localStorage.setItem('apex_fitness_activities', JSON.stringify([]));
      }
      if (!localStorage.getItem('apex_distractions')) {
        localStorage.setItem('apex_distractions', JSON.stringify([]));
      }
      if (!localStorage.getItem('apex_xp')) {
        localStorage.setItem('apex_xp', '0');
      }
      if (!localStorage.getItem('apex_achievements')) {
        localStorage.setItem('apex_achievements', JSON.stringify([]));
      }
      if (!localStorage.getItem('apex_focus_history')) {
        localStorage.setItem('apex_focus_history', JSON.stringify([]));
      }
      if (!localStorage.getItem('apex_reflections')) {
        localStorage.setItem('apex_reflections', JSON.stringify([]));
      }
      if (!localStorage.getItem('apex_mission')) {
        localStorage.setItem('apex_mission', JSON.stringify({ building: '', why: '', values: '', direction: '' }));
      }
    }

    // --- Missions CRUD ---
    getTasks() {
      try {
        return JSON.parse(localStorage.getItem('apex_tasks')) || [];
      } catch (e) { return []; }
    }

    saveTasks(tasks) {
      localStorage.setItem('apex_tasks', JSON.stringify(tasks));
      window.dispatchEvent(new CustomEvent('apex:tasks-updated'));
    }

    addTask(taskData) {
      const tasks = this.getTasks();
      const newTask = {
        id: 'msn_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        title: taskData.title.trim(),
        description: (taskData.description || '').trim(),
        category: taskData.category || 'TECHNICAL',
        priority: taskData.priority || 'P2',
        deadline: taskData.deadline || '', // Optional! User manually decides
        startDate: taskData.startDate || '',
        estimatedEffort: (taskData.estimatedEffort || '').trim(),
        status: 'TODO',
        subtasks: taskData.subtasks || [],
        notes: (taskData.notes || '').trim(),
        createdAt: Date.now()
      };
      tasks.unshift(newTask);
      this.saveTasks(tasks);
      return newTask;
    }

    updateTask(id, updatedFields) {
      const tasks = this.getTasks();
      const index = tasks.findIndex(t => t.id === id);
      if (index !== -1) {
        tasks[index] = { ...tasks[index], ...updatedFields };
        this.saveTasks(tasks);
        return tasks[index];
      }
      return null;
    }

    deleteTask(id) {
      let tasks = this.getTasks();
      tasks = tasks.filter(t => t.id !== id);
      this.saveTasks(tasks);
    }

    toggleTaskCompletion(id) {
      const tasks = this.getTasks();
      const task = tasks.find(t => t.id === id);
      if (task) {
        const isNowCompleted = task.status !== 'COMPLETED';
        task.status = isNowCompleted ? 'COMPLETED' : 'TODO';
        
        if (isNowCompleted && task.subtasks) {
          task.subtasks.forEach(st => st.completed = true);
        }

        this.saveTasks(tasks);

        if (isNowCompleted) {
          this.awardXPForTask(task);
          this.logAchievement(task);
          sound.playSuccessChime();
        }
        return isNowCompleted;
      }
      return false;
    }

    toggleSubtaskCompletion(taskId, subtaskId) {
      const tasks = this.getTasks();
      const task = tasks.find(t => t.id === taskId);
      if (task && task.subtasks) {
        const sub = task.subtasks.find(s => s.id === subtaskId);
        if (sub) {
          sub.completed = !sub.completed;
          
          const allDone = task.subtasks.every(s => s.completed);
          if (allDone) {
            task.status = 'COMPLETED';
            this.awardXPForTask(task);
            this.logAchievement(task);
            sound.playSuccessChime();
          } else if (task.status === 'COMPLETED') {
            task.status = 'IN_PROGRESS';
          }
          this.saveTasks(tasks);
          return sub.completed;
        }
      }
      return false;
    }

    addSubtask(taskId, subtaskTitle) {
      const tasks = this.getTasks();
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        if (!task.subtasks) task.subtasks = [];
        const newSub = {
          id: 'qst_' + Date.now() + '_' + Math.floor(Math.random() * 100),
          title: subtaskTitle.trim(),
          completed: false
        };
        task.subtasks.push(newSub);
        this.saveTasks(tasks);
        return newSub;
      }
      return null;
    }

    // --- XP & Progression ---
    getXP() {
      return parseInt(localStorage.getItem('apex_xp') || '0', 10);
    }

    awardXPForTask(task) {
      let earnedXP = 20;
      if (task.priority === 'P1') earnedXP = 50;
      else if (task.priority === 'P2') earnedXP = 35;
      else if (task.priority === 'P3') earnedXP = 20;
      else if (task.priority === 'P4') earnedXP = 10;

      if (task.subtasks && task.subtasks.length > 0) {
        earnedXP += task.subtasks.length * 5;
      }

      const currentXP = this.getXP();
      const newXP = currentXP + earnedXP;
      localStorage.setItem('apex_xp', newXP.toString());
      window.dispatchEvent(new CustomEvent('apex:xp-updated', { detail: { earnedXP, newXP } }));
    }

    getRankInfo() {
      const xp = this.getXP();
      if (xp >= 2000) return { title: 'MASTER', level: 6, reqXP: 2000, nextXP: 5000, symbol: 'MS' };
      if (xp >= 1200) return { title: 'COMMAND', level: 5, reqXP: 1200, nextXP: 2000, symbol: 'CM' };
      if (xp >= 700) return { title: 'ELITE', level: 4, reqXP: 700, nextXP: 1200, symbol: 'EL' };
      if (xp >= 350) return { title: 'SPECIALIST', level: 3, reqXP: 350, nextXP: 700, symbol: 'SP' };
      if (xp >= 100) return { title: 'OPERATIVE', level: 2, reqXP: 100, nextXP: 350, symbol: 'OP' };
      return { title: 'INITIATE', level: 1, reqXP: 0, nextXP: 100, symbol: 'IN' };
    }

    getAchievements() {
      try {
        return JSON.parse(localStorage.getItem('apex_achievements')) || [];
      } catch (e) { return []; }
    }

    logAchievement(task) {
      const achievements = this.getAchievements();
      const entry = {
        id: 'ach_' + Date.now(),
        taskTitle: task.title,
        category: task.category,
        completedAt: new Date().toLocaleDateString(),
        priority: task.priority
      };
      achievements.unshift(entry);
      localStorage.setItem('apex_achievements', JSON.stringify(achievements));
      window.dispatchEvent(new CustomEvent('apex:achievements-updated'));
    }

    // --- Recalibration / Physical Activities ---
    getFitnessActivities() {
      try {
        return JSON.parse(localStorage.getItem('apex_fitness_activities')) || [];
      } catch (e) { return []; }
    }

    saveFitnessActivities(activities) {
      localStorage.setItem('apex_fitness_activities', JSON.stringify(activities));
      window.dispatchEvent(new CustomEvent('apex:fitness-updated'));
    }

    addFitnessActivity(name, category, duration, target) {
      const list = this.getFitnessActivities();
      const newAct = {
        id: 'fit_' + Date.now(),
        name: name.trim(),
        category: category || 'PHYSICAL',
        duration: duration || '30m',
        target: target || '1 session',
        completedToday: false,
        createdAt: Date.now()
      };
      list.push(newAct);
      this.saveFitnessActivities(list);
    }

    toggleFitnessActivity(id) {
      const list = this.getFitnessActivities();
      const act = list.find(a => a.id === id);
      if (act) {
        act.completedToday = !act.completedToday;
        this.saveFitnessActivities(list);
        if (act.completedToday) sound.playSuccessChime();
      }
    }

    // --- Internal Status Logs ---
    getDistractions() {
      try {
        return JSON.parse(localStorage.getItem('apex_distractions')) || [];
      } catch (e) { return []; }
    }

    logDistraction(text) {
      const list = this.getDistractions();
      list.unshift({
        id: 'dis_' + Date.now(),
        text: text.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      localStorage.setItem('apex_distractions', JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('apex:attention-updated'));
    }
  }

  const state = new AppState();

  /* ==========================================================================
     3. TELEMETRY CLOCK & HEADER
     ========================================================================== */
  function initHeaderTelemetry() {
    const dateEl = document.getElementById('header-date');
    const timeEl = document.getElementById('header-session-time');
    const rankTitleEl = document.getElementById('header-rank-name');
    const xpValEl = document.getElementById('header-xp-val');

    const updateClock = () => {
      const now = new Date();
      const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const dayName = days[now.getDay()];
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');

      if (dateEl) dateEl.textContent = `${y}-${m}-${d} • ${dayName}`;
      if (timeEl) timeEl.textContent = `${hours}:${minutes}:${seconds}`;
    };

    updateClock();
    setInterval(updateClock, 1000);

    const updateRankHeader = () => {
      const info = state.getRankInfo();
      const xp = state.getXP();
      if (rankTitleEl) rankTitleEl.textContent = info.title;
      if (xpValEl) xpValEl.textContent = `${xp} XP`;
    };

    updateRankHeader();
    window.addEventListener('apex:xp-updated', updateRankHeader);
  }

  /* ==========================================================================
     4. NAVIGATION ENGINE & MOBILE NAVIGATION SYSTEM
     ========================================================================== */
  function initNavigation() {
    const navTabBtns = document.querySelectorAll('.nav-tab-btn');
    const mobileBottomBtns = document.querySelectorAll('.mobile-bottom-nav-item');
    const viewContainers = document.querySelectorAll('.app-view-container');
    const modeCoreBtn = document.getElementById('btn-mode-core');
    const modeFitnessBtn = document.getElementById('btn-mode-fitness');
    const modeDisplayTitle = document.getElementById('mode-display-title');

    // Mobile More Sheet Elements
    const modalMobileMore = document.getElementById('modal-mobile-more');
    const btnCloseMobileMore = document.getElementById('btn-close-mobile-more');
    const btnCloseMoreSheet = document.getElementById('btn-close-more-sheet');
    const mobileMoreItems = document.querySelectorAll('.mobile-more-item[data-view]');
    const btnMobileOpenPreferences = document.getElementById('btn-mobile-open-preferences');
    const btnMobileOpenAI = document.getElementById('btn-mobile-open-ai');
    const btnMobileInstallPWA = document.getElementById('btn-mobile-install-pwa');

    const secondaryViews = ['fitness', 'attention', 'decompression', 'mission'];

    const switchView = (targetView) => {
      if (targetView === 'more') {
        if (modalMobileMore) modalMobileMore.classList.remove('hidden');
        sound.playBeep(700, 0.04, 'sine', 0.05);
        return;
      }

      if (modalMobileMore) modalMobileMore.classList.add('hidden');

      viewContainers.forEach(view => {
        if (view.id === `view-${targetView}`) {
          view.classList.remove('hidden');
        } else {
          view.classList.add('hidden');
        }
      });

      // Highlight Desktop Tabs
      navTabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === targetView);
      });

      // Highlight Mobile Bottom Navigation Tabs
      mobileBottomBtns.forEach(btn => {
        if (btn.dataset.view === 'more') {
          btn.classList.toggle('active', secondaryViews.includes(targetView));
        } else {
          btn.classList.toggle('active', btn.dataset.view === targetView);
        }
      });

      // Update Mode Title Display
      if (modeDisplayTitle) {
        if (targetView === 'fitness') modeDisplayTitle.textContent = 'RECALIBRATION PACING';
        else if (targetView === 'attention') modeDisplayTitle.textContent = 'STATUS REPORT';
        else if (targetView === 'decompression') modeDisplayTitle.textContent = 'RECALIBRATION';
        else if (targetView === 'mission') modeDisplayTitle.textContent = 'CORE DIRECTIVES';
        else modeDisplayTitle.textContent = 'SYSTEM // INTERFACE';
      }

      sound.playBeep(640, 0.04, 'sine', 0.05);
    };

    navTabBtns.forEach(btn => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    mobileBottomBtns.forEach(btn => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    mobileMoreItems.forEach(item => {
      item.addEventListener('click', () => {
        switchView(item.dataset.view);
      });
    });

    const closeMoreModal = () => {
      if (modalMobileMore) modalMobileMore.classList.add('hidden');
    };

    if (btnCloseMobileMore) btnCloseMobileMore.addEventListener('click', closeMoreModal);
    if (btnCloseMoreSheet) btnCloseMoreSheet.addEventListener('click', closeMoreModal);

    if (btnMobileOpenPreferences) {
      btnMobileOpenPreferences.addEventListener('click', () => {
        closeMoreModal();
        const prefModal = document.getElementById('modal-creative-control');
        if (prefModal) prefModal.classList.remove('hidden');
      });
    }

    if (btnMobileOpenAI) {
      btnMobileOpenAI.addEventListener('click', () => {
        closeMoreModal();
        const aiModal = document.getElementById('modal-ai-assistant');
        if (aiModal) aiModal.classList.remove('hidden');
      });
    }

    if (modeCoreBtn && modeFitnessBtn) {
      modeCoreBtn.addEventListener('click', () => {
        modeCoreBtn.classList.add('active');
        modeFitnessBtn.classList.remove('active');
        if (modeDisplayTitle) modeDisplayTitle.textContent = 'SYSTEM // INTERFACE';
        switchView('dashboard');
        sound.playBeep(700, 0.04, 'sine', 0.06);
      });

      modeFitnessBtn.addEventListener('click', () => {
        modeFitnessBtn.classList.add('active');
        modeCoreBtn.classList.remove('active');
        if (modeDisplayTitle) modeDisplayTitle.textContent = 'RECALIBRATION PACING';
        switchView('fitness');
        sound.playBeep(750, 0.04, 'sine', 0.06);
      });
    }

    // PWA Install Prompt Event Listener
    let deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (btnMobileInstallPWA) btnMobileInstallPWA.classList.remove('hidden');
    });

    if (btnMobileInstallPWA) {
      btnMobileInstallPWA.addEventListener('click', async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`[SYSTEM PWA] User install choice: ${outcome}`);
          deferredPrompt = null;
          btnMobileInstallPWA.classList.add('hidden');
        }
      });
    }
  }

  /* ==========================================================================
     5. MISSION SYSTEM & HIERARCHICAL QUEST STEPS CONTROLLER
     ========================================================================== */
  function initTaskSystem() {
    const listEl = document.getElementById('task-system-list');
    const filterPills = document.querySelectorAll('#task-filter-pills .filter-pill');
    const searchInput = document.getElementById('task-search-input');
    const categorySelect = document.getElementById('task-category-filter');
    const btnOpenCreate = document.getElementById('btn-open-create-task');
    const btnMobileFabCreate = document.getElementById('btn-mobile-fab-create');

    // Modal Elements
    const modalTask = document.getElementById('modal-task-editor');
    const formTask = document.getElementById('form-task-editor');
    const editIdInput = document.getElementById('task-edit-id');
    const titleInput = document.getElementById('task-title-input');
    const catInput = document.getElementById('task-category-input');
    const priorityInput = document.getElementById('task-priority-input');
    const deadlineInput = document.getElementById('task-deadline-input');
    const effortInput = document.getElementById('task-effort-input');
    const descInput = document.getElementById('task-desc-input');
    const modalSubtasksList = document.getElementById('modal-subtasks-list');
    const modalNewSubtaskInput = document.getElementById('input-modal-new-subtask');
    const btnModalAddSubtask = document.getElementById('btn-modal-add-subtask');
    const btnCloseModal = document.getElementById('btn-close-task-modal');
    const btnCancelModal = document.getElementById('btn-cancel-task-modal');

    let currentFilter = 'ALL';
    let tempSubtasks = [];
    const expandedTaskIds = new Set();

    const calculateDeadlineStatus = (deadlineStr) => {
      if (!deadlineStr) return { label: 'NO TIME CONSTRAINT', class: 'deadline-none' };
      const today = new Date(state.todayStr);
      const target = new Date(deadlineStr);
      const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return { label: 'TIME CONSTRAINT OVERDUE', class: 'deadline-overdue' };
      if (diffDays === 0) return { label: 'DUE TODAY', class: 'deadline-today' };
      if (diffDays <= 7) return { label: `DUE IN ${diffDays}D`, class: 'deadline-soon' };
      return { label: `TIME CONSTRAINT: ${deadlineStr}`, class: 'deadline-upcoming' };
    };

    const renderTasks = () => {
      const tasks = state.getTasks();
      if (!listEl) return;

      let filtered = tasks;

      // Filter category
      if (categorySelect && categorySelect.value !== 'ALL') {
        filtered = filtered.filter(t => t.category === categorySelect.value);
      }

      // Filter search query
      if (searchInput && searchInput.value.trim()) {
        const query = searchInput.value.toLowerCase().trim();
        filtered = filtered.filter(t => 
          t.title.toLowerCase().includes(query) || 
          (t.description && t.description.toLowerCase().includes(query))
        );
      }

      // Filter pills
      if (currentFilter === 'TODAY') {
        filtered = filtered.filter(t => t.deadline === state.todayStr);
      } else if (currentFilter === 'DUE_SOON') {
        filtered = filtered.filter(t => {
          const status = calculateDeadlineStatus(t.deadline);
          return status.class === 'deadline-soon' || status.class === 'deadline-today';
        });
      } else if (currentFilter === 'OVERDUE') {
        filtered = filtered.filter(t => calculateDeadlineStatus(t.deadline).class === 'deadline-overdue');
      } else if (currentFilter === 'HIGH_PRIORITY') {
        filtered = filtered.filter(t => t.priority === 'P1' || t.priority === 'P2');
      } else if (currentFilter === 'IN_PROGRESS') {
        filtered = filtered.filter(t => t.status !== 'COMPLETED');
      } else if (currentFilter === 'COMPLETED') {
        filtered = filtered.filter(t => t.status === 'COMPLETED');
      } else if (currentFilter === 'NO_DEADLINE') {
        filtered = filtered.filter(t => !t.deadline);
      }

      if (filtered.length === 0) {
        listEl.innerHTML = `
          <li class="console-card" style="padding: 24px; text-align: center;">
            <p class="mono-meta" style="font-size: 0.85rem;">No missions declared in this view. Click <strong>+ CREATE MISSION</strong> above to set your objective.</p>
          </li>
        `;
        return;
      }

      listEl.innerHTML = '';
      filtered.forEach(task => {
        const isCompleted = task.status === 'COMPLETED';
        const isExpanded = expandedTaskIds.has(task.id);
        const deadlineInfo = calculateDeadlineStatus(task.deadline);
        const subtaskTotal = task.subtasks ? task.subtasks.length : 0;
        const subtaskDone = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0;
        const progressPercent = subtaskTotal > 0 ? Math.round((subtaskDone / subtaskTotal) * 100) : (isCompleted ? 100 : 0);

        const li = document.createElement('li');
        li.className = `task-card-item ${isCompleted ? 'completed' : ''}`;
        li.innerHTML = `
          <div class="task-header-row">
            <label class="custom-checkbox-label">
              <input type="checkbox" class="checkbox-input task-complete-chk" data-id="${task.id}" ${isCompleted ? 'checked' : ''}>
              <span class="checkbox-visual">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </span>
            </label>

            <div class="task-main-info">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
                <span class="task-title-text">${task.title}</span>
                <div style="display: flex; gap: 6px; align-items: center;">
                  <button class="btn-expand-task" data-id="${task.id}">
                    <span>${isExpanded ? 'LESS ▲' : 'DETAILS ▾'}</span>
                  </button>
                  <button class="btn-mini btn-edit-task" data-id="${task.id}">EDIT</button>
                  <button class="btn-mini btn-text-danger btn-delete-task" data-id="${task.id}">DELETE</button>
                </div>
              </div>

              <div class="task-tags-row" style="margin-top: 6px;">
                <span class="priority-badge priority-${task.priority}">${task.priority}</span>
                <span class="category-tag">${task.category}</span>
                <span class="deadline-badge ${deadlineInfo.class}">${deadlineInfo.label}</span>
                ${task.estimatedEffort ? `<span class="mono-meta">Effort: ${task.estimatedEffort}</span>` : ''}
              </div>

              ${subtaskTotal > 0 ? `
                <div class="progress-bar-rail" style="margin-top: 8px;">
                  <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">
                  <span>Quest Steps: ${subtaskDone} / ${subtaskTotal} cleared (${progressPercent}%)</span>
                </div>
              ` : ''}

              <!-- EXPANDABLE DETAILS & QUEST STEPS -->
              ${isExpanded ? `
                <div class="task-card-details">
                  ${task.description ? `<p class="task-desc-text">${task.description}</p>` : ''}
                  ${subtaskTotal > 0 ? `
                    <div class="subtasks-wrapper">
                      ${task.subtasks.map(st => `
                        <div class="subtask-item ${st.completed ? 'completed' : ''}">
                          <div class="subtask-left">
                            <label class="custom-checkbox-label">
                              <input type="checkbox" class="checkbox-input subtask-chk" data-task-id="${task.id}" data-sub-id="${st.id}" ${st.completed ? 'checked' : ''}>
                              <span class="checkbox-visual" style="width: 18px; height: 18px;">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke-width="3.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              </span>
                            </label>
                            <span>${st.title}</span>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  ` : ''}
                </div>
              ` : ''}
            </div>
          </div>
        `;

        listEl.appendChild(li);
      });
    };


    // Filter switching
    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentFilter = pill.dataset.filter;
        renderTasks();
      });
    });

    if (searchInput) searchInput.addEventListener('input', renderTasks);
    if (categorySelect) categorySelect.addEventListener('change', renderTasks);

    // List Event Delegation
    if (listEl) {
      listEl.addEventListener('click', (e) => {
        // Expand/Collapse Details
        const expandBtn = e.target.closest('.btn-expand-task');
        if (expandBtn) {
          const id = expandBtn.dataset.id;
          if (expandedTaskIds.has(id)) {
            expandedTaskIds.delete(id);
          } else {
            expandedTaskIds.add(id);
          }
          renderTasks();
          return;
        }

        // Complete Task
        const taskChk = e.target.closest('.task-complete-chk');
        if (taskChk) {
          state.toggleTaskCompletion(taskChk.dataset.id);
          renderTasks();
          return;
        }

        // Complete Subtask
        const subChk = e.target.closest('.subtask-chk');
        if (subChk) {
          state.toggleSubtaskCompletion(subChk.dataset.taskId, subChk.dataset.subId);
          renderTasks();
          return;
        }

        // Edit Task
        const editBtn = e.target.closest('.btn-edit-task');
        if (editBtn) {
          const task = state.getTasks().find(t => t.id === editBtn.dataset.id);
          if (task && modalTask) {
            editIdInput.value = task.id;
            titleInput.value = task.title;
            catInput.value = task.category;
            priorityInput.value = task.priority;
            deadlineInput.value = task.deadline || '';
            effortInput.value = task.estimatedEffort || '';
            descInput.value = task.description || '';
            tempSubtasks = [...(task.subtasks || [])];
            renderModalSubtasks();
            modalTask.classList.remove('hidden');
          }
          return;
        }

        // Delete Task
        const delBtn = e.target.closest('.btn-delete-task');
        if (delBtn) {
          if (confirm('System Confirmation: Delete this mission record?')) {
            state.deleteTask(delBtn.dataset.id);
            renderTasks();
          }
        }
      });
    }

    // Mobile FAB Create Mission Click Listener
    if (btnMobileFabCreate) {
      btnMobileFabCreate.addEventListener('click', () => {
        editIdInput.value = '';
        formTask.reset();
        tempSubtasks = [];
        renderModalSubtasks();
        modalTask.classList.remove('hidden');
        titleInput.focus();
      });
    }


    // Modal Subtasks Render & Add
    const renderModalSubtasks = () => {
      if (!modalSubtasksList) return;
      modalSubtasksList.innerHTML = tempSubtasks.map((s, idx) => `
        <div style="display: flex; align-items: center; justify-content: space-between; background: var(--surface-input); padding: 6px 10px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
          <span style="font-size: 0.8rem;">${s.title}</span>
          <button type="button" class="btn-mini btn-text-danger btn-remove-subtask-temp" data-idx="${idx}">✕</button>
        </div>
      `).join('');
    };

    if (btnModalAddSubtask) {
      btnModalAddSubtask.addEventListener('click', () => {
        const text = modalNewSubtaskInput.value.trim();
        if (text) {
          tempSubtasks.push({ id: 'st_' + Date.now(), title: text, completed: false });
          modalNewSubtaskInput.value = '';
          renderModalSubtasks();
        }
      });
    }

    if (modalSubtasksList) {
      modalSubtasksList.addEventListener('click', (e) => {
        const rm = e.target.closest('.btn-remove-subtask-temp');
        if (rm) {
          const idx = parseInt(rm.dataset.idx, 10);
          tempSubtasks.splice(idx, 1);
          renderModalSubtasks();
        }
      });
    }

    // Open Create Modal
    if (btnOpenCreate) {
      btnOpenCreate.addEventListener('click', () => {
        editIdInput.value = '';
        formTask.reset();
        tempSubtasks = [];
        renderModalSubtasks();
        modalTask.classList.remove('hidden');
        titleInput.focus();
      });
    }

    // Modal Form Submit
    if (formTask) {
      formTask.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = editIdInput.value;
        const taskData = {
          title: titleInput.value,
          category: catInput.value,
          priority: priorityInput.value,
          deadline: deadlineInput.value || '', // Keep empty if user didn't set one!
          estimatedEffort: effortInput.value,
          description: descInput.value,
          subtasks: tempSubtasks
        };

        if (id) {
          state.updateTask(id, taskData);
        } else {
          state.addTask(taskData);
        }

        modalTask.classList.add('hidden');
        sound.playBeep(750, 0.05, 'sine', 0.07);
        renderTasks();
      });
    }

    const closeModal = () => modalTask.classList.add('hidden');
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
    if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);

    renderTasks();
    window.addEventListener('apex:tasks-updated', renderTasks);
  }

  /* ==========================================================================
     6. DASHBOARD SURFACING & ACCOMPLISHMENT ARCHIVE
     ========================================================================= */
  function initDashboardSurfacing() {
    const dueSoonList = document.getElementById('dash-due-soon-list');
    const recentAchList = document.getElementById('dash-recent-achievements-list');
    const priorityTitle = document.getElementById('priority-title');
    const priorityDesc = document.getElementById('priority-desc');
    const priorityCat = document.getElementById('priority-category-badge');
    const smartEngagerText = document.getElementById('smart-engager-text');

    const renderDashboard = () => {
      const tasks = state.getTasks();
      const activeTasks = tasks.filter(t => t.status !== 'COMPLETED');

      // Recommended priority mission for Priority Transmission
      const topTask = activeTasks.find(t => t.priority === 'P1') || activeTasks[0];
      if (topTask) {
        if (priorityTitle) priorityTitle.textContent = topTask.title;
        if (priorityDesc) priorityDesc.textContent = topTask.description || `Priority ${topTask.priority} • ${topTask.deadline ? 'Time Constraint: ' + topTask.deadline : 'No Time Constraint'}`;
        if (priorityCat) {
          priorityCat.textContent = `${topTask.priority} — ${topTask.category}`;
          priorityCat.className = `priority-badge priority-${topTask.priority}`;
        }
      } else {
        if (priorityTitle) priorityTitle.textContent = 'All missions cleared';
        if (priorityDesc) priorityDesc.textContent = 'Create your next mission objective in Missions.';
      }

      // System Analysis (Respectful & Autonomous)
      if (smartEngagerText) {
        if (topTask) {
          smartEngagerText.textContent = `System analysis: "${topTask.title}" (${topTask.priority}) has the highest current urgency. You may begin, reschedule, or choose another mission.`;
        } else {
          smartEngagerText.textContent = 'System analysis: All user missions cleared. Observant system awaiting commander directives.';
        }
      }

      // Urgent & Due soon list
      if (dueSoonList) {
        const dueSoon = activeTasks.slice(0, 4);
        if (dueSoon.length === 0) {
          dueSoonList.innerHTML = '<li class="mono-meta">No active time constraints pending.</li>';
        } else {
          dueSoonList.innerHTML = dueSoon.map(t => `
            <li class="task-card-item">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span class="task-title-text" style="font-size: 0.88rem;">${t.title}</span>
                <span class="priority-badge priority-${t.priority}">${t.priority}</span>
              </div>
              <span class="mono-meta">${t.deadline ? 'Time Constraint: ' + t.deadline : 'No Time Constraint'} • ${t.category}</span>
            </li>
          `).join('');
        }
      }

      // Accomplishment Archive
      if (recentAchList) {
        const achievements = state.getAchievements().slice(0, 4);
        if (achievements.length === 0) {
          recentAchList.innerHTML = '<li class="mono-meta">Cleared missions record accomplishment telemetry here.</li>';
        } else {
          recentAchList.innerHTML = achievements.map(a => `
            <li class="achievement-card">
              <div class="achievement-icon">✦</div>
              <div>
                <strong style="font-size: 0.85rem; color: var(--text-primary);">${a.taskTitle}</strong>
                <div class="mono-meta">Cleared on ${a.completedAt} • ${a.category}</div>
              </div>
            </li>
          `).join('');
        }
      }
    };

    renderDashboard();
    window.addEventListener('apex:tasks-updated', renderDashboard);
    window.addEventListener('apex:achievements-updated', renderDashboard);
  }

  /* ==========================================================================
     7. RECALIBRATION PACING CONTROLLER
     ========================================================================= */
  function initFitnessMode() {
    const gridEl = document.getElementById('fitness-activities-grid');
    const btnOpenAdd = document.getElementById('btn-open-create-fitness');

    const renderFitness = () => {
      const activities = state.getFitnessActivities();
      if (!gridEl) return;

      if (activities.length === 0) {
        gridEl.innerHTML = `
          <div class="console-card" style="grid-column: span 3; padding: 24px; text-align: center;">
            <p class="mono-meta" style="font-size: 0.85rem;">No recalibration routines declared yet. Click <strong>+ ADD ROUTINE</strong> to declare physical pacing.</p>
          </div>
        `;
        return;
      }

      gridEl.innerHTML = activities.map(act => `
        <div class="fitness-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <span class="category-tag">${act.category}</span>
              <h3 style="font-size: 0.95rem; font-weight: 700; margin-top: 4px;">${act.name}</h3>
            </div>
            <button class="btn-tactical ${act.completedToday ? 'btn-success' : 'btn-cyan-action'} btn-toggle-fitness" data-id="${act.id}">
              ${act.completedToday ? 'CLEARED' : 'MARK CLEARED'}
            </button>
          </div>
          <div class="mono-meta">Target: ${act.target} • Duration: ${act.duration}</div>
        </div>
      `).join('');
    };

    if (gridEl) {
      gridEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-toggle-fitness');
        if (btn) {
          state.toggleFitnessActivity(btn.dataset.id);
          renderFitness();
        }
      });
    }

    if (btnOpenAdd) {
      btnOpenAdd.addEventListener('click', () => {
        const name = prompt('Declare recalibration routine (e.g., Physical Session, 5km Run, Mobility):');
        if (name) {
          state.addFitnessActivity(name, 'PHYSICAL', '30m', '1 session');
          renderFitness();
        }
      });
    }

    renderFitness();
    window.addEventListener('apex:fitness-updated', renderFitness);
  }

  /* ==========================================================================
     8. INTERNAL STATUS REPORT LOG
     ========================================================================= */
  function initAttentionControl() {
    const formLog = document.getElementById('form-log-distraction');
    const inputTitle = document.getElementById('input-distraction-title');
    const listEl = document.getElementById('distraction-log-list');

    const renderDistractions = () => {
      const distractions = state.getDistractions();
      if (!listEl) return;

      if (distractions.length === 0) {
        listEl.innerHTML = '<li class="mono-meta">No attention leaks recorded in this cycle.</li>';
        return;
      }

      listEl.innerHTML = distractions.slice(0, 6).map(d => `
        <li class="attention-item">
          <span>${d.text}</span>
          <span class="mono-meta">${d.timestamp}</span>
        </li>
      `).join('');
    };

    if (formLog) {
      formLog.addEventListener('submit', (e) => {
        e.preventDefault();
        if (inputTitle.value.trim()) {
          state.logDistraction(inputTitle.value.trim());
          inputTitle.value = '';
          sound.playBeep(620, 0.04, 'sine', 0.05);
          renderDistractions();
        }
      });
    }

    renderDistractions();
  }

  /* ==========================================================================
     9. AI ASSISTANT & QUEST STEP DECOMPOSITION
     ========================================================================= */
  function initAIAssistant() {
    const modal = document.getElementById('modal-ai-assistant');
    const btnOpen = document.getElementById('btn-open-ai-assistant');
    const btnClose = document.getElementById('btn-close-ai');
    const btnCloseX = document.getElementById('btn-close-ai-modal');
    const btnDecompose = document.getElementById('btn-ai-decompose-selected');
    const outputText = document.getElementById('ai-output-text');

    if (btnOpen) btnOpen.addEventListener('click', () => modal.classList.remove('hidden'));
    const close = () => modal.classList.add('hidden');
    if (btnClose) btnClose.addEventListener('click', close);
    if (btnCloseX) btnCloseX.addEventListener('click', close);

    if (btnDecompose) {
      btnDecompose.addEventListener('click', async () => {
        const topTask = state.getTasks().find(t => t.status !== 'COMPLETED');
        if (!topTask) {
          if (outputText) outputText.textContent = 'System analysis: No active mission available to break into quest steps.';
          return;
        }

        if (outputText) outputText.textContent = `Decomposing mission "${topTask.title}" into quest steps...`;

        try {
          const res = await fetch('/api/ai/assist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'decompose', taskTitle: topTask.title })
          });
          const data = await res.json();
          if (data && data.success && data.suggestedSubtasks) {
            data.suggestedSubtasks.forEach(st => state.addSubtask(topTask.id, st.title));
            if (outputText) outputText.textContent = `System Record Updated: Decomposed "${topTask.title}" into ${data.suggestedSubtasks.length} quest steps!`;
            sound.playSuccessChime();
          } else {
            if (outputText) outputText.textContent = `AI assistance is not connected yet. You may add quest steps manually in Mission Editor.`;
          }
        } catch (e) {
          if (outputText) outputText.textContent = `AI assistance is not connected yet. You may add quest steps manually in Mission Editor.`;
        }
      });
    }
  }

  /* ==========================================================================
     10. THEME SWITCHER (12 ACTIVE CELESTIAL ACCENT PALETTES)
     ========================================================================= */
  function initThemeSwitcher() {
    const modal = document.getElementById('modal-creative-control');
    const btnOpen = document.getElementById('btn-open-creative-control');
    const btnClose = document.getElementById('btn-close-cc');
    const btnCloseX = document.getElementById('btn-close-cc-modal');
    const themeCards = document.querySelectorAll('#theme-presets-row .theme-preset-card');

    const applyTheme = (themeName) => {
      document.body.className = `apex-body theme-${themeName || 'cyan'}`;
      localStorage.setItem('apex_theme', themeName || 'cyan');
      themeCards.forEach(card => card.classList.toggle('active', card.dataset.theme === themeName));
    };

    applyTheme(localStorage.getItem('apex_theme') || 'cyan');

    themeCards.forEach(card => {
      card.addEventListener('click', () => {
        applyTheme(card.dataset.theme);
        sound.playBeep(720, 0.04, 'sine', 0.06);
      });
    });

    if (btnOpen) btnOpen.addEventListener('click', () => modal.classList.remove('hidden'));
    const close = () => modal.classList.add('hidden');
    if (btnClose) btnClose.addEventListener('click', close);
    if (btnCloseX) btnCloseX.addEventListener('click', close);
  }

  /* ==========================================================================
     11. SUPABASE CLOUD SYNC & AUTHENTICATION MANAGER
     ========================================================================== */
  function initSyncEngine() {
    const syncIndicator = document.getElementById('sync-status-indicator');
    const headerSyncPill = document.getElementById('header-sync-pill');
    const offlineBanner = document.getElementById('offline-banner');

    // Preference Modal Inputs
    const urlInput = document.getElementById('input-supabase-url');
    const keyInput = document.getElementById('input-supabase-key');
    const btnSaveConfig = document.getElementById('btn-save-supabase-config');
    const prefUserStatus = document.getElementById('pref-sync-user-status');

    // Auth Modal
    const modalAuth = document.getElementById('modal-auth-sync');
    const btnOpenAuth = document.getElementById('btn-open-auth-modal');
    const btnCloseAuth = document.getElementById('btn-close-auth-modal');
    const formAuth = document.getElementById('form-auth');
    const emailInput = document.getElementById('auth-email-input');
    const passInput = document.getElementById('auth-password-input');
    const btnAuthSignup = document.getElementById('btn-auth-signup');

    // Migration Consent Elements
    const migrationConsentBox = document.getElementById('auth-migration-consent');
    const btnConsentImport = document.getElementById('btn-consent-import');
    const btnConsentSkip = document.getElementById('btn-consent-skip');
    const btnConsentExport = document.getElementById('btn-consent-export');

    let supabaseClient = null;
    let currentUser = null;

    // Load saved Supabase Credentials
    const savedUrl = localStorage.getItem('apex_supabase_url') || '';
    const savedKey = localStorage.getItem('apex_supabase_key') || '';
    if (urlInput) urlInput.value = savedUrl;
    if (keyInput) keyInput.value = savedKey;

    const updateSyncBadge = (statusText, statusClass = 'text-accent-cyan') => {
      if (syncIndicator) {
        syncIndicator.textContent = statusText;
        syncIndicator.className = `mono-label ${statusClass}`;
      }
    };

    const updateOnlineState = () => {
      if (!navigator.onLine) {
        if (offlineBanner) offlineBanner.classList.remove('hidden');
        updateSyncBadge('OFFLINE // CACHED ⚡', 'text-accent-warning');
      } else {
        if (offlineBanner) offlineBanner.classList.add('hidden');
        if (currentUser) {
          updateSyncBadge('SYNCED ✦', 'text-accent-cyan');
        } else {
          updateSyncBadge('LOCAL STORAGE ✦', 'text-accent-cyan');
        }
      }
    };

    window.addEventListener('online', updateOnlineState);
    window.addEventListener('offline', updateOnlineState);
    updateOnlineState();

    const setupSupabase = () => {
      const url = localStorage.getItem('apex_supabase_url') || '';
      const key = localStorage.getItem('apex_supabase_key') || '';

      if (url && key && typeof window.supabase !== 'undefined') {
        try {
          supabaseClient = window.supabase.createClient(url, key);
          console.log('[SYSTEM SYNC] Supabase client initialized');
          checkAuthSession();
        } catch (err) {
          console.warn('[SYSTEM SYNC] Invalid Supabase client config:', err);
        }
      }
    };

    const checkAuthSession = async () => {
      if (!supabaseClient) return;
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session && session.user) {
          currentUser = session.user;
          onUserSignedIn(session.user);
        }
      } catch (err) {}
    };

    const onUserSignedIn = (user) => {
      currentUser = user;
      if (prefUserStatus) prefUserStatus.textContent = `Account: ${user.email}`;
      updateSyncBadge('SYNCED ✦', 'text-accent-cyan');

      const migrationDecision = localStorage.getItem('apex_migration_decision');
      const hasLocalData = state.getTasks().length > 0 || state.getXP() > 0;

      if (hasLocalData && !migrationDecision && migrationConsentBox) {
        migrationConsentBox.classList.remove('hidden');
        if (modalAuth) modalAuth.classList.remove('hidden');
      } else {
        if (migrationConsentBox) migrationConsentBox.classList.add('hidden');
        pullCloudData();
      }
    };

    const pullCloudData = async () => {
      if (!supabaseClient || !currentUser) return;
      updateSyncBadge('SYNCING... ↻', 'text-accent-blue');
      try {
        const { data: cloudMissions } = await supabaseClient
          .from('missions')
          .select('*')
          .eq('user_id', currentUser.id);

        if (cloudMissions && cloudMissions.length > 0) {
          const formattedMissions = cloudMissions.map(m => ({
            id: m.id,
            title: m.title,
            description: m.description,
            category: m.category,
            priority: m.priority,
            deadline: m.deadline,
            startDate: m.start_date,
            estimatedEffort: m.estimated_effort,
            status: m.status,
            notes: m.notes,
            subtasks: m.subtasks || [],
            createdAt: m.created_at
          }));
          state.saveTasks(formattedMissions);
        }

        updateSyncBadge('SYNCED ✦', 'text-accent-cyan');
      } catch (err) {
        console.warn('[SYSTEM SYNC] Pull failed:', err);
        updateSyncBadge('SYNC ERROR ⚠️', 'text-danger');
      }
    };

    const pushCloudData = async () => {
      if (!supabaseClient || !currentUser || !navigator.onLine) return;
      updateSyncBadge('SYNCING... ↻', 'text-accent-blue');
      try {
        const localMissions = state.getTasks();
        const rows = localMissions.map(m => ({
          id: m.id,
          user_id: currentUser.id,
          title: m.title,
          description: m.description,
          category: m.category,
          priority: m.priority,
          deadline: m.deadline,
          start_date: m.startDate || '',
          estimated_effort: m.estimatedEffort || '',
          status: m.status,
          notes: m.notes || '',
          subtasks: m.subtasks || [],
          created_at: m.createdAt || Date.now()
        }));

        if (rows.length > 0) {
          await supabaseClient.from('missions').upsert(rows);
        }

        updateSyncBadge('SYNCED ✦', 'text-accent-cyan');
      } catch (err) {
        console.warn('[SYSTEM SYNC] Push failed:', err);
        updateSyncBadge('SYNC ERROR ⚠️', 'text-danger');
      }
    };

    // Auto Push on task updates
    window.addEventListener('apex:tasks-updated', () => pushCloudData());

    // Save Supabase Config Button
    if (btnSaveConfig) {
      btnSaveConfig.addEventListener('click', () => {
        const url = urlInput.value.trim();
        const key = keyInput.value.trim();
        localStorage.setItem('apex_supabase_url', url);
        localStorage.setItem('apex_supabase_key', key);
        setupSupabase();
        alert('Supabase credentials saved. Sync engine initialized.');
      });
    }

    // Modal Auth Triggers
    if (btnOpenAuth) btnOpenAuth.addEventListener('click', () => {
      const prefModal = document.getElementById('modal-creative-control');
      if (prefModal) prefModal.classList.add('hidden');
      if (modalAuth) modalAuth.classList.remove('hidden');
    });

    if (headerSyncPill) headerSyncPill.addEventListener('click', () => {
      if (modalAuth) modalAuth.classList.remove('hidden');
    });

    if (btnCloseAuth) btnCloseAuth.addEventListener('click', () => {
      if (modalAuth) modalAuth.classList.add('hidden');
    });

    // Form Auth Submit (Sign In)
    if (formAuth) {
      formAuth.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const password = passInput.value.trim();

        if (!supabaseClient) {
          alert('Please configure your Supabase URL & Anon Key in Preferences first.');
          return;
        }

        try {
          const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
          if (error) throw error;
          if (data.user) {
            onUserSignedIn(data.user);
            sound.playSuccessChime();
          }
        } catch (err) {
          alert(`Sign In Error: ${err.message}`);
        }
      });
    }

    // Sign Up Button
    if (btnAuthSignup) {
      btnAuthSignup.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        const password = passInput.value.trim();

        if (!email || !password) {
          alert('Please enter an email and password to sign up.');
          return;
        }

        if (!supabaseClient) {
          alert('Please configure your Supabase URL & Anon Key in Preferences first.');
          return;
        }

        try {
          const { data, error } = await supabaseClient.auth.signUp({ email, password });
          if (error) throw error;
          alert('Account created! Please check your email for confirmation or sign in.');
        } catch (err) {
          alert(`Sign Up Error: ${err.message}`);
        }
      });
    }

    // Migration Consent Actions
    if (btnConsentImport) {
      btnConsentImport.addEventListener('click', async () => {
        localStorage.setItem('apex_migration_decision', 'imported');
        if (migrationConsentBox) migrationConsentBox.classList.add('hidden');
        await pushCloudData();
        if (modalAuth) modalAuth.classList.add('hidden');
        alert('Device APEX data successfully imported to your cloud account!');
      });
    }

    if (btnConsentSkip) {
      btnConsentSkip.addEventListener('click', () => {
        localStorage.setItem('apex_migration_decision', 'skipped');
        if (migrationConsentBox) migrationConsentBox.classList.add('hidden');
        if (modalAuth) modalAuth.classList.add('hidden');
        pullCloudData();
      });
    }

    if (btnConsentExport) {
      btnConsentExport.addEventListener('click', () => {
        const exportBtn = document.getElementById('btn-export-data');
        if (exportBtn) exportBtn.click();
      });
    }

    setupSupabase();
  }

  /* ==========================================================================
     12. BOOTSTRAP & SYSTEM RECORD NOTIFICATIONS
     ========================================================================= */
  document.addEventListener('DOMContentLoaded', () => {
    initHeaderTelemetry();
    initNavigation();
    initTaskSystem();
    initDashboardSurfacing();
    initFitnessMode();
    initAttentionControl();
    initAIAssistant();
    initThemeSwitcher();
    initSyncEngine();

    // Register PWA Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => console.log('[SYSTEM PWA] Service Worker registered scope:', reg.scope))
        .catch((err) => console.log('[SYSTEM PWA] Service Worker registration failed:', err));
    }

    console.log(
      '%c SYSTEM // SELF-MASTERY OS %c SYSTEM INTERFACE ONLINE ',
      'background: #06090e; color: #38bdf8; font-weight: bold; border: 1px solid #1e293b; padding: 4px;',
      'background: #0d1421; color: #34d399; font-weight: bold; padding: 4px;'
    );
  });
})();



