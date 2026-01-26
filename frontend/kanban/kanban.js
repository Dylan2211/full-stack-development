// #region Module State

// Check authentication
requireAuth();

let hiddenDragImage = null;
let dragPreview = null;
let dragPreviewOffset = { x: 0, y: 0 };
let boardState = [];
let isCreatingBoard = false;

// State for Task Editing
let isEditingTask = false;
let editingTaskId = null;
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

// Inject CSS for Task Actions
const style = document.createElement('style');
style.textContent = `
  .card { position: relative; padding-right: 24px; }
  .card-actions {
    position: absolute;
    top: 8px;
    right: 8px;
    display: none;
    gap: 4px;
  }
  .card:hover .card-actions { display: flex; }
  .card-action-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    padding: 2px;
    opacity: 0.6;
    transition: opacity 0.2s;
  }
  .card-action-btn:hover { opacity: 1; }
  .card-action-btn.delete { color: #dc2626; }
`;
document.head.appendChild(style);
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
  if (!res.ok) {
    console.error("Failed to load boards:", res.status);
    return [];
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function loadBoardName(dashboardId) {
  const res = await authFetch(`/api/dashboards/${dashboardId}`, {
    method: "GET",
  });
  if (!res.ok) {
    console.error("Dashboard not found");
    throw new Error("Dashboard not found");
  }
  const dashboard = await res.json();
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

async function deleteBoard(boardId, targetBoardId = null) {
  const body = targetBoardId ? JSON.stringify({ targetBoardId }) : undefined;
  const res = await authFetch(`/api/boards/${boardId}`, {
    method: "DELETE",
    body,
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Unable to delete board");
  }
  // Safe return: Handle 204 No Content (empty response) which crashes JSON.parse
  if (res.status === 204) return {}; 
  return await res.json().catch(() => ({}));
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
    
    if (!res.ok) {
      const responseText = await res.text();
      alert("Failed to create task: " + responseText);
      return;
    }
    
    // Server response (might only contain ID)
    const saved = await res.json();
    
    // FIX: Merge the form data (taskData) with the server response (saved)
    // This ensures we have the BoardId, Title, and Description to update the UI immediately
    const uiTask = { ...taskData, ...saved };
    
    // Normalize casing (server might send capitalized, JS uses camelCase)
    // We ensure these exist for addTaskToBoard to use
    uiTask.BoardId = uiTask.BoardId || uiTask.boardId;
    uiTask.TaskId = uiTask.TaskId || uiTask.taskId;
    uiTask.Title = uiTask.Title || uiTask.title;
    uiTask.Description = uiTask.Description || uiTask.description;

    console.log("Updating UI with:", uiTask); // Debugging line
    addTaskToBoard(uiTask);
    
    if (taskData.aiModel) {
      executeAITask(saved.taskId || saved.TaskId, taskData.aiModel, taskData.title, taskData.description);
    }
  } catch (error) {
    console.error("Error creating task:", error);
    alert("Failed to create task: " + error.message);
  } finally {
    notification.classList.remove("show");
  }
}

async function updateTask(taskId, taskData) {
    const res = await authFetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify(taskData)
    });

    if (!res.ok) {
        throw new Error("Failed to update task");
    }

    // Refresh UI
    const card = document.querySelector(`.card[data-id="${taskId}"]`);
    if(card) {
        card.remove();
        // Re-add to show updated info (or move boards if boardId changed)
        // For simplicity, we assume board hasn't changed or we reload. 
        // Ideally we just update DOM text:
        if(taskData.title) card.querySelector(".card-title").textContent = taskData.title;
        if(taskData.description) card.querySelector(".card-text").textContent = taskData.description;
    }
    return await res.json();
}

async function deleteTask(taskId, cardElement) {
    if(!confirm("Are you sure you want to delete this task?")) return;

    try {
        const res = await authFetch(`/api/tasks/${taskId}`, {
            method: "DELETE"
        });

        if (!res.ok) throw new Error("Failed to delete task");
        
        // Remove from UI
        cardElement.remove();
    } catch (error) {
        console.error(error);
        alert("Could not delete task");
    }
}

