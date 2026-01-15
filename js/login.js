const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

togglePassword.addEventListener("click", () => {
  const type = passwordInput.getAttribute("type") === "password"
    ? "text"
    : "password";
  passwordInput.setAttribute("type", type);
});

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  alert(
    "LOGIN AÚN NO FUNCIONA\n\n" +
    "El frontend está listo.\n" +
    "Falta activar la validación en el backend."
  );
});
