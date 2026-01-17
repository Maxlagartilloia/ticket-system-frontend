const sb = supabase.createClient('https://esxojlfcjwtahkcrqxkd.supabase.co', 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y');
let userProfile = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar Sesión
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return window.location.href = "index.html";

    // 2. Cargar Perfil y Empresa
    const { data: profile } = await sb.from('profiles').select('*, institutions(name)').eq('id', session.user.id).single();
    userProfile = profile;

    if (!userProfile.institution_id) {
        alert("Tu usuario no está vinculado a una empresa. Contacta a soporte.");
        return;
    }

    document.getElementById('clientName').textContent = userProfile.full_name || session.user.email;
    document.getElementById('clientInst').textContent = userProfile.institutions?.name;

    loadMyTickets();
    loadDepartments();

    // 3. ACTIVAR POLLING (Refresco automático cada 10 segundos para ver cambios de estado)
    setInterval(loadMyTickets, 10000);
});

// FUNCIONES DE CARGA
async function loadDepartments() {
    const { data } = await sb.from('departments').select('*').eq('institution_id', userProfile.institution_id);
    const sel = document.getElementById('deptSelect');
    sel.innerHTML = '<option value="">Selecciona Departamento...</option>';
    data?.forEach(d => sel.innerHTML += `<option value="${d.id}">${d.name}</option>`);
}

window.loadEquip = async (deptId) => {
    const sel = document.getElementById('equipSelect');
    sel.disabled = true; sel.innerHTML = '<option>Cargando...</option>';
    const { data } = await sb.from('equipment').select('*').eq('department_id', deptId);
    sel.innerHTML = '<option value="">Selecciona Equipo...</option>';
    data?.forEach(e => sel.innerHTML += `<option value="${e.id}">${e.model} (${e.serial_number})</option>`);
    sel.disabled = false;
}

// CREAR TICKET
document.getElementById('newTicketForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.innerHTML = "Enviando..."; btn.disabled = true;

    const { error } = await sb.from('tickets').insert([{
        institution_id: userProfile.institution_id,
        department_id: document.getElementById('deptSelect').value,
        equipment_id: document.getElementById('equipSelect').value,
        reported_by: userProfile.id,
        title: document.getElementById('title').value,
        priority: document.querySelector('input[name="prio"]:checked').value,
        status: 'open' // Nace abierto -> Alerta para Supervisor
    }]);

    if (error) alert("Error: " + error.message);
    else {
        closeModal();
        e.target.reset();
        loadMyTickets(); // Refrescar lista inmediata
        alert("✅ Solicitud enviada. El supervisor ha sido notificado.");
    }
    btn.innerHTML = "ENVIAR SOLICITUD"; btn.disabled = false;
});

// LISTAR TICKETS
async function loadMyTickets() {
    const { data } = await sb.from('tickets')
        .select('*')
        .eq('institution_id', userProfile.institution_id) // Solo de mi empresa
        .order('created_at', { ascending: false });

    const container = document.getElementById('ticketsContainer');
    container.innerHTML = '';

    if (!data.length) {
        container.innerHTML = '<div style="text-align:center; padding:30px; color:#cbd5e1;">No hay solicitudes recientes</div>';
        return;
    }

    data.forEach(t => {
        let statusStyle = 'background:#e2e8f0; color:#64748b;';
        let statusText = 'Enviado';

        if (t.status === 'open') { statusStyle = 'background:#fee2e2; color:#ef4444;'; statusText = '🔴 Pendiente'; }
        if (t.status === 'in_progress') { statusStyle = 'background:#fef3c7; color:#d97706;'; statusText = '🟠 En Revisión'; }
        if (t.status === 'resolved') { statusStyle = 'background:#dcfce7; color:#16a34a;'; statusText = '🟢 Resuelto'; }

        container.innerHTML += `
            <div class="ticket-item">
                <div>
                    <div style="font-weight:700; color:#1e293b; font-size:15px;">${t.title}</div>
                    <div style="font-size:13px; color:#64748b; margin-top:4px;">#${t.id} • ${new Date(t.created_at).toLocaleDateString()}</div>
                </div>
                <div class="status-badge" style="${statusStyle}">${statusText}</div>
            </div>
        `;
    });
}

// MODALES
window.openModal = () => document.getElementById('ticketModal').style.display = 'flex';
window.closeModal = () => document.getElementById('ticketModal').style.display = 'none';
window.logout = async () => { await sb.auth.signOut(); window.location.href = 'index.html'; };