async function executeAITask(taskId, aiModel, title, description) {
  try {
    const prompt = `Task: ${title}\nDescription: ${description}`;
    
    let apiEndpoint;
    if (aiModel === "gemini-2.5-flash") {
      apiEndpoint = "/api/ai/gemini";
    } else if (aiModel === "gpt-4o-mini") {
      apiEndpoint = "/api/ai/openai";
    } else if (aiModel === "llama-3.1-8b-instant") {
      apiEndpoint = "/api/ai/groq";
    } else {
      console.error("Unknown AI model:", aiModel);
      return;
    }
    
    const res = await authFetch(apiEndpoint, {
      method: "POST",
      body: JSON.stringify({ prompt }),
    });
    
    if (res.ok) {
      const result = await res.json();
      const aiOutput = result.output;
      
      await authFetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify({ aiOutput }),
      });
    }
  } catch (error) {
    console.error("Error executing AI task:", error);
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
  const targetListId = "board-" + (task.BoardId || task.boardId || "");
  const board = document.getElementById(targetListId);
  
  if (!board) {
    console.warn(`Board element not found for ID: ${targetListId}`, task);
    return;
  }

  const card = document.createElement("div");
  card.classList.add("card");
  card.setAttribute("draggable", "true");
  card.dataset.id = task.TaskId || task.taskId;

  // Added Actions for Edit/Delete
  card.innerHTML = `
      <div class="card-title">${task.Title || task.title || ""}</div>
      <div class="card-text">${task.Description || task.description || ""}</div>
      <div class="card-actions">
        <button class="card-action-btn edit" title="Edit">✎</button>
        <button class="card-action-btn delete" title="Delete">✖</button>
      </div>
  `;

  // --- Click Listeners ---
  
  // 1. Delete Button
  card.querySelector(".delete").addEventListener("click", (e) => {
      e.stopPropagation();
      deleteTask(task.TaskId || task.taskId, card);
  });

  // 2. Edit Button
  card.querySelector(".edit").addEventListener("click", (e) => {
      e.stopPropagation();
      openEditDialog(task);
  });

  // 3. Card Body Click (AI Output)
  card.style.cursor = "pointer";
  card.addEventListener("click", async (e) => {
    // Only fire if clicking the card body, not buttons
    if (e.target.closest(".card-action-btn")) return;
    
    const id = card.dataset.id;
    if (!id) return;
    await fetchTaskAndShow(id);
  });

  attachCardDragEvents(card);
  board.appendChild(card);
  card.style.animation = "slideIn 0.3s ease-out";
}

