// js/login.js - Autenticación y Registro

let isLoginMode = true;

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar si ya hay sesión activa
    const { data: { session } } = await sb.auth.getSession();
    if (session) {
        window.location.href = 'dashboard.html';
    }
});

// Alternar entre Login y Registro
window.toggleMode = () => {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('formTitle');
    const subtitle = document.getElementById('formSubtitle');
    const btn = document.querySelector('#submitBtn span');
    const toggleText = document.getElementById('toggleText');
    const toggleBtn = document.getElementById('toggleBtn');
    const nameGroup = document.getElementById('nameGroup');

    if (isLoginMode) {
        title.innerText = "Iniciar Sesión";
        subtitle.innerText = "Accede al panel de control";
        btn.innerText = "Ingresar";
        toggleText.innerText = "¿No tienes cuenta?";
        toggleBtn.innerText = "Regístrate aquí";
        nameGroup.style.display = 'none';
        document.getElementById('fullName').required = false;
    } else {
        title.innerText = "Crear Cuenta";
        subtitle.innerText = "Registra tu organización o perfil";
        btn.innerText = "Registrarse";
        toggleText.innerText = "¿Ya tienes cuenta?";
        toggleBtn.innerText = "Inicia sesión";
        nameGroup.style.display = 'block';
        document.getElementById('fullName').required = true;
    }
};

document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = document.getElementById('submitBtn');
    const errorBox = document.getElementById('errorBox');

    // UI Loading
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    errorBox.style.display = 'none';

    try {
        if (isLoginMode) {
            // --- LOGIN ---
            const { data, error } = await sb.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;
            window.location.href = 'dashboard.html';

        } else {
            // --- REGISTRO ---
            const fullName = document.getElementById('fullName').value;

            // 1. Crear Usuario en Auth
            const { data: authData, error: authError } = await sb.auth.signUp({
                email: email,
                password: password
            });

            if (authError) throw authError;

            if (authData.user) {
                // 2. Crear Perfil en tabla pública 'profiles'
                // Nota: Asignamos rol 'client' por defecto. El admin lo cambia después.
                const { error: profileError } = await sb.from('profiles').insert([
                    {
                        id: authData.user.id,
                        full_name: fullName,
                        email: email,
                        role: 'client' // Seguridad por defecto
                    }
                ]);

                if (profileError) {
                    console.error("Error creando perfil:", profileError);
                    // No bloqueamos el flujo, pero avisamos
                    alert("Cuenta creada, pero hubo un error configurando el perfil. Contacte soporte.");
                } else {
                    alert("✅ Registro exitoso. Bienvenido a CopierMaster.");
                    window.location.href = 'dashboard.html';
                }
            }
        }
    } catch (err) {
        errorBox.innerText = "Error: " + err.message;
        errorBox.style.display = 'block';
        btn.disabled = false;
        btn.innerHTML = isLoginMode ? '<span>Ingresar</span> <i class="fas fa-arrow-right"></i>' : '<span>Registrarse</span> <i class="fas fa-arrow-right"></i>';
    }
});
