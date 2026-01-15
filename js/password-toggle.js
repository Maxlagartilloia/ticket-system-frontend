document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("togglePassword");
  const input = document.getElementById("password");

  toggle.addEventListener("click", () => {
    input.type = input.type === "password" ? "text" : "password";
  });
});
