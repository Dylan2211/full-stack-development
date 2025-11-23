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

function init_navigation() {
  const add_button = document.getElementById("new-task-trigger");
  if (add_button) {
    add_button.addEventListener("click", () => {
      // go to the new task overlay page
      window.location.href = "newtask.html";
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  init_drag_and_drop();
  init_navigation();
});
