document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault(); // ⛔ evita recarga

  const correo = document.getElementById("correo").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorDiv = document.getElementById("error");

  errorDiv.textContent = "";

  try {
    const response = await fetch(
      "https://ticket-system-backend-4h25.onrender.com/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ correo, password })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      errorDiv.textContent = data.detail || "Credenciales incorrectas";
      return;
    }

    // ✅ Guardamos token
    localStorage.setItem("token", data.access_token);

    // 🔁 Redirección
    window.location.href = "tablero.html";

  } catch (err) {
    console.error(err);
    errorDiv.textContent = "Error de conexión con el servidor";
  }
});
