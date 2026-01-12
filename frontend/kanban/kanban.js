// #region Module State
let hiddenDragImage = null;
let dragPreview = null;
let dragPreviewOffset = { x: 0, y: 0 };
// #endregion Module State

// #region Utilities
function setText(id, text) {
  const el = document.getElementById(id);
  if (!el) {
    console.warn(`[setText] Missing element #${id}`);
    return false;
  }
  el.textContent = text;
  return true;
}

function getDashboardId() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id || isNaN(id)) return null;
  return Number(id);
}

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
// #endregion Utilities

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
  document.title = dashboard.Name;
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
  const notification = document.getElementById("taskNotification");
  notification.classList.add("show");

  try {
    const res = await fetch("/no_login_api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    });
    const saved = await res.json();
    addTaskToBoard(saved);
  } finally {
    notification.classList.remove("show");
  }
}

async function loadTasks(boardId) {
  const res = await fetch(`/no_login_api/boards/${boardId}/tasks`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const tasks = await res.json();
  tasks.forEach(addTaskToBoard);
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

async function deleteBoardRequest(boardId) {
  const res = await fetch(`/no_login_api/boards/${boardId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Unable to delete board");
  }

  return await res.json();
}
// #endregion Data Access

// #region Drag & Drop
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

function getDragAfterElement(list, mouseY) {
  const cards = [...list.querySelectorAll(".card:not(.dragging)")];

  return cards.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = mouseY - (box.top + box.height / 2);

      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      }

      return closest;
    },
    { offset: Number.NEGATIVE_INFINITY, element: null }
  ).element;
}

function attachCardDragEvents(card) {
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

function bindBoardDragEvents(board) {
  if (board.classList.contains("add-board-section")) return;
  if (board.dataset.dndBound === "1") return;

  const list = board.querySelector(".list");
  if (!list) return;

  board.dataset.dndBound = "1";

  board.addEventListener("dragover", (event) => {
    event.preventDefault();
    const dragging = document.querySelector(".card.dragging");
    if (!dragging) return;

    const afterElement = getDragAfterElement(list, event.clientY);
    if (afterElement == null) {
      list.appendChild(dragging);
    } else {
      list.insertBefore(dragging, afterElement);
    }

    board.classList.add("drag-over");
  });

  board.addEventListener("dragenter", (event) => {
    event.preventDefault();
    board.classList.add("drag-over");
  });

  board.addEventListener("dragleave", (event) => {
    const dragging = document.querySelector(".card.dragging");
    if (!board.contains(event.relatedTarget) && dragging) {
      board.classList.remove("drag-over");
    }
  });

  board.addEventListener("drop", async () => {
    board.classList.remove("drag-over");
    const dragged = document.querySelector(".card.dragging");
    if (!dragged) return;

    const targetBoardId = board.dataset.boardId;
    const ordered = [...board.querySelectorAll(".card")];

    await updateTaskPositions(targetBoardId, ordered);

    dragged.classList.add("card-drop");
    dragged.addEventListener(
      "animationend",
      () => dragged.classList.remove("card-drop"),
      { once: true }
    );
  });
}

function initializeDragAndDrop() {
  const cards = document.querySelectorAll(".card");
  const boards = document.querySelectorAll(".board");

  cards.forEach(attachCardDragEvents);
  boards.forEach(bindBoardDragEvents);
}
// #endregion Drag & Drop

// #region UI Builders
function addTaskToBoard(task) {
  const targetListId = "board-" + (task.BoardId || "");
  const board = document.getElementById(targetListId);
  if (!board) return;

  const card = document.createElement("div");
  card.classList.add("card");
  card.setAttribute("draggable", "true");
  card.dataset.id = task.TaskId;

  card.innerHTML = `
      <div class="card-title">${task.Title}</div>
      <div class="card-text">${task.Description || ""}</div>
  `;

  attachCardDragEvents(card);
  board.appendChild(card);
}

function createBoardSection(board) {
  const section = document.createElement("section");
  section.className = "board";
  section.dataset.boardId = board.BoardId;

  const header = document.createElement("header");
  header.className = "board-section-header";
  
  const nameContainer = document.createElement("div");
  nameContainer.className = "board-name-container";
  
  const name = document.createElement("div");
  name.className = "board-name";
  name.textContent = board.Name;
  name.addEventListener("click", () => {
    updateBoardName(board.BoardId, name);
  });
  nameContainer.appendChild(name);
  
  // Menu button (three dots)
  const menuButton = document.createElement("button");
  menuButton.className = "board-menu-button";
  menuButton.textContent = "⋯";
  menuButton.setAttribute("aria-label", "Board options");
  
  // Dropdown menu
  const menu = document.createElement("div");
  menu.className = "board-menu-dropdown";
  
  const moveLeftOption = document.createElement("button");
  moveLeftOption.className = "board-menu-item";
  moveLeftOption.textContent = "Move left";
  moveLeftOption.addEventListener("click", () => {
    moveBoardLeft(section);
    menu.classList.remove("show");
  });
  
  const moveRightOption = document.createElement("button");
  moveRightOption.className = "board-menu-item";
  moveRightOption.textContent = "Move right";
  moveRightOption.addEventListener("click", () => {
    moveBoardRight(section);
    menu.classList.remove("show");
  });
  
  const renameOption = document.createElement("button");
  renameOption.className = "board-menu-item";
  renameOption.textContent = "Rename";
  renameOption.addEventListener("click", () => {
    updateBoardName(board.BoardId, name);
    menu.classList.remove("show");
  });
  
  const deleteOption = document.createElement("button");
  deleteOption.className = "board-menu-item board-menu-item-danger";
  deleteOption.textContent = "Delete";
  deleteOption.addEventListener("click", async () => {
    if (confirm("Are you sure you want to delete this board?")) {
      try {
        await deleteBoardRequest(board.BoardId);
        section.remove();
      } catch (error) {
        console.error("Failed to delete board:", error);
        alert("Could not delete board");
      }
    }
    menu.classList.remove("show");
  });
  
  menu.appendChild(moveLeftOption);
  menu.appendChild(moveRightOption);
  menu.appendChild(renameOption);
  menu.appendChild(deleteOption);
  
  menuButton.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.classList.toggle("show");
  });
  
  // Close menu when clicking outside
  document.addEventListener("click", () => {
    menu.classList.remove("show");
  });
  
  nameContainer.appendChild(menuButton);
  nameContainer.appendChild(menu);
  header.appendChild(nameContainer);

  const list = document.createElement("div");
  list.className = "list";
  list.id = "board-" + board.BoardId;

  section.appendChild(header);
  section.appendChild(list);
  bindBoardDragEvents(section);

  return section;
}

function createAddBoardSection(dashboardId) {
  const section = document.createElement("section");
  section.className = "board add-board-section";

  const header = document.createElement("header");
  header.className = "board-section-header";
  const name = document.createElement("div");
  name.className = "board-name";
  name.textContent = "new board";
  header.appendChild(name);

  const form = document.createElement("form");
  form.className = "add-board-form";
  form.innerHTML = `
    <label class="sr-only" for="newBoardName">Board name</label>
    <input id="newBoardName" class="add-board-input" type="text" name="boardName" placeholder="Name" required />
    <button class="add-board-submit" type="submit">Create</button>
    <div class="add-board-hint">Creates a fresh board for this dashboard.</div>
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
      const addBoardSection = frame ? frame.querySelector(".add-board-section") : null;
      const newSection = createBoardSection(board);
      if (frame && addBoardSection) {
        frame.insertBefore(newSection, addBoardSection);
      } else if (frame) {
        frame.appendChild(newSection);
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
        if (hint) hint.textContent = "Creates a fresh board for this dashboard.";
      }, 1500);
    }
  });

  section.appendChild(header);
  section.appendChild(form);
  return section;
}