function createBoardSection(board) {
  const section = document.createElement("section");
  section.className = "board";
  section.dataset.boardId = board.BoardId;
  const dashboardId = board.DashboardId;

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
  
  // Menu button
  const menuButton = document.createElement("button");
  menuButton.className = "board-menu-button";
  menuButton.textContent = "⋯";
  menuButton.setAttribute("aria-label", "Board options");
  
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
    const otherBoards = boardState.filter((b) => b.BoardId !== board.BoardId);
    
    showDeleteConfirmation(otherBoards, async (targetBoardId) => {
      try {
        await deleteBoard(board.BoardId, targetBoardId);
        section.remove();

        boardState = boardState.filter((b) => b.BoardId !== board.BoardId);
        populateBoardSelect(boardState);
        if (boardState.length === 0) {
          const dashId = dashboardId || getDashboardId();
          if (dashId !== null) {
            renderBoardSections(boardState, dashId);
          }
        }
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
  
  document.addEventListener("click", () => {
    menu.classList.remove("show");
  });
  
  nameContainer.appendChild(menuButton);
  nameContainer.appendChild(menu);
  header.appendChild(nameContainer);

  const list = document.createElement("div");
  list.className = "list";
  list.id = "board-" + board.BoardId;

  const addTaskBtn = document.createElement("button");
  addTaskBtn.className = "board-add-task-btn";
  addTaskBtn.textContent = "+ Add task";
  addTaskBtn.type = "button";
  addTaskBtn.addEventListener("click", () => {
    window.openAddTaskDialog(board.BoardId);
  });
  addTaskBtn.style.display = "none";

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

async function createBoardAndInsert(dashboardId, name, onComplete = () => {}) {
  const trimmed = (name || "").trim();
  if (!trimmed || isCreatingBoard) return;

  isCreatingBoard = true;
  try {
    const board = await createBoardRequest(dashboardId, trimmed);
    boardState.push(board);
    insertBoardIntoFrame(board);
    populateBoardSelect(boardState);
    onComplete();
  } catch (error) {
    console.error("Failed to create board:", error);
    alert("Could not create board");
  } finally {
    isCreatingBoard = false;
  }
}

function insertBoardIntoFrame(board) {
  const frame = document.querySelector(".board-frame");
  if (!frame) return;

  const emptyState = frame.querySelector(".empty-state");
  if (emptyState) emptyState.remove();
  frame.classList.remove("board-frame-empty");

  let addBoardSection = frame.querySelector(".add-board-section");
  if (!addBoardSection) {
    addBoardSection = createAddBoardSection(board.DashboardId);
    frame.appendChild(addBoardSection);
  }

  const newSection = createBoardSection(board);
  frame.insertBefore(newSection, addBoardSection);
}

function createAddBoardSection(dashboardId) {
  const section = document.createElement("section");
  section.className = "board add-board-section";

  const plusButton = document.createElement("button");
  plusButton.className = "add-board-plus-button";
  plusButton.textContent = "+";
  plusButton.setAttribute("aria-label", "Add new board");
  plusButton.type = "button";

  const input = document.createElement("input");
  input.className = "add-board-input";
  input.type = "text";
  input.placeholder = "Board name";
  input.style.display = "none";

  const resetState = () => {
    input.value = "";
    input.style.display = "none";
    plusButton.style.display = "block";
    input.disabled = false;
  };

  const submit = async () => {
    input.disabled = true;
    await createBoardAndInsert(dashboardId, input.value, resetState);
  };

  plusButton.addEventListener("click", () => {
    plusButton.style.display = "none";
    input.style.display = "block";
    input.focus();
  });

  input.addEventListener("blur", async () => {
    if (!input.value.trim()) return resetState();
    await submit();
  });

  input.addEventListener("keypress", async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (!input.value.trim()) return;
      await submit();
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
  frame.classList.toggle("board-frame-empty", !boards || boards.length === 0);
  
  if (!boards || boards.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.innerHTML = `
      <div class="empty-state-content">
        <input class="empty-board-input" type="text" placeholder="Name your first board" />
        <h2>No boards yet</h2>
        <p>Create your first board to start organizing tasks</p>
      </div>
    `;
    const input = emptyState.querySelector(".empty-board-input");
    const submitEmptyState = async () => {
      if (!input || !input.value.trim()) return;
      input.disabled = true;
      await createBoardAndInsert(dashboardId, input.value, () => {
        input.value = "";
      });
      input.disabled = false;
    };

    if (input) {
      input.addEventListener("blur", submitEmptyState);
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submitEmptyState();
        }
      });
    }
    frame.appendChild(emptyState);
  } else {
    boards.forEach((board) => {
      frame.appendChild(createBoardSection(board));
    });
  }

  if (boards && boards.length > 0) {
    frame.appendChild(createAddBoardSection(dashboardId));
  }
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

function showDeleteConfirmation(otherBoards, onConfirm) {
  const dialog = document.getElementById("deleteConfirmDialog");
  const textEl = document.getElementById("deleteConfirmText");
  const confirmBtn = document.getElementById("deleteConfirmSubmit");
  const cancelBtn = document.getElementById("deleteConfirmCancel");
  
  textEl.innerHTML = "";
  
  if (otherBoards.length > 0) {
    const message = document.createElement("p");
    message.textContent = "Move all tasks to another board before deleting:";
    textEl.appendChild(message);
    
    const select = document.createElement("select");
    select.id = "targetBoardSelect";
    select.style.width = "100%";
    select.style.padding = "8px";
    select.style.marginTop = "12px";
    select.style.marginBottom = "12px";
    select.style.borderRadius = "4px";
    select.style.border = "1px solid #d0d7de";
    
    otherBoards.forEach(board => {
      const option = document.createElement("option");
      option.value = board.BoardId;
      option.textContent = board.Name;
      select.appendChild(option);
    });
    
    textEl.appendChild(select);
  } else {
    textEl.textContent = "Are you sure you want to delete this board? All tasks will be permanently deleted.";
  }

  const handleConfirm = async () => {
    dialog.close();
    cleanupListeners();
    
    const targetBoardId = otherBoards.length > 0 
      ? parseInt(document.getElementById("targetBoardSelect").value)
      : null;
    
    await onConfirm(targetBoardId);
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

async function fetchTaskAndShow(taskId) {
  try {
    const res = await authFetch(`/api/tasks/${taskId}`, { method: "GET" });
    if (!res.ok) {
      const errText = await res.text();
      showAIOutput("Error", `Unable to fetch task: ${errText}`);
      return;
    }
    const task = await res.json();
    const title = task.Title || task.title || `Task ${taskId}`;
    const aiOutput = task.AIOutput || task.aiOutput || "No AI output available for this task.";
    showAIOutput(title, aiOutput);
  } catch (err) {
    console.error("fetchTaskAndShow error:", err);
    showAIOutput("Error", "Failed to fetch task details.");
  }
}

function showAIOutput(taskTitle, aiOutput) {
  const dialog = document.createElement("dialog");
  dialog.className = "ai-output-dialog";
  dialog.innerHTML = `
    <div class="ai-output-content">
      <h2>${taskTitle}</h2>
      <div class="ai-output-text">${aiOutput.replace(/\n/g, "<br>")}</div>
      <button class="close-ai-output">Close</button>
    </div>
  `;
  
  document.body.appendChild(dialog);
  dialog.showModal();
  
  dialog.querySelector(".close-ai-output").addEventListener("click", () => {
    dialog.close();
    dialog.remove();
  });
  
  dialog.addEventListener("cancel", () => {
    dialog.remove();
  });
}

function openEditDialog(task) {
    isEditingTask = true;
    editingTaskId = task.TaskId || task.taskId;

    const dialog = document.getElementById("newTaskDialog");
    
    // Helper to safely set values
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if(el) el.value = val || "";
    };

    setVal("taskTitle", task.Title || task.title);
    setVal("taskDesc", task.Description || task.description);
    setVal("taskBoard", task.BoardId || task.boardId);
    setVal("taskSkills", task.Skills || task.skills);
    setVal("taskAIModel", task.AIModel || task.aiModel);
    
    // Change button text safely
    const btn = document.getElementById("createTask");
    if(btn) btn.textContent = "Update Task";
    
    // Change header text safely (Compatible with both HTML versions)
    const header = document.querySelector("#newTaskDialog h2");
    if(header) header.textContent = "Edit Task";
    
    // Open the dialog
    try {
        dialog.showModal(); // Try modal first (with backdrop)
    } catch (e) {
        dialog.show(); // Fallback
    }
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

  let selectedBoardId = null;

  open_btn.addEventListener("click", () => {
    // Reset state for new task
    isEditingTask = false;
    editingTaskId = null;
    form.reset();
    
    // Reset Texts safely
    const btn = document.getElementById("createTask");
    if(btn) btn.textContent = "Add Task";

    const header = document.querySelector("#newTaskDialog h2");
    if(header) header.textContent = "Create a new task";

    // Show Dialog
    try {
        dialog.showModal();
    } catch (e) {
        dialog.show();
    }

    if (selectedBoardId) {
      boardSelect.value = selectedBoardId;
    }
  });

  // Close handlers
  const closeDialog = () => dialog.close();
  if(close_btn) close_btn.addEventListener("click", closeDialog);
  if(cancel_btn) cancel_btn.addEventListener("click", closeDialog);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const boardId = parseInt(boardSelect.value);
    if (!boardId) {
      alert("Please select a board");
      return;
    }

    const title = document.getElementById("taskTitle").value.trim();
    const description = document.getElementById("taskDesc").value.trim();
    const agentSelect = document.getElementById("taskAgents");
    // Handle agent select possibly being null/missing
    const assignedAgents = agentSelect ? Array.from(agentSelect.selectedOptions).map((o) => o.value) : [];
    
    const skillsEl = document.getElementById("taskSkills");
    const skills = skillsEl ? skillsEl.value.trim() : "";
    
    const aiModelEl = document.getElementById("taskAIModel");
    const aiModel = aiModelEl ? aiModelEl.value.trim() : "";

    if (isEditingTask && editingTaskId) {
        // Handle Update
        await updateTask(editingTaskId, {
            title,
            description,
            skills,
            boardId
        });
        
        // Reload tasks to reflect changes
        const board = document.getElementById("board-" + boardId);
        if(board) {
            board.innerHTML = "";
            await loadTasks(boardId);
        }
    } else {
        // Handle Create
        await createTask({
            title,
            description,
            assignedAgents,
            skills,
            boardId,
            createdBy: userId,
            position: 0,
            status: "todo",
            aiModel: aiModel || null,
        });
    }

    form.reset();
    dialog.close();
  });

  window.openAddTaskDialog = (boardId) => {
    selectedBoardId = boardId;
    isEditingTask = false;
    editingTaskId = null;
    form.reset();
    
    const btn = document.getElementById("createTask");
    if(btn) btn.textContent = "Add Task";
    
    const header = document.querySelector("#newTaskDialog h2");
    if(header) header.textContent = "Create a new task";

    try {
        dialog.showModal();
    } catch (e) {
        dialog.show();
    }
    
    if(boardSelect) boardSelect.value = boardId;
    const titleInput = document.getElementById("taskTitle");
    if(titleInput) titleInput.focus();
  };
  
  enableDialogScroll();
}

function enableDialogScroll() {
  const dialog = document.getElementById("newTaskDialog");
  const dialogContent = dialog?.querySelector(".dialog-content");
  
  if (!dialog || !dialogContent) return;
  
  const maxHeight = window.innerHeight * 0.85;
  dialog.style.maxHeight = `${maxHeight}px`;
  dialogContent.style.maxHeight = `${maxHeight}px`;
  dialogContent.style.overflowY = "auto";
  dialogContent.style.overflowX = "hidden";
  
  const closeBtn = dialog.querySelector(".close-btn");
  if (closeBtn) {
    closeBtn.style.zIndex = "10";
    closeBtn.style.pointerEvents = "auto";
  }
  
  window.addEventListener("resize", () => {
    const newMaxHeight = window.innerHeight * 0.85;
    dialog.style.maxHeight = `${newMaxHeight}px`;
    dialogContent.style.maxHeight = `${newMaxHeight}px`;
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
  const currentUser = getUserInfoFromToken();
  const userId = currentUser?.userId || currentUser?.id;
  if (!userId) {
    throw new Error("User not authenticated");
  }
  const boards = (await loadBoards(dashboardId)) || [];
  boardState = [...boards];

  renderBoardSections(boards, dashboardId);
  await loadBoardName(dashboardId);

  if (!boards.length) {
    setText("boardTitle", "Create your first board");
    initializeDragAndDrop();
    await populateAgents();
    initializeAddTaskDialog(userId);
    return;
  }
  for (const b of boards) {
    await loadTasks(b.BoardId);
  }

  initializeDragAndDrop();
  await populateAgents();
  populateBoardSelect(boardState);
  initializeAddTaskDialog(userId);
}

document.addEventListener("DOMContentLoaded", async () => {
  const dashboardId = loadDashboardIdFromUrl();
  if (dashboardId === null) return;

  try {
    await initializeDashboard(dashboardId);
    setupSettingsButton(dashboardId);
  } catch (error) {
    console.error("Error during initialization:", error);
    document.body.innerHTML = "<h2>Error: Unable to load dashboard data</h2>";
  }

});

function setupSettingsButton(dashboardId) {
  const settingsButton = document.getElementById("settingsButton");
  if (settingsButton) {
    settingsButton.href = `/dashboard-settings?id=${dashboardId}`;
  }
}
// #endregion Initialization