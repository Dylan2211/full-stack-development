// data
let tasks = [
  {
    id: '1',
    title: 'Implement user auth API',
    description: 'JWT-based login with rate limiting, brute-force protection, and audit logging.',
    priority: 'high',
    agent: null,
    status: 'todo',
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
    status: 'in-progress',
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
    status: 'review',
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
    status: 'done',
    progress: 100,
    category: 'Documentation',
    skills: ['OpenAPI', 'Documentation']
  }
];

const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'review', title: 'AI Review' },
  { id: 'done', title: 'Done' }
];

// DOm elements
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

// render board
function renderBoard() {
  const counts = { 'todo': 0, 'in-progress': 0, 'review': 0, 'done': 0 };
  tasks.forEach(task => counts[task.status]++);

  const activeAgents = new Set(tasks.filter(t => t.agent).map(t => t.agent)).size;
  agentCountEl.textContent = activeAgents;
  taskCountEl.textContent = tasks.length;

  let boardHTML = '';
  COLUMNS.forEach(col => {
    const colTasks = tasks.filter(t => t.status === col.id);
    const colClass = `col-${col.id.replace('-', '')}`;
    boardHTML += `
      <div class="column" data-column="${col.id}" id="col-${col.id}">
        <div class="column-header">
          <div class="column-title">${col.title}</div>
          <div class="column-count">${counts[col.id]}</div>
        </div>
    `;
    if (colTasks.length === 0) {
      boardHTML += `<div class="empty-placeholder" style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px;">Drag tasks here</div>`;
    } else {
      colTasks.forEach(task => {
        const agentDisplay = task.agent || '— Auto —';
        
        // Render skills
        const skillsHTML = task.skills && task.skills.length 
          ? `<div class="skills-list">${task.skills.map(s => `<span class="skills-tag">${s}</span>`).join('')}</div>`
          : '';
        
        boardHTML += `
          <div class="task-card" 
               draggable="true" 
               data-task-id="${task.id}"
               data-status="${task.status}">
            <div class="task-title">${task.title}</div>
            <div class="task-desc">${task.description}</div>
            <div class="task-meta">
              <span class="priority-badge priority-${task.priority}">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
              <span class="agent-tag">${agentDisplay}</span>
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
    card.addEventListener('click', (e) => {
      if (e.target.closest('.task-card')) {
        const taskId = card.getAttribute('data-task-id');
        const task = tasks.find(t => t.id === taskId);
        openTaskDetail(task);
      }
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
}

// drag and drop
let draggedTask = null;

function handleDragStart(e) {
  draggedTask = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', '');
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

  if (draggedTask) {
    const taskId = draggedTask.getAttribute('data-task-id');
    const newStatus = this.getAttribute('data-column');
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      task.status = newStatus;
      if (newStatus === 'todo' || newStatus === 'in-progress') {
        task.progress = Math.min(task.progress, 95);
      }
      renderBoard();
    }
  }
}

// task detail
function openTaskDetail(task) {
  detailModalTitle.textContent = task.title;
  
  const agentDisplay = task.agent 
    ? `<span class="agent-tag">${task.agent}</span>` 
    : '<em>Auto-assigned</em>';
  
  // render skills
  const skillsHTML = task.skills && task.skills.length 
    ? `<div class="skills-list">${task.skills.map(s => `<span class="skills-tag">${s}</span>`).join('')}</div>`
    : '<em>None specified</em>';
  
  let progressHTML = '';
  if (task.status === 'in-progress' || task.status === 'review') {
    progressHTML = `
      <div class="progress-section">
        <div class="progress-labels">
          <span>AI Execution Progress</span>
          <span>${task.progress}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${task.progress}%"></div>
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
        <div><span class="priority-badge priority-${task.priority}">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span></div>
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
      <div class="text-sm">${task.status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
    </div>
    ${progressHTML}
    <div class="btn-group mt-4">
      <button class="btn btn-outline btn-sm">Reassign Agent</button>
      <button class="btn btn-outline btn-sm">View Logs</button>
      <button class="btn btn-outline btn-sm">Edit Task</button>
    </div>
  `;
  detailModal.classList.add('active');
}

// modal create task
function openCreateTaskModal() {
  createModal.classList.add('active');
}

function closeCreateTaskModal() {
  createModal.classList.remove('active');
  createTaskForm.reset();
}

// event listener
closeDetailModal.addEventListener('click', () => {
  detailModal.classList.remove('active');
});

detailModal.addEventListener('click', (e) => {
  if (e.target === detailModal) detailModal.classList.remove('active');
});

openCreateModal.addEventListener('click', openCreateTaskModal);

closeCreateModal.addEventListener('click', closeCreateTaskModal);

cancelCreate.addEventListener('click', closeCreateTaskModal);

createModal.addEventListener('click', (e) => {
  if (e.target === createModal) closeCreateTaskModal();
});

createTaskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  // Process skills input
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
    agent: document.getElementById('taskAgent').value || null,
    status: 'todo',
    progress: 0,
    category: document.getElementById('taskCategory').value || null,
    skills: skills
  };
  tasks.push(newTask);
  renderBoard();
  closeCreateTaskModal();
});


document.addEventListener('DOMContentLoaded', () => {
  renderBoard();
});

// Live progress simulation
setInterval(() => {
  tasks.forEach(task => {
    if (task.status === 'in-progress' && task.progress < 95) {
      task.progress = Math.min(95, task.progress + Math.random() * 3);
    }
  });
}, 4000);