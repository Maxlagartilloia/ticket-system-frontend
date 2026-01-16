// ==========================================
// LOGIN LOGIC - COPIERMASTER LEAD ENGINEER
// ==========================================

// ✅ URL DE TU BACKEND EN RENDER (Ajustada según tu configuración)
const API_BASE_URL = "https://ticket-system-backend-4h25.onrender.com";

// 🔐 Guardia de Seguridad: Si ya hay sesión, saltar login
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("copiermaster_token");
    if (token) {
        window.location.href = "dashboard.html";
    }
});

const loginForm = document.getElementById("loginForm");
const errorDiv = document.getElementById("error");

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorDiv.textContent = "Connecting..."; 

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // 💾 ALMACENAMIENTO UNIFICADO PARA EL SISTEMA
            localStorage.setItem("copiermaster_token", data.access_token);
            localStorage.setItem("copiermaster_role", data.role);
            localStorage.setItem("copiermaster_user", email);

            // 🚀 REDIRECCIÓN AUTOMÁTICA
            // Nota: En CopierMaster el dashboard es unificado pero muestra datos por rol
            window.location.href = "dashboard.html";
        } else {
            // Manejo de errores del Backend (401, 403, 422)
            errorDiv.textContent = data.detail || "Authentication failed";
            console.error("Auth status:", response.status);
        }
    } catch (err) {
        console.error("Network error:", err);
        errorDiv.textContent = "Cannot reach server. Please check your connection.";
    }
});
