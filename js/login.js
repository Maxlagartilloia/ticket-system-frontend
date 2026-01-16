const API_BASE_URL = "https://ticket-system-backend-4h25.onrender.com";

const loginForm = document.getElementById("loginForm");
const errorDiv = document.getElementById("error");

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorDiv.textContent = "Validando acceso..."; 

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Enviamos como Form Data para OAuth2
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("copiermaster_token", data.access_token);
            localStorage.setItem("copiermaster_role", data.role);
            localStorage.setItem("copiermaster_user", data.full_name);
            window.location.href = "dashboard.html";
        } else {
            errorDiv.textContent = data.detail || "Error al ingresar";
        }
    } catch (err) {
        errorDiv.textContent = "Servidor no disponible en este momento.";
    }
});
