// ================================
// LOGIN - COPIERMASTER
// ================================

const API_BASE_URL = "https://ticket-system-backend-4h25.onrender.com";

// 🔐 Si ya hay sesión activa, redirigir automáticamente
const existingToken = localStorage.getItem("copiermaster_token");
if (existingToken) {
  window.location.href = "dashboard.html";
}

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // ✅ ID ALINEADO CON index.html
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const error = await res.json();
      document.getElementById("error").textContent =
        error.detail || "Invalid credentials";
      return;
    }

    const data = await res.json();

    // 🔐 TOKEN UNIFICADO (REGLA ABSOLUTA)
    localStorage.setItem("copiermaster_token", data.access_token);
    localStorage.setItem("copiermaster_role", data.role);

    // 🚀 REDIRECCIÓN POST-LOGIN
    window.location.href = "dashboard.html";

  } catch (err) {
    console.error("Login error:", err);
    document.getElementById("error").textContent =
      "Server connection error";
  }
});
