let currentDashboardId = null;

// #region Data Access
// Boards
async function createBoardRequest(dashboardId, name) {
  const res = await fetch(`/no_login_api/dashboards/${dashboardId}/boards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Unable to create board");
  }

  return await res.json();
}

async function loadBoards(dashboardId) {
  const res = await fetch(`/no_login_api/dashboards/${dashboardId}/boards`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return await res.json();
}

async function loadBoardName(dashboardId) {
  const dashboard = await (await fetch(`/no_login_api/dashboards/${dashboardId}`)).json();
  if (!dashboard) {
    console.error("Dashboard not found");
    throw new Error("Dashboard not found");
  }
  setText("dashboardTitle", dashboard.Name);
}

function updateBoardName(boardId, nameElement) {
  const currentName = nameElement.textContent;
  const input = document.createElement("input");
  input.type = "text";
  input.value = currentName;
  input.className = "board-name-input";

  input.addEventListener("blur", async () => {
    const newName = input.value.trim();
    if (newName && newName !== currentName) {
      try {
        const res = await fetch(`/no_login_api/boards/${boardId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName }),
        });
        if (!res.ok) {
          throw new Error("Failed to update board name");
        }
        nameElement.textContent = newName;
      } catch (error) {
        console.error(error);
        nameElement.textContent = currentName;
      }
    } else {
      nameElement.textContent = currentName;
    }
  });

  nameElement.textContent = "";
  nameElement.appendChild(input);
  input.focus();
}

// Tasks
async function createTask(taskData) {
  const res = await fetch("/no_login_api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(taskData),
  });
  const saved = await res.json();
  addTaskToColumn(saved);
}

