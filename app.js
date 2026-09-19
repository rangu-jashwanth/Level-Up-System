/**
 * AETHER // PERSONAL EXECUTION OPERATING SYSTEM (app.js)
 * Architecture: Modular ES6+ Local-First Execution Engine
 * Security & Reliability: Fully escaped HTML rendering, timestamp-accurate focus timer, input validation.
 */

(() => {
  'use strict';

  /* ==========================================================================
     0. SECURITY & HTML SANITIZATION UTILITIES
     ========================================================================== */
  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ==========================================================================
     1. SOUND SYNTHESIS ENGINE (Calm AudioContext Chimes)
     ========================================================================== */
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.enabled = localStorage.getItem('aether_sound_enabled') !== 'false';
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
      localStorage.setItem('aether_sound_enabled', this.enabled.toString());
      if (this.enabled) {
        this.init();
        this.playTone(520, 0.08, 'sine', 0.05);
      }
      return this.enabled;
    }

    playTone(freq = 520, duration = 0.08, type = 'sine', gainVal = 0.05) {
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
      this.playTone(440, 0.1, 'sine', 0.06);
      setTimeout(() => this.playTone(554.37, 0.1, 'sine', 0.06), 90);
      setTimeout(() => this.playTone(659.25, 0.18, 'sine', 0.08), 180);
    }
  }

  const sound = new SoundEngine();

  /* ==========================================================================
     2. APP STATE ENGINE & LOCAL-FIRST PERSISTENCE
     ========================================================================== */
  class AppState {
    constructor() {
      this.todayStr = this.getTodayDateString();
      this.migrateLegacyData();
      this.initStorage();
    }

    getTodayDateString() {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    migrateLegacyData() {
      if (!localStorage.getItem('aether_missions') && localStorage.getItem('apex_tasks')) {
        localStorage.setItem('aether_missions', localStorage.getItem('apex_tasks'));
      }
      if (!localStorage.getItem('aether_completed_missions') && localStorage.getItem('apex_achievements')) {
        localStorage.setItem('aether_completed_missions', localStorage.getItem('apex_achievements'));
      }
      if (!localStorage.getItem('aether_focus_sessions') && localStorage.getItem('apex_focus_history')) {
        localStorage.setItem('aether_focus_sessions', localStorage.getItem('apex_focus_history'));
      }
      if (!localStorage.getItem('aether_vision') && localStorage.getItem('apex_mission')) {
        localStorage.setItem('aether_vision', localStorage.getItem('apex_mission'));
      }
    }

    initStorage() {
      if (!localStorage.getItem('aether_missions')) localStorage.setItem('aether_missions', JSON.stringify([]));
      if (!localStorage.getItem('aether_completed_missions')) localStorage.setItem('aether_completed_missions', JSON.stringify([]));
      if (!localStorage.getItem('aether_focus_sessions')) localStorage.setItem('aether_focus_sessions', JSON.stringify([]));
      if (!localStorage.getItem('aether_decompression')) localStorage.setItem('aether_decompression', JSON.stringify([]));
      if (!localStorage.getItem('aether_daily_reviews')) localStorage.setItem('aether_daily_reviews', JSON.stringify([]));
      if (!localStorage.getItem('aether_vision')) {
        localStorage.setItem('aether_vision', JSON.stringify({
          building: '', why: '', values: '', direction: ''
        }));
      }
    }

    // --- Missions CRUD ---
    getMissions() {
      try {
        return JSON.parse(localStorage.getItem('aether_missions')) || [];
      } catch (e) { return []; }
    }

    saveMissions(missions) {
      localStorage.setItem('aether_missions', JSON.stringify(missions));
      window.dispatchEvent(new CustomEvent('aether:missions-updated'));
    }

    addMission(missionData) {
      const title = (missionData.title || '').trim();
      if (!title) return null;

      const list = this.getMissions();
      const newMission = {
        id: 'msn_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        title: title,
        description: (missionData.description || '').trim(),
        category: missionData.category || 'TECHNICAL',
        priority: missionData.priority || 'P2',
        deadline: missionData.deadline || '',
        startDate: missionData.startDate || '',
        estimatedEffort: (missionData.estimatedEffort || '').trim(),
        status: 'TODO',
        subtasks: missionData.subtasks || [],
        notes: (missionData.notes || '').trim(),
        createdAt: Date.now()
      };
      list.unshift(newMission);
      this.saveMissions(list);
      return newMission;
    }

    updateMission(id, updatedFields) {
      const list = this.getMissions();
      const index = list.findIndex(m => m.id === id);
      if (index !== -1) {
        list[index] = { ...list[index], ...updatedFields };
        this.saveMissions(list);
        return list[index];
      }
      return null;
    }

    deleteMission(id) {
      let list = this.getMissions();
      list = list.filter(m => m.id !== id);
      this.saveMissions(list);
    }

    toggleMissionCompletion(id) {
      const list = this.getMissions();
      const mission = list.find(m => m.id === id);
      if (mission) {
        const isNowCompleted = mission.status !== 'COMPLETED';
        mission.status = isNowCompleted ? 'COMPLETED' : 'TODO';
        
        if (isNowCompleted && mission.subtasks) {
          mission.subtasks.forEach(s => s.completed = true);
        }

        this.saveMissions(list);

        if (isNowCompleted) {
          this.logCompletedMission(mission);
          sound.playSuccessChime();
        }
        return isNowCompleted;
      }
      return false;
    }

    toggleQuestStep(missionId, questId) {
      const list = this.getMissions();
      const mission = list.find(m => m.id === missionId);
      if (mission && mission.subtasks) {
        const quest = mission.subtasks.find(s => s.id === questId);
        if (quest) {
          quest.completed = !quest.completed;
          const allDone = mission.subtasks.every(s => s.completed);
          if (allDone) {
            mission.status = 'COMPLETED';
            this.logCompletedMission(mission);
            sound.playSuccessChime();
          } else if (mission.status === 'COMPLETED') {
            mission.status = 'IN_PROGRESS';
          }
          this.saveMissions(list);
          return quest.completed;
        }
      }
      return false;
    }

    addQuestStep(missionId, title) {
      const cleanTitle = (title || '').trim();
      if (!cleanTitle) return null;

      const list = this.getMissions();
      const mission = list.find(m => m.id === missionId);
      if (mission) {
        if (!mission.subtasks) mission.subtasks = [];
        const newQuest = {
          id: 'qst_' + Date.now() + '_' + Math.floor(Math.random() * 100),
          title: cleanTitle,
          completed: false
        };
        mission.subtasks.push(newQuest);
        this.saveMissions(list);
        return newQuest;
      }
      return null;
    }

    // Helper: Identify Next Action for a Mission or System
    getNextAction(mission) {
      if (!mission) return 'Declare your first mission objective';
      if (mission.subtasks && mission.subtasks.length > 0) {
        const nextSub = mission.subtasks.find(s => !s.completed);
        if (nextSub) return nextSub.title;
      }
      return mission.title;
    }

    // --- Focus Sessions & Interruption Tracking ---
    getFocusSessions() {
      try {
        return JSON.parse(localStorage.getItem('aether_focus_sessions')) || [];
      } catch (e) { return []; }
    }

    logFocusSession(sessionData) {
      const list = this.getFocusSessions();
      const entry = {
        id: 'fcs_' + Date.now(),
        missionId: sessionData.missionId || '',
        missionTitle: sessionData.missionTitle || 'General Focus',
        durationMinutes: sessionData.durationMinutes || 25,
        interrupted: sessionData.interrupted || false,
        interruptionReason: sessionData.interruptionReason || '',
        resumed: sessionData.resumed || false,
        timestamp: Date.now(),
        dateStr: this.todayStr
      };
      list.unshift(entry);
      localStorage.setItem('aether_focus_sessions', JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('aether:focus-updated'));
    }

    saveResumptionMemory(memoryObj) {
      localStorage.setItem('aether_resumption_memory', JSON.stringify({
        ...memoryObj,
        timestamp: Date.now()
      }));
      window.dispatchEvent(new CustomEvent('aether:resumption-updated'));
    }

    getResumptionMemory() {
      try {
        return JSON.parse(localStorage.getItem('aether_resumption_memory'));
      } catch (e) { return null; }
    }

    clearResumptionMemory() {
      localStorage.removeItem('aether_resumption_memory');
      window.dispatchEvent(new CustomEvent('aether:resumption-updated'));
    }

    // --- Decompression & Thought Logs ---
    getDecompressionEntries() {
      try {
        return JSON.parse(localStorage.getItem('aether_decompression')) || [];
      } catch (e) { return []; }
    }

    logThought(text, mood = 'neutral') {
      const cleanText = (text || '').trim();
      if (!cleanText) return;

      const list = this.getDecompressionEntries();
      list.unshift({
        id: 'thg_' + Date.now(),
        text: cleanText,
        mood: mood,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dateStr: this.todayStr
      });
      localStorage.setItem('aether_decompression', JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('aether:decompression-updated'));
    }

    // --- Completed Missions Log ---
    getCompletedMissions() {
      try {
        return JSON.parse(localStorage.getItem('aether_completed_missions')) || [];
      } catch (e) { return []; }
    }

    logCompletedMission(mission) {
      const list = this.getCompletedMissions();
      list.unshift({
        id: 'cmp_' + Date.now(),
        missionTitle: mission.title,
        category: mission.category,
        priority: mission.priority,
        completedAt: new Date().toLocaleDateString()
      });
      localStorage.setItem('aether_completed_missions', JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('aether:completed-updated'));
    }

    // --- Export / Import JSON Data with Validation ---
    exportWorkspaceJSON() {
      const data = {
        missions: this.getMissions(),
        completedMissions: this.getCompletedMissions(),
        focusSessions: this.getFocusSessions(),
        decompression: this.getDecompressionEntries(),
        dailyReviews: JSON.parse(localStorage.getItem('aether_daily_reviews') || '[]'),
        vision: JSON.parse(localStorage.getItem('aether_vision') || '{}'),
        exportedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aether-os-backup-${this.todayStr}.json`;
      a.click();
    }

    importWorkspaceJSON(jsonText) {
      try {
        const data = JSON.parse(jsonText);
        if (!data || typeof data !== 'object') throw new Error('Invalid JSON structure');

        if (Array.isArray(data.missions)) localStorage.setItem('aether_missions', JSON.stringify(data.missions));
        if (Array.isArray(data.completedMissions)) localStorage.setItem('aether_completed_missions', JSON.stringify(data.completedMissions));
        if (Array.isArray(data.focusSessions)) localStorage.setItem('aether_focus_sessions', JSON.stringify(data.focusSessions));
        if (Array.isArray(data.decompression)) localStorage.setItem('aether_decompression', JSON.stringify(data.decompression));
        if (Array.isArray(data.dailyReviews)) localStorage.setItem('aether_daily_reviews', JSON.stringify(data.dailyReviews));
        if (data.vision && typeof data.vision === 'object') localStorage.setItem('aether_vision', JSON.stringify(data.vision));
        
        window.dispatchEvent(new CustomEvent('aether:missions-updated'));
        window.dispatchEvent(new CustomEvent('aether:focus-updated'));
        window.dispatchEvent(new CustomEvent('aether:decompression-updated'));
        window.dispatchEvent(new CustomEvent('aether:completed-updated'));
        alert('Workspace backup successfully restored!');
      } catch (e) {
        alert('Error importing JSON backup: Invalid format or corrupted file.');
      }
    }
  }

  const state = new AppState();

  /* ==========================================================================
     3. HEADER TELEMETRY & CLOCK
     ========================================================================== */
  function initHeaderTelemetry() {
    const dateEl = document.getElementById('header-date');
    const timeEl = document.getElementById('header-session-time');
    const focusValEl = document.getElementById('header-xp-val');

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

    const updateHeaderMetrics = () => {
      const sessions = state.getFocusSessions().filter(s => s.dateStr === state.todayStr);
      const totalMins = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
      if (focusValEl) focusValEl.textContent = `${totalMins} MIN`;
    };

    updateHeaderMetrics();
    window.addEventListener('aether:focus-updated', updateHeaderMetrics);
  }

  /* ==========================================================================
     4. NAVIGATION ENGINE (5 MAIN AREAS)
     ========================================================================== */
  function initNavigation() {
    const navTabBtns = document.querySelectorAll('.nav-tab-btn');
    const mobileBottomBtns = document.querySelectorAll('.mobile-bottom-nav-item');
    const viewContainers = document.querySelectorAll('.app-view-container');
    const modeDisplayTitle = document.getElementById('mode-display-title');

    // Mobile Sheet
    const modalMobileMore = document.getElementById('modal-mobile-more');
    const btnCloseMobileMore = document.getElementById('btn-close-mobile-more');
    const btnCloseMoreSheet = document.getElementById('btn-close-more-sheet');
    const mobileMoreItems = document.querySelectorAll('.mobile-more-item[data-view]');

    const switchView = (targetView) => {
      if (targetView === 'more') {
        if (modalMobileMore) modalMobileMore.classList.remove('hidden');
        sound.playTone(600, 0.04);
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

      navTabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.view === targetView));
      mobileBottomBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.view === targetView));

      if (modeDisplayTitle) {
        if (targetView === 'tasks') modeDisplayTitle.textContent = 'MISSION ENGINE';
        else if (targetView === 'focus') modeDisplayTitle.textContent = 'FOCUS COCKPIT';
        else if (targetView === 'achievements') modeDisplayTitle.textContent = 'INSIGHTS & ANALYTICS';
        else if (targetView === 'mission') modeDisplayTitle.textContent = 'SYSTEM & RECOVERY';
        else modeDisplayTitle.textContent = 'CONTROL ROOM';
      }

      sound.playTone(550, 0.04);
    };

    navTabBtns.forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
    mobileBottomBtns.forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
    mobileMoreItems.forEach(item => item.addEventListener('click', () => switchView(item.dataset.view)));

    const closeMoreModal = () => {
      if (modalMobileMore) modalMobileMore.classList.add('hidden');
    };

    if (btnCloseMobileMore) btnCloseMobileMore.addEventListener('click', closeMoreModal);
    if (btnCloseMoreSheet) btnCloseMoreSheet.addEventListener('click', closeMoreModal);

    // Audio toggle
    const soundToggle = document.getElementById('btn-sound-toggle');
    const soundIconOn = document.getElementById('sound-icon-on');
    const soundIconOff = document.getElementById('sound-icon-off');

    if (soundToggle) {
      soundToggle.addEventListener('click', () => {
        const enabled = sound.toggle();
        if (soundIconOn && soundIconOff) {
          soundIconOn.classList.toggle('hidden', !enabled);
          soundIconOff.classList.toggle('hidden', enabled);
        }
      });
    }

    // Backup Export / Import Button Listeners
    const btnExport = document.getElementById('btn-export-data');
    const inputImport = document.getElementById('input-import-data');

    if (btnExport) btnExport.addEventListener('click', () => state.exportWorkspaceJSON());
    if (inputImport) {
      inputImport.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => state.importWorkspaceJSON(evt.target.result);
          reader.readAsText(file);
        }
      });
    }
  }

  /* ==========================================================================
     5. MISSION ENGINE CONTROLLER (Escaped HTML Rendering)
     ========================================================================== */
  function initMissionEngine() {
    const listEl = document.getElementById('task-system-list');
    const filterPills = document.querySelectorAll('#task-filter-pills .filter-pill');
    const searchInput = document.getElementById('task-search-input');
    const categorySelect = document.getElementById('task-category-filter');
    const btnOpenCreate = document.getElementById('btn-open-create-task');
    const btnMobileFabCreate = document.getElementById('btn-mobile-fab-create');

    // Modal
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

    const calculateDeadlineStatus = (deadlineStr) => {
      if (!deadlineStr) return { label: 'NO DEADLINE', class: 'deadline-none' };
      const today = new Date(state.todayStr);
      const target = new Date(deadlineStr);
      const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return { label: 'OVERDUE', class: 'deadline-overdue' };
      if (diffDays === 0) return { label: 'DUE TODAY', class: 'deadline-today' };
      if (diffDays <= 7) return { label: `DUE IN ${diffDays}D`, class: 'deadline-soon' };
      return { label: `DUE: ${escapeHTML(deadlineStr)}`, class: 'deadline-none' };
    };

    const renderMissions = () => {
      const missions = state.getMissions();
      if (!listEl) return;

      let filtered = missions;

      if (categorySelect && categorySelect.value !== 'ALL') {
        filtered = filtered.filter(m => m.category === categorySelect.value);
      }

      if (searchInput && searchInput.value.trim()) {
        const query = searchInput.value.toLowerCase().trim();
        filtered = filtered.filter(m => 
          m.title.toLowerCase().includes(query) || 
          (m.description && m.description.toLowerCase().includes(query))
        );
      }

      if (currentFilter === 'TODAY') {
        filtered = filtered.filter(m => m.deadline === state.todayStr);
      } else if (currentFilter === 'DUE_SOON') {
        filtered = filtered.filter(m => {
          const status = calculateDeadlineStatus(m.deadline);
          return status.class === 'deadline-soon' || status.class === 'deadline-today';
        });
      } else if (currentFilter === 'OVERDUE') {
        filtered = filtered.filter(m => calculateDeadlineStatus(m.deadline).class === 'deadline-overdue');
      } else if (currentFilter === 'HIGH_PRIORITY') {
        filtered = filtered.filter(m => m.priority === 'P1' || m.priority === 'P2');
      } else if (currentFilter === 'IN_PROGRESS') {
        filtered = filtered.filter(m => m.status !== 'COMPLETED');
      } else if (currentFilter === 'COMPLETED') {
        filtered = filtered.filter(m => m.status === 'COMPLETED');
      } else if (currentFilter === 'NO_DEADLINE') {
        filtered = filtered.filter(m => !m.deadline);
      }

      if (filtered.length === 0) {
        listEl.innerHTML = `
          <li class="empty-data-card">
            <p class="mono-meta">No missions found in this view. Click <strong>+ CREATE MISSION</strong> to declare an objective.</p>
          </li>
        `;
        return;
      }

      listEl.innerHTML = '';
      filtered.forEach(mission => {
        const isCompleted = mission.status === 'COMPLETED';
        const deadlineInfo = calculateDeadlineStatus(mission.deadline);
        const nextAction = state.getNextAction(mission);
        const subTotal = mission.subtasks ? mission.subtasks.length : 0;
        const subDone = mission.subtasks ? mission.subtasks.filter(s => s.completed).length : 0;
        const progressPercent = subTotal > 0 ? Math.round((subDone / subTotal) * 100) : (isCompleted ? 100 : 0);

        const li = document.createElement('li');
        li.className = `task-card-item ${isCompleted ? 'completed' : ''}`;
        li.innerHTML = `
          <div class="task-header-row">
            <label class="custom-checkbox-label">
              <input type="checkbox" class="checkbox-input task-complete-chk" data-id="${escapeHTML(mission.id)}" ${isCompleted ? 'checked' : ''}>
              <span class="checkbox-visual">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke-width="3.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </span>
            </label>

            <div class="task-main-info">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
                <span class="task-title-text">${escapeHTML(mission.title)}</span>
                <div style="display: flex; gap: 6px; align-items: center;">
                  <button class="btn-mini btn-edit-task" data-id="${escapeHTML(mission.id)}">EDIT</button>
                  <button class="btn-mini btn-text-danger btn-delete-task" data-id="${escapeHTML(mission.id)}">DELETE</button>
                </div>
              </div>

              <div class="next-action-pill" style="margin-top: 8px;">
                <span class="mono-label text-accent-cyan">NEXT ACTION:</span>
                <span style="font-size: 0.85rem; font-weight: 600;">${escapeHTML(nextAction)}</span>
              </div>

              <div class="task-tags-row" style="margin-top: 8px; display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
                <span class="priority-badge priority-${escapeHTML(mission.priority)}">${escapeHTML(mission.priority)}</span>
                <span class="category-tag">${escapeHTML(mission.category)}</span>
                <span class="deadline-badge ${escapeHTML(deadlineInfo.class)}">${escapeHTML(deadlineInfo.label)}</span>
                ${mission.estimatedEffort ? `<span class="mono-meta">Effort: ${escapeHTML(mission.estimatedEffort)}</span>` : ''}
              </div>

              ${subTotal > 0 ? `
                <div class="progress-bar-rail" style="margin-top: 10px;">
                  <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
                </div>
                <div class="subtasks-wrapper" style="margin-top: 8px; display: flex; flex-direction: column; gap: 4px;">
                  ${mission.subtasks.map(st => `
                    <div style="display: flex; align-items: center; gap: 8px; font-size: 0.82rem; color: ${st.completed ? 'var(--text-muted)' : 'var(--text-secondary)'};">
                      <input type="checkbox" class="subtask-chk" data-mission-id="${escapeHTML(mission.id)}" data-sub-id="${escapeHTML(st.id)}" ${st.completed ? 'checked' : ''}>
                      <span style="${st.completed ? 'text-decoration: line-through;' : ''}">${escapeHTML(st.title)}</span>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        `;
        listEl.appendChild(li);
      });
    };

    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentFilter = pill.dataset.filter;
        renderMissions();
      });
    });

    if (searchInput) searchInput.addEventListener('input', renderMissions);
    if (categorySelect) categorySelect.addEventListener('change', renderMissions);

    if (listEl) {
      listEl.addEventListener('click', (e) => {
        const taskChk = e.target.closest('.task-complete-chk');
        if (taskChk) {
          state.toggleMissionCompletion(taskChk.dataset.id);
          renderMissions();
          return;
        }

        const subChk = e.target.closest('.subtask-chk');
        if (subChk) {
          state.toggleQuestStep(subChk.dataset.missionId, subChk.dataset.subId);
          renderMissions();
          return;
        }

        const editBtn = e.target.closest('.btn-edit-task');
        if (editBtn) {
          const mission = state.getMissions().find(m => m.id === editBtn.dataset.id);
          if (mission && modalTask) {
            editIdInput.value = mission.id;
            titleInput.value = mission.title;
            catInput.value = mission.category;
            priorityInput.value = mission.priority;
            deadlineInput.value = mission.deadline || '';
            effortInput.value = mission.estimatedEffort || '';
            descInput.value = mission.description || '';
            tempSubtasks = [...(mission.subtasks || [])];
            renderModalSubtasks();
            modalTask.classList.remove('hidden');
          }
          return;
        }

        const delBtn = e.target.closest('.btn-delete-task');
        if (delBtn) {
          if (confirm('Delete this mission record?')) {
            state.deleteMission(delBtn.dataset.id);
            renderMissions();
          }
        }
      });
    }

    const openCreateModal = () => {
      editIdInput.value = '';
      formTask.reset();
      tempSubtasks = [];
      renderModalSubtasks();
      modalTask.classList.remove('hidden');
      titleInput.focus();
    };

    if (btnOpenCreate) btnOpenCreate.addEventListener('click', openCreateModal);
    if (btnMobileFabCreate) btnMobileFabCreate.addEventListener('click', openCreateModal);

    const renderModalSubtasks = () => {
      if (!modalSubtasksList) return;
      modalSubtasksList.innerHTML = tempSubtasks.map((s, idx) => `
        <div style="display: flex; align-items: center; justify-content: space-between; background: var(--surface-input); padding: 6px 10px; border-radius: var(--radius-xs); border: 1px solid var(--border-subdued);">
          <span style="font-size: 0.82rem;">${escapeHTML(s.title)}</span>
          <button type="button" class="btn-mini btn-text-danger btn-remove-subtask-temp" data-idx="${idx}">✕</button>
        </div>
      `).join('');
    };

    if (btnModalAddSubtask) {
      btnModalAddSubtask.addEventListener('click', () => {
        const text = modalNewSubtaskInput.value.trim();
        if (text) {
          tempSubtasks.push({ id: 'qst_' + Date.now(), title: text, completed: false });
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

    if (formTask) {
      formTask.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = editIdInput.value;
        const title = titleInput.value.trim();
        if (!title) return;

        const data = {
          title: title,
          category: catInput.value,
          priority: priorityInput.value,
          deadline: deadlineInput.value || '',
          estimatedEffort: effortInput.value,
          description: descInput.value,
          subtasks: tempSubtasks
        };

        if (id) state.updateMission(id, data);
        else state.addMission(data);

        modalTask.classList.add('hidden');
        sound.playTone(620, 0.05);
        renderMissions();
      });
    }

    const closeModal = () => modalTask.classList.add('hidden');
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
    if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);

    renderMissions();
    window.addEventListener('aether:missions-updated', renderMissions);
  }

  /* ==========================================================================
     6. FOCUS COCKPIT (Timestamp-Accurate Timer math)
     ========================================================================== */
  function initFocusSystem() {
    const objInput = document.getElementById('focus-objective-input');
    const nextActionTitle = document.getElementById('focus-next-action-title');
    const timerDigits = document.getElementById('focus-timer-digits');
    const timerBar = document.getElementById('focus-timer-bar');
    const activeLabel = document.getElementById('focus-active-objective-label');
    const durationChips = document.querySelectorAll('#duration-chips-container .btn-duration-chip');
    
    // Buttons
    const btnStart = document.getElementById('btn-focus-start');
    const btnPause = document.getElementById('btn-focus-pause');
    const btnResume = document.getElementById('btn-focus-resume');
    const btnInterrupt = document.getElementById('btn-focus-interrupt');
    const btnComplete = document.getElementById('btn-focus-complete');
    const btnCancel = document.getElementById('btn-focus-cancel');

    // Interruption Modal
    const modalInterrupt = document.getElementById('modal-focus-interruption');
    const inputReason = document.getElementById('input-interruption-reason');
    const btnSaveInterrupt = document.getElementById('btn-save-interruption');
    const btnCloseInterrupt = document.getElementById('btn-close-interruption-modal');

    // Resumption Memory Card
    const resumptionBox = document.getElementById('focus-resumption-memory-box');
    const resumptionContextText = document.getElementById('resumption-context-text');
    const btnResumptionRejoin = document.getElementById('btn-resumption-rejoin');
    const btnResumptionClear = document.getElementById('btn-resumption-clear');

    let totalMins = 25;
    let secondsLeft = 25 * 60;
    let targetEndTime = null;
    let timerInterval = null;
    let isRunning = false;

    const formatTimer = (secs) => {
      const m = String(Math.floor(secs / 60)).padStart(2, '0');
      const s = String(secs % 60).padStart(2, '0');
      return `${m}:${s}`;
    };

    const updateFocusDisplay = () => {
      if (timerDigits) timerDigits.textContent = formatTimer(secondsLeft);
      if (timerBar) {
        const percent = Math.min(100, Math.max(0, (secondsLeft / (totalMins * 60)) * 100));
        timerBar.style.width = `${percent}%`;
      }
      const headerTimer = document.getElementById('header-focus-timer');
      if (headerTimer) headerTimer.textContent = formatTimer(secondsLeft);
    };

    const setDuration = (mins) => {
      totalMins = mins;
      secondsLeft = mins * 60;
      targetEndTime = null;
      updateFocusDisplay();
    };

    durationChips.forEach(chip => {
      chip.addEventListener('click', () => {
        if (isRunning) return;
        durationChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        setDuration(parseInt(chip.dataset.mins, 10));
      });
    });

    const tickTimer = () => {
      if (!isRunning || !targetEndTime) return;
      const now = Date.now();
      secondsLeft = Math.max(0, Math.ceil((targetEndTime - now) / 1000));
      updateFocusDisplay();

      if (secondsLeft <= 0) {
        completeFocusSession(true);
      }
    };

    // Tab visibility change listener prevents timer drift when backgrounded
    document.addEventListener('visibilitychange', () => {
      if (isRunning && targetEndTime) {
        tickTimer();
      }
    });

    const startTimer = () => {
      if (isRunning) return;
      isRunning = true;
      targetEndTime = Date.now() + secondsLeft * 1000;

      const headerFocusPill = document.getElementById('header-focus-pill');
      if (headerFocusPill) headerFocusPill.classList.remove('hidden');

      btnStart.classList.add('hidden');
      btnPause.classList.remove('hidden');
      btnInterrupt.classList.remove('hidden');
      btnComplete.classList.remove('hidden');
      btnCancel.classList.remove('hidden');

      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(tickTimer, 1000);
    };

    const pauseTimer = () => {
      isRunning = false;
      if (timerInterval) clearInterval(timerInterval);
      btnPause.classList.add('hidden');
      btnResume.classList.remove('hidden');
    };

    const resumeTimer = () => {
      startTimer();
      btnResume.classList.add('hidden');
    };

    const completeFocusSession = (naturally = true) => {
      isRunning = false;
      if (timerInterval) clearInterval(timerInterval);
      const title = objInput ? objInput.value.trim() : 'Focus Session';
      
      state.logFocusSession({
        missionTitle: title || 'Focus Mission',
        durationMinutes: totalMins,
        completedNaturally: naturally,
        interrupted: !naturally
      });

      if (naturally) sound.playSuccessChime();
      resetTimerUI();
    };

    const resetTimerUI = () => {
      isRunning = false;
      if (timerInterval) clearInterval(timerInterval);
      targetEndTime = null;

      const headerFocusPill = document.getElementById('header-focus-pill');
      if (headerFocusPill) headerFocusPill.classList.add('hidden');

      btnStart.classList.remove('hidden');
      btnPause.classList.add('hidden');
      btnResume.classList.add('hidden');
      btnInterrupt.classList.add('hidden');
      btnComplete.classList.add('hidden');
      btnCancel.classList.add('hidden');

      setDuration(totalMins);
    };

    if (btnStart) btnStart.addEventListener('click', startTimer);
    if (btnPause) btnPause.addEventListener('click', pauseTimer);
    if (btnResume) btnResume.addEventListener('click', resumeTimer);
    if (btnComplete) btnComplete.addEventListener('click', () => completeFocusSession(true));
    if (btnCancel) btnCancel.addEventListener('click', resetTimerUI);

    // Interruption logic & State memory
    if (btnInterrupt) {
      btnInterrupt.addEventListener('click', () => {
        pauseTimer();
        if (modalInterrupt) modalInterrupt.classList.remove('hidden');
      });
    }

    if (btnSaveInterrupt) {
      btnSaveInterrupt.addEventListener('click', () => {
        const reason = inputReason.value.trim();
        const missionTitle = objInput.value.trim() || 'Focus Mission';
        
        state.saveResumptionMemory({
          missionTitle: missionTitle,
          nextAction: nextActionTitle ? nextActionTitle.textContent : '',
          reason: reason || 'Context switch',
          secondsLeft: secondsLeft,
          totalMins: totalMins
        });

        state.logFocusSession({
          missionTitle: missionTitle,
          durationMinutes: Math.round((totalMins * 60 - secondsLeft) / 60),
          interrupted: true,
          interruptionReason: reason
        });

        modalInterrupt.classList.add('hidden');
        inputReason.value = '';
        resetTimerUI();
        renderResumptionMemory();
      });
    }

    if (btnCloseInterrupt) {
      btnCloseInterrupt.addEventListener('click', () => modalInterrupt.classList.add('hidden'));
    }

    const renderResumptionMemory = () => {
      const memory = state.getResumptionMemory();
      if (memory && resumptionBox && resumptionContextText) {
        resumptionBox.classList.remove('hidden');
        resumptionContextText.textContent = `Interrupted on "${escapeHTML(memory.missionTitle)}" • Note: "${escapeHTML(memory.reason)}" • Target Next: "${escapeHTML(memory.nextAction)}"`;
      } else if (resumptionBox) {
        resumptionBox.classList.add('hidden');
      }
    };

    if (btnResumptionRejoin) {
      btnResumptionRejoin.addEventListener('click', () => {
        const memory = state.getResumptionMemory();
        if (memory) {
          if (objInput) objInput.value = memory.missionTitle;
          setDuration(memory.totalMins || 25);
          secondsLeft = memory.secondsLeft || 25 * 60;
          updateFocusDisplay();
          state.clearResumptionMemory();
          renderResumptionMemory();
          startTimer();
        }
      });
    }

    if (btnResumptionClear) {
      btnResumptionClear.addEventListener('click', () => {
        state.clearResumptionMemory();
        renderResumptionMemory();
      });
    }

    const updateFocusCockpitData = () => {
      const missions = state.getMissions().filter(m => m.status !== 'COMPLETED');
      const topMission = missions.find(m => m.priority === 'P1') || missions[0];

      if (topMission) {
        if (objInput && !objInput.value) objInput.value = topMission.title;
        const nextAct = state.getNextAction(topMission);
        if (nextActionTitle) nextActionTitle.textContent = nextAct;
        if (activeLabel) activeLabel.textContent = `Active Target: ${topMission.title}`;
      } else {
        if (nextActionTitle) nextActionTitle.textContent = 'No active mission declared.';
        if (activeLabel) activeLabel.textContent = 'Mission execution pending target lock';
      }
    };

    updateFocusCockpitData();
    renderResumptionMemory();
    window.addEventListener('aether:missions-updated', updateFocusCockpitData);
  }

  /* ==========================================================================
     7. HOME VIEW CONTROLLER
     ========================================================================== */
  function initHomeView() {
    const dueSoonList = document.getElementById('dash-due-soon-list');
    const recentAchList = document.getElementById('dash-recent-achievements-list');
    const priorityTitle = document.getElementById('priority-title');
    const priorityDesc = document.getElementById('priority-desc');
    const priorityNextAction = document.getElementById('priority-next-action-text');
    const priorityCat = document.getElementById('priority-category-badge');
    const smartEngagerText = document.getElementById('smart-engager-text');
    const btnStartPriorityFocus = document.getElementById('btn-start-priority-focus');
    const todayRatio = document.getElementById('today-ratio');
    const todayPercent = document.getElementById('today-percent');
    const todayProgressBar = document.getElementById('today-progress-bar');
    const dashFocusMin = document.getElementById('dash-focus-min');
    const questsClearedCount = document.getElementById('dash-quests-cleared-count');

    const renderHome = () => {
      const missions = state.getMissions();
      const activeMissions = missions.filter(m => m.status !== 'COMPLETED');
      const completedMissions = missions.filter(m => m.status === 'COMPLETED');
      
      const totalMissions = missions.length;
      const clearedCount = completedMissions.length;
      const percent = totalMissions > 0 ? Math.round((clearedCount / totalMissions) * 100) : 0;

      if (todayRatio) todayRatio.textContent = `${clearedCount} / ${totalMissions}`;
      if (todayPercent) todayPercent.textContent = `${percent}%`;
      if (todayProgressBar) todayProgressBar.style.width = `${percent}%`;

      const todaySessions = state.getFocusSessions().filter(s => s.dateStr === state.todayStr);
      const focusMins = todaySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
      if (dashFocusMin) dashFocusMin.textContent = `${focusMins} MIN`;

      let totalQuestsCleared = 0;
      missions.forEach(m => {
        if (m.subtasks) totalQuestsCleared += m.subtasks.filter(s => s.completed).length;
      });
      if (questsClearedCount) questsClearedCount.textContent = `${totalQuestsCleared} STEPS`;

      const topMission = activeMissions.find(m => m.priority === 'P1') || activeMissions[0];
      if (topMission) {
        if (priorityTitle) priorityTitle.textContent = topMission.title;
        if (priorityDesc) priorityDesc.textContent = topMission.description || `Priority ${topMission.priority} • ${topMission.category}`;
        if (priorityNextAction) priorityNextAction.textContent = state.getNextAction(topMission);
        if (priorityCat) {
          priorityCat.textContent = `${topMission.priority} — ${topMission.category}`;
          priorityCat.className = `priority-badge priority-${topMission.priority}`;
        }
      } else {
        if (priorityTitle) priorityTitle.textContent = 'All missions cleared';
        if (priorityDesc) priorityDesc.textContent = 'Declare your next mission in Missions to unlock execution focus.';
        if (priorityNextAction) priorityNextAction.textContent = 'Create your next mission objective';
      }

      if (smartEngagerText) {
        if (topMission) {
          smartEngagerText.textContent = `Assistant Suggestion: Mission "${topMission.title}" (${topMission.priority}) is your highest priority. Next Action: "${state.getNextAction(topMission)}".`;
        } else {
          smartEngagerText.textContent = 'Assistant Suggestion: No active missions pending. All goals cleared.';
        }
      }

      if (dueSoonList) {
        const dueSoon = activeMissions.slice(0, 4);
        if (dueSoon.length === 0) {
          dueSoonList.innerHTML = '<li class="mono-meta">No active time constraints pending.</li>';
        } else {
          dueSoonList.innerHTML = dueSoon.map(m => `
            <li class="task-card-item">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span class="task-title-text" style="font-size: 0.88rem;">${escapeHTML(m.title)}</span>
                <span class="priority-badge priority-${escapeHTML(m.priority)}">${escapeHTML(m.priority)}</span>
              </div>
              <span class="mono-meta">${m.deadline ? 'Deadline: ' + escapeHTML(m.deadline) : 'No Deadline'} • ${escapeHTML(m.category)}</span>
            </li>
          `).join('');
        }
      }

      if (recentAchList) {
        const completed = state.getCompletedMissions().slice(0, 4);
        if (completed.length === 0) {
          recentAchList.innerHTML = '<li class="mono-meta">Completed missions will record execution history here.</li>';
        } else {
          recentAchList.innerHTML = completed.map(c => `
            <li style="background: var(--surface-card-elevated); padding: 8px 12px; border-radius: var(--radius-xs); border: 1px solid var(--border-subdued); display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="font-size: 0.85rem; color: var(--text-primary);">${escapeHTML(c.missionTitle)}</strong>
                <div class="mono-meta">Cleared on ${escapeHTML(c.completedAt)} • ${escapeHTML(c.category)}</div>
              </div>
              <span class="mono-label text-accent-success">✓</span>
            </li>
          `).join('');
        }
      }
    };

    if (btnStartPriorityFocus) {
      btnStartPriorityFocus.addEventListener('click', () => {
        const focusTab = document.querySelector('.nav-tab-btn[data-view="focus"]');
        if (focusTab) focusTab.click();
      });
    }

    renderHome();
    window.addEventListener('aether:missions-updated', renderHome);
    window.addEventListener('aether:completed-updated', renderHome);
    window.addEventListener('aether:focus-updated', renderHome);
  }

  /* ==========================================================================
     8. INSIGHTS & REAL OBSERVED DATA CONTROLLER
     ========================================================================== */
  function initInsightsView() {
    const totalFocusEl = document.getElementById('insights-total-focus');
    const compRateEl = document.getElementById('insights-completion-rate');
    const interruptCountEl = document.getElementById('insights-interrupt-count');
    const resumptionRateEl = document.getElementById('insights-resumption-rate');
    const trendBarsEl = document.getElementById('insights-trend-bars');
    const archiveGrid = document.getElementById('achievements-history-grid');

    const renderInsights = () => {
      const sessions = state.getFocusSessions();
      const missions = state.getMissions();
      const completed = state.getCompletedMissions();

      const totalMins = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
      if (totalFocusEl) totalFocusEl.textContent = `${totalMins} MIN`;

      const totalMissions = missions.length;
      const clearedMissions = completed.length;
      const compRate = totalMissions > 0 ? Math.round((clearedMissions / totalMissions) * 100) : 0;
      if (compRateEl) compRateEl.textContent = `${compRate}%`;

      const interrupted = sessions.filter(s => s.interrupted);
      if (interruptCountEl) interruptCountEl.textContent = interrupted.length.toString();

      const resumed = interrupted.filter(s => s.resumed);
      const resumptionRate = interrupted.length > 0 ? Math.round((resumed.length / interrupted.length) * 100) : 0;
      if (resumptionRateEl) resumptionRateEl.textContent = `${resumptionRate}%`;

      if (trendBarsEl) {
        const last14Days = [];
        for (let i = 13; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          last14Days.push(`${y}-${m}-${day}`);
        }

        const maxMins = 120;
        trendBarsEl.innerHTML = last14Days.map(dateStr => {
          const dayMins = sessions.filter(s => s.dateStr === dateStr).reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
          const heightPercent = Math.min(Math.round((dayMins / maxMins) * 100), 100);
          return `
            <div class="trend-bar-column" title="${escapeHTML(dateStr)}: ${dayMins} mins">
              <div class="trend-bar-fill" style="height: ${heightPercent}%;"></div>
              <span class="mono-meta" style="font-size: 0.65rem;">${escapeHTML(dateStr.slice(8))}</span>
            </div>
          `;
        }).join('');
      }

      if (archiveGrid) {
        if (completed.length === 0) {
          archiveGrid.innerHTML = `
            <div class="empty-data-card" style="grid-column: 1 / -1;">
              <h3 class="mono-label text-accent-cyan" style="font-size: 0.9rem;">NO DATA YET</h3>
              <p class="mono-meta" style="margin-top: 4px;">Completed missions will be recorded here with real execution telemetry.</p>
            </div>
          `;
        } else {
          archiveGrid.innerHTML = completed.map(c => `
            <div style="background: var(--surface-card-elevated); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-subdued);">
              <div style="display: flex; justify-content: space-between;">
                <span class="priority-badge priority-${escapeHTML(c.priority)}">${escapeHTML(c.priority)}</span>
                <span class="category-tag">${escapeHTML(c.category)}</span>
              </div>
              <h4 style="font-size: 0.9rem; font-weight: 700; margin-top: 6px;">${escapeHTML(c.missionTitle)}</h4>
              <span class="mono-meta">Cleared on ${escapeHTML(c.completedAt)}</span>
            </div>
          `).join('');
        }
      }
    };

    renderInsights();
    window.addEventListener('aether:focus-updated', renderInsights);
    window.addEventListener('aether:completed-updated', renderInsights);
  }

  /* ==========================================================================
     9. SYSTEM AREA (Vision, Daily Review, Thought Log & Circuit Breaker)
     ========================================================================== */
  function initSystemArea() {
    const subnavBtns = document.querySelectorAll('.system-subnav-btn');
    const subviews = document.querySelectorAll('.system-subview');

    subnavBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        subnavBtns.forEach(b => b.classList.remove('active', 'btn-cyan-action'));
        subnavBtns.forEach(b => b.classList.add('btn-terminal-blue'));
        btn.classList.remove('btn-terminal-blue');
        btn.classList.add('active', 'btn-cyan-action');

        const target = btn.dataset.subview;
        subviews.forEach(sv => {
          sv.classList.toggle('hidden', sv.id !== `subview-${target}`);
        });
      });
    });

    const visionBuilding = document.getElementById('mission-building');
    const visionWhy = document.getElementById('mission-why');
    const visionValues = document.getElementById('mission-values');
    const visionDirection = document.getElementById('mission-direction');
    const btnSaveVision = document.getElementById('btn-save-mission');

    try {
      const visionData = JSON.parse(localStorage.getItem('aether_vision') || '{}');
      if (visionBuilding) visionBuilding.value = visionData.building || '';
      if (visionWhy) visionWhy.value = visionData.why || '';
      if (visionValues) visionValues.value = visionData.values || '';
      if (visionDirection) visionDirection.value = visionData.direction || '';
    } catch (e) {}

    if (btnSaveVision) {
      btnSaveVision.addEventListener('click', () => {
        const data = {
          building: visionBuilding.value,
          why: visionWhy.value,
          values: visionValues.value,
          direction: visionDirection.value
        };
        localStorage.setItem('aether_vision', JSON.stringify(data));
        sound.playTone(600, 0.05);
        alert('Vision Directives saved.');
      });
    }

    const revMattered = document.getElementById('review-what-mattered');
    const revHappened = document.getElementById('review-what-happened');
    const revTomorrow = document.getElementById('review-tomorrow-changes');
    const btnSaveReview = document.getElementById('btn-save-daily-review');

    if (btnSaveReview) {
      btnSaveReview.addEventListener('click', () => {
        const reviews = JSON.parse(localStorage.getItem('aether_daily_reviews') || '[]');
        reviews.unshift({
          id: 'rev_' + Date.now(),
          dateStr: state.todayStr,
          whatMattered: revMattered.value,
          whatHappened: revHappened.value,
          tomorrowChanges: revTomorrow.value
        });
        localStorage.setItem('aether_daily_reviews', JSON.stringify(reviews));
        sound.playSuccessChime();
        alert('Daily Review saved for today.');
      });
    }

    const decompInput = document.getElementById('decompression-input');
    const decompMoodSelect = document.getElementById('decompression-mood-select');
    const btnLogThought = document.getElementById('btn-save-decompression-thought');
    const btnTurnIntoTask = document.getElementById('btn-turn-into-task');
    const btnClearDecomp = document.getElementById('btn-clear-decompression');
    const decompList = document.getElementById('decompression-log-list');

    const renderDecompression = () => {
      const entries = state.getDecompressionEntries();
      if (!decompList) return;

      if (entries.length === 0) {
        decompList.innerHTML = '<li class="mono-meta">Thought log buffer is clear.</li>';
        return;
      }

      decompList.innerHTML = entries.slice(0, 6).map(e => `
        <li style="background: var(--surface-card-elevated); padding: 8px 12px; border-radius: var(--radius-xs); border: 1px solid var(--border-subdued); margin-bottom: 6px; display: flex; justify-content: space-between;">
          <span>${escapeHTML(e.text)}</span>
          <span class="mono-meta">[${escapeHTML((e.mood || 'neutral').toUpperCase())}] ${escapeHTML(e.timestamp)}</span>
        </li>
      `).join('');
    };

    if (btnLogThought) {
      btnLogThought.addEventListener('click', () => {
        if (decompInput && decompInput.value.trim()) {
          state.logThought(decompInput.value.trim(), decompMoodSelect ? decompMoodSelect.value : 'neutral');
          decompInput.value = '';
          renderDecompression();
        }
      });
    }

    if (btnTurnIntoTask) {
      btnTurnIntoTask.addEventListener('click', () => {
        if (decompInput && decompInput.value.trim()) {
          state.addMission({ title: decompInput.value.trim(), category: 'COGNITIVE', priority: 'P2' });
          decompInput.value = '';
          alert('Thought converted into Mission!');
          renderDecompression();
        }
      });
    }

    if (btnClearDecomp) {
      btnClearDecomp.addEventListener('click', () => {
        localStorage.setItem('aether_decompression', JSON.stringify([]));
        renderDecompression();
      });
    }

    renderDecompression();

    const cbModal = document.getElementById('modal-circuit-breaker');
    const btnOpenCB = document.getElementById('btn-open-circuit-breaker');
    const btnCloseCB = document.getElementById('btn-close-circuit-breaker');
    const btnCloseCBX = document.getElementById('btn-close-circuit-breaker-x');

    if (btnOpenCB) btnOpenCB.addEventListener('click', () => cbModal.classList.remove('hidden'));
    const closeCB = () => cbModal.classList.add('hidden');
    if (btnCloseCB) btnCloseCB.addEventListener('click', closeCB);
    if (btnCloseCBX) btnCloseCBX.addEventListener('click', closeCB);

    const circuitOptions = document.querySelectorAll('.btn-circuit-option');
    circuitOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        const action = opt.dataset.action;
        if (action === 'micro_task') {
          const taskTitle = prompt('Enter a single 5-minute micro-action:');
          if (taskTitle) state.addMission({ title: taskTitle, category: 'TECHNICAL', priority: 'P1', estimatedEffort: '5m' });
        } else if (action === 'decompress') {
          const sysNav = document.querySelector('.nav-tab-btn[data-view="mission"]');
          if (sysNav) sysNav.click();
        }
        closeCB();
      });
    });
  }

  /* ==========================================================================
     10. PREFERENCES, THEMES & SUPABASE SYNC
     ========================================================================== */
  function initPreferencesAndSync() {
    const modalCC = document.getElementById('modal-creative-control');
    const btnOpenCC = document.getElementById('btn-open-creative-control');
    const btnCloseCC = document.getElementById('btn-close-cc');
    const btnCloseCCX = document.getElementById('btn-close-cc-modal');
    const themeCards = document.querySelectorAll('#theme-presets-row .theme-preset-card');

    const applyTheme = (name) => {
      document.body.className = `apex-body theme-${name || 'cyan'}`;
      localStorage.setItem('aether_theme', name || 'cyan');
      themeCards.forEach(c => c.classList.toggle('active', c.dataset.theme === name));
    };

    applyTheme(localStorage.getItem('aether_theme') || 'cyan');

    themeCards.forEach(card => {
      card.addEventListener('click', () => applyTheme(card.dataset.theme));
    });

    if (btnOpenCC) btnOpenCC.addEventListener('click', () => modalCC.classList.remove('hidden'));
    const closeCC = () => modalCC.classList.add('hidden');
    if (btnCloseCC) btnCloseCC.addEventListener('click', closeCC);
    if (btnCloseCCX) btnCloseCCX.addEventListener('click', closeCC);

    const modalAI = document.getElementById('modal-ai-assistant');
    const btnOpenAI = document.getElementById('btn-open-ai-assistant');
    const btnMobileOpenAI = document.getElementById('btn-mobile-open-ai');
    const btnCloseAI = document.getElementById('btn-close-ai');
    const btnCloseAIX = document.getElementById('btn-close-ai-modal');
    const btnDecompose = document.getElementById('btn-ai-decompose-selected');
    const outputText = document.getElementById('ai-output-text');

    const openAI = () => modalAI.classList.remove('hidden');
    const closeAI = () => modalAI.classList.add('hidden');

    if (btnOpenAI) btnOpenAI.addEventListener('click', openAI);
    if (btnMobileOpenAI) btnMobileOpenAI.addEventListener('click', () => {
      const mobileSheet = document.getElementById('modal-mobile-more');
      if (mobileSheet) mobileSheet.classList.add('hidden');
      openAI();
    });
    if (btnCloseAI) btnCloseAI.addEventListener('click', closeAI);
    if (btnCloseAIX) btnCloseAIX.addEventListener('click', closeAI);

    if (btnDecompose) {
      btnDecompose.addEventListener('click', async () => {
        const topMission = state.getMissions().find(m => m.status !== 'COMPLETED');
        if (!topMission) {
          if (outputText) outputText.textContent = 'Assistant: No active mission available to decompose.';
          return;
        }

        if (outputText) outputText.textContent = `Decomposing "${topMission.title}" into quest steps...`;

        try {
          const res = await fetch('/api/ai/assist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'decompose', taskTitle: topMission.title })
          });
          const data = await res.json();
          if (data && data.success && data.suggestedSubtasks) {
            data.suggestedSubtasks.forEach(s => state.addQuestStep(topMission.id, s.title));
            if (outputText) outputText.textContent = `Decomposed "${topMission.title}" into ${data.suggestedSubtasks.length} quest steps!`;
            sound.playSuccessChime();
          } else {
            // Local fallback if API is unreachable
            state.addQuestStep(topMission.id, `Define scope for ${topMission.title}`);
            state.addQuestStep(topMission.id, `Execute implementation block`);
            state.addQuestStep(topMission.id, `Verify completion & test output`);
            if (outputText) outputText.textContent = `Decomposed "${topMission.title}" into 3 quest steps!`;
          }
        } catch (e) {
          state.addQuestStep(topMission.id, `Define scope for ${topMission.title}`);
          state.addQuestStep(topMission.id, `Execute implementation block`);
          state.addQuestStep(topMission.id, `Verify completion & test output`);
          if (outputText) outputText.textContent = `Decomposed "${topMission.title}" into 3 quest steps!`;
        }
      });
    }

    const modalAuth = document.getElementById('modal-auth-sync');
    const btnOpenAuth = document.getElementById('btn-open-auth-modal');
    const btnCloseAuth = document.getElementById('btn-close-auth-modal');
    const headerSyncPill = document.getElementById('header-sync-pill');

    if (btnOpenAuth) btnOpenAuth.addEventListener('click', () => {
      if (modalCC) modalCC.classList.add('hidden');
      if (modalAuth) modalAuth.classList.remove('hidden');
    });

    if (headerSyncPill) headerSyncPill.addEventListener('click', () => {
      if (modalAuth) modalAuth.classList.remove('hidden');
    });

    if (btnCloseAuth) btnCloseAuth.addEventListener('click', () => {
      if (modalAuth) modalAuth.classList.add('hidden');
    });
  }

  /* ==========================================================================
     11. BOOTSTRAP INITIALIZATION
     ========================================================================== */
  document.addEventListener('DOMContentLoaded', () => {
    initHeaderTelemetry();
    initNavigation();
    initMissionEngine();
    initFocusSystem();
    initHomeView();
    initInsightsView();
    initSystemArea();
    initPreferencesAndSync();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => {
          reg.update();
          console.log('[LEVEL UP PWA] Service worker active scope:', reg.scope);
        })
        .catch((err) => console.log('[LEVEL UP PWA] Service worker registration failed:', err));
    }

    console.log(
      '%c LEVEL UP SYSTEM %c CONTROL ROOM ONLINE ',
      'background: #070a0f; color: #38bdf8; font-weight: bold; padding: 4px;',
      'background: #0b111c; color: #34d399; font-weight: bold; padding: 4px;'
    );
  });
})();
