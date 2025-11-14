document.addEventListener("DOMContentLoaded", () => {
  const profileBtn = document.querySelector(".my-profile");
  const newTaskBtn = document.querySelector(".new-task");
  const lists = document.querySelectorAll(".list");

  if (profileBtn) {
    profileBtn.addEventListener("click", () => {
      window.location.href = "profile.html";
    });
  }

  if (newTaskBtn) {
    newTaskBtn.addEventListener("click", handleNewTask);
  }

  // Attach drag behaviour to existing cards
  document.querySelectorAll(".card").forEach(card => {
    attachCardDragEvents(card);
  });

  // Column list events
  lists.forEach(list => {
    const allowDrop = list.dataset.allowDrop !== "false";

    list.addEventListener("dragover", e => {
      if (!allowDrop) {
        return; // cannot drop into this column (e.g. Failed)
      }
      e.preventDefault();
      const draggingCard = document.querySelector(".card.dragging");
      if (!draggingCard) return;

      const afterElement = getDragAfterElement(list, e.clientY);
      if (afterElement == null) {
        list.appendChild(draggingCard);
      } else {
        list.insertBefore(draggingCard, afterElement);
      }
    });

    list.addEventListener("dragenter", e => {
      if (!allowDrop) {
        return;
      }
      e.preventDefault();
      list.classList.add("over");
    });

    list.addEventListener("dragleave", () => {
      if (!allowDrop) {
        return;
      }
      if (!list.contains(document.querySelector(".card.dragging"))) {
        list.classList.remove("over");
      }
    });

    list.addEventListener("drop", () => {
      if (!allowDrop) {
        return;
      }
      list.classList.remove("over");
    });
  });
});

function attachCardDragEvents(card) {
  card.addEventListener("dragstart", () => {
    card.classList.add("dragging");
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
  });
}

// Determine where to place the dragged card relative to others
function getDragAfterElement(container, mouseY) {
  const draggableElements = [
    ...container.querySelectorAll(".card:not(.dragging)")
  ];

  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = mouseY - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      }

      return closest;
    },
    { offset: Number.NEGATIVE_INFINITY, element: null }
  ).element;
}

// Simple "New Task" creator – adds a card to the To Do column (front-end only for now)
function handleNewTask() {
  const title = window.prompt("Task title");
  if (!title) {
    return;
  }

  const description = window.prompt("Short description (optional)") || "";

  const todoList = document.getElementById("todo");
  if (!todoList) {
    return;
  }

  const newId = "t-" + Date.now().toString();

  const card = document.createElement("article");
  card.classList.add("card");
  card.setAttribute("draggable", "true");
  card.dataset.id = newId;

  const titleDiv = document.createElement("div");
  titleDiv.classList.add("title");
  titleDiv.textContent = title;

  const smallDiv = document.createElement("div");
  smallDiv.classList.add("small");
  smallDiv.textContent = description || "Newly created task";

  card.appendChild(titleDiv);
  card.appendChild(smallDiv);

  todoList.appendChild(card);
  attachCardDragEvents(card);
}
