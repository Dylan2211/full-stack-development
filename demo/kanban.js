const STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'review',
  ERROR: 'done'
};

const COLUMN_ORDER = [
  STATUS.TODO,
  STATUS.IN_PROGRESS,
  STATUS.COMPLETED,
  STATUS.ERROR
];

const COLUMN_CONFIG = {
  [STATUS.TODO]: { id: STATUS.TODO, title: 'To Do' },
  [STATUS.IN_PROGRESS]: { id: STATUS.IN_PROGRESS, title: 'In Progress' },
  [STATUS.COMPLETED]: { id: STATUS.COMPLETED, title: 'Completed' },
  [STATUS.ERROR]: { id: STATUS.ERROR, title: 'Errors' }
};

const AGENTS = {
  'Claude-Code-v2': { label: 'Claude Code v2', icon: '🤖' },
  'Gemini-CLI': { label: 'Gemini CLI', icon: '✨' },
  'Amp-Agent': { label: 'Amp Agent', icon: '⚡' },
  'AutoDev-Pro': { label: 'AutoDev Pro', icon: '🛠️' }
};

let tasks = [
  {
    id: '1',
    title: 'Implement user auth API',
    description: 'JWT-based login with rate limiting, brute-force protection, and audit logging.',
    priority: 'high',
    agent: null,
    status: STATUS.TODO,
    progress: 0,
    category: 'Backend',
    skills: ['Node.js', 'JWT', 'Security'],
    result: '',
    errorLog: ''
  },
  {
    id: '2',
    title: 'Write unit tests for payment module',
    description: 'Cover edge cases in refund logic, currency conversion, and idempotency keys.',
    priority: 'medium',
    agent: 'Claude-Code-v2',
    status: STATUS.IN_PROGRESS,
    progress: 65,
    category: 'Testing',
    skills: ['Jest', 'Testing', 'JavaScript'],
    result: 'All critical payment paths covered.\n\nSummary:\n- 32 tests added\n- 100% coverage for refund logic\n- Idempotency key collisions handled.',
    errorLog: ''
  },
  {
    id: '3',
    title: 'Optimize DB queries in dashboard',
    description: 'Reduce latency below 200ms; propose indexing strategy and query refactoring.',
    priority: 'high',
    agent: 'Gemini-CLI',
    status: STATUS.COMPLETED,
    progress: 100,
    category: 'Backend',
    skills: ['SQL', 'Performance', 'Optimization'],
    result: 'Latency reduced from 420ms to 160ms (P95).\n\nChanges:\n- Added composite index on (tenant_id, created_at)\n- Replaced N+1 queries with single aggregated query\n- Introduced read replica for analytics traffic.',
    errorLog: ''
  },
  {
    id: '4',
    title: 'Generate OpenAPI spec',
    description: 'Auto-document all REST endpoints with request/response examples and error codes.',
    priority: 'low',
    agent: 'Amp-Agent',
    status: STATUS.ERROR,
    progress: 100,
    category: 'Documentation',
    skills: ['OpenAPI', 'Documentation'],
    result: '',
    errorLog: 'Generation failed\n\nError code: OPENAPI-422\nMessage: Non-JSON error responses detected on 3 endpoints.\n\nNext steps:\n- Normalize error response schema\n- Regenerate specification.'
  }
];

let kanbanBoard;
let detailModal;
let detailModalTitle;
let detailModalBody;
let closeDetailModal;
let createModal;
let openCreateModal;
let closeCreateModal;
let createTaskForm;
let cancelCreate;
let createAndStartBtn;
let agentCountEl;
let taskCountEl;
let agentUtilizationEl;
let taskAgentSelect;
let detailToggleButton;
let resultModal;
let resultModalBody;
let resultModalTitle;
let closeResultModal;

let lastSelectedTaskId = null;
let draggedTask = null;

