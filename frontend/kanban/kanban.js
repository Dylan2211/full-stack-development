// #region Module State

// Check authentication
requireAuth();

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
  const res = await authFetch(`/api/dashboards/${dashboardId}/boards`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Unable to create board");
  }

  return await res.json();
}

async function loadBoards(dashboardId) {
  const res = await authFetch(`/api/dashboards/${dashboardId}/boards`, {
    method: "GET",
  });
  return await res.json();
}

async function loadBoardName(dashboardId) {
  const dashboard = await authFetch(`/api/dashboards/${dashboardId}`, {
    method: "GET",
  });
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
        const res = await authFetch(`/api/boards/${boardId}`, {
          method: "PUT",
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

async function deleteBoard(boardId) {
  const res = await authFetch(`/api/boards/${boardId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Unable to delete board");
  }
  return await res.json();
}

// Tasks
async function createTask(taskData) {
  const notification = document.getElementById("taskNotification");
  notification.classList.add("show");

  try {
    const res = await authFetch("/api/tasks", {
      method: "POST",
      body: JSON.stringify(taskData),
    });
    const saved = await res.json();
    addTaskToBoard(saved);
  } finally {
    notification.classList.remove("show");
  }
}

async function loadTasks(boardId) {
  const res = await authFetch(`/api/boards/${boardId}/tasks`, {
    method: "GET",
  });
  const tasks = await res.json();
  tasks.forEach(addTaskToBoard);
}

async function updateTaskPositions(boardId, orderedCards) {
  await Promise.all(
    orderedCards.map((card, idx) =>
      authFetch(`/api/tasks/${card.dataset.id}`, {
        method: "PUT",
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
  const res = await authFetch("/api/agents");
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
    showDeleteConfirmation(async () => {
      try {
        await deleteBoard(board.BoardId);
        section.remove();
      } catch (error) {
        console.error("Failed to delete board:", error);
        alert("Could not delete board");
      }
    });
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

  // Create add task button for this board
  const addTaskBtn = document.createElement("button");
  addTaskBtn.className = "board-add-task-btn";
  addTaskBtn.textContent = "+ Add task";
  addTaskBtn.type = "button";
  addTaskBtn.addEventListener("click", () => {
    window.openAddTaskDialog(board.BoardId);
  });
  addTaskBtn.style.display = "none";

  // Show/hide add task button on hover
  section.addEventListener("mouseenter", () => {
    addTaskBtn.style.display = "block";
  });

  section.addEventListener("mouseleave", () => {
    addTaskBtn.style.display = "none";
  });

  section.appendChild(header);
  section.appendChild(list);
  section.appendChild(addTaskBtn);
  bindBoardDragEvents(section);

  return section;
}

function createAddBoardSection(dashboardId) {
  const section = document.createElement("section");
  section.className = "board add-board-section";

  // Create the plus button
  const plusButton = document.createElement("button");
  plusButton.className = "add-board-plus-button";
  plusButton.textContent = "+";
  plusButton.setAttribute("aria-label", "Add new board");
  plusButton.type = "button";

  // Create the input (initially hidden)
  const input = document.createElement("input");
  input.className = "add-board-input";
  input.type = "text";
  input.placeholder = "Board name";
  input.style.display = "none";

  plusButton.addEventListener("click", () => {
    plusButton.style.display = "none";
    input.style.display = "block";
    input.focus();
  });

  input.addEventListener("blur", async () => {
    const nameValue = input.value.trim();
    if (!nameValue) {
      input.style.display = "none";
      plusButton.style.display = "block";
      return;
    }

    try {
      input.disabled = true;
      const board = await createBoardRequest(dashboardId, nameValue);
      input.value = "";

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

      input.style.display = "none";
      plusButton.style.display = "block";
    } catch (error) {
      console.error("Failed to create board:", error);
      alert("Could not create board");
      input.disabled = false;
    }
  });

  input.addEventListener("keypress", async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const nameValue = input.value.trim();
      if (!nameValue) return;

      try {
        input.disabled = true;
        const board = await createBoardRequest(dashboardId, nameValue);
        input.value = "";

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

        input.style.display = "none";
        plusButton.style.display = "block";
      } catch (error) {
        console.error("Failed to create board:", error);
        alert("Could not create board");
      } finally {
        input.disabled = false;
      }
    }
  });

  section.appendChild(plusButton);
  section.appendChild(input);
  return section;
}

function renderBoardSections(boards, dashboardId) {
  const frame = document.querySelector(".board-frame");
  if (!frame) return;
  frame.innerHTML = "";
  
  if (!boards || boards.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.innerHTML = `
      <div class="empty-state-content">
        <h2>No boards yet</h2>
        <p>Create your first board to start organizing tasks</p>
      </div>
    `;
    frame.appendChild(emptyState);
  } else {
    boards.forEach((board) => {
      frame.appendChild(createBoardSection(board));
    });
  }

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

function populateBoardSelect(boards) {
  const boardSelect = document.getElementById("taskBoard");
  boardSelect.innerHTML = "";
  boards.forEach((board) => {
    const opt = document.createElement("option");
    opt.value = board.BoardId;
    opt.textContent = board.Name;
    boardSelect.appendChild(opt);
  });
}

function moveBoardLeft(boardSection) {
  const frame = boardSection.parentElement;
  const boards = [...frame.querySelectorAll(".board:not(.add-board-section)")];
  const currentIndex = boards.indexOf(boardSection);
  
  if (currentIndex > 0) {
    frame.insertBefore(boardSection, boards[currentIndex - 1]);
    updateBoardPositions(frame);
  }
}

function moveBoardRight(boardSection) {
  const frame = boardSection.parentElement;
  const boards = [...frame.querySelectorAll(".board:not(.add-board-section)")];
  const currentIndex = boards.indexOf(boardSection);
  
  if (currentIndex < boards.length - 1) {
    frame.insertBefore(boardSection, boards[currentIndex + 1].nextElementSibling);
    updateBoardPositions(frame);
  }
}

async function updateBoardPositions(frame) {
  const boards = [...frame.querySelectorAll(".board:not(.add-board-section)")];
  
  await Promise.all(
    boards.map((board, index) =>
      authFetch(`/api/boards/${board.dataset.boardId}`, {
        method: "PUT",
        body: JSON.stringify({ position: index }),
      })
    )
  );
}

function showDeleteConfirmation(onConfirm) {
  const dialog = document.getElementById("deleteConfirmDialog");
  const confirmBtn = document.getElementById("deleteConfirmSubmit");
  const cancelBtn = document.getElementById("deleteConfirmCancel");

  const handleConfirm = async () => {
    dialog.close();
    cleanupListeners();
    await onConfirm();
  };

  const handleCancel = () => {
    dialog.close();
    cleanupListeners();
  };

  const cleanupListeners = () => {
    confirmBtn.removeEventListener("click", handleConfirm);
    cancelBtn.removeEventListener("click", handleCancel);
  };

  confirmBtn.addEventListener("click", handleConfirm);
  cancelBtn.addEventListener("click", handleCancel);
  dialog.showModal();
}
// #endregion Helpers

// #region Add Task Dialog
function initializeAddTaskDialog(userId) {
  const dialog = document.getElementById("newTaskDialog");
  const open_btn = document.getElementById("new-task-trigger");
  const close_btn = document.getElementById("closeTask");
  const cancel_btn = document.getElementById("cancelTask");
  const form = document.getElementById("taskForm");
  const boardSelect = document.getElementById("taskBoard");

  // Store the default/selected board
  let selectedBoardId = null;

  open_btn.addEventListener("click", () => {
    dialog.show();
    if (selectedBoardId) {
      boardSelect.value = selectedBoardId;
    }
  });

  close_btn.addEventListener("click", () => dialog.close());
  cancel_btn.addEventListener("click", () => dialog.close());

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const boardId = parseInt(boardSelect.value);
    if (!boardId) {
      alert("Please select a board");
      return;
    }

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

    // Reset form
    form.reset();
    dialog.close();
  });

  // Expose a method to set the board and open dialog
  window.openAddTaskDialog = (boardId) => {
    selectedBoardId = boardId;
    dialog.show();
    boardSelect.value = boardId;
    document.getElementById("taskTitle").focus();
  };
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
    const userId = 1; // Replace with actual user ID as needed
    initializeAddTaskDialog(userId);
    return;
  }

  await loadBoardName(dashboardId);

  for (const b of boards) {
    await loadTasks(b.BoardId);
  }

  initializeDragAndDrop();
  await populateAgents();
  populateBoardSelect(boards);

  const userId = 1; // Replace with actual user ID as needed
  initializeAddTaskDialog(userId);
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