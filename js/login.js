// ==========================================
// CONFIGURACIÓN DE SUPABASE
// ==========================================

// Tu URL de proyecto
const SUPABASE_URL = 'https://esxojlfcjwtahkcrqxkd.supabase.co'; 

// Tu Clave Pública (Anon Key)
const SUPABASE_ANON_KEY = 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y';

// Inicializamos el cliente de Supabase
// (Si esto falla, asegúrate de haber puesto el script en el index.html)
const sbClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Referencias a los elementos de la pantalla
const loginForm = document.getElementById("loginForm");
const errorDiv = document.getElementById("error");

// ==========================================
// LÓGICA DE INICIO DE SESIÓN
// ==========================================
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // Evita que la página se recargue sola
    
    // 1. Mostrar estado "Cargando"
    errorDiv.style.color = "blue";
    errorDiv.textContent = "Verificando credenciales...";
    
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        // 2. Enviar datos a Supabase
        const { data, error } = await sbClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        // 3. Si hay error, lanzamos la excepción para ir al 'catch'
        if (error) throw error;

        // 4. Si todo salió bien:
        console.log("Login exitoso:", data.user);
        
        // Guardamos el token de seguridad en el navegador
        localStorage.setItem("copiermaster_token", data.session.access_token);
        localStorage.setItem("copiermaster_user", data.user.email);
        
        // Avisamos al usuario
        errorDiv.style.color = "green";
        errorDiv.textContent = "¡Bienvenido! Redirigiendo al sistema...";

        // 5. Redirigimos al Dashboard después de 1.5 segundos
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1500);

    } catch (err) {
        console.error("Error de acceso:", err.message);
        errorDiv.style.color = "red";
        
        // Mensajes de error amigables en español
        if (err.message.includes("Invalid login")) {
            errorDiv.textContent = "El correo o la contraseña son incorrectos.";
        } else if (err.message.includes("Email not confirmed")) {
            errorDiv.textContent = "Tu correo no ha sido confirmado. Revisa tu bandeja de entrada.";
        } else {
            errorDiv.textContent = "Error de conexión: " + err.message;
        }
    }
});
