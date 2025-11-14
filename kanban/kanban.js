// Redirect to profile page when "My Profile" is clicked
document.addEventListener("DOMContentLoaded", () => {
  const profileBtn = document.querySelector(".my-profile");
  if (profileBtn) {
    profileBtn.addEventListener("click", () => {
      window.location.href = "profile.html";
    });
  }
});
document.addEventListener("DOMContentLoaded", () => {
  const newTaskBtn = document.getElementById("newTaskBtn");
  const overlay = document.getElementById("newTaskOverlay");
  const closeBtn = document.getElementById("closeNewTask");
  const form = document.getElementById("newTaskForm");

  // Open overlay
  newTaskBtn.addEventListener("click", () => {
    overlay.classList.remove("hidden");
  });

  // Close overlay
  closeBtn.addEventListener("click", () => {
    overlay.classList.add("hidden");
  });

  // Click outside overlay closes it
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.add("hidden");
  });

  // Handle form submission
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("taskTitle").value;
    const desc = document.getElementById("taskDesc").value;
    const agent = document.getElementById("taskAgent").value;

    const todoList = document.getElementById("todo");
    const newCard = document.createElement("div");
    newCard.classList.add("card");
    newCard.draggable = true;
    newCard.innerHTML = `
      <div class="title">${title}</div>
      <div class="small">${desc || "Assigned to: " + agent}</div>
    `;
    todoList.appendChild(newCard);

    form.reset();
    overlay.classList.add("hidden");
  });
});
