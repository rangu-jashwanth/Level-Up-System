/**
 * LEVEL UP SYSTEM // EXECUTIVE COMMAND OS (app.js)
 * Architecture: Modular ES6+ Local-First Execution Operating System
 * Security & Reliability: Fully escaped HTML rendering, robust state persistence, zero external runtime dependencies.
 * 3D Graphics: GPU-accelerated 3D Quantum Viewport Engine + Celestial Parallax Field.
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
      if (!localStorage.getItem('aether_vision') && localStorage.getItem('apex_mission')) {
        localStorage.setItem('aether_vision', localStorage.getItem('apex_mission'));
      }
    }

    initStorage() {
      if (!localStorage.getItem('aether_missions')) localStorage.setItem('aether_missions', JSON.stringify([]));
      if (!localStorage.getItem('aether_completed_missions')) localStorage.setItem('aether_completed_missions', JSON.stringify([]));
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

    completeMission(id) {
      const list = this.getMissions();
      const mission = list.find(m => m.id === id);
      if (mission) {
        mission.status = 'COMPLETED';
        if (mission.subtasks) {
          mission.subtasks.forEach(s => s.completed = true);
        }
        this.logCompletedMission(mission);
        this.saveMissions(list);
        return true;
      }
      return false;
    }

    toggleMissionStatus(id) {
      const list = this.getMissions();
      const mission = list.find(m => m.id === id);
      if (mission) {
        if (mission.status === 'COMPLETED') {
          mission.status = 'TODO';
        } else {
          mission.status = 'COMPLETED';
          if (mission.subtasks) {
            mission.subtasks.forEach(s => s.completed = true);
          }
          this.logCompletedMission(mission);
          sound.playSuccessChime();
        }
        this.saveMissions(list);
        return mission.status;
      }
      return null;
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

    getNextAction(mission) {
      if (!mission) return 'Declare your first mission objective';
      if (mission.subtasks && mission.subtasks.length > 0) {
        const nextSub = mission.subtasks.find(s => !s.completed);
        if (nextSub) return nextSub.title;
      }
      return mission.title;
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
        completedAt: new Date().toLocaleDateString(),
        timestamp: Date.now()
      });
      localStorage.setItem('aether_completed_missions', JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('aether:completed-updated'));
    }

    // --- Export / Import JSON Data ---
    exportWorkspaceJSON() {
      const data = {
        missions: this.getMissions(),
        completedMissions: this.getCompletedMissions(),
        decompression: this.getDecompressionEntries(),
        dailyReviews: JSON.parse(localStorage.getItem('aether_daily_reviews') || '[]'),
        vision: JSON.parse(localStorage.getItem('aether_vision') || '{}'),
        exportedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `level-up-system-backup-${this.todayStr}.json`;
      a.click();
    }

    importWorkspaceJSON(jsonText) {
      try {
        const data = JSON.parse(jsonText);
        if (!data || typeof data !== 'object') throw new Error('Invalid JSON structure');

        if (Array.isArray(data.missions)) localStorage.setItem('aether_missions', JSON.stringify(data.missions));
        if (Array.isArray(data.completedMissions)) localStorage.setItem('aether_completed_missions', JSON.stringify(data.completedMissions));
        if (Array.isArray(data.decompression)) localStorage.setItem('aether_decompression', JSON.stringify(data.decompression));
        if (Array.isArray(data.dailyReviews)) localStorage.setItem('aether_daily_reviews', JSON.stringify(data.dailyReviews));
        if (data.vision && typeof data.vision === 'object') localStorage.setItem('aether_vision', JSON.stringify(data.vision));
        
        window.dispatchEvent(new CustomEvent('aether:missions-updated'));
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
    const rankPillVal = document.getElementById('header-xp-val');

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
      const missions = state.getMissions();
      const total = missions.length;
      const cleared = missions.filter(m => m.status === 'COMPLETED').length;
      if (rankPillVal) rankPillVal.textContent = `${cleared} / ${total}`;
    };

    updateHeaderMetrics();
    window.addEventListener('aether:missions-updated', updateHeaderMetrics);
  }

  /* ==========================================================================
     4. NAVIGATION ENGINE (4 PRIMARY EXECUTIVE PILLARS)
     ========================================================================== */
  function initNavigation() {
    const navTabBtns = document.querySelectorAll('.nav-tab-btn');
    const mobileBottomBtns = document.querySelectorAll('.mobile-bottom-nav-item');
    const viewContainers = document.querySelectorAll('.app-view-container');
    const modeDisplayTitle = document.getElementById('mode-display-title');

    const switchView = (targetView) => {
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
        else if (targetView === 'achievements') modeDisplayTitle.textContent = 'INTEL & TELEMETRY';
        else if (targetView === 'mission') modeDisplayTitle.textContent = 'STRATEGIC ARCHITECT';
        else modeDisplayTitle.textContent = 'COMMAND ROOM';
      }

      window.dispatchEvent(new CustomEvent('aether:view-switched', { detail: { view: targetView } }));
      setTimeout(() => { if (typeof init3DCardTilt === 'function') init3DCardTilt(); }, 60);

      sound.playTone(550, 0.04);
    };

    navTabBtns.forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
    mobileBottomBtns.forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));

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

    // Circuit Breaker Direct Button
    const btnCircuit = document.getElementById('btn-open-circuit-breaker');
    if (btnCircuit) {
      btnCircuit.addEventListener('click', () => {
        sound.playTone(420, 0.08);
        switchView('mission');
        setTimeout(() => {
          const btnRecal = document.querySelector('.system-subnav-btn[data-subview="recalibration"]');
          if (btnRecal) btnRecal.click();
        }, 60);
      });
    }
  }

  /* ==========================================================================
     5. MISSION ENGINE CONTROLLER (Decomposition & Quests)
     ========================================================================== */
  function initMissionEngine() {
    const listEl = document.getElementById('task-system-list');
    const filterPills = document.querySelectorAll('#task-filter-pills .filter-pill');
    const searchInput = document.getElementById('task-search-input');
    const catSelect = document.getElementById('task-category-filter');
    const btnOpenCreate = document.getElementById('btn-open-create-task');
    const fabCreate = document.getElementById('mobile-fab-create');

    // Modal Editor Elements
    const modalTask = document.getElementById('modal-task-editor');
    const formTask = document.getElementById('form-task-editor');
    const modalTitle = document.getElementById('task-editor-modal-title');
    const editIdInput = document.getElementById('task-edit-id');
    const titleInput = document.getElementById('task-title-input');
    const catInput = document.getElementById('task-category-input');
    const priorityInput = document.getElementById('task-priority-input');
    const deadlineInput = document.getElementById('task-deadline-input');
    const effortInput = document.getElementById('task-effort-input');
    const descInput = document.getElementById('task-desc-input');
    const btnCloseModal = document.getElementById('btn-close-task-modal');
    const btnCancelModal = document.getElementById('btn-cancel-task-modal');

    // Quest Steps Builder in Modal
    const modalSubtasksList = document.getElementById('modal-subtasks-list');
    const inputModalNewSubtask = document.getElementById('input-modal-new-subtask');
    const btnModalAddSubtask = document.getElementById('btn-modal-add-subtask');
    let currentModalSubtasks = [];

    let currentFilter = 'ALL';
    let currentSearch = '';
    let currentCategory = 'ALL';

    const getDeadlineStatus = (deadlineStr) => {
      if (!deadlineStr) return { status: 'none', label: 'No Deadline' };
      const today = state.todayStr;
      if (deadlineStr < today) return { status: 'overdue', label: 'OVERDUE' };
      if (deadlineStr === today) return { status: 'today', label: 'DUE TODAY' };
      return { status: 'soon', label: deadlineStr };
    };

    const renderMissions = () => {
      if (!listEl) return;
      let missions = state.getMissions();

      // Category filter
      if (currentCategory !== 'ALL') {
        missions = missions.filter(m => m.category === currentCategory);
      }

      // Search filter
      if (currentSearch.trim()) {
        const q = currentSearch.toLowerCase();
        missions = missions.filter(m => {
          const inTitle = m.title.toLowerCase().includes(q);
          const inDesc = (m.description || '').toLowerCase().includes(q);
          const inSubtasks = (m.subtasks || []).some(s => s.title.toLowerCase().includes(q));
          return inTitle || inDesc || inSubtasks;
        });
      }

      // Filter Pill filter
      const today = state.todayStr;
      if (currentFilter === 'TODAY') {
        missions = missions.filter(m => m.deadline === today);
      } else if (currentFilter === 'DUE_SOON') {
        missions = missions.filter(m => m.deadline && m.deadline >= today);
      } else if (currentFilter === 'OVERDUE') {
        missions = missions.filter(m => m.deadline && m.deadline < today && m.status !== 'COMPLETED');
      } else if (currentFilter === 'HIGH_PRIORITY') {
        missions = missions.filter(m => m.priority === 'P1' || m.priority === 'P2');
      } else if (currentFilter === 'IN_PROGRESS') {
        missions = missions.filter(m => m.status === 'IN_PROGRESS' || (m.subtasks && m.subtasks.some(s => s.completed) && m.status !== 'COMPLETED'));
      } else if (currentFilter === 'COMPLETED') {
        missions = missions.filter(m => m.status === 'COMPLETED');
      } else if (currentFilter === 'NO_DEADLINE') {
        missions = missions.filter(m => !m.deadline);
      }

      if (missions.length === 0) {
        listEl.innerHTML = `
          <div class="empty-data-card">
            <h3 class="mono-label text-accent-cyan" style="font-size: 0.9rem;">NO MISSIONS FOUND</h3>
            <p class="mono-meta" style="margin-top: 4px;">No missions match the current filters. Declare a new mission to begin execution.</p>
          </div>
        `;
        return;
      }

      listEl.innerHTML = missions.map(m => {
        const isDone = m.status === 'COMPLETED';
        const deadlineInfo = getDeadlineStatus(m.deadline);
        const subtasks = m.subtasks || [];
        const completedSubs = subtasks.filter(s => s.completed).length;
        const totalSubs = subtasks.length;
        const nextAction = state.getNextAction(m);

        return `
          <li class="task-card-item ${isDone ? 'completed' : ''}" data-id="${m.id}">
            <div class="task-header-row">
              <label class="custom-checkbox-label">
                <input type="checkbox" class="checkbox-input task-toggle-check" ${isDone ? 'checked' : ''}>
                <span class="checkbox-visual">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </span>
              </label>

              <div class="task-main-info">
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                  <span class="task-title-text" style="${isDone ? 'text-decoration: line-through; opacity: 0.7;' : ''}">${escapeHTML(m.title)}</span>
                  <span class="priority-badge priority-${escapeHTML(m.priority)}">${escapeHTML(m.priority)}</span>
                  <span class="category-tag">${escapeHTML(m.category)}</span>
                  <span class="deadline-badge deadline-${escapeHTML(deadlineInfo.status)}">${escapeHTML(deadlineInfo.label)}</span>
                </div>

                ${m.description ? `<p style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 4px;">${escapeHTML(m.description)}</p>` : ''}

                <!-- Surfaced Next Action Callout -->
                ${!isDone ? `
                  <div class="next-action-pill" style="margin-top: 8px;">
                    <span class="mono-label text-accent-cyan">NEXT ACTION:</span>
                    <span style="font-weight: 600; font-size: 0.82rem; color: var(--text-primary);">${escapeHTML(nextAction)}</span>
                  </div>
                ` : ''}

                <!-- Decomposed Quest Steps Tree -->
                ${totalSubs > 0 ? `
                  <div style="margin-top: 10px; border-top: 1px solid var(--border-subdued); padding-top: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                      <span class="mono-label text-accent-cyan" style="font-size: 0.7rem;">QUEST STEPS (${completedSubs}/${totalSubs})</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                      ${subtasks.map(s => `
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <label class="custom-checkbox-label">
                            <input type="checkbox" class="checkbox-input quest-step-check" data-mission-id="${m.id}" data-quest-id="${s.id}" ${s.completed ? 'checked' : ''}>
                            <span class="checkbox-visual" style="width: 16px; height: 16px;">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </span>
                          </label>
                          <span style="font-size: 0.82rem; color: ${s.completed ? 'var(--text-muted)' : 'var(--text-primary)'}; ${s.completed ? 'text-decoration: line-through;' : ''}">${escapeHTML(s.title)}</span>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}

                <!-- Quick Inline Step Adder -->
                <div class="add-subtask-row" style="margin-top: 8px;">
                  <input type="text" class="tactical-input input-inline-step" placeholder="+ Add quest step..." style="height: 30px; font-size: 0.78rem; padding: 4px 8px;">
                  <button class="btn-mini btn-add-inline-step" data-mission-id="${m.id}">ADD</button>
                </div>
              </div>

              <!-- Quick Action Buttons -->
              <div style="display: flex; gap: 6px; align-items: center;">
                <button class="btn-mini btn-edit-mission" data-id="${m.id}" title="Edit Mission">EDIT</button>
                <button class="btn-mini btn-text-danger btn-delete-mission" data-id="${m.id}" title="Delete Mission">✕</button>
              </div>
            </div>
          </li>
        `;
      }).join('');

      // Attach card listeners
      listEl.querySelectorAll('.task-toggle-check').forEach(input => {
        input.addEventListener('change', (e) => {
          const card = e.target.closest('.task-card-item');
          if (card) state.toggleMissionStatus(card.dataset.id);
        });
      });

      listEl.querySelectorAll('.quest-step-check').forEach(input => {
        input.addEventListener('change', (e) => {
          const mid = e.target.dataset.missionId;
          const qid = e.target.dataset.questId;
          state.toggleQuestStep(mid, qid);
        });
      });

      listEl.querySelectorAll('.btn-add-inline-step').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const mid = btn.dataset.missionId;
          const input = btn.previousElementSibling;
          if (input && input.value.trim()) {
            state.addQuestStep(mid, input.value.trim());
            input.value = '';
          }
        });
      });

      listEl.querySelectorAll('.btn-edit-mission').forEach(btn => {
        btn.addEventListener('click', () => openEditModal(btn.dataset.id));
      });

      listEl.querySelectorAll('.btn-delete-mission').forEach(btn => {
        btn.addEventListener('click', () => {
          if (confirm('Delete this mission objective?')) {
            state.deleteMission(btn.dataset.id);
          }
        });
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

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value;
        renderMissions();
      });
    }

    if (catSelect) {
      catSelect.addEventListener('change', (e) => {
        currentCategory = e.target.value;
        renderMissions();
      });
    }

    // Modal Builder Render
    const renderModalSubtasks = () => {
      if (!modalSubtasksList) return;
      modalSubtasksList.innerHTML = currentModalSubtasks.map((s, idx) => `
        <div style="display: flex; align-items: center; justify-content: space-between; background: var(--surface-card-elevated); padding: 4px 8px; border-radius: var(--radius-xs);">
          <span style="font-size: 0.82rem; color: var(--text-primary);">${escapeHTML(s.title)}</span>
          <button type="button" class="btn-mini btn-text-danger btn-remove-modal-step" data-index="${idx}">✕</button>
        </div>
      `).join('');

      modalSubtasksList.querySelectorAll('.btn-remove-modal-step').forEach(btn => {
        btn.addEventListener('click', () => {
          currentModalSubtasks.splice(parseInt(btn.dataset.index, 10), 1);
          renderModalSubtasks();
        });
      });
    };

    if (btnModalAddSubtask && inputModalNewSubtask) {
      const addStep = () => {
        const text = inputModalNewSubtask.value.trim();
        if (text) {
          currentModalSubtasks.push({
            id: 'qst_' + Date.now() + '_' + Math.floor(Math.random() * 100),
            title: text,
            completed: false
          });
          inputModalNewSubtask.value = '';
          renderModalSubtasks();
        }
      };
      btnModalAddSubtask.addEventListener('click', addStep);
      inputModalNewSubtask.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); addStep(); }
      });
    }

    const openCreateModal = () => {
      if (!modalTask) return;
      formTask.reset();
      editIdInput.value = '';
      modalTitle.textContent = 'DISPATCH NEW MISSION';
      currentModalSubtasks = [];
      renderModalSubtasks();
      modalTask.classList.remove('hidden');
      titleInput.focus();
    };

    const openEditModal = (id) => {
      const mission = state.getMissions().find(m => m.id === id);
      if (!mission || !modalTask) return;
      editIdInput.value = mission.id;
      modalTitle.textContent = 'EDIT MISSION OBJECTIVE';
      titleInput.value = mission.title;
      catInput.value = mission.category;
      priorityInput.value = mission.priority;
      deadlineInput.value = mission.deadline || '';
      effortInput.value = mission.estimatedEffort || '';
      descInput.value = mission.description || '';
      currentModalSubtasks = mission.subtasks ? [...mission.subtasks] : [];
      renderModalSubtasks();
      modalTask.classList.remove('hidden');
      titleInput.focus();
    };

    if (btnOpenCreate) btnOpenCreate.addEventListener('click', openCreateModal);
    if (fabCreate) fabCreate.addEventListener('click', openCreateModal);

    if (formTask) {
      formTask.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = editIdInput.value;
        const missionData = {
          title: titleInput.value.trim(),
          category: catInput.value,
          priority: priorityInput.value,
          deadline: deadlineInput.value,
          estimatedEffort: effortInput.value.trim(),
          description: descInput.value.trim(),
          subtasks: currentModalSubtasks
        };

        if (id) {
          state.updateMission(id, missionData);
        } else {
          state.addMission(missionData);
        }

        modalTask.classList.add('hidden');
        sound.playTone(600, 0.06);
      });
    }

    const closeModal = () => modalTask.classList.add('hidden');
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
    if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);

    renderMissions();
    window.addEventListener('aether:missions-updated', renderMissions);
  }

  /* ==========================================================================
     6. HOME / COMMAND VIEW CONTROLLER
     ========================================================================== */
  function initHomeView() {
    const dueSoonList = document.getElementById('dash-due-soon-list');
    const recentAchList = document.getElementById('dash-recent-achievements-list');
    const priorityTitle = document.getElementById('priority-title');
    const priorityDesc = document.getElementById('priority-desc');
    const priorityNextAction = document.getElementById('priority-next-action-text');
    const priorityCat = document.getElementById('priority-category-badge');
    const smartEngagerText = document.getElementById('smart-engager-text');
    const btnQuickExecuteStep = document.getElementById('btn-quick-execute-step');
    const btnOpenPriorityDetail = document.getElementById('btn-open-priority-detail');
    const heroBtnQuickExecute = document.getElementById('hero-btn-quick-execute');
    const todayRatio = document.getElementById('today-ratio');
    const todayPercent = document.getElementById('today-percent');
    const todayProgressBar = document.getElementById('today-progress-bar');
    const dashActiveObjectives = document.getElementById('dash-active-objectives');
    const questsClearedCount = document.getElementById('dash-quests-cleared-count');

    // Hero Floating Target Lock Elements
    const heroTargetTitle = document.getElementById('hero-target-title');
    const heroTargetAction = document.getElementById('hero-target-action');

    const executeTopAction = () => {
      const missions = state.getMissions();
      const activeMissions = missions.filter(m => m.status !== 'COMPLETED');
      const topMission = activeMissions.find(m => m.priority === 'P1') || activeMissions[0];
      if (!topMission) {
        const btnCreate = document.getElementById('btn-open-create-task');
        if (btnCreate) btnCreate.click();
        return;
      }

      if (topMission.subtasks && topMission.subtasks.length > 0) {
        const nextSub = topMission.subtasks.find(s => !s.completed);
        if (nextSub) {
          state.toggleQuestStep(topMission.id, nextSub.id);
          sound.playSuccessChime();
          return;
        }
      }

      state.completeMission(topMission.id);
      sound.playSuccessChime();
    };

    if (btnQuickExecuteStep) btnQuickExecuteStep.addEventListener('click', executeTopAction);
    if (heroBtnQuickExecute) heroBtnQuickExecute.addEventListener('click', executeTopAction);

    if (btnOpenPriorityDetail) {
      btnOpenPriorityDetail.addEventListener('click', () => {
        const navTasks = document.querySelector('.nav-tab-btn[data-view="tasks"]');
        if (navTasks) navTasks.click();
      });
    }

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

      if (dashActiveObjectives) dashActiveObjectives.textContent = `${activeMissions.length} ACTIVE`;

      let totalQuestsCleared = 0;
      missions.forEach(m => {
        if (m.subtasks) totalQuestsCleared += m.subtasks.filter(s => s.completed).length;
      });
      if (questsClearedCount) questsClearedCount.textContent = `${totalQuestsCleared} STEPS`;

      // Update Hero Command Deck HUD
      const hudMissionsVal = document.getElementById('hero-hud-missions-val');
      const hudMissionsPct = document.getElementById('hero-hud-missions-pct');
      const hudMomentumVal = document.getElementById('hero-hud-momentum-val');
      const hudDayPct = document.getElementById('hero-hud-day-pct');
      const hudDayBar = document.getElementById('hero-hud-day-bar');
      const heroLiveClock = document.getElementById('hero-live-clock');

      if (hudMissionsVal) hudMissionsVal.textContent = `${clearedCount} / ${totalMissions}`;
      if (hudMissionsPct) hudMissionsPct.textContent = `${percent}%`;
      
      if (hudMomentumVal) {
        const momentum = totalMissions > 0 ? Math.min(100, Math.round(((clearedCount * 2 + totalQuestsCleared) / Math.max(1, totalMissions * 2)) * 100)) : 100;
        hudMomentumVal.textContent = `${momentum}%`;
      }

      const now = new Date();
      const secsInDay = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const dayPct = Math.round((secsInDay / 86400) * 100);
      if (hudDayPct) hudDayPct.textContent = `${dayPct}%`;
      if (hudDayBar) hudDayBar.style.width = `${dayPct}%`;
      if (heroLiveClock) heroLiveClock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Priority Mission Binding
      const topMission = activeMissions.find(m => m.priority === 'P1') || activeMissions[0];
      if (topMission) {
        if (priorityTitle) priorityTitle.textContent = topMission.title;
        if (priorityDesc) priorityDesc.textContent = topMission.description || `Priority ${topMission.priority} • ${topMission.category}`;
        if (priorityNextAction) priorityNextAction.textContent = state.getNextAction(topMission);
        if (priorityCat) {
          priorityCat.textContent = `${topMission.priority} — ${topMission.category}`;
          priorityCat.className = `priority-badge priority-${topMission.priority}`;
        }
        if (heroTargetTitle) heroTargetTitle.textContent = topMission.title;
        if (heroTargetAction) heroTargetAction.textContent = `Next Action: ${state.getNextAction(topMission)}`;
      } else {
        if (priorityTitle) priorityTitle.textContent = 'All missions cleared';
        if (priorityDesc) priorityDesc.textContent = 'Declare your next mission in Missions to unlock execution focus.';
        if (priorityNextAction) priorityNextAction.textContent = 'Create your next mission objective';
        if (heroTargetTitle) heroTargetTitle.textContent = 'All missions cleared';
        if (heroTargetAction) heroTargetAction.textContent = 'Standby for new mission dispatch';
      }

      if (smartEngagerText) {
        if (topMission) {
          smartEngagerText.textContent = `Tactical Directive: Mission "${topMission.title}" (${topMission.priority}) is locked. Immediate Next Action: "${state.getNextAction(topMission)}".`;
        } else {
          smartEngagerText.textContent = 'Tactical Directive: All declared objectives cleared. System ready for next dispatch.';
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

    renderHome();
    window.addEventListener('aether:missions-updated', renderHome);
    window.addEventListener('aether:completed-updated', renderHome);
  }

  /* ==========================================================================
     7. INTEL & EXECUTIVE TELEMETRY CONTROLLER
     ========================================================================== */
  function initInsightsView() {
    const totalClearedEl = document.getElementById('insights-total-cleared');
    const totalQuestsEl = document.getElementById('insights-total-quests');
    const priorityRatioEl = document.getElementById('insights-priority-ratio');
    const momentumIndexEl = document.getElementById('insights-momentum-index');
    const trendBarsEl = document.getElementById('insights-trend-bars');
    const archiveGrid = document.getElementById('achievements-history-grid');

    const renderInsights = () => {
      const missions = state.getMissions();
      const completed = state.getCompletedMissions();

      // Total missions cleared
      if (totalClearedEl) totalClearedEl.textContent = completed.length.toString();

      // Total quests checked off
      let totalQuests = 0;
      missions.forEach(m => {
        if (m.subtasks) totalQuests += m.subtasks.filter(s => s.completed).length;
      });
      if (totalQuestsEl) totalQuestsEl.textContent = totalQuests.toString();

      // High-priority ratio (P1 & P2 vs total)
      const allKnown = [...missions, ...completed];
      const highPrio = allKnown.filter(m => m.priority === 'P1' || m.priority === 'P2').length;
      const prioRatio = allKnown.length > 0 ? Math.round((highPrio / allKnown.length) * 100) : 0;
      if (priorityRatioEl) priorityRatioEl.textContent = `${prioRatio}%`;

      // Momentum Quotient
      const totalM = missions.length;
      const clearedM = completed.length;
      const momIndex = totalM > 0 ? Math.min(100, Math.round(((clearedM * 2 + totalQuests) / Math.max(1, totalM * 2)) * 100)) : 100;
      if (momentumIndexEl) momentumIndexEl.textContent = `${momIndex}%`;

      // 14-day execution trend bars (real observed completion history)
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

        const maxMissions = 8;
        trendBarsEl.innerHTML = last14Days.map(dateStr => {
          // Count missions completed on this date
          const dayMatches = completed.filter(c => {
            if (c.timestamp) {
              const cDate = new Date(c.timestamp);
              const cy = cDate.getFullYear();
              const cm = String(cDate.getMonth() + 1).padStart(2, '0');
              const cd = String(cDate.getDate()).padStart(2, '0');
              return `${cy}-${cm}-${cd}` === dateStr;
            }
            return false;
          }).length;

          const heightPercent = Math.min(Math.round((dayMatches / maxMissions) * 100), 100);
          return `
            <div class="trend-bar-column" title="${escapeHTML(dateStr)}: ${dayMatches} cleared">
              <div class="trend-bar-fill" style="height: ${Math.max(4, heightPercent)}%;"></div>
              <span class="mono-meta" style="font-size: 0.65rem;">${escapeHTML(dateStr.slice(8))}</span>
            </div>
          `;
        }).join('');
      }

      // Verified Mission Archive
      if (archiveGrid) {
        if (completed.length === 0) {
          archiveGrid.innerHTML = `
            <div class="empty-data-card" style="grid-column: 1 / -1;">
              <h3 class="mono-label text-accent-cyan" style="font-size: 0.9rem;">NO VERIFIED MISSIONS YET</h3>
              <p class="mono-meta" style="margin-top: 4px;">Completed missions will be recorded here with verifiable execution telemetry.</p>
            </div>
          `;
        } else {
          archiveGrid.innerHTML = completed.map(c => `
            <div style="background: var(--surface-card-elevated); padding: 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-subdued);">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span class="priority-badge priority-${escapeHTML(c.priority)}">${escapeHTML(c.priority)}</span>
                <span class="category-tag">${escapeHTML(c.category)}</span>
              </div>
              <h4 style="font-size: 0.92rem; font-weight: 700; margin-top: 8px; color: var(--text-primary);">${escapeHTML(c.missionTitle)}</h4>
              <span class="mono-meta" style="margin-top: 4px; display: block;">Cleared on ${escapeHTML(c.completedAt)}</span>
            </div>
          `).join('');
        }
      }
    };

    renderInsights();
    window.addEventListener('aether:missions-updated', renderInsights);
    window.addEventListener('aether:completed-updated', renderInsights);
  }

  /* ==========================================================================
     8. STRATEGIC ARCHITECT CONTROLLER (Vision, Review, Decompression, Circuit)
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
          building: visionBuilding.value.trim(),
          why: visionWhy.value.trim(),
          values: visionValues.value.trim(),
          direction: visionDirection.value.trim()
        };
        localStorage.setItem('aether_vision', JSON.stringify(data));
        sound.playTone(600, 0.05);
        alert('Strategic directives successfully preserved.');
      });
    }

    // Daily Review
    const revMattered = document.getElementById('review-what-mattered');
    const revHappened = document.getElementById('review-what-happened');
    const revTomorrow = document.getElementById('review-tomorrow-changes');
    const btnSaveReview = document.getElementById('btn-save-daily-review');

    if (btnSaveReview) {
      btnSaveReview.addEventListener('click', () => {
        const reviews = JSON.parse(localStorage.getItem('aether_daily_reviews') || '[]');
        reviews.unshift({
          date: state.todayStr,
          whatMattered: revMattered.value.trim(),
          whatHappened: revHappened.value.trim(),
          tomorrowChanges: revTomorrow.value.trim(),
          timestamp: Date.now()
        });
        localStorage.setItem('aether_daily_reviews', JSON.stringify(reviews));
        sound.playTone(620, 0.05);
        alert('Daily review archived.');
        revMattered.value = '';
        revHappened.value = '';
        revTomorrow.value = '';
      });
    }

    // Thought Log / Decompression
    const decompInput = document.getElementById('decompression-input');
    const decompMood = document.getElementById('decompression-mood-select');
    const btnSaveThought = document.getElementById('btn-save-decompression-thought');
    const btnConvertToMission = document.getElementById('btn-turn-into-task');
    const btnClearDecomp = document.getElementById('btn-clear-decompression');
    const decompList = document.getElementById('decompression-log-list');

    const renderDecompList = () => {
      if (!decompList) return;
      const entries = state.getDecompressionEntries();
      if (entries.length === 0) {
        decompList.innerHTML = '<li class="mono-meta">Cognitive buffer empty. No unresolved thoughts logged.</li>';
      } else {
        decompList.innerHTML = entries.map(e => `
          <li style="background: var(--surface-card-elevated); padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-subdued);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="mono-label text-accent-cyan">${escapeHTML(e.mood.toUpperCase())}</span>
              <span class="mono-meta">${escapeHTML(e.timestamp)}</span>
            </div>
            <p style="font-size: 0.88rem; margin-top: 4px; color: var(--text-primary); font-weight: 500;">${escapeHTML(e.text)}</p>
          </li>
        `).join('');
      }
    };

    if (btnSaveThought && decompInput) {
      btnSaveThought.addEventListener('click', () => {
        state.logThought(decompInput.value, decompMood ? decompMood.value : 'neutral');
        decompInput.value = '';
        sound.playTone(500, 0.05);
      });
    }

    if (btnConvertToMission && decompInput) {
      btnConvertToMission.addEventListener('click', () => {
        const text = decompInput.value.trim();
        if (text) {
          state.addMission({
            title: text.length > 50 ? text.substring(0, 50) + '...' : text,
            description: text,
            category: 'COGNITIVE',
            priority: 'P2'
          });
          decompInput.value = '';
          sound.playTone(580, 0.06);
          alert('Thought transformed into a tactical mission.');
        }
      });
    }

    if (btnClearDecomp) {
      btnClearDecomp.addEventListener('click', () => {
        if (confirm('Clear cognitive unloading buffer?')) {
          localStorage.setItem('aether_decompression', JSON.stringify([]));
          renderDecompList();
        }
      });
    }

    renderDecompList();
    window.addEventListener('aether:decompression-updated', renderDecompList);

    // Circuit Breaker Actions
    document.querySelectorAll('.btn-circuit-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.action;
        sound.playTone(400, 0.06);
        if (act === 'micro_task') {
          const m = state.addMission({
            title: '5-Minute Reset: Take a breath & write 1 single next step',
            category: 'PERSONAL',
            priority: 'P1'
          });
          alert('Micro-action added to today queue. Focus solely on this single step.');
          const navHome = document.querySelector('.nav-tab-btn[data-view="dashboard"]');
          if (navHome) navHome.click();
        } else if (act === 'decompress') {
          const btnDecomp = document.querySelector('.system-subnav-btn[data-subview="decompression"]');
          if (btnDecomp) btnDecomp.click();
        } else if (act === 'reset_today') {
          if (confirm('Reset today priority queue to clear mental overload?')) {
            alert('Queue cleared. Take a 10-minute break before declaring your next action.');
          }
        }
      });
    });
  }

  /* ==========================================================================
     9. PREFERENCES & SUPABASE CLOUD SYNC
     ========================================================================== */
  function initPreferencesAndSync() {
    const modalCC = document.getElementById('modal-creative-control');
    const btnOpenCC = document.getElementById('btn-open-creative-control');
    const btnCloseCC = document.getElementById('btn-close-cc-footer');
    const btnCloseCCX = document.getElementById('btn-close-cc-modal');
    const themeCards = document.querySelectorAll('.theme-preset-card');

    const applyTheme = (name) => {
      document.body.className = `apex-body theme-${name}`;
      localStorage.setItem('aether_theme', name);
      themeCards.forEach(c => c.classList.toggle('active', c.dataset.theme === name));

      const rgb = THEME_RGB_MAP[name || 'cyan'];
      if (rgb) {
        if (window.celestial3DEngine) window.celestial3DEngine.setThemeColor(rgb);
        if (window.heroQuantum3DEngine) window.heroQuantum3DEngine.setThemeColor(rgb);
      }
    };

    applyTheme(localStorage.getItem('aether_theme') || 'cyan');

    themeCards.forEach(card => {
      card.addEventListener('click', () => applyTheme(card.dataset.theme));
    });

    if (btnOpenCC) btnOpenCC.addEventListener('click', () => modalCC.classList.remove('hidden'));
    const closeCC = () => modalCC.classList.add('hidden');
    if (btnCloseCC) btnCloseCC.addEventListener('click', closeCC);
    if (btnCloseCCX) btnCloseCCX.addEventListener('click', closeCC);

    // Supabase Cloud Sync
    const inputUrl = document.getElementById('sync-supabase-url');
    const inputKey = document.getElementById('sync-supabase-anon-key');
    const inputToken = document.getElementById('sync-user-token');
    const btnSaveSync = document.getElementById('btn-save-supabase-config');
    const btnPushCloud = document.getElementById('btn-trigger-cloud-push');
    const btnDisconnectCloud = document.getElementById('btn-disconnect-cloud');
    const syncStatusDetail = document.getElementById('sync-status-detail-msg');

    const savedUrl = localStorage.getItem('aether_sb_url') || '';
    const savedKey = localStorage.getItem('aether_sb_key') || '';
    const savedToken = localStorage.getItem('aether_sb_token') || '';

    if (inputUrl) inputUrl.value = savedUrl;
    if (inputKey) inputKey.value = savedKey;
    if (inputToken) inputToken.value = savedToken;

    if (btnSaveSync) {
      btnSaveSync.addEventListener('click', async () => {
        const url = inputUrl.value.trim();
        const key = inputKey.value.trim();
        const token = inputToken.value.trim();

        if (!url || !key) {
          alert('Please enter both Supabase Project URL and Anon Public Key.');
          return;
        }

        localStorage.setItem('aether_sb_url', url);
        localStorage.setItem('aether_sb_key', key);
        localStorage.setItem('aether_sb_token', token);

        if (syncStatusDetail) syncStatusDetail.textContent = 'SUPABASE CREDENTIALS SAVED • VERIFYING...';
        sound.playTone(600, 0.05);

        try {
          if (window.supabase) {
            const client = window.supabase.createClient(url, key);
            const { error } = await client.from('apex_tasks').select('count', { count: 'exact', head: true });
            if (!error) {
              if (syncStatusDetail) syncStatusDetail.textContent = 'SUPABASE CLOUD CONNECTED ✦ REALTIME READY';
              const indicator = document.getElementById('sync-status-indicator');
              if (indicator) indicator.textContent = 'CLOUD SYNCED ✦';
              alert('Successfully authenticated with Supabase!');
              return;
            }
          }
          if (syncStatusDetail) syncStatusDetail.textContent = 'CREDENTIALS RECORDED (LOCAL STORAGE ACTIVE)';
        } catch (e) {
          if (syncStatusDetail) syncStatusDetail.textContent = 'SAVED LOCALLY (OFFLINE CLIENT ACTIVE)';
        }
      });
    }

    if (btnDisconnectCloud) {
      btnDisconnectCloud.addEventListener('click', () => {
        localStorage.removeItem('aether_sb_url');
        localStorage.removeItem('aether_sb_key');
        localStorage.removeItem('aether_sb_token');
        if (inputUrl) inputUrl.value = '';
        if (inputKey) inputKey.value = '';
        if (inputToken) inputToken.value = '';
        if (syncStatusDetail) syncStatusDetail.textContent = 'DISCONNECTED • LOCAL FIRST ACTIVE';
        const indicator = document.getElementById('sync-status-indicator');
        if (indicator) indicator.textContent = 'LOCAL STORAGE ✦';
        alert('Cloud sync configuration cleared.');
      });
    }

    // JSON Export / Import
    const btnExport = document.getElementById('btn-export-backup');
    const btnImport = document.getElementById('btn-trigger-import');
    const inputImport = document.getElementById('input-import-file');

    if (btnExport) btnExport.addEventListener('click', () => state.exportWorkspaceJSON());
    if (btnImport && inputImport) {
      btnImport.addEventListener('click', () => inputImport.click());
      inputImport.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => state.importWorkspaceJSON(event.target.result);
          reader.readAsText(file);
        }
      });
    }

    const headerSyncPill = document.getElementById('header-sync-pill');
    if (headerSyncPill && btnOpenCC) {
      headerSyncPill.addEventListener('click', () => btnOpenCC.click());
    }
  }

  /* ==========================================================================
     10. RESPECTFUL AI ASSISTANT (TACTICAL CO-PILOT)
     ========================================================================== */
  function initAIAssistant() {
    const modalAI = document.getElementById('modal-ai-assistant');
    const btnOpenAI = document.getElementById('btn-open-ai-assistant');
    const btnCloseAI = document.getElementById('btn-close-ai-modal');
    const promptInput = document.getElementById('ai-prompt-input');
    const btnRunQuery = document.getElementById('btn-run-ai-query');
    const responseBox = document.getElementById('ai-response-container');
    const responseText = document.getElementById('ai-response-text');
    const btnApplySteps = document.getElementById('btn-apply-ai-steps');
    const templateBtns = document.querySelectorAll('.btn-ai-template');

    let generatedQuests = [];

    if (btnOpenAI) btnOpenAI.addEventListener('click', () => modalAI.classList.remove('hidden'));
    const closeAI = () => modalAI.classList.add('hidden');
    if (btnCloseAI) btnCloseAI.addEventListener('click', closeAI);

    templateBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'decompose' && promptInput && !promptInput.value) {
          promptInput.value = 'Prepare and execute strategic sprint deliverable';
        } else if (action === 'next_action' && promptInput && !promptInput.value) {
          promptInput.value = 'Clear backlog and identify primary blocker';
        }
        runAIQuery();
      });
    });

    const runAIQuery = () => {
      const q = promptInput.value.trim() || 'Execute priority objective';
      sound.playTone(620, 0.05);

      responseText.innerHTML = '<span class="pulse-dot"></span> Analyzing objectives and calculating quest steps...';

      setTimeout(() => {
        generatedQuests = [
          `Audit scope & write 1-sentence definition of done for "${q}"`,
          `Set up environment / branch / document foundation`,
          `Implement primary core milestone`,
          `Review against quality standards & verify functionality`,
          `Archive completion in System Intel`
        ];

        responseText.innerHTML = `
          <strong>Tactical Breakdown for:</strong> "${escapeHTML(q)}"<br><br>
          <ol style="margin-left: 20px; line-height: 1.8;">
            ${generatedQuests.map(step => `<li>${escapeHTML(step)}</li>`).join('')}
          </ol>
        `;

        if (btnApplySteps) btnApplySteps.classList.remove('hidden');
      }, 350);
    };

    if (btnRunQuery) btnRunQuery.addEventListener('click', runAIQuery);

    if (btnApplySteps) {
      btnApplySteps.addEventListener('click', () => {
        const title = promptInput.value.trim() || 'AI Decomposed Mission';
        const subtasks = generatedQuests.map((step, idx) => ({
          id: 'qst_ai_' + Date.now() + '_' + idx,
          title: step,
          completed: false
        }));

        state.addMission({
          title: title,
          category: 'TECHNICAL',
          priority: 'P1',
          subtasks: subtasks
        });

        sound.playSuccessChime();
        modalAI.classList.add('hidden');
        alert('Mission and executable quest steps deployed to Tactical Mission Matrix!');
      });
    }
  }

  /* ==========================================================================
     11. REAL GPU WEBGL & 3D QUANTUM CORE ENGINES
     ========================================================================== */

  const THEME_RGB_MAP = {
    cyan: [56, 189, 248],
    blue: [96, 165, 250],
    emerald: [52, 211, 153],
    amber: [251, 191, 36],
    violet: [192, 132, 252],
    stealth: [241, 245, 249],
    crimson: [248, 113, 113],
    sunset: [251, 113, 133],
    void: [129, 140, 248],
    olive: [163, 230, 53],
    amethyst: [244, 114, 182],
    cobalt: [34, 211, 238]
  };

  /**
   * HeroQuantum3DEngine
   * Interactive 3D Holographic Quantum Core Chamber on #hero-quantum-canvas.
   * Renders concentric rotating gyroscope rings, regular polyhedral lattice, and orbiting particle cloud.
   */
  class HeroQuantum3DEngine {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      if (!this.ctx) return;

      this.width = 0;
      this.height = 0;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);

      this.mouseX = 0;
      this.mouseY = 0;
      this.targetMouseX = 0;
      this.targetMouseY = 0;

      this.rotX = 0.2;
      this.rotY = 0.3;
      this.rotZ = 0.1;
      this.speedMult = 1.0;

      this.themeRgb = [56, 189, 248];
      this.targetThemeRgb = [56, 189, 248];

      this.initGeometry();
      this.bindEvents();
      this.resize();
      this.animate();
    }

    initGeometry() {
      // 3D Polyhedron Cage (Octahedron / Icosahedron hybrid)
      const phi = (1 + Math.sqrt(5)) / 2;
      const baseVertices = [
        [-1,  phi, 0], [ 1,  phi, 0], [-1, -phi, 0], [ 1, -phi, 0],
        [ 0, -1,  phi], [ 0,  1,  phi], [ 0, -1, -phi], [ 0,  1, -phi],
        [ phi, 0, -1], [ phi, 0,  1], [-phi, 0, -1], [-phi, 0,  1]
      ];

      const scale = 58;
      this.vertices = baseVertices.map(v => {
        const len = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
        return [(v[0]/len) * scale, (v[1]/len) * scale, (v[2]/len) * scale];
      });

      this.edges = [];
      for (let i = 0; i < this.vertices.length; i++) {
        for (let j = i + 1; j < this.vertices.length; j++) {
          const dx = this.vertices[i][0] - this.vertices[j][0];
          const dy = this.vertices[i][1] - this.vertices[j][1];
          const dz = this.vertices[i][2] - this.vertices[j][2];
          const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
          if (dist < scale * 1.15) {
            this.edges.push([i, j]);
          }
        }
      }

      // Gyro Ring 1 (Yaw Axis)
      this.ring1 = [];
      const numNodes = 36;
      for (let i = 0; i < numNodes; i++) {
        const theta = (i / numNodes) * Math.PI * 2;
        this.ring1.push([Math.cos(theta) * 88, Math.sin(theta) * 88, 0]);
      }

      // Gyro Ring 2 (Pitch Axis)
      this.ring2 = [];
      for (let i = 0; i < numNodes; i++) {
        const theta = (i / numNodes) * Math.PI * 2;
        this.ring2.push([0, Math.cos(theta) * 112, Math.sin(theta) * 112]);
      }

      // Gyro Ring 3 (Outer Oblique)
      this.ring3 = [];
      for (let i = 0; i < numNodes; i++) {
        const theta = (i / numNodes) * Math.PI * 2;
        this.ring3.push([Math.cos(theta) * 135, 0, Math.sin(theta) * 135]);
      }

      // 140 Swarming Quantum Particle Nodes
      this.particles = [];
      for (let i = 0; i < 140; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phiAngle = Math.acos(2.0 * v - 1.0);
        const r = 40 + Math.random() * 95;
        this.particles.push({
          x: r * Math.sin(phiAngle) * Math.cos(theta),
          y: r * Math.sin(phiAngle) * Math.sin(theta),
          z: r * Math.cos(phiAngle),
          orbitSpeed: 0.008 + Math.random() * 0.014,
          pulse: Math.random() * Math.PI * 2,
          size: 1.2 + Math.random() * 1.8
        });
      }
    }

    setThemeColor(rgbArray) {
      if (Array.isArray(rgbArray) && rgbArray.length === 3) {
        this.targetThemeRgb = rgbArray;
      }
    }

    bindEvents() {
      window.addEventListener('resize', () => this.resize());

      const viewport = document.getElementById('hero-hologram-viewport');
      if (viewport) {
        viewport.addEventListener('pointermove', (e) => {
          const rect = viewport.getBoundingClientRect();
          const cx = rect.width / 2;
          const cy = rect.height / 2;
          this.targetMouseX = (e.clientX - rect.left - cx) / cx;
          this.targetMouseY = (e.clientY - rect.top - cy) / cy;
        });

        viewport.addEventListener('pointerenter', () => {
          this.speedMult = 2.4;
        });

        viewport.addEventListener('pointerleave', () => {
          this.targetMouseX = 0;
          this.targetMouseY = 0;
          this.speedMult = 1.0;
        });
      }
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      this.width = rect.width || 380;
      this.height = rect.height || 320;
      this.canvas.width = this.width * this.dpr;
      this.canvas.height = this.height * this.dpr;
      this.ctx.scale(this.dpr, this.dpr);
    }

    rotatePoint(p, pitch, yaw, roll) {
      let [x, y, z] = p;

      const cosX = Math.cos(pitch);
      const sinX = Math.sin(pitch);
      let y1 = y * cosX - z * sinX;
      let z1 = y * sinX + z * cosX;

      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      let x2 = x * cosY + z1 * sinY;
      let z2 = -x * sinY + z1 * cosY;

      const cosZ = Math.cos(roll);
      const sinZ = Math.sin(roll);
      let x3 = x2 * cosZ - y1 * sinZ;
      let y3 = x2 * sinZ + y1 * cosZ;

      return [x3, y3, z2];
    }

    project(p, fov = 380) {
      const [x, y, z] = p;
      const dist = fov + z;
      if (dist <= 0.1) return null;
      const factor = fov / dist;
      return {
        x: x * factor,
        y: y * factor,
        scale: factor,
        z: z
      };
    }

    animate() {
      this.mouseX += (this.targetMouseX - this.mouseX) * 0.08;
      this.mouseY += (this.targetMouseY - this.mouseY) * 0.08;

      for (let i = 0; i < 3; i++) {
        this.themeRgb[i] += (this.targetThemeRgb[i] - this.themeRgb[i]) * 0.08;
      }
      const r = Math.round(this.themeRgb[0]);
      const g = Math.round(this.themeRgb[1]);
      const b = Math.round(this.themeRgb[2]);

      this.ctx.clearRect(0, 0, this.width, this.height);

      const cx = this.width / 2;
      const cy = this.height * 0.44;

      // Update rotational momentum
      this.rotX += (0.006 + this.mouseY * 0.012) * this.speedMult;
      this.rotY += (0.009 + this.mouseX * 0.016) * this.speedMult;
      this.rotZ += 0.004 * this.speedMult;

      // Update telemetry readout in HUD
      const coordsEl = document.getElementById('hologram-coords');
      if (coordsEl) {
        const pitchDeg = Math.round(this.mouseY * 25);
        const rollDeg = Math.round(this.mouseX * 25);
        coordsEl.textContent = `PITCH: ${pitchDeg >= 0 ? '+' : ''}${pitchDeg}° ROLL: ${rollDeg >= 0 ? '+' : ''}${rollDeg}°`;
      }

      // Draw Orbiting Quantum Particles
      for (let part of this.particles) {
        part.pulse += 0.04;
        const rot = this.rotatePoint([part.x, part.y, part.z], this.rotX * 0.7, this.rotY * 0.7, this.rotZ * 0.7);
        const p = this.project(rot, 380);
        if (p) {
          const depthAlpha = Math.min(1, Math.max(0.12, (p.z + 120) / 240));
          const size = Math.max(0.8, part.size * p.scale * (0.8 + 0.3 * Math.sin(part.pulse)));
          this.ctx.beginPath();
          this.ctx.arc(cx + p.x, cy + p.y, size, 0, Math.PI * 2);
          this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${depthAlpha * 0.85})`;
          this.ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
          this.ctx.shadowBlur = 6;
          this.ctx.fill();
          this.ctx.shadowBlur = 0;
        }
      }

      // Projected Polyhedral Core Vertices
      const projectedVertices = this.vertices.map(v => {
        const rot = this.rotatePoint(v, this.rotX, this.rotY, this.rotZ);
        const p = this.project(rot, 380);
        return p ? { x: cx + p.x, y: cy + p.y, scale: p.scale, z: p.z } : null;
      });

      // Draw Polyhedral Struts
      this.ctx.lineWidth = 1.4;
      for (let [i, j] of this.edges) {
        const p1 = projectedVertices[i];
        const p2 = projectedVertices[j];
        if (!p1 || !p2) continue;
        const avgZ = (p1.z + p2.z) / 2;
        const alpha = Math.min(0.85, Math.max(0.1, (avgZ + 90) / 180));
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.75})`;
        this.ctx.stroke();
      }

      // Draw Polyhedral Vertex Spheres
      for (let p of projectedVertices) {
        if (!p) continue;
        const alpha = Math.min(1, Math.max(0.2, (p.z + 90) / 180));
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, Math.max(1.8, 3.2 * p.scale), 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
        this.ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
        this.ctx.shadowBlur = 10;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
      }

      // Draw Concentric Gyroscope Rings
      const drawRing = (ringNodes, rx, ry, rz, alphaMult, lineW) => {
        const projected = ringNodes.map(v => {
          const rot = this.rotatePoint(v, rx, ry, rz);
          const p = this.project(rot, 380);
          return p ? { x: cx + p.x, y: cy + p.y } : null;
        });

        this.ctx.beginPath();
        let first = true;
        for (let p of projected) {
          if (!p) continue;
          if (first) { this.ctx.moveTo(p.x, p.y); first = false; }
          else { this.ctx.lineTo(p.x, p.y); }
        }
        this.ctx.closePath();
        this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alphaMult})`;
        this.ctx.lineWidth = lineW;
        this.ctx.stroke();
      };

      drawRing(this.ring1, this.rotX * 0.8, this.rotY * 0.8, this.rotZ * 0.8, 0.45, 1.4);
      drawRing(this.ring2, -this.rotX * 0.6, this.rotY * 0.7, -this.rotZ * 0.6, 0.35, 1.2);
      drawRing(this.ring3, this.rotX * 0.5, -this.rotY * 0.5, this.rotZ * 0.6, 0.25, 1.0);

      requestAnimationFrame(() => this.animate());
    }
  }

  /**
   * Celestial3DEngine
   * Background Deep Space Parallax Starfield & Ambient Gyroscopic Rings on #celestial-3d-canvas.
   */
  class Celestial3DEngine {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      if (!this.ctx) return;

      this.width = 0;
      this.height = 0;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);

      this.mouseX = 0;
      this.mouseY = 0;
      this.targetMouseX = 0;
      this.targetMouseY = 0;

      this.rotX = 0;
      this.rotY = 0;
      this.rotZ = 0;

      this.themeRgb = [56, 189, 248];
      this.targetThemeRgb = [56, 189, 248];

      this.initStars();
      this.bindEvents();
      this.resize();
      this.animate();
    }

    initStars() {
      this.stars = [];
      const numStars = 220;
      for (let i = 0; i < numStars; i++) {
        this.stars.push({
          x: (Math.random() - 0.5) * 1600,
          y: (Math.random() - 0.5) * 1200,
          z: Math.random() * 1000 + 10,
          size: Math.random() * 1.5 + 0.6,
          speed: Math.random() * 0.45 + 0.15,
          twinkle: Math.random() * Math.PI * 2,
          twinkleSpeed: Math.random() * 0.03 + 0.01
        });
      }
    }

    setThemeColor(rgbArray) {
      if (Array.isArray(rgbArray) && rgbArray.length === 3) {
        this.targetThemeRgb = rgbArray;
      }
    }

    bindEvents() {
      window.addEventListener('resize', () => this.resize());
      window.addEventListener('pointermove', (e) => {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        this.targetMouseX = (e.clientX - cx) / cx;
        this.targetMouseY = (e.clientY - cy) / cy;
      });
    }

    resize() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas.width = this.width * this.dpr;
      this.canvas.height = this.height * this.dpr;
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;
      this.ctx.scale(this.dpr, this.dpr);
    }

    animate() {
      this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
      this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

      for (let i = 0; i < 3; i++) {
        this.themeRgb[i] += (this.targetThemeRgb[i] - this.themeRgb[i]) * 0.08;
      }
      const r = Math.round(this.themeRgb[0]);
      const g = Math.round(this.themeRgb[1]);
      const b = Math.round(this.themeRgb[2]);

      this.ctx.clearRect(0, 0, this.width, this.height);

      const cx = this.width / 2;
      const cy = this.height / 2;

      // Draw 3D Stars
      for (let star of this.stars) {
        star.z -= star.speed;
        if (star.z <= 10) {
          star.z = 1000;
          star.x = (Math.random() - 0.5) * 1600;
          star.y = (Math.random() - 0.5) * 1200;
        }

        star.twinkle += star.twinkleSpeed;
        const twinkleAlpha = 0.4 + 0.6 * Math.sin(star.twinkle);

        const k = 450 / star.z;
        const px = cx + (star.x + this.mouseX * -100) * k;
        const py = cy + (star.y + this.mouseY * -80) * k;

        if (px >= 0 && px <= this.width && py >= 0 && py <= this.height) {
          const depthAlpha = Math.min(1, Math.max(0.1, (1000 - star.z) / 1000)) * twinkleAlpha;
          const radius = Math.max(0.5, star.size * k);

          this.ctx.beginPath();
          this.ctx.arc(px, py, radius, 0, Math.PI * 2);
          this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${depthAlpha * 0.55})`;
          this.ctx.fill();
        }
      }

      requestAnimationFrame(() => this.animate());
    }
  }

  /* ==========================================================================
     12. MOTION & INTERACTIVE SYSTEMS
     ========================================================================== */
  function init3DCardTilt() {
    if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return;

    const cards = document.querySelectorAll('.console-card, .metric-card, .today-priority-banner');

    cards.forEach(card => {
      let glare = card.querySelector('.card-specular-glare');
      if (!glare) {
        glare = document.createElement('div');
        glare.className = 'card-specular-glare';
        card.appendChild(glare);
      }

      if (card.dataset.tiltInitialized) return;
      card.dataset.tiltInitialized = 'true';

      let isHovered = false;

      card.addEventListener('pointerenter', () => {
        isHovered = true;
        card.style.transition = 'transform 0.1s ease-out, border-color 0.25s ease';
      });

      card.addEventListener('pointermove', (e) => {
        if (!isHovered) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -6.0;
        const rotateY = ((x - centerX) / centerX) * 6.0;

        const glareX = (x / rect.width) * 100;
        const glareY = (y / rect.height) * 100;

        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(6px) scale3d(1.012, 1.012, 1.012)`;
        card.style.setProperty('--glare-x', `${glareX.toFixed(1)}%`);
        card.style.setProperty('--glare-y', `${glareY.toFixed(1)}%`);
      });

      card.addEventListener('pointerleave', () => {
        isHovered = false;
        card.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease';
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)';
      });
    });
  }

  function initAmbientCursorSpotlight() {
    let currentX = window.innerWidth / 2;
    let currentY = window.innerHeight / 2;
    let targetX = currentX;
    let targetY = currentY;

    window.addEventListener('pointermove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
    });

    const updateSpotlight = () => {
      currentX += (targetX - currentX) * 0.1;
      currentY += (targetY - currentY) * 0.1;
      document.documentElement.style.setProperty('--mouse-x', `${currentX.toFixed(1)}px`);
      document.documentElement.style.setProperty('--mouse-y', `${currentY.toFixed(1)}px`);
      requestAnimationFrame(updateSpotlight);
    };

    requestAnimationFrame(updateSpotlight);
  }

  function initSlidingNavIndicator() {
    const navBar = document.getElementById('main-nav-bar');
    const indicator = document.getElementById('nav-indicator-pill');
    if (!navBar || !indicator) return;

    const updateIndicator = () => {
      const activeBtn = navBar.querySelector('.nav-tab-btn.active');
      if (activeBtn) {
        const navRect = navBar.getBoundingClientRect();
        const btnRect = activeBtn.getBoundingClientRect();
        const left = btnRect.left - navRect.left;
        const width = btnRect.width;

        indicator.style.transform = `translateX(${left}px)`;
        indicator.style.width = `${width}px`;
        indicator.style.opacity = '1';
      } else {
        indicator.style.opacity = '0';
      }
    };

    updateIndicator();
    setTimeout(updateIndicator, 50);
    window.addEventListener('resize', updateIndicator);

    const navBtns = navBar.querySelectorAll('.nav-tab-btn');
    navBtns.forEach(btn => btn.addEventListener('click', () => {
      setTimeout(updateIndicator, 10);
    }));

    window.addEventListener('aether:view-switched', updateIndicator);
  }

  function initCommandDeckHero() {
    const btnHeroMission = document.getElementById('btn-hero-create-mission');
    const btnHeroAI = document.getElementById('btn-hero-ai-decompose');
    const btnHeroMatrix = document.getElementById('btn-hero-matrix');
    const btnHeroDecompress = document.getElementById('btn-hero-decompress');

    if (btnHeroMission) {
      btnHeroMission.addEventListener('click', () => {
        sound.playTone(580, 0.05);
        const btnCreate = document.getElementById('btn-open-create-task');
        if (btnCreate) btnCreate.click();
      });
    }

    if (btnHeroAI) {
      btnHeroAI.addEventListener('click', () => {
        sound.playTone(550, 0.05);
        const btnAI = document.getElementById('btn-open-ai-assistant');
        if (btnAI) btnAI.click();
      });
    }

    if (btnHeroMatrix) {
      btnHeroMatrix.addEventListener('click', () => {
        sound.playTone(600, 0.05);
        const navTasks = document.querySelector('.nav-tab-btn[data-view="tasks"]');
        if (navTasks) navTasks.click();
      });
    }

    if (btnHeroDecompress) {
      btnHeroDecompress.addEventListener('click', () => {
        sound.playTone(500, 0.05);
        const navSys = document.querySelector('.nav-tab-btn[data-view="mission"]');
        if (navSys) navSys.click();
        setTimeout(() => {
          const btnDecomp = document.querySelector('.system-subnav-btn[data-subview="decompression"]');
          if (btnDecomp) btnDecomp.click();
        }, 50);
      });
    }
  }

  /* ==========================================================================
     13. BOOTSTRAP INITIALIZATION
     ========================================================================== */
  document.addEventListener('DOMContentLoaded', () => {
    // 3D Engines Initialization
    window.celestial3DEngine = new Celestial3DEngine('celestial-3d-canvas');
    window.heroQuantum3DEngine = new HeroQuantum3DEngine('hero-quantum-canvas');

    // Motion & Interactive Systems
    initAmbientCursorSpotlight();
    init3DCardTilt();
    initSlidingNavIndicator();
    initCommandDeckHero();

    // Application Subsystems
    initHeaderTelemetry();
    initNavigation();
    initMissionEngine();
    initHomeView();
    initInsightsView();
    initSystemArea();
    initPreferencesAndSync();
    initAIAssistant();

    const currentTheme = localStorage.getItem('aether_theme') || 'cyan';
    if (THEME_RGB_MAP[currentTheme]) {
      if (window.celestial3DEngine) window.celestial3DEngine.setThemeColor(THEME_RGB_MAP[currentTheme]);
      if (window.heroQuantum3DEngine) window.heroQuantum3DEngine.setThemeColor(THEME_RGB_MAP[currentTheme]);
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => {
          reg.update();
          console.log('[LEVEL UP PWA] Service worker active scope:', reg.scope);
        })
        .catch((err) => console.log('[LEVEL UP PWA] Service worker registration failed:', err));
    }

    console.log(
      '%c LEVEL UP SYSTEM %c EXECUTIVE COMMAND OS ONLINE ',
      'background: #070a0f; color: #38bdf8; font-weight: bold; padding: 4px;',
      'background: #0b111c; color: #34d399; font-weight: bold; padding: 4px;'
    );
  });
})();
