/**
 * ============================================================================
 * POMODORO FOCUS - APLICAÇÃO COMPLETA DE FOCO E PRODUTIVIDADE
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. ÁUDIO & NOTIFICAÇÕES (Web Audio API)
// ----------------------------------------------------------------------------
class SoundService {
  constructor() {
    this.audioCtx = null;
    this.soundEnabled = true;
    this.volume = 0.8;
  }

  initContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
  }

  /**
   * Toca um acorde de sino zen e harmonioso sem precisar de arquivos externos
   */
  playAlarm() {
    if (!this.soundEnabled || this.volume <= 0) return;
    this.initContext();
    if (!this.audioCtx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // Acorde C Maior (C5, E5, G5, C6)
    const startTime = this.audioCtx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime + idx * 0.12);

      // Curva suave de volume
      const noteStart = startTime + idx * 0.12;
      const noteEnd = noteStart + 1.6;

      gain.gain.setValueAtTime(0.001, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.25 * this.volume, noteStart + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(noteStart);
      osc.stop(noteEnd);
    });
  }

  playClick() {
    if (!this.soundEnabled || this.volume <= 0) return;
    this.initContext();
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.audioCtx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.08 * this.volume, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.05);
  }
}

// ----------------------------------------------------------------------------
// 2. GERENCIADOR DE NOTIFICAÇÕES DO NAVEGADOR
// ----------------------------------------------------------------------------
class NotificationService {
  constructor() {
    this.enabled = false;
  }

