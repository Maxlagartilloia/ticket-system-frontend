const API_BASE_URL = "https://ticket-system-backend-4h25.onrender.com";

const loginForm = document.getElementById("loginForm");
const errorDiv = document.getElementById("error");

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorDiv.textContent = "Conectando..."; 

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // 🚀 IMPORTANTE: Usamos FormData para enviar como formulario real
    const formData = new FormData();
    formData.append("username", email); // FastAPI espera 'username'
    formData.append("password", password);

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            body: new URLSearchParams(formData) // Esto lo convierte al formato correcto
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("copiermaster_token", data.access_token);
            localStorage.setItem("copiermaster_role", data.role);
            localStorage.setItem("copiermaster_user", email);
            window.location.href = "dashboard.html";
        } else {
            errorDiv.textContent = data.detail || "Error de autenticación";
        }
    } catch (err) {
        console.error("Error:", err);
        errorDiv.textContent = "Error al conectar con el servidor.";
    }
});
