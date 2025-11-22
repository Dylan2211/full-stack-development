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
  [STATUS.ERROR]: { id: STATUS.ERROR, title: 'Error' }
};

const AGENTS = {
  'Claude-Code-v2': {
    label: 'Claude Code v2',
    icon: '🤖'
  },
  'Gemini-CLI': {
    label: 'Gemini CLI',
    icon: '✨'
  },
  'Amp-Agent': {
    label: 'Amp Agent',
    icon: '⚡'
  },
  'AutoDev-Pro': {
    label: 'AutoDev Pro',
    icon: '🛠️'
  }
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
    skills: ['Node.js', 'JWT', 'Security']
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
    skills: ['Jest', 'Testing', 'JavaScript']
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
    skills: ['SQL', 'Performance', 'Optimization']
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
    skills: ['OpenAPI', 'Documentation']
  }
];

const kanbanBoard = document.getElementById('kanbanBoard');
const detailModal = document.getElementById('detailModal');
const detailModalTitle = document.getElementById('detailModalTitle');
const detailModalBody = document.getElementById('detailModalBody');
const closeDetailModal = document.getElementById('closeDetailModal');
const createModal = document.getElementById('createModal');
const openCreateModal = document.getElementById('openCreateModal');
const closeCreateModal = document.getElementById('closeCreateModal');
const createTaskForm = document.getElementById('createTaskForm');
const cancelCreate = document.getElementById('cancelCreate');
const agentCountEl = document.getElementById('agentCount');
const taskCountEl = document.getElementById('taskCount');
const agentUtilizationEl = document.getElementById('agentUtilization');
const taskAgentSelect = document.getElementById('taskAgent');

function formatStatus(statusId) {
  const cfg = COLUMN_CONFIG[statusId];
  if (cfg) return cfg.title;
  return statusId
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

function getAgentMeta(agentId) {
  if (!agentId) return null;
  return AGENTS[agentId] || { label: agentId, icon: '🤖' };
}

function renderBoard() {
  const counts = {};
  COLUMN_ORDER.forEach(id => {
    counts[id] = 0;
  });

  tasks.forEach(task => {
    if (counts[task.status] !== undefined) {
      counts[task.status]++;
    }
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
        <div class="empty-placeholder"
             style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px;">
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
          ? `<div class="skills-list">${task.skills
              .map(s => `<span class="skills-tag">${s}</span>`)
              .join('')}</div>`
          : '';

        boardHTML += `
          <div class="task-card"
               draggable="true"
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
    card.addEventListener('click', () => {
      const taskId = card.getAttribute('data-task-id');
      const task = tasks.find(t => t.id === taskId);
      if (task) openTaskDetail(task);
    });

    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
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

let draggedTask = null;

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

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
  e.preventDefault();
  this.classList.add('drag-over');
}

function handleDragLeave(e) {
  if (!this.contains(e.relatedTarget)) {
    this.classList.remove('drag-over');
  }
}

function handleDrop(e) {
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

function openTaskDetail(task) {
  detailModalTitle.textContent = task.title;

  const agentMeta = getAgentMeta(task.agent);
  const agentLabel = agentMeta ? agentMeta.label : 'Auto-assigned';
  const agentIcon = agentMeta ? agentMeta.icon : '🎯';

  const agentDisplay = `
    <span class="agent-chip">
      <span class="agent-icon">${agentIcon}</span>
      <span class="agent-name">${agentLabel}</span>
    </span>
  `;

  const skillsHTML = task.skills && task.skills.length
    ? `<div class="skills-list">${task.skills.map(s => `<span class="skills-tag">${s}</span>`).join('')}</div>`
    : '<em>None specified</em>';

  let progressHTML = '';
  if (task.status === STATUS.IN_PROGRESS || task.status === STATUS.COMPLETED) {
    progressHTML = `
      <div class="progress-section">
        <div class="progress-labels">
          <span>AI Execution Progress</span>
          <span>${Math.round(task.progress)}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${Math.round(task.progress)}%"></div>
        </div>
      </div>
    `;
  }

  detailModalBody.innerHTML = `
    <div class="form-group">
      <label class="form-label">Description</label>
      <div class="text-sm">${task.description}</div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Priority</label>
        <div>
          <span class="priority-badge priority-${task.priority}">
            ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Assigned Agent</label>
        <div>${agentDisplay}</div>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Category</label>
      <div>${task.category || '<em>Not specified</em>'}</div>
    </div>
    <div class="form-group">
      <label class="form-label">Required Skills</label>
      <div>${skillsHTML}</div>
    </div>
    <div class="form-group">
      <label class="form-label">Status</label>
      <div class="text-sm">${formatStatus(task.status)}</div>
    </div>
    ${progressHTML}
    <div class="btn-group mt-4">
      <button class="btn btn-outline btn-sm" type="button">Reassign Agent</button>
      <button class="btn btn-outline btn-sm" type="button">View Logs</button>
      <button class="btn btn-outline btn-sm" type="button">Edit Task</button>
    </div>
  `;

  detailModal.classList.add('active');
}

function openCreateTaskModal() {
  createModal.classList.add('active');
}

function closeCreateTaskModal() {
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

closeDetailModal.addEventListener('click', () => {
  detailModal.classList.remove('active');
});

detailModal.addEventListener('click', e => {
  if (e.target === detailModal) detailModal.classList.remove('active');
});

openCreateModal.addEventListener('click', openCreateTaskModal);
closeCreateModal.addEventListener('click', closeCreateTaskModal);
cancelCreate.addEventListener('click', closeCreateTaskModal);

createModal.addEventListener('click', e => {
  if (e.target === createModal) closeCreateTaskModal();
});

createTaskForm.addEventListener('submit', e => {
  e.preventDefault();

  let skills = [];
  const skillsInput = document.getElementById('taskSkills').value.trim();
  if (skillsInput) {
    skills = skillsInput.split(',').map(s => s.trim()).filter(s => s);
  }

  const newTask = {
    id: 'task-' + Date.now(),
    title: document.getElementById('taskTitle').value,
    description: document.getElementById('taskDesc').value,
    priority: document.getElementById('taskPriority').value,
    agent: taskAgentSelect.value || null,
    status: STATUS.TODO,
    progress: 0,
    category: document.getElementById('taskCategory').value || null,
    skills: skills
  };

  tasks.push(newTask);
  renderBoard();
  closeCreateTaskModal();
});

document.addEventListener('DOMContentLoaded', () => {
  initializeAgentSelect();
  renderBoard();
});

setInterval(() => {
  tasks.forEach(task => {
    if (task.status === STATUS.IN_PROGRESS && task.progress < 95) {
      task.progress = Math.min(95, task.progress + Math.random() * 3);
    }
  });
}, 4000);
