// document.addEventListener("DOMContentLoaded", () => {
//   // Retrieve stored user ID from localStorage
//   const userId = localStorage.getItem("loggedInUserId");

//   if (userId) {
//     document.getElementById("userId").textContent = userId;

//     // Optional: dynamically set name or avatar based on userId
//     document.getElementById("name").textContent = "Employee " + userId;
//     document.getElementById("avatar").textContent = userId
//       .slice(-2)
//       .toUpperCase(); // last 2 digits
//   } else {
//     // If no user ID found, redirect to login
//     window.location.href = "../login/login.html";
//   }

//   // Logout function
//   document.getElementById("logoutBtn").addEventListener("click", () => {
//     localStorage.removeItem("loggedInUserId"); // clear saved user
//     window.location.href = "login.html";
//   });
// });
