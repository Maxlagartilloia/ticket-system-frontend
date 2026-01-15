// ================================
// AUTHENTICATION - COPIERMASTER
// ================================

const API_BASE_URL = "https://ticket-system-backend-4h25.onrender.com";

// Elementos del DOM
const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorBox = document.getElementById("error-message");

// Evento submit
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.textContent = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        errorBox.textContent = "Ingrese correo y contraseña.";
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        if (!response.ok) {
            throw new Error("Credenciales inválidas");
        }

        const data = await response.json();

        // Guardar sesión
        localStorage.setItem("copiermaster_token", data.access_token);
        localStorage.setItem("copiermaster_role", data.role);
        localStorage.setItem("copiermaster_user", JSON.stringify(data.user));

        // Redirección según rol
        switch (data.role) {
            case "admin":
                window.location.href = "/dashboard/admin.html";
                break;
            case "supervisor":
                window.location.href = "/dashboard/supervisor.html";
                break;
            case "tecnico":
                window.location.href = "/dashboard/tecnico.html";
                break;
            case "cliente":
                window.location.href = "/dashboard/cliente.html";
                break;
            default:
                errorBox.textContent = "Rol no reconocido.";
        }

    } catch (error) {
        errorBox.textContent = "Correo o contraseña incorrectos.";
        console.error(error);
    }
});