async function loadTasks(boardId) {
  const res = await fetch(`/no_login_api/boards/${boardId}/tasks`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const tasks = await res.json();
  tasks.forEach(addTaskToColumn);
}

async function updateTaskPositions(boardId, orderedCards) {
  await Promise.all(
    orderedCards.map((card, idx) =>
      fetch(`/no_login_api/tasks/${card.dataset.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boardId,
          position: idx,
        }),
      })
    )
  );
}

// Agents
async function loadAgents() {
  const res = await fetch("/no_login_api/agents");
  return await res.json();
}

function getDashboardId() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id || isNaN(id)) return null;
  return Number(id);
}
// #endregion Data Access

// #region Drag & Drop
let hiddenDragImage = null;
function getHiddenDragImage() {
  if (hiddenDragImage) return hiddenDragImage;
  const img = document.createElement("div");
  img.style.width = "1px";
  img.style.height = "1px";
  img.style.opacity = "0";
  img.style.position = "absolute";
  img.style.pointerEvents = "none";
  document.body.appendChild(img);
  hiddenDragImage = img;
  return img;
}

// lightweight preview that follows the cursor during native drag
let dragPreview = null;
let dragPreviewOffset = { x: 0, y: 0 };

function moveDragPreview(event) {
  if (!dragPreview) return;
  dragPreview.style.transform = `translate(${event.clientX - dragPreviewOffset.x}px, ${event.clientY - dragPreviewOffset.y}px)`;
}

function handleDragOver(event) {
  event.preventDefault();
  moveDragPreview(event);
}

function createDragPreview(card, event) {
  removeDragPreview();
  const rect = card.getBoundingClientRect();
  dragPreview = card.cloneNode(true);
  dragPreview.classList.add("drag-preview");
  dragPreview.style.width = `${rect.width}px`;
  dragPreview.style.height = `${rect.height}px`;
  document.body.appendChild(dragPreview);

  dragPreviewOffset = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };

  moveDragPreview(event);
  document.addEventListener("drag", moveDragPreview);
  document.addEventListener("dragover", handleDragOver, { passive: false });
}

function removeDragPreview() {
  if (!dragPreview) return;
  dragPreview.remove();
  dragPreview = null;
  document.removeEventListener("drag", moveDragPreview);
  document.removeEventListener("dragover", handleDragOver);
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

function attach_card_drag_events(card) {
  card.addEventListener("dragstart", (event) => {
    const hidden = getHiddenDragImage();
    event.dataTransfer?.setDragImage(hidden, 0, 0);
    createDragPreview(card, event);
    card.classList.add("dragging");
  });

  card.addEventListener("dragend", () => {
    removeDragPreview();
    card.classList.remove("dragging");
  });
}

function bind_column_drag_events(column) {
  if (column.classList.contains("add-board-column")) return;
  if (column.dataset.dndBound === "1") return;

  const list = column.querySelector(".list");
  if (!list) return;

  column.dataset.dndBound = "1";

  column.addEventListener("dragover", (event) => {
    event.preventDefault();
    const dragging = document.querySelector(".card.dragging");
    if (!dragging) return;

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

  column.addEventListener("drop", async () => {
    column.classList.remove("drag-over");
    const dragged = document.querySelector(".card.dragging");
    if (!dragged) return;

    const targetBoardId = column.dataset.boardId;
    const ordered = [...column.querySelectorAll(".card")];

    await updateTaskPositions(targetBoardId, ordered);

    dragged.classList.add("card-drop");
    dragged.addEventListener(
      "animationend",
      () => dragged.classList.remove("card-drop"),
      { once: true }
    );
  });
}

function init_drag_and_drop() {
  const cards = document.querySelectorAll(".card");
  const columns = document.querySelectorAll(".column");

  cards.forEach(attach_card_drag_events);
  columns.forEach(bind_column_drag_events);
}
// #endregion Drag & Drop

// #region UI Builders
function addTaskToColumn(task) {
  const targetListId = "board-" + (task.BoardId || "");
  const column = document.getElementById(targetListId);
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

function buildBoardColumn(board) {
  const section = document.createElement("section");
  section.className = "column";
  section.dataset.boardId = board.BoardId;

  const header = document.createElement("header");
  header.className = "column-header";
  const name = document.createElement("div");
  name.className = "column-name";
  name.textContent = board.Name;
  name.addEventListener("click", () => {
    updateBoardName(board.BoardId, name);
  });
  header.appendChild(name);

  const list = document.createElement("div");
  list.className = "list";
  list.id = "board-" + board.BoardId;

  section.appendChild(header);
  section.appendChild(list);
  bind_column_drag_events(section);

  return section;
}

function buildAddBoardColumn(dashboardId) {
  const section = document.createElement("section");
  section.className = "column add-board-column";

  const header = document.createElement("header");
  header.className = "column-header";
  const name = document.createElement("div");
  name.className = "column-name";
  name.textContent = "new board";
  header.appendChild(name);

  const form = document.createElement("form");
  form.className = "add-board-form";
  form.innerHTML = `
    <label class="sr-only" for="newBoardName">Board name</label>
    <input id="newBoardName" class="add-board-input" type="text" name="boardName" placeholder="Name" required />
    <button class="add-board-submit" type="submit">Create</button>
    <div class="add-board-hint">Creates a fresh column for this dashboard.</div>
  `;

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    const input = form.querySelector(".add-board-input");
    const hint = form.querySelector(".add-board-hint");
    if (!input) return;

    const nameValue = input.value.trim();
    if (!nameValue) return;

    try {
      form.classList.add("is-loading");
      hint.textContent = "Creating...";
      const board = await createBoardRequest(dashboardId, nameValue);
      input.value = "";
      hint.textContent = "Board created";

      const frame = document.querySelector(".board-frame");
      const addColumn = frame ? frame.querySelector(".add-board-column") : null;
      const newCol = buildBoardColumn(board);
      if (frame && addColumn) {
        frame.insertBefore(newCol, addColumn);
      } else if (frame) {
        frame.appendChild(newCol);
      }

      const boardTitle = document.getElementById("boardTitle");
      if (boardTitle && (!boardTitle.textContent || boardTitle.textContent === "Create your first board")) {
        boardTitle.textContent = board.Name;
      }
    } catch (error) {
      if (hint) hint.textContent = "Could not create board";
      console.error("Failed to create board:", error);
    } finally {
      form.classList.remove("is-loading");
      input.focus();
      setTimeout(function () {
        if (hint) hint.textContent = "Creates a fresh column for this dashboard.";
      }, 1500);
    }
  });

  section.appendChild(header);
  section.appendChild(form);
  return section;
}

function renderBoardColumns(boards, dashboardId) {
  const frame = document.querySelector(".board-frame");
  if (!frame) return;
  frame.innerHTML = "";
  boards.forEach((board) => {
    frame.appendChild(buildBoardColumn(board));
  });

  frame.appendChild(buildAddBoardColumn(dashboardId));
}
// #endregion UI Builders

// #region Helpers
function setText(id, text) {
  const el = document.getElementById(id);
  if (!el) {
    console.warn(`[setText] Missing element #${id}`);
    return false;
  }
  el.textContent = text;
  return true;
}

async function populateAgents() {
  const agentSelect = document.getElementById("taskAgents");
  const agents = await loadAgents();

  agentSelect.innerHTML = "";
  agents.forEach((a) => {
    const opt = document.createElement("option");
    opt.value = a.name;
    opt.textContent = a.name;
    agentSelect.appendChild(opt);
  });
}
// #endregion Helpers

// #region Add Task Dialog
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
    const assignedAgents = Array.from(agentSelect.selectedOptions).map((o) => o.value);
    const skills = document.getElementById("taskSkills").value.trim();

    createTask({
      title,
      description,
      assignedAgents,
      skills,
      boardId,
      createdBy: userId,
      position: 0,
      status: "todo",
    });
    dialog.close();
  });
}
// #endregion Add Task Dialog

// #region Initialization
function loadDashboardId() {
  const dashboardId = getDashboardId();
  if (dashboardId === null) {
    console.error("Invalid dashboard ID");
    document.body.innerHTML = "<h2>Error: Invalid dashboard ID</h2>";
    return null;
  }
  currentDashboardId = dashboardId;
  return dashboardId;
}

async function InitializeDashboard(dashboardId) {
  const boards = (await loadBoards(dashboardId)) || [];

  renderBoardColumns(boards, dashboardId);

  if (!boards.length) {
    setText("boardTitle", "Create your first board");
    init_drag_and_drop();
    await populateAgents();
    return;
  }

  await loadBoardName(dashboardId);

  for (const b of boards) {
    await loadTasks(b.BoardId);
  }

  init_drag_and_drop();
  await populateAgents();

  const userId = 1; // Replace with actual user ID as needed
  init_add_task(boards[0].BoardId, userId);
}

document.addEventListener("DOMContentLoaded", async () => {
  const dashboardId = loadDashboardId();
  if (dashboardId === null) return;

  try {
    await InitializeDashboard(dashboardId);
  } catch (error) {
    console.error("Error during initialization:", error);
    document.body.innerHTML = "<h2>Error: Unable to load dashboard data</h2>";
  }
});
// #endregion Initialization