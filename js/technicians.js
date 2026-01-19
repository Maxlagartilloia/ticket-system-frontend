const SUPABASE_URL = 'https://esxojlfcjwtahkcrqxkd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let currentUserRole = null;

document.addEventListener("DOMContentLoaded", async () => {
    await checkMyRole();
    loadTechnicians();
});

// 1. VERIFICAR ROL (Para mostrar u ocultar controles de Supervisor)
async function checkMyRole() {
    const { data: { user } } = await sb.auth.getUser();
    if(user) {
        const { data } = await sb.from('profiles').select('role').eq('id', user.id).single();
        currentUserRole = data?.role;
    }
}

// 2. CARGAR PERSONAL EN EL GRID
async function loadTechnicians() {
    const grid = document.getElementById('techGrid');
    grid.innerHTML = '<div style="grid-column:1/-1; text-align:center;">Cargando...</div>';
    
    // A. Traer perfiles
    const { data: profiles, error } = await sb.from('profiles').select('*').order('full_name');
    
    if(error || !profiles) {
        grid.innerHTML = '<div style="text-align:center; padding:20px;">No se encontraron técnicos registrados.</div>';
        return;
    }

    // B. Traer Tickets para estadísticas (Carga de trabajo)
    let tickets = [];
    try {
        const { data: t } = await sb.from('tickets').select('technician_id, status');
        if(t) tickets = t;
    } catch (e) {
        console.warn("No se pudieron cargar estadísticas.");
    }

    grid.innerHTML = '';
    
    profiles.forEach(p => {
        // Calcular Stats
        const myTickets = tickets.filter(t => t.technician_id === p.id);
        const active = myTickets.filter(t => t.status !== 'closed').length;
        const closed = myTickets.filter(t => t.status === 'closed').length;

        // Estilos Visuales
        const isSup = p.role === 'supervisor';
        const roleClass = isSup ? 'role-supervisor' : 'role-technician';
        const roleLabel = isSup ? 'SUPERVISOR' : 'TÉCNICO';
        const icon = isSup ? 'fa-user-tie' : 'fa-screwdriver-wrench';

        // Botón de cambio de rol (Solo visible para Supervisor)
        let actionBtn = '';
        if (currentUserRole === 'supervisor') {
            const nextRole = isSup ? 'technician' : 'supervisor';
            const btnIcon = isSup ? 'fa-arrow-down' : 'fa-arrow-up';
            const title = isSup ? 'Degradar a Técnico' : 'Ascender a Supervisor';
            
            actionBtn = `
                <div class="card-actions">
                    <button class="btn-mini" title="${title}" onclick="toggleRole('${p.id}', '${nextRole}')">
                        <i class="fas ${btnIcon}"></i>
                    </button>
                </div>`;
        }

        grid.innerHTML += `
            <div class="tech-card">
                ${actionBtn}
                <div class="avatar-circle"><i class="fas ${icon}"></i></div>
                <div style="font-weight:700; font-size:16px; color:#1e293b; margin-bottom:5px;">${p.full_name || 'Sin Nombre'}</div>
                <div style="font-size:12px; color:#64748b; margin-bottom:10px;">${p.email}</div>
                <span class="role-badge ${roleClass}">${roleLabel}</span>
                <div class="tech-stats">
                    <div class="stat-item"><div class="stat-val" style="color:#ef4444;">${active}</div><div class="stat-lbl">Activos</div></div>
                    <div class="stat-item"><div class="stat-val" style="color:#10b981;">${closed}</div><div class="stat-lbl">Cerrados</div></div>
                    <div class="stat-item"><div class="stat-val">${myTickets.length}</div><div class="stat-lbl">Total</div></div>
                </div>
            </div>`;
    });
}

// 3. CAMBIAR ROL
window.toggleRole = async (userId, newRole) => {
    if(!confirm(`¿Estás seguro de cambiar el rol a ${newRole.toUpperCase()}?`)) return;
    
    const { error } = await sb.from('profiles').update({ role: newRole }).eq('id', userId);
    
    if(error) alert("Error: " + error.message);
    else loadTechnicians();
}

// 4. CREAR USUARIO (Lógica Especial para no cerrar sesión)
const registerForm = document.getElementById('registerForm');
if(registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('.btn-confirm');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando...'; 
        btn.disabled = true;

        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPass').value;
        const name = document.getElementById('regName').value;
        const role = document.getElementById('regRole').value;

        try {
            // TRUCO: Cliente temporal sin persistencia para crear usuario nuevo
            const tempClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
                auth: {
                    persistSession: false, 
                    autoRefreshToken: false,
                    detectSessionInUrl: false
                }
            });

            // 1. Crear en Auth
            const { data: authData, error: authError } = await tempClient.auth.signUp({
                email: email,
                password: password,
                options: { data: { full_name: name } }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("No se pudo crear el usuario (posiblemente ya existe).");

            // 2. Guardar Perfil con Rol correcto (Usando cliente principal con permisos de admin)
            const { error: profileError } = await sb.from('profiles')
                .upsert({
                    id: authData.user.id,
                    email: email,
                    full_name: name,
                    role: role
                });

            if (profileError) throw profileError;

            alert(`✅ Usuario ${name} creado con éxito.`);
            closeRegisterModal();
            e.target.reset();
            loadTechnicians();

        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            btn.innerHTML = originalText; 
            btn.disabled = false;
        }
    });
}

// 5. CONTROL DE MODALES
window.openRegisterModal = () => document.getElementById('registerModal').style.display = 'flex';
window.closeRegisterModal = () => document.getElementById('registerModal').style.display = 'none';
