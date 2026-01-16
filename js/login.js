// ==========================================
// LOGIN LOGIC - COPIERMASTER LEAD ENGINEER
// ==========================================

const API_BASE_URL = "https://ticket-system-backend-4h25.onrender.com";

// 🔐 Guardia de Seguridad
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

    // 🚀 CAMBIO CRÍTICO: Usamos URLSearchParams para enviar como FORM-DATA
    const formData = new URLSearchParams();
    formData.append("username", email); // OAuth2 requiere que el campo se llame 'username'
    formData.append("password", password);

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded" // El formato que espera el Backend
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("copiermaster_token", data.access_token);
            localStorage.setItem("copiermaster_role", data.role);
            localStorage.setItem("copiermaster_user", email);

            window.location.href = "dashboard.html";
        } else {
            errorDiv.textContent = data.detail || "Authentication failed";
            console.error("Auth status:", response.status);
        }
    } catch (err) {
        console.error("Network error:", err);
        errorDiv.textContent = "Cannot reach server. Please check your connection.";
    }
});
