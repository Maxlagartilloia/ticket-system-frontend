// ✅ URL Corregida: Ahora apunta a tu propio dominio en Netlify donde corre el backend
const API_BASE_URL = "https://soporte.copiermastercyg.com.ec";

const loginForm = document.getElementById("loginForm");
const errorDiv = document.getElementById("error");

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorDiv.style.color = "blue"; // Para que se note el cambio
    errorDiv.textContent = "Validando credenciales en Supabase..."; 

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("copiermaster_token", data.access_token);
            localStorage.setItem("copiermaster_role", data.role);
            localStorage.setItem("copiermaster_user", data.full_name);
            
            errorDiv.style.color = "green";
            errorDiv.textContent = "Acceso concedido. Redirigiendo...";
            
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1000);
        } else {
            errorDiv.style.color = "red";
            errorDiv.textContent = data.detail || "Credenciales incorrectas";
        }
    } catch (err) {
        console.error("Error capturado:", err);
        errorDiv.style.color = "red";
        errorDiv.textContent = "Error de conexión con el servidor.";
    }
});
