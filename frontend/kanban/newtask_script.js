document.addEventListener("DOMContentLoaded", () => {
  const close_btn = document.getElementById("closeTask");
  const cancel_btn = document.getElementById("cancelTask");
  const form = document.getElementById("taskForm");

  const close_popup = () => {
    // both files in same folder
    window.location.href = "kanban.html";
  };

  if (close_btn) {
    close_btn.addEventListener("click", close_popup);
  }

  if (cancel_btn) {
    cancel_btn.addEventListener("click", close_popup);
  }

  if (form) {
    form.addEventListener("submit", event => {
      event.preventDefault();

      const title = document.getElementById("taskTitle").value.trim();
      const desc = document.getElementById("taskDesc").value.trim();
      const agent = document.getElementById("taskAgent").value;

      console.log("new task created:", { title, desc, agent });

      alert("task created successfully!");
      close_popup();
    });
  }
});
