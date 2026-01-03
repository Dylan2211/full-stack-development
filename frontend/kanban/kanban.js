// #region loading
// no_login_api
async function fetchBoards(dashboardId) {
  const res = await fetch(`/no_login_api/dashboards/${dashboardId}/boards`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      // Include authentication token if required
    },
  });
  return await res.json();
}

// no_login_api
async function loadBoardName(boardId) {
  const res = await fetch(`/no_login_api/boards/${boardId}`);
  const board = await res.json();

  // UPDATE THE TITLE
  document.getElementById("boardTitle").textContent = board.Name;
}

// no_login_api
async function loadTasks(boardId) {
  console.log("Loading tasks for board:", boardId);
  const res = await fetch(`/no_login_api/boards/${boardId}/tasks`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      // Include authentication token if required
    },
  });
  const tasks = await res.json();

  tasks.forEach((task) => {
    addTaskToColumn(task);
    console.log("Loaded task:", task);
  });
}

// no_login_api
async function loadAgents() {
  const res = await fetch("/no_login_api/agents");
  return await res.json();
}

function getDashboardId() {
  var params = new URLSearchParams(window.location.search);
  var id = params.get("id");
  if (!id || isNaN(id)) return null;
  return Number(id);
}

// #endregion loading

// #region Tasks

function attach_card_drag_events(card) {
  card.addEventListener("dragstart", () => {
    card.classList.add("dragging");
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
  });
}

function get_drag_after_element(list, mouse_y) {
  const cards = [...list.querySelectorAll(".card:not(.dragging)")];

  return cards.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = mouse_y - (box.top + box.height / 2);

      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      }

      return closest;
    },
    { offset: Number.NEGATIVE_INFINITY, element: null }
  ).element;
}

function init_drag_and_drop() {
  const cards = document.querySelectorAll(".card");
  const columns = document.querySelectorAll(".column");

  cards.forEach(attach_card_drag_events);

  columns.forEach((column) => {
    const list = column.querySelector(".list");
    if (!list) {
      return;
    }

    column.addEventListener("dragover", (event) => {
      event.preventDefault();
      const dragging = document.querySelector(".card.dragging");
      if (!dragging) {
        return;
      }

      const after_element = get_drag_after_element(list, event.clientY);
      if (after_element == null) {
        list.appendChild(dragging);
      } else {
        list.insertBefore(dragging, after_element);
      }

      column.classList.add("drag-over");
    });

    column.addEventListener("dragenter", (event) => {
      event.preventDefault();
      column.classList.add("drag-over");
    });

    column.addEventListener("dragleave", (event) => {
      const dragging = document.querySelector(".card.dragging");
      if (!column.contains(event.relatedTarget) && dragging) {
        column.classList.remove("drag-over");
      }
    });

    column.addEventListener("drop", () => {
      column.classList.remove("drag-over");
    });
  });
}

// #endregion Tasks

// #region Add Task
function init_add_task(boardId, userId) {
  const dialog = document.getElementById("newTaskDialog");
  const open_btn = document.getElementById("new-task-trigger");
  const close_btn = document.getElementById("closeTask");
  const cancel_btn = document.getElementById("cancelTask");
  const form = document.getElementById("taskForm");

  open_btn.addEventListener("click", () => {
    dialog.show();
  });

  close_btn.addEventListener("click", () => dialog.close());
  cancel_btn.addEventListener("click", () => dialog.close());

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("taskTitle").value.trim();
    const description = document.getElementById("taskDesc").value.trim();

    const agentSelect = document.getElementById("taskAgents");
    const assignedAgents = Array.from(agentSelect.selectedOptions).map(
      (o) => o.value
    );
    const skills = document.getElementById("taskSkills").value.trim();

    add_task({
      title,
      description,
      assignedAgents,
      skills,
      boardId: boardId, // ← required
      createdBy: userId, // ← required
      position: 0,
      status: "todo",
    });
    dialog.close();
  });
}

// no_login_api
async function add_task(taskData) {
  // POST the task to your backend API
  const res = await fetch("/no_login_api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(taskData),
  });

  const saved = await res.json();

  // Add it to UI
  addTaskToColumn(saved);
}

function addTaskToColumn(task) {
  var targetListId = "board-" + (task.BoardId || "");
  var column = document.getElementById(targetListId);
  if (!column) return;

  const card = document.createElement("div");
  card.classList.add("card");
  card.setAttribute("draggable", "true");
  card.dataset.id = task.TaskId;

  card.innerHTML = `
      <div class="card-title">${task.Title}</div>
      <div class="card-text">${task.Description || ""}</div>
  `;

  attach_card_drag_events(card);
  column.appendChild(card);
}

async function populateAgents() {
  const agentSelect = document.getElementById("taskAgents");

  const agents = await loadAgents();

  agentSelect.innerHTML = ""; // clear old options

  agents.forEach((a) => {
    const opt = document.createElement("option");
    opt.value = a.name;
    opt.textContent = a.name;
    agentSelect.appendChild(opt);
  });
}

function renderBoardColumns(boards) {
  var frame = document.querySelector(".board-frame");
  if (!frame) return;
  frame.innerHTML = "";
  boards.forEach(function (board) {
    var section = document.createElement("section");
    section.className = "column";
    section.dataset.boardId = board.BoardId;

    var header = document.createElement("header");
    header.className = "column-header";
    var name = document.createElement("div");
    name.className = "column-name";
    name.textContent = board.Name;
    header.appendChild(name);

    var list = document.createElement("div");
    list.className = "list";
    list.id = "board-" + board.BoardId;

    section.appendChild(header);
    section.appendChild(list);
    frame.appendChild(section);
  });
}

// #endregion Add Task

// #region Initialization
document.addEventListener("DOMContentLoaded", async () => {
  var dashboardId = getDashboardId();
  if (dashboardId === null) {
    console.error("Invalid dashboard ID");
    document.body.innerHTML = "<h2>Error: Invalid dashboard ID</h2>";
    return;
  }
  try {
  // Fetch boards for this dashboard
  const boards = await fetchBoards(dashboardId);

  // Check if boards exist
  if (!boards || boards.length === 0) {
    console.log("No boards found for this dashboard");
    return;
  }

  // Render columns from board names
  renderBoardColumns(boards);

  // Use the first board for title/load
  const boardId = boards[0].BoardId;

  // Load board data
  await loadBoardName(boardId);

  // Load tasks for each board
  for (const b of boards) {
    await loadTasks(b.BoardId);
  }

  // Initialize UI
  init_drag_and_drop();
  await populateAgents();
  
  const userId = 1; // Replace with actual user ID as needed
  init_add_task(boardId, userId);
  } catch (error) {
    console.error("Error during initialization:", error);
    document.body.innerHTML = "<h2>Error: Unable to load dashboard data</h2>";
  }
});
// #endregion Initialization
