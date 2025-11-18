document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const userId = document.getElementById("userId").value.trim();

    if (userId !== "") {
      // Store user ID in localStorage
      localStorage.setItem("loggedInUserId", userId);

      // Redirect to main page (or profile first, up to you)
      window.location.href = "mainpage.html";
    } else {
      alert("Please enter your User ID to log in.");
    }
  });
});
