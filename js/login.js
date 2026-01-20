// ==========================================
// LÓGICA DE LOGIN (VINCULADA AL MAESTRO)
// ==========================================

// IMPORTANTE: Este archivo asume que 'sb' ya existe (cargado desde js/supabase.js)

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 1. Elementos de la interfaz
    const btn = document.getElementById('btnLog');
    const errorMsg = document.getElementById('errorMsg');
    
    // 2. Estado de "Cargando"
    btn.disabled = true;
    const textoOriginal = btn.innerText;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
    errorMsg.style.display = 'none';

    // 3. Capturar datos (Limpiando espacios accidentales)
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    try {
        // Validación rápida
        if (!email || !password) throw new Error("Por favor completa ambos campos.");

        // 4. LOGIN (Usando la conexión 'sb' del archivo maestro)
        console.log("🔐 Intentando entrar en BD:", sb.supabaseUrl); // Debe salir la URL ...kkuz

        const { data: authData, error: authError } = await sb.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) throw authError;

        // 5. VERIFICAR ROL (Seguridad)
        const { data: profile, error: profileError } = await sb
            .from('profiles')
            .select('role')
            .eq('id', authData.user.id)
            .single();

        if (profileError || !profile) {
            throw new Error("Usuario validado pero sin perfil de sistema.");
        }

        // 6. REDIRECCIONAR SEGÚN RANGO
        console.log("✅ Acceso permitido. Rol:", profile.role);

        if (profile.role === 'supervisor') {
            window.location.href = 'dashboard.html';
        } else {
            // Técnicos y Clientes van al Help Desk
            window.location.href = 'tickets.html';
        }

    } catch (error) {
        console.error("❌ Error de Login:", error);
        
        // Restaurar botón
        btn.disabled = false;
        btn.innerText = textoOriginal;
        
        // Mostrar mensaje amigable
        let mensaje = "Credenciales incorrectas.";
        if (error.message.includes("network")) mensaje = "Error de conexión con el servidor.";
        if (error.message.includes("sin perfil")) mensaje = "Tu usuario no tiene perfil asignado.";
        
        errorMsg.innerText = `⚠️ ${mensaje}`;
        errorMsg.style.display = 'block';
    }
});