  async requestPermission() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') {
      this.enabled = true;
      return true;
    }
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.enabled = permission === 'granted';
      return this.enabled;
    }
    return false;
  }

  notify(title, body) {
    if (!this.enabled || !('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }
    try {
      new Notification(title, {
        body,
        icon: 'icons/icon-192.png'
      });
    } catch (e) {
      console.warn('Erro ao disparar notificação:', e);
    }
  }
}

// ----------------------------------------------------------------------------
// 3. PERSISTÊNCIA & CONFIGURAÇÕES (LocalStorage)
// ----------------------------------------------------------------------------
const DEFAULT_SETTINGS = {
  pomodoroTime: 25,
  shortBreakTime: 5,
  longBreakTime: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  soundEnabled: true,
  soundVolume: 0.8,
  browserNotifications: false
};

class StorageService {
  static getSettings() {
    try {
      const saved = localStorage.getItem('pomodoro_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  static saveSettings(settings) {
    try {
      localStorage.setItem('pomodoro_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('Falha ao salvar configurações:', e);
    }
  }

  static getTasks() {
    try {
      const saved = localStorage.getItem('pomodoro_tasks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  static saveTasks(tasks) {
    try {
      localStorage.setItem('pomodoro_tasks', JSON.stringify(tasks));
    } catch (e) {
      console.warn('Falha ao salvar tarefas:', e);
    }
  }

  static getStats() {
    try {
      const saved = localStorage.getItem('pomodoro_stats');
      return saved ? JSON.parse(saved) : { completedPomodoros: 0 };
    } catch {
      return { completedPomodoros: 0 };
    }
  }

  static saveStats(stats) {
    try {
      localStorage.setItem('pomodoro_stats', JSON.stringify(stats));
    } catch (e) {
      console.warn('Falha ao salvar estatísticas:', e);
    }
  }
}

// ----------------------------------------------------------------------------
// 4. APLICAÇÃO PRINCIPAL (PomodoroApp)
// ----------------------------------------------------------------------------
class PomodoroApp {
  constructor() {
    this.sound = new SoundService();
    this.notifications = new NotificationService();
    this.settings = StorageService.getSettings();
    this.tasks = StorageService.getTasks();
    this.stats = StorageService.getStats();

    // Estado do Temporizador
    this.mode = 'pomodoro'; // 'pomodoro' | 'shortBreak' | 'longBreak'
    this.isRunning = false;
    this.currentCycle = 1; // 1 a 4
    this.activeTaskId = null;
    this.timerId = null;
    this.endTime = null;

    // Constante da circunferência do anel SVG: 2 * Math.PI * 140 ≈ 879.6459
    this.RING_CIRCUMFERENCE = 2 * Math.PI * 140;

    this.timeLeft = this.getDurationForMode(this.mode);
    this.totalDuration = this.timeLeft;

    // Cache dos Elementos do DOM
    this.cacheDom();

    // Inicialização
    this.applySettingsToApp();
    this.renderTasks();
    this.updateStatsDisplay();
    this.bindEvents();
    this.updateDisplay();
  }

  cacheDom() {
    // Topo & Configs
    this.html = document.documentElement;
    this.soundToggleBtn = document.getElementById('soundToggleBtn');
    this.soundOnIcon = this.soundToggleBtn.querySelector('.sound-on-icon');
    this.soundOffIcon = this.soundToggleBtn.querySelector('.sound-off-icon');
    this.openSettingsBtn = document.getElementById('openSettingsBtn');
    this.closeSettingsBtn = document.getElementById('closeSettingsBtn');
    this.settingsModal = document.getElementById('settingsModal');
    this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
    this.resetDefaultsBtn = document.getElementById('resetDefaultsBtn');
    this.testAlarmBtn = document.getElementById('testAlarmBtn');

    // Campos do Modal
    this.pomodoroTimeInput = document.getElementById('pomodoroTimeInput');
    this.shortBreakTimeInput = document.getElementById('shortBreakTimeInput');
    this.longBreakTimeInput = document.getElementById('longBreakTimeInput');
    this.longBreakIntervalInput = document.getElementById('longBreakIntervalInput');
    this.autoStartBreaksToggle = document.getElementById('autoStartBreaksToggle');
    this.autoStartPomodorosToggle = document.getElementById('autoStartPomodorosToggle');
    this.browserNotificationsToggle = document.getElementById('browserNotificationsToggle');
    this.soundVolumeInput = document.getElementById('soundVolumeInput');

    // Abas de Modo
    this.tabPomodoro = document.getElementById('tabPomodoro');
    this.tabShortBreak = document.getElementById('tabShortBreak');
    this.tabLongBreak = document.getElementById('tabLongBreak');

    // Display do Timer & Círculo
    this.timeText = document.getElementById('timeText');
    this.statusLabel = document.getElementById('statusLabel');
    this.progressCircle = document.getElementById('progressCircle');
    this.cycleDots = document.getElementById('cycleDots');
    this.cycleNumber = document.getElementById('cycleNumber');

    // Controles
    this.playPauseBtn = document.getElementById('playPauseBtn');
    this.playIcon = document.getElementById('playIcon');
    this.pauseIcon = document.getElementById('pauseIcon');
    this.playPauseText = document.getElementById('playPauseText');
    this.resetBtn = document.getElementById('resetBtn');
    this.skipBtn = document.getElementById('skipBtn');

    // Tarefas & Produtividade
    this.completedPomodorosCount = document.getElementById('completedPomodorosCount');
    this.activeTaskBanner = document.getElementById('activeTaskBanner');
    this.activeTaskTitle = document.getElementById('activeTaskTitle');
    this.clearActiveTaskBtn = document.getElementById('clearActiveTaskBtn');
    this.addTaskForm = document.getElementById('addTaskForm');
    this.taskInput = document.getElementById('taskInput');
    this.taskEstInput = document.getElementById('taskEstInput');
    this.taskList = document.getElementById('taskList');
    this.emptyTasksState = document.getElementById('emptyTasksState');
  }

  bindEvents() {
    // Alternância de Abas
    this.tabPomodoro.addEventListener('click', () => this.switchMode('pomodoro'));
    this.tabShortBreak.addEventListener('click', () => this.switchMode('shortBreak'));
    this.tabLongBreak.addEventListener('click', () => this.switchMode('longBreak'));

    // Controles do Timer
    this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
    this.resetBtn.addEventListener('click', () => this.resetTimer());
    this.skipBtn.addEventListener('click', () => this.skipStep());

    // Som e Notificações
    this.soundToggleBtn.addEventListener('click', () => this.toggleSound());
    this.openSettingsBtn.addEventListener('click', () => this.openSettings());
    this.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
    this.settingsModal.addEventListener('click', (e) => {
      if (e.target === this.settingsModal) this.closeSettings();
    });
    this.saveSettingsBtn.addEventListener('click', () => this.saveSettingsFromModal());
    this.resetDefaultsBtn.addEventListener('click', () => this.resetSettingsToDefaults());
    this.testAlarmBtn.addEventListener('click', () => this.sound.playAlarm());

    // Tarefas
    this.addTaskForm.addEventListener('submit', (e) => this.handleAddTask(e));
    this.clearActiveTaskBtn.addEventListener('click', () => this.setActiveTask(null));

    // Atalhos de Teclado
    window.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
  }

  handleKeyboardShortcuts(e) {
    const isEditing = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);
    if (isEditing) return;

    if (e.code === 'Space') {
      e.preventDefault();
      this.togglePlayPause();
    } else if (e.code === 'KeyR') {
      e.preventDefault();
      this.resetTimer();
    } else if (e.code === 'KeyS') {
      e.preventDefault();
      this.skipStep();
    } else if (e.code === 'Escape' && !this.settingsModal.classList.contains('hidden')) {
      this.closeSettings();
    }
  }

  // --------------------------------------------------------------------------
  // LÓGICA DO TEMPORIZADOR
  // --------------------------------------------------------------------------
  getDurationForMode(mode) {
    switch (mode) {
      case 'pomodoro':
        return this.settings.pomodoroTime * 60;
      case 'shortBreak':
        return this.settings.shortBreakTime * 60;
      case 'longBreak':
        return this.settings.longBreakTime * 60;
      default:
        return 25 * 60;
    }
  }

  switchMode(newMode, keepRunning = false) {
    if (this.mode === newMode && !keepRunning) return;

    this.mode = newMode;
    this.html.setAttribute('data-mode', newMode);
    this.totalDuration = this.getDurationForMode(newMode);
    this.timeLeft = this.totalDuration;

    if (!keepRunning) {
      this.pauseTimer();
    }

    // Atualiza Abas Ativas
    [this.tabPomodoro, this.tabShortBreak, this.tabLongBreak].forEach(tab => {
      const isActive = tab.dataset.mode === newMode;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    // Atualiza label do status e meta theme-color para PWA
    const themeColors = {
      pomodoro: '#ba4949',
      shortBreak: '#328287',
      longBreak: '#3d6f9a'
    };
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme && themeColors[newMode]) {
      metaTheme.setAttribute('content', themeColors[newMode]);
    }

    if (newMode === 'pomodoro') {
      this.statusLabel.textContent = 'Hora de Focar';
    } else if (newMode === 'shortBreak') {
      this.statusLabel.textContent = 'Pausa Curta';
    } else {
      this.statusLabel.textContent = 'Pausa Longa';
    }

    this.sound.playClick();
    this.updateDisplay();
  }

  togglePlayPause() {
    this.sound.initContext();
    if (this.isRunning) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  }

  startTimer() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.endTime = Date.now() + this.timeLeft * 1000;

    this.playIcon.classList.add('hidden');
    this.pauseIcon.classList.remove('hidden');
    this.playPauseText.textContent = 'PAUSAR';
    this.playPauseBtn.classList.add('running');

    // Intervalo de alta precisão imune a desvios de segundo plano
    this.timerId = setInterval(() => {
      const remainingMs = this.endTime - Date.now();
      if (remainingMs <= 0) {
        this.timeLeft = 0;
        this.updateDisplay();
        this.handleTimerComplete();
      } else {
        this.timeLeft = Math.ceil(remainingMs / 1000);
        this.updateDisplay();
      }
    }, 250);

    this.updateDisplay();
  }

  pauseTimer() {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    this.playIcon.classList.remove('hidden');
    this.pauseIcon.classList.add('hidden');
    this.playPauseText.textContent = 'INICIAR';
    this.playPauseBtn.classList.remove('running');
    this.updateDisplay();
  }

  resetTimer() {
    this.sound.playClick();
    this.pauseTimer();
    this.timeLeft = this.totalDuration;
    this.updateDisplay();
  }

  skipStep() {
    this.sound.playClick();
    this.pauseTimer();
    this.advanceToNextCycleStep(false);
  }

  handleTimerComplete() {
    this.pauseTimer();
    this.sound.playAlarm();

    if (this.mode === 'pomodoro') {
      // Incrementa pomodoros completados
      this.stats.completedPomodoros += 1;
      StorageService.saveStats(this.stats);
      this.updateStatsDisplay();

      // Atualiza tarefa em andamento se houver
      if (this.activeTaskId) {
        const task = this.tasks.find(t => t.id === this.activeTaskId);
        if (task) {
          task.completedCount = (task.completedCount || 0) + 1;
          StorageService.saveTasks(this.tasks);
          this.renderTasks();
        }
      }

      this.notifications.notify(
        '🎉 Pomodoro Concluído!',
        'Excelente trabalho! Hora de respirar e descansar um pouco.'
      );
    } else {
      this.notifications.notify(
        '🔔 Pausa Finalizada!',
        'Sua pausa terminou. Vamos voltar ao foco?'
      );
    }

    this.advanceToNextCycleStep(true);
  }

  advanceToNextCycleStep(fromCompletion = false) {
    if (this.mode === 'pomodoro') {
      const isLongBreak = this.currentCycle % this.settings.longBreakInterval === 0;
      const nextMode = isLongBreak ? 'longBreak' : 'shortBreak';
      this.switchMode(nextMode);

      if (fromCompletion && this.settings.autoStartBreaks) {
        this.startTimer();
      }
    } else {
      // Terminou uma pausa: avança o ciclo
      this.currentCycle = (this.currentCycle % this.settings.longBreakInterval) + 1;
      this.updateCycleDots();
      this.switchMode('pomodoro');

      if (fromCompletion && this.settings.autoStartPomodoros) {
        this.startTimer();
      }
    }
  }

  updateDisplay() {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // Atualiza número na tela
    this.timeText.textContent = formatted;

    // Atualiza título da aba
    const modeName = this.mode === 'pomodoro' ? 'Foco' : (this.mode === 'shortBreak' ? 'Pausa Curta' : 'Pausa Longa');
    document.title = `(${formatted}) ${modeName} | Pomodoro`;

    // Atualiza o anel de progresso SVG
    const fraction = this.totalDuration > 0 ? (this.totalDuration - this.timeLeft) / this.totalDuration : 0;
    const offset = this.RING_CIRCUMFERENCE * fraction;
    this.progressCircle.style.strokeDashoffset = offset;

    this.updateCycleDots();
  }

  updateCycleDots() {
    this.cycleNumber.textContent = `#${this.currentCycle}`;
    const dots = this.cycleDots.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index < this.currentCycle);
    });
  }

  updateStatsDisplay() {
    this.completedPomodorosCount.textContent = this.stats.completedPomodoros;
  }

  // --------------------------------------------------------------------------
  // SOM & NOTIFICAÇÕES UI
  // --------------------------------------------------------------------------
  toggleSound() {
    this.settings.soundEnabled = !this.settings.soundEnabled;
    this.sound.setSoundEnabled(this.settings.soundEnabled);
    StorageService.saveSettings(this.settings);
    this.updateSoundIcon();
  }

  updateSoundIcon() {
    if (this.settings.soundEnabled) {
      this.soundOnIcon.classList.remove('hidden');
      this.soundOffIcon.classList.add('hidden');
    } else {
      this.soundOnIcon.classList.add('hidden');
      this.soundOffIcon.classList.remove('hidden');
    }
  }

  // --------------------------------------------------------------------------
  // MODAL DE CONFIGURAÇÕES
  // --------------------------------------------------------------------------
  openSettings() {
    this.sound.playClick();
    this.pomodoroTimeInput.value = this.settings.pomodoroTime;
    this.shortBreakTimeInput.value = this.settings.shortBreakTime;
    this.longBreakTimeInput.value = this.settings.longBreakTime;
    this.longBreakIntervalInput.value = this.settings.longBreakInterval;
    this.autoStartBreaksToggle.checked = this.settings.autoStartBreaks;
    this.autoStartPomodorosToggle.checked = this.settings.autoStartPomodoros;
    this.browserNotificationsToggle.checked = this.settings.browserNotifications;
    this.soundVolumeInput.value = this.settings.soundVolume;

    this.settingsModal.classList.remove('hidden');
  }

  closeSettings() {
    this.settingsModal.classList.add('hidden');
  }

  async saveSettingsFromModal() {
    this.settings.pomodoroTime = Math.max(1, parseInt(this.pomodoroTimeInput.value) || 25);
    this.settings.shortBreakTime = Math.max(1, parseInt(this.shortBreakTimeInput.value) || 5);
    this.settings.longBreakTime = Math.max(1, parseInt(this.longBreakTimeInput.value) || 15);
    this.settings.longBreakInterval = Math.max(1, parseInt(this.longBreakIntervalInput.value) || 4);
    this.settings.autoStartBreaks = this.autoStartBreaksToggle.checked;
    this.settings.autoStartPomodoros = this.autoStartPomodorosToggle.checked;
    this.settings.soundVolume = parseFloat(this.soundVolumeInput.value) || 0.8;

    if (this.browserNotificationsToggle.checked) {
      const allowed = await this.notifications.requestPermission();
      this.settings.browserNotifications = allowed;
    } else {
      this.settings.browserNotifications = false;
      this.notifications.enabled = false;
    }

    StorageService.saveSettings(this.settings);
    this.applySettingsToApp();
    this.closeSettings();
    this.sound.playClick();

    // Se o timer estiver pausado, recalcula a duração atual
    if (!this.isRunning) {
      this.totalDuration = this.getDurationForMode(this.mode);
      this.timeLeft = this.totalDuration;
      this.updateDisplay();
    }
  }

  resetSettingsToDefaults() {
    this.settings = { ...DEFAULT_SETTINGS };
    StorageService.saveSettings(this.settings);
    this.applySettingsToApp();
    this.openSettings(); // Recarrega valores na tela
  }

  applySettingsToApp() {
    this.sound.setSoundEnabled(this.settings.soundEnabled);
    this.sound.setVolume(this.settings.soundVolume);
    this.notifications.enabled = this.settings.browserNotifications;
    this.updateSoundIcon();
  }

  // --------------------------------------------------------------------------
  // GERENCIADOR DE TAREFAS
  // --------------------------------------------------------------------------
  handleAddTask(e) {
    e.preventDefault();
    const title = this.taskInput.value.trim();
    const est = parseInt(this.taskEstInput.value) || 1;

    if (!title) return;

    const newTask = {
      id: Date.now().toString(),
      title,
      est: Math.min(20, Math.max(1, est)),
      completedCount: 0,
      isDone: false
    };

    this.tasks.push(newTask);
    StorageService.saveTasks(this.tasks);
    this.taskInput.value = '';
    this.taskEstInput.value = '1';

    // Se não tiver tarefa ativa, define esta como ativa automaticamente
    if (!this.activeTaskId) {
      this.setActiveTask(newTask.id);
    }

    this.renderTasks();
    this.sound.playClick();
  }

  setActiveTask(id) {
    this.activeTaskId = id;
    if (id) {
      const task = this.tasks.find(t => t.id === id);
      if (task) {
        this.activeTaskTitle.textContent = task.title;
        this.activeTaskBanner.classList.remove('hidden');
      }
    } else {
      this.activeTaskBanner.classList.add('hidden');
    }
    this.renderTasks();
  }

  toggleTaskDone(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.isDone = !task.isDone;
      StorageService.saveTasks(this.tasks);
      this.renderTasks();
      this.sound.playClick();
    }
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    if (this.activeTaskId === id) {
      this.setActiveTask(null);
    }
    StorageService.saveTasks(this.tasks);
    this.renderTasks();
    this.sound.playClick();
  }

  renderTasks() {
    this.taskList.innerHTML = '';

    if (this.tasks.length === 0) {
      this.emptyTasksState.classList.remove('hidden');
      return;
    }

    this.emptyTasksState.classList.add('hidden');

    this.tasks.forEach(task => {
      const li = document.createElement('li');
      li.className = `task-item ${task.isDone ? 'completed' : ''} ${this.activeTaskId === task.id ? 'active-focus' : ''}`;

      // Checkbox
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'task-checkbox';
      checkbox.checked = task.isDone;
      checkbox.setAttribute('aria-label', `Concluir ${task.title}`);
      checkbox.addEventListener('change', () => this.toggleTaskDone(task.id));

      // Conteúdo clicável (ativa o foco na tarefa)
      const content = document.createElement('div');
      content.className = 'task-content';
      content.title = 'Clique para selecionar como foco principal';
      content.innerHTML = `
        <span class="task-text">${this.escapeHtml(task.title)}</span>
        <span class="task-meta">${task.completedCount} / ${task.est} 🍅 pomodoros</span>
      `;
      content.addEventListener('click', () => this.setActiveTask(task.id));

      // Ações (Excluir)
      const actions = document.createElement('div');
      actions.className = 'task-actions';

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'task-action-btn delete';
      deleteBtn.title = 'Excluir tarefa';
      deleteBtn.setAttribute('aria-label', 'Excluir tarefa');
      deleteBtn.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      `;
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteTask(task.id);
      });

      actions.appendChild(deleteBtn);

      li.appendChild(checkbox);
      li.appendChild(content);
      li.appendChild(actions);

      this.taskList.appendChild(li);
    });
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

// ----------------------------------------------------------------------------
// INICIALIZAÇÃO & REGISTRO PWA
// ----------------------------------------------------------------------------
let deferredInstallPrompt = null;

// Captura o evento nativo para permitir instalação via botão do app
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  const pwaBtn = document.getElementById('pwaInstallBtn');
  if (pwaBtn) {
    pwaBtn.classList.remove('hidden');
    pwaBtn.onclick = async () => {
      pwaBtn.classList.add('hidden');
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        console.log('Instalação PWA:', choice.outcome);
        deferredInstallPrompt = null;
      }
    };
  }
});

window.addEventListener('appinstalled', () => {
  const pwaBtn = document.getElementById('pwaInstallBtn');
  if (pwaBtn) pwaBtn.classList.add('hidden');
  console.log('Pomodoro Focus instalado com sucesso!');
});

// Registra o Service Worker para cache e uso offline
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then((reg) => console.log('Service Worker ativo:', reg.scope))
      .catch((err) => console.log('Service Worker não registrado:', err));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new PomodoroApp();
});