function renderBoardSections(boards, dashboardId) {
  const frame = document.querySelector(".board-frame");
  if (!frame) return;
  frame.innerHTML = "";
  boards.forEach((board) => {
    frame.appendChild(createBoardSection(board));
  });

  frame.appendChild(createAddBoardSection(dashboardId));
}
// #endregion UI Builders

// #region Helpers
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

function moveBoardLeft(boardSection) {
  const frame = boardSection.parentElement;
  const addSection = frame.querySelector(".add-board-section");
  const previousSibling = boardSection.previousElementSibling;
  
  if (previousSibling && previousSibling !== addSection) {
    frame.insertBefore(boardSection, previousSibling);
  }
}

function moveBoardRight(boardSection) {
  const frame = boardSection.parentElement;
  const addSection = frame.querySelector(".add-board-section");
  const nextSibling = boardSection.nextElementSibling;
  
  if (nextSibling && nextSibling !== addSection) {
    frame.insertBefore(boardSection, nextSibling.nextElementSibling);
  } else if (nextSibling === addSection) {
    // If the next sibling is the add section, don't move
    return;
  }
}
// #endregion Helpers

// #region Add Task Dialog
function initializeAddTaskDialog(boardId, userId) {
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
function loadDashboardIdFromUrl() {
  const dashboardId = getDashboardId();
  if (dashboardId === null) {
    console.error("Invalid dashboard ID");
    document.body.innerHTML = "<h2>Error: Invalid dashboard ID</h2>";
    return null;
  }
  return dashboardId;
}

async function initializeDashboard(dashboardId) {
  const boards = (await loadBoards(dashboardId)) || [];

  renderBoardSections(boards, dashboardId);

  if (!boards.length) {
    setText("boardTitle", "Create your first board");
    initializeDragAndDrop();
    await populateAgents();
    return;
  }

  await loadBoardName(dashboardId);

  for (const b of boards) {
    await loadTasks(b.BoardId);
  }

  initializeDragAndDrop();
  await populateAgents();

  const userId = 1; // Replace with actual user ID as needed
  initializeAddTaskDialog(boards[0].BoardId, userId);
}

document.addEventListener("DOMContentLoaded", async () => {
  const dashboardId = loadDashboardIdFromUrl();
  if (dashboardId === null) return;

  try {
    await initializeDashboard(dashboardId);
  } catch (error) {
    console.error("Error during initialization:", error);
    document.body.innerHTML = "<h2>Error: Unable to load dashboard data</h2>";
  }

});
// #endregion Initialization