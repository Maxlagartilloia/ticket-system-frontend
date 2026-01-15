document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");

  toggle.addEventListener("click", () => {
    const type =
      passwordInput.getAttribute("type") === "password"
        ? "text"
        : "password";
    passwordInput.setAttribute("type", type);
  });
});
