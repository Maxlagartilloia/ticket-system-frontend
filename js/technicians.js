// js/technicians.js - Gestión de Personal v4.0

document.addEventListener('DOMContentLoaded', async () => {
    // Cargar información del usuario actual en la barra superior
    const { data: { session } } = await sb.auth.getSession();
    if(session) {
        // Cargar nombre si es necesario, o dejar que security.js lo maneje
    }
    loadTechnicians();
});

async function loadTechnicians() {
    const grid = document.getElementById('techGrid');
    
    // 1. Obtener Perfiles
    const { data: users, error } = await sb
        .from('profiles')
        .select('*')
        .order('role');

    if (error) {
        grid.innerHTML = `<div style="color:red; text-align:center;">Error cargando personal: ${error.message}</div>`;
        return;
    }

    grid.innerHTML = '';

    // 2. Renderizar Tarjetas
    users.forEach(u => {
        let roleClass = 'role-technician';
        let roleText = 'Técnico';
        let icon = 'fa-user-cog';

        if (u.role === 'supervisor') { roleClass = 'role-supervisor'; roleText = 'Supervisor'; icon = 'fa-user-tie'; }
        if (u.role === 'client') { roleClass = 'role-client'; roleText = 'Cliente'; icon = 'fa-building'; }

        // Simulación de carga laboral (esto vendría de contar tickets reales)
        const activeTickets = Math.floor(Math.random() * 5); 

        const card = `
            <div class="tech-card">
                <div class="card-actions">
                    <button class="btn-mini" onclick="deleteUser('${u.id}')" title="Eliminar"><i class="fas fa-trash"></i></button>
                </div>
                <div class="avatar-circle">
                    <i class="fas ${icon}"></i>
                </div>
                <h3 style="margin:0; font-size:16px; color:#1e293b;">${u.full_name || 'Sin Nombre'}</h3>
                <div style="font-size:12px; color:#64748b; margin-bottom:10px;">${u.email}</div>
                <span class="role-badge ${roleClass}">${roleText}</span>

                <div class="tech-stats">
                    <div class="stat-item">
                        <div class="stat-val" style="color:#3b82f6;">${activeTickets}</div>
                        <div class="stat-lbl">Tickets Activos</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-val" style="color:#10b981;">98%</div>
                        <div class="stat-lbl">SLA</div>
                    </div>
                </div>
            </div>
        `;
        grid.innerHTML += card;
    });
}

// GESTIÓN DE MODALES
window.openRegisterModal = () => document.getElementById('registerModal').style.display = 'flex';
window.closeRegisterModal = () => document.getElementById('registerModal').style.display = 'none';

// CREAR USUARIO (Usando la API Admin de Supabase o función RPC idealmente)
// Nota: En frontend puro, solo puedes crear usuarios si 'Allow Signups' está activo,
// o si usas un segundo cliente temporal para no cerrar tu sesión.
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const pass = document.getElementById('regPass').value;
    const role = document.getElementById('regRole').value;
    
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.innerText = "Creando...";
    btn.disabled = true;

    try {
        // TRUCO: Usamos signUp normal. Si Supabase tiene "Confirm Email" desactivado, 
        // esto crea el usuario y lo loguea (cerrando tu sesión actual). 
        // Para evitar cerrar sesión, necesitamos una Edge Function.
        // PERO, para este prototipo rápido, usaremos el método simple:
        // Advertimos al usuario que se cerrará sesión o usamos un cliente secundario.
        
        // OPCIÓN A (Simple): Crear y avisar que inicie sesión el nuevo.
        const { data, error } = await sb.auth.signUp({
            email: email,
            password: pass,
            options: {
                data: { full_name: name, role: role } // Metadata para el trigger de profiles
            }
        });

        if (error) throw error;

        alert(`✅ Usuario creado correctamente.\nNOTA: Si se cerró tu sesión, vuelve a entrar.`);
        window.location.reload();

    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
        closeRegisterModal();
    }
});

// LOGOUT
window.logout = async () => {
    await sb.auth.signOut();
    window.location.href = 'index.html';
};
