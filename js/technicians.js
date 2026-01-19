// URL y KEY de tu proyecto
const SUPABASE_URL = 'https://esxojlfcjwtahkcrqxkd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let currentUserRole = null;

document.addEventListener("DOMContentLoaded", async () => {
    // Primero revisamos rol, luego cargamos datos
    await checkMyRole();
    await loadTechnicians();
});

// 1. VERIFICAR ROL
async function checkMyRole() {
    try {
        const { data: { user } } = await sb.auth.getUser();
        if(user) {
            const { data } = await sb.from('profiles').select('role').eq('id', user.id).single();
            currentUserRole = data?.role;
        }
    } catch (e) { console.error("Error verificando rol:", e); }
}

// 2. CARGAR PERSONAL (FUNCIÓN BLINDADA)
async function loadTechnicians() {
    const grid = document.getElementById('techGrid');
    if (!grid) return; // Si no existe el grid, salimos para no dar error
    
    grid.innerHTML = '<div style="grid-column:1/-1; text-align:center;">Cargando...</div>';
    
    // A. Traer perfiles
    const { data: profiles, error } = await sb.from('profiles').select('*').order('full_name');
    
    if(error) {
        console.error("Error Supabase:", error);
        grid.innerHTML = '<div style="color:red; text-align:center;">Error de conexión. Recarga la página.</div>';
        return;
    }

    if(!profiles || profiles.length === 0) {
        grid.innerHTML = '<div style="text-align:center; padding:20px;">No se encontraron técnicos registrados.</div>';
        return;
    }

    // B. Traer Stats (Intentar, pero no fallar si no hay permisos)
    let tickets = [];
    try {
        const { data: t } = await sb.from('tickets').select('technician_id, status');
        if(t) tickets = t;
    } catch (e) {
        console.warn("No se cargaron estadísticas (posible restricción de permisos).");
    }

    grid.innerHTML = ''; // Limpiar loader
    
    profiles.forEach(p => {
        // Calcular contadores
        const myTickets = tickets.filter(t => t.technician_id === p.id);
        const active = myTickets.filter(t => t.status !== 'closed').length;
        const closed = myTickets.filter(t => t.status === 'closed').length;

        // Determinar Estilos
        const isSup = p.role === 'supervisor';
        const roleClass = isSup ? 'role-supervisor' : 'role-technician';
        const roleLabel = isSup ? 'SUPERVISOR' : 'TÉCNICO';
        const icon = isSup ? 'fa-user-tie' : 'fa-screwdriver-wrench';

        // Botón de acciones (Solo para Supervisor)
        let actionBtn = '';
        if (currentUserRole === 'supervisor') {
            const nextRole = isSup ? 'technician' : 'supervisor';
            const btnIcon = isSup ? 'fa-arrow-down' : 'fa-arrow-up';
            const tooltip = isSup ? 'Degradar' : 'Ascender';
            
            actionBtn = `
                <div class="card-actions">
                    <button class="btn-mini" title="${tooltip}" onclick="toggleRole('${p.id}', '${nextRole}')">
                        <i class="fas ${btnIcon}"></i>
                    </button>
                </div>`;
        }

        // Renderizar Tarjeta
        const cardHTML = `
            <div class="tech-card">
                ${actionBtn}
                <div class="avatar-circle">
                    <i class="fas ${icon}"></i>
                </div>
                <div style="font-weight:700; font-size:16px; color:#1e293b; margin-bottom:5px;">
                    ${p.full_name || 'Usuario'}
                </div>
                <div style="font-size:12px; color:#64748b; margin-bottom:10px;">
                    ${p.email}
                </div>
                <span class="role-badge ${roleClass}">${roleLabel}</span>

                <div class="tech-stats">
                    <div class="stat-item">
                        <div class="stat-val" style="color:#ef4444;">${active}</div>
                        <div class="stat-lbl">Activos</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-val" style="color:#10b981;">${closed}</div>
                        <div class="stat-lbl">Cerrados</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-val">${myTickets.length}</div>
                        <div class="stat-lbl">Total</div>
                    </div>
                </div>
            </div>
        `;
        grid.innerHTML += cardHTML;
    });
}

// 3. CAMBIAR ROL
window.toggleRole = async (userId, newRole) => {
    if(!confirm(`¿Cambiar rol a ${newRole}?`)) return;
    const { error } = await sb.from('profiles').update({ role: newRole }).eq('id', userId);
    if(error) alert("Error: " + error.message);
    else loadTechnicians();
}

// 4. LÓGICA DEL MODAL DE REGISTRO
const registerForm = document.getElementById('registerForm');
if(registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('.btn-confirm');
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Creando...'; 
        btn.disabled = true;

        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPass').value;
        const name = document.getElementById('regName').value;
        const role = document.getElementById('regRole').value;

        try {
            // Cliente temporal para no cerrar sesión actual
            const tempClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
                auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
            });

            // 1. Crear Usuario
            const { data: authData, error: authError } = await tempClient.auth.signUp({
                email: email, password: password,
                options: { data: { full_name: name } }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("No se pudo crear usuario.");

            // 2. Crear Perfil
            const { error: profileError } = await sb.from('profiles').upsert({
                id: authData.user.id, email: email, full_name: name, role: role
            });

            if (profileError) throw profileError;

            alert(`✅ Usuario ${name} creado.`);
            closeRegisterModal();
            registerForm.reset();
            loadTechnicians();

        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

// Control de Modales
window.openRegisterModal = () => document.getElementById('registerModal').style.display = 'flex';
window.closeRegisterModal = () => document.getElementById('registerModal').style.display = 'none';
