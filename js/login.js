// ✅ URL DINÁMICA: Detecta automáticamente tu dominio (soporte.copiermastercyg.com.ec)
// Esto evita errores de CORS y problemas de rutas fijas.
const API_BASE_URL = window.location.origin;

const loginForm = document.getElementById("loginForm");
const errorDiv = document.getElementById("error");

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Limpieza de estados previos
    errorDiv.style.color = "blue"; 
    errorDiv.textContent = "Conectando con Supabase..."; 

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Preparación de datos para OAuth2 (FastAPI compatible)
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

        // Intentamos obtener el JSON. Si falla aquí, es por el error 404 de Netlify (falta el .toml)
        const data = await response.json();

        if (response.ok) {
            // Guardamos la sesión en el navegador
            localStorage.setItem("copiermaster_token", data.access_token);
            localStorage.setItem("copiermaster_role", data.role);
            localStorage.setItem("copiermaster_user", data.full_name);
            
            errorDiv.style.color = "green";
            errorDiv.textContent = "¡Éxito! Entrando al sistema...";
            
            // Redirección al Dashboard tras 1 segundo
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1000);
        } else {
            // Manejo de errores de credenciales (401 Unauthorized)
            errorDiv.style.color = "red";
            errorDiv.textContent = data.detail || "Email o contraseña incorrectos";
        }
    } catch (err) {
        // Este error ocurre si el servidor responde con HTML en lugar de JSON
        console.error("Error técnico detectado:", err);
        errorDiv.style.color = "red";
        errorDiv.textContent = "Error de comunicación. Asegúrate de haber subido el archivo netlify.toml";
    }
});
