// AUTH GUARD
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "index.html";
}

// LOGOUT
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "index.html";
});
