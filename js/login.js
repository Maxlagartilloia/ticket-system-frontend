const API_BASE_URL = "https://ticket-system-backend-4h25.onrender.com";

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    if (!res.ok) {
      const error = await res.json();
      alert(error.detail || "Credenciales inválidas");
      return;
    }

    const data = await res.json();

    // 🔐 GUARDADO CORRECTO
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("user_role", data.role);

    // 🚀 REDIRECCIÓN
    window.location.href = "dashboard.html";

  } catch (err) {
    console.error("Login error:", err);
    alert("Error conectando con el servidor");
  }
});