function formatStatus(statusId) {
  const cfg = COLUMN_CONFIG[statusId];
  if (cfg) return cfg.title;
  return statusId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function statusKey(statusId) {
  if (statusId === STATUS.TODO) return 'todo';
  if (statusId === STATUS.IN_PROGRESS) return 'in-progress';
  if (statusId === STATUS.COMPLETED) return 'review';
  if (statusId === STATUS.ERROR) return 'done';
  return 'todo';
}

function getAgentMeta(agentId) {
  if (!agentId) return null;
  return AGENTS[agentId] || { label: agentId, icon: '🤖' };
}

function renderBoard() {
  if (!kanbanBoard || !agentCountEl || !taskCountEl) return;

  const counts = {};
  COLUMN_ORDER.forEach(id => {
    counts[id] = 0;
  });

  tasks.forEach(task => {
    if (counts[task.status] !== undefined) counts[task.status]++;
  });

  const activeAgents = new Set(
    tasks.filter(t => t.agent).map(t => t.agent)
  ).size;
  agentCountEl.textContent = activeAgents;
  taskCountEl.textContent = tasks.length;

  let boardHTML = '';

  COLUMN_ORDER.forEach(colId => {
    const colCfg = COLUMN_CONFIG[colId];
    const colTasks = tasks.filter(t => t.status === colId);

    boardHTML += `
      <div class="column col-${colId}" data-column="${colId}" id="col-${colId}">
        <div class="column-header">
          <div class="column-title">${colCfg.title}</div>
          <div class="column-count">${counts[colId] || 0}</div>
        </div>
    `;

    if (colTasks.length === 0) {
      boardHTML += `
        <div class="empty-placeholder">
          Drag tasks here
        </div>
      `;
    } else {
      colTasks.forEach(task => {
        const agentMeta = getAgentMeta(task.agent);
        const agentLabel = agentMeta ? agentMeta.label : 'Auto';
        const agentIcon = agentMeta ? agentMeta.icon : '🎯';
        const agentDisplay = `
          <span class="agent-chip" title="${task.agent ? agentLabel : 'Auto-assigned'}">
            <span class="agent-icon">${agentIcon}</span>
            <span class="agent-name">${agentLabel}</span>
          </span>
        `;
        const skillsHTML = task.skills && task.skills.length
          ? `<div class="skills-list">${task.skills.map(s => `<span class="skills-tag">${s}</span>`).join('')}</div>`
          : '';
        const canDrag = task.status !== STATUS.COMPLETED;
        const dragAttr = canDrag ? 'true' : 'false';
        const extraClass = canDrag ? '' : ' non-draggable';

        boardHTML += `
          <div class="task-card${extraClass}"
               draggable="${dragAttr}"
               data-task-id="${task.id}"
               data-status="${task.status}">
            <div class="task-title">${task.title}</div>
            <div class="task-desc">${task.description}</div>
            <div class="task-meta">
              <span class="priority-badge priority-${task.priority}">
                ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </span>
              ${agentDisplay}
            </div>
            ${task.category ? `<div class="category-tag">${task.category}</div>` : ''}
            ${skillsHTML}
          </div>
        `;
      });
    }

    boardHTML += `</div>`;
  });

  kanbanBoard.innerHTML = boardHTML;

  document.querySelectorAll('.task-card').forEach(card => {
    const taskId = card.getAttribute('data-task-id');
    card.addEventListener('click', () => {
      const task = tasks.find(t => t.id === taskId);
      if (task) openTaskDetail(task);
    });

    if (card.draggable) {
      card.addEventListener('dragstart', handleDragStart);
      card.addEventListener('dragend', handleDragEnd);
    }
  });

  document.querySelectorAll('.column').forEach(col => {
    col.addEventListener('dragover', handleDragOver);
    col.addEventListener('dragenter', handleDragEnter);
    col.addEventListener('dragleave', handleDragLeave);
    col.addEventListener('drop', handleDrop);
  });

  renderAgentUtilization();
}

function renderAgentUtilization() {
  if (!agentUtilizationEl) return;

  const agentCounts = {};
  let totalAgentTasks = 0;

  Object.keys(AGENTS).forEach(id => {
    agentCounts[id] = 0;
  });

  tasks.forEach(task => {
    if (task.agent && agentCounts[task.agent] !== undefined) {
      agentCounts[task.agent]++;
      totalAgentTasks++;
    }
  });

  if (totalAgentTasks === 0) {
    agentUtilizationEl.innerHTML = '';
    return;
  }

  const itemsHTML = Object.entries(agentCounts)
    .filter(([, count]) => count > 0)
    .map(([agentId, count]) => {
      const meta = getAgentMeta(agentId);
      const pct = Math.round((count / totalAgentTasks) * 100);
      return `
        <span class="agent-util-item">
          ${meta.icon} ${meta.label}: ${count} (${pct}%)
        </span>
      `;
    })
    .join('');

  agentUtilizationEl.innerHTML = `
    <span class="agent-utilization-label">Agent utilisation:</span>
    <div class="agent-utilization-list">
      ${itemsHTML}
    </div>
  `;
}

function handleDragStart(e) {
  draggedTask = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', this.getAttribute('data-task-id'));
}

function handleDragEnd() {
  this.classList.remove('dragging');
  document.querySelectorAll('.column').forEach(col => {
    col.classList.remove('drag-over');
  });
}

function isLockedColumn(colStatus) {
  return colStatus === STATUS.COMPLETED || colStatus === STATUS.ERROR;
}

function handleDragOver(e) {
  const colStatus = this.getAttribute('data-column');
  if (isLockedColumn(colStatus)) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
  const colStatus = this.getAttribute('data-column');
  if (isLockedColumn(colStatus)) return;
  e.preventDefault();
  this.classList.add('drag-over');
}

function handleDragLeave(e) {
  const colStatus = this.getAttribute('data-column');
  if (isLockedColumn(colStatus)) return;
  if (!this.contains(e.relatedTarget)) {
    this.classList.remove('drag-over');
  }
}

function handleDrop(e) {
  const colStatus = this.getAttribute('data-column');
  if (isLockedColumn(colStatus)) return;

  e.preventDefault();
  this.classList.remove('drag-over');

  const taskId = e.dataTransfer.getData('text/plain');
  const newStatus = this.getAttribute('data-column');

  const task = tasks.find(t => t.id === taskId);
  if (task && task.status !== newStatus) {
    task.status = newStatus;

    if (newStatus === STATUS.TODO || newStatus === STATUS.IN_PROGRESS) {
      task.progress = Math.min(task.progress, 95);
    } else if (newStatus === STATUS.COMPLETED || newStatus === STATUS.ERROR) {
      task.progress = 100;
    }

    renderBoard();
  }

  draggedTask = null;
}

function buildLogText(task) {
  if (task.status === STATUS.TODO) {
    return 'Task created and queued. Waiting for an available agent to start executing.';
  }
  if (task.status === STATUS.IN_PROGRESS) {
    return 'Agent started executing this task. Streaming intermediate outputs and checking for errors.';
  }
  if (task.status === STATUS.COMPLETED) {
    return 'Task completed successfully. All subtasks have finished and results are available.';
  }
  if (task.status === STATUS.ERROR) {
    return 'Task moved to the error queue. Review error log for details.';
  }
  return 'Task state updated.';
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function openResultModal(task, mode) {
  if (!resultModal || !resultModalBody || !resultModalTitle) return;

  const isError = mode === 'error';
  const title = isError ? 'Error Log' : 'AI Task Result';

  const agentMeta = getAgentMeta(task.agent);
  const agentLabel = agentMeta ? agentMeta.label : 'Auto-assigned';
  const metaText = `${agentLabel} • ${formatStatus(task.status)}`;

  const sourceText = isError ? task.errorLog : task.result;
  const bodyHtml = sourceText && sourceText.trim().length > 0
    ? `<pre class="result-pre">${escapeHtml(sourceText)}</pre>`
    : `<div class="result-empty">${isError ? 'No error details available yet for this task.' : 'Result is not available yet for this task.'}</div>`;

  resultModalTitle.textContent = title;

  resultModalBody.innerHTML = `
    <div class="result-header-row">
      <div class="result-task-title">${task.title}</div>
      <div class="result-meta">${metaText}</div>
    </div>
    <div class="result-content">
      ${bodyHtml}
    </div>
  `;

  resultModal.classList.add('active');
}

function openTaskDetail(task) {
  if (!detailModal || !detailModalTitle || !detailModalBody) return;

  lastSelectedTaskId = task.id;

  const agentMeta = getAgentMeta(task.agent);
  const agentLabel = agentMeta ? agentMeta.label : 'Auto-assigned';
  const agentIcon = agentMeta ? agentMeta.icon : '🎯';
  const agentDisplay = task.agent ? `${agentIcon} ${agentLabel}` : agentLabel;

  const modelLoad = task.agent ? Math.max(50, Math.min(95, Math.round(task.progress + 20))) : 0;
  const progressPct = Math.round(task.progress);
  const startedValue = '19/11/2025';
  const elapsedValue = progressPct === 0 ? '–' : '5 min';
  const etaValue = task.status === STATUS.IN_PROGRESS ? '6 min' : progressPct === 100 ? 'Done' : '–';
  const logText = buildLogText(task);
  const statusClass = statusKey(task.status);

  const showStop = task.status === STATUS.IN_PROGRESS;
  const showResult = task.status === STATUS.COMPLETED;
  const showErrorLog = task.status === STATUS.ERROR;
  const showDelete = task.status === STATUS.TODO || task.status === STATUS.ERROR;

  const stopButtonHtml = showStop
    ? `<button type="button" class="stop-task-btn" id="stopTaskButton">Stop Task</button>`
    : '';

  let secondaryButtonHtml = '';
  if (showResult) {
    secondaryButtonHtml = `
      <div class="result-link-row">
        <button type="button" class="result-link-btn" id="viewResultButton">View AI result</button>
      </div>
    `;
  } else if (showErrorLog) {
    secondaryButtonHtml = `
      <div class="result-link-row">
        <button type="button" class="result-link-btn" id="viewErrorButton">Error Log</button>
      </div>
    `;
  }

  const deleteButtonHtml = showDelete
    ? `
      <div class="delete-task-row">
        <button type="button" class="delete-task-btn" id="deleteTaskButton">Delete Task</button>
      </div>
    `
    : '';

  detailModalTitle.innerHTML = `Update <span class="highlight-word">Task</span>`;

  detailModalBody.innerHTML = `
    <div class="detail-status-row">
      <div class="status-pill ${statusClass}">${formatStatus(task.status)}</div>
      <div class="detail-subtitle">${task.title}</div>
    </div>
    <div class="detail-meta-card">
      <div class="detail-meta-tabs">
        <div class="detail-tab active">Task Details</div>
      </div>
      <div class="task-meta-grid">
        <div>
          <div class="meta-label">Started</div>
          <div class="meta-value">${startedValue}</div>
        </div>
        <div>
          <div class="meta-label">Agent</div>
          <div class="meta-value">${agentDisplay}</div>
        </div>
        <div>
          <div class="meta-label">Model Load</div>
          <div class="meta-value">${task.agent ? modelLoad + '%' : '–'}</div>
        </div>
        <div>
          <div class="meta-label">Progress</div>
          <div class="meta-value">${progressPct}%</div>
        </div>
        <div>
          <div class="meta-label">Elapsed</div>
          <div class="meta-value">${elapsedValue}</div>
        </div>
        <div>
          <div class="meta-label">ETA</div>
          <div class="meta-value">${etaValue}</div>
        </div>
      </div>
      <div class="workspace-row">
        <div class="workspace-label">Workspace Path</div>
        <div class="workspace-line">
          <div class="workspace-path">/Synapse/EGRA Team Project</div>
          ${stopButtonHtml}
        </div>
        <div class="detail-progress-track">
          <div class="detail-progress-fill" style="width: ${progressPct}%;"></div>
        </div>
      </div>
    </div>
    <div class="log-section">
      <div class="log-title">Logs</div>
      <div class="log-entry">${logText}</div>
    </div>
    ${secondaryButtonHtml}
    ${deleteButtonHtml}
  `;

  const stopBtn = document.getElementById('stopTaskButton');
  if (stopBtn) {
    stopBtn.addEventListener('click', () => {
      task.status = STATUS.TODO;
      task.progress = 0;
      renderBoard();
      detailModal.classList.remove('active');
    });
  }

  const viewResultButton = document.getElementById('viewResultButton');
  if (viewResultButton) {
    viewResultButton.addEventListener('click', () => openResultModal(task, 'result'));
  }

  const viewErrorButton = document.getElementById('viewErrorButton');
  if (viewErrorButton) {
    viewErrorButton.addEventListener('click', () => openResultModal(task, 'error'));
  }

  const deleteTaskButton = document.getElementById('deleteTaskButton');
  if (deleteTaskButton) {
    deleteTaskButton.addEventListener('click', () => {
      tasks = tasks.filter(t => t.id !== task.id);
      if (lastSelectedTaskId === task.id) lastSelectedTaskId = null;
      renderBoard();
      detailModal.classList.remove('active');
    });
  }

  detailModal.classList.add('active');
}

function openCreateTaskModal() {
  if (!createModal) return;
  createModal.classList.add('active');
}

function closeCreateTaskModal() {
  if (!createModal || !createTaskForm) return;
  createModal.classList.remove('active');
  createTaskForm.reset();
}

function initializeAgentSelect() {
  if (!taskAgentSelect) return;

  while (taskAgentSelect.options.length > 1) {
    taskAgentSelect.remove(1);
  }

  Object.entries(AGENTS).forEach(([id, meta]) => {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = meta.label;
    taskAgentSelect.appendChild(opt);
  });
}

function createTaskFromForm(startImmediately) {
  if (!createTaskForm.reportValidity()) return;

  let skills = [];
  const skillsInputElement = document.getElementById('taskSkills');
  const skillsInput = skillsInputElement ? skillsInputElement.value.trim() : '';
  if (skillsInput) {
    skills = skillsInput.split(',').map(s => s.trim()).filter(s => s);
  }

  const status = startImmediately ? STATUS.IN_PROGRESS : STATUS.TODO;
  const progress = startImmediately ? 5 : 0;

  const newTask = {
    id: 'task-' + Date.now(),
    title: document.getElementById('taskTitle').value,
    description: document.getElementById('taskDesc').value,
    priority: document.getElementById('taskPriority').value,
    agent: taskAgentSelect && taskAgentSelect.value ? taskAgentSelect.value : null,
    status: status,
    progress: progress,
    category: document.getElementById('taskCategory').value || null,
    skills: skills,
    result: '',
    errorLog: ''
  };

  tasks.push(newTask);
  renderBoard();
  closeCreateTaskModal();
}

function wireEvents() {
  if (closeDetailModal) {
    closeDetailModal.addEventListener('click', () => {
      detailModal.classList.remove('active');
    });
  }

  if (detailModal) {
    detailModal.addEventListener('click', e => {
      if (e.target === detailModal) detailModal.classList.remove('active');
    });
  }

  if (closeResultModal) {
    closeResultModal.addEventListener('click', () => {
      resultModal.classList.remove('active');
    });
  }

  if (resultModal) {
    resultModal.addEventListener('click', e => {
      if (e.target === resultModal) resultModal.classList.remove('active');
    });
  }

  if (detailToggleButton) {
    detailToggleButton.addEventListener('click', () => {
      if (!detailModal) return;
      if (detailModal.classList.contains('active')) {
        detailModal.classList.remove('active');
        return;
      }
      let task = null;
      if (lastSelectedTaskId) {
        task = tasks.find(t => t.id === lastSelectedTaskId);
      }
      if (!task && tasks.length > 0) {
        task = tasks[0];
      }
      if (task) openTaskDetail(task);
    });
  }

  if (openCreateModal) {
    openCreateModal.addEventListener('click', openCreateTaskModal);
  }
  if (closeCreateModal) {
    closeCreateModal.addEventListener('click', closeCreateTaskModal);
  }
  if (cancelCreate) {
    cancelCreate.addEventListener('click', closeCreateTaskModal);
  }

  if (createModal) {
    createModal.addEventListener('click', e => {
      if (e.target === createModal) closeCreateTaskModal();
    });
  }

  if (createTaskForm) {
    createTaskForm.addEventListener('submit', e => {
      e.preventDefault();
      createTaskFromForm(false);
    });
  }

  if (createAndStartBtn) {
    createAndStartBtn.addEventListener('click', e => {
      e.preventDefault();
      createTaskFromForm(true);
    });
  }
}

function init() {
  kanbanBoard = document.getElementById('kanbanBoard');
  detailModal = document.getElementById('detailModal');
  detailModalTitle = document.getElementById('detailModalTitle');
  detailModalBody = document.getElementById('detailModalBody');
  closeDetailModal = document.getElementById('closeDetailModal');
  createModal = document.getElementById('createModal');
  openCreateModal = document.getElementById('openCreateModal');
  closeCreateModal = document.getElementById('closeCreateModal');
  createTaskForm = document.getElementById('createTaskForm');
  cancelCreate = document.getElementById('cancelCreate');
  createAndStartBtn = document.getElementById('createAndStart');
  agentCountEl = document.getElementById('agentCount');
  taskCountEl = document.getElementById('taskCount');
  agentUtilizationEl = document.getElementById('agentUtilization');
  taskAgentSelect = document.getElementById('taskAgent');
  detailToggleButton = document.getElementById('detailToggleButton');
  resultModal = document.getElementById('resultModal');
  resultModalBody = document.getElementById('resultModalBody');
  resultModalTitle = document.getElementById('resultModalTitle');
  closeResultModal = document.getElementById('closeResultModal');

  initializeAgentSelect();
  wireEvents();
  renderBoard();

  setInterval(() => {
    tasks.forEach(task => {
      if (task.status === STATUS.IN_PROGRESS) {
        if (task.progress < 95) {
          task.progress = Math.min(95, task.progress + Math.random() * 3);
        } else if (task.progress < 100) {
          task.progress = 100;
          task.status = STATUS.COMPLETED;
        }
      }
    });
    renderBoard();
  }, 4000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
