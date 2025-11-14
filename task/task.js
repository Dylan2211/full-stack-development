document.addEventListener("DOMContentLoaded", () => {
  const closeBtn = document.getElementById("closeTask");
  const cancelBtn = document.getElementById("cancelTask");
  const form = document.getElementById("taskForm");

  // Close popup and go back to mainpage
  const closePopup = () => {
    window.location.href = "../mainpage.html";
  };

  closeBtn.addEventListener("click", closePopup);
  cancelBtn.addEventListener("click", closePopup);

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("taskTitle").value.trim();
    const desc = document.getElementById("taskDesc").value.trim();
    const agent = document.getElementById("taskAgent").value;

    // Save task (could be localStorage or backend later)
    console.log("New Task Created:", { title, desc, agent });

    alert("Task created successfully!");
    closePopup();
  });
});
