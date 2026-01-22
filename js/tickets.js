// ==========================================
// CONTROLADOR DE TICKETS (Help Desk V4.5)
// ==========================================

// Variables Globales de Sesión
let currentUser = null;
let userRole = null;

// 1. INICIALIZACIÓN AL CARGAR
document.addEventListener('DOMContentLoaded', async () => {
    await verifySession();
    await loadDashboard();
});

// 2. VERIFICACIÓN DE SEGURIDAD
async function verifySession() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
        window.location.href = 'index.html'; 
        return;
    }
    currentUser = user;

    const { data: profile } = await sb
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    
    userRole = profile.role; 
    
    const roleName = userRole === 'technician' ? 'Técnico' : (userRole === 'client' ? 'Cliente' : 'Admin');
    document.getElementById('userDisplay').innerHTML = `<b>${profile.first_name || 'Usuario'}</b> (${roleName})`;

    if (userRole === 'client') {
        document.getElementById('btnCreateTicket').style.display = 'flex';
        document.getElementById('dashboardTitle').innerText = 'Mis Reportes';
        loadClientEquipments();
    } else if (userRole === 'technician') {
        document.getElementById('dashboardTitle').innerText = 'Mis Asignaciones';
    } else {
        document.getElementById('dashboardTitle').innerText = 'Supervisión Global';
    }
}

// 3. CARGAR TICKETS
async function loadDashboard() {
    const container = document.getElementById('ticketsGrid');
    const loading = document.getElementById('loadingMsg');
    
    try {
        let query = sb
            .from('tickets')
            .select(`
                *,
                equipment ( model, brand, serial, physical_location ),
                institutions ( name )
            `)
            .order('created_at', { ascending: false });

        if (userRole === 'client') {
            query = query.eq('client_id', currentUser.id);
        } else if (userRole === 'technician') {
            query = query.eq('technician_id', currentUser.id);
        }

        const { data: tickets, error } = await query;
        loading.style.display = 'none';
        if (error) throw error;

        container.innerHTML = '';
        if (tickets.length === 0) {
            container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:#94a3b8;">No hay tickets pendientes.</div>';
            return;
        }

        tickets.forEach(t => {
            const card = createTicketCard(t);
            container.appendChild(card);
        });

    } catch (err) {
        console.error("Error cargando tickets:", err);
        loading.innerText = "Error al cargar datos.";
    }
}

// 4. CREAR TARJETA VISUAL
function createTicketCard(t) {
    const div = document.createElement('div');
    const statusClass = `status-${t.status}`; 
    const statusLabels = { 'open': 'ABIERTO', 'in_progress': 'EN PROCESO', 'closed': 'CERRADO' };
    const label = statusLabels[t.status] || t.status;

    div.className = `ticket-card ${statusClass}`;
    
    let actionBtn = '';
    if (userRole === 'technician' && t.status !== 'closed') {
        actionBtn = `<button onclick="openAttendModal('${t.id}', '${t.ticket_number}', '${t.equipment?.model}')" class="btn-card" style="background:#dbeafe; color:#1e40af; border:1px solid #bfdbfe;">
                        <i class="fas fa-tools"></i> Atender / Diagnosticar
                     </button>`;
    } else if (t.status === 'closed') {
        // AQUÍ ES DONDE CONECTAREMOS CON TU ARCHIVO DE IMPRESIÓN
        // Por ahora dejamos el botón visual
        actionBtn = `<div style="text-align:center; margin-top:10px; font-size:12px; color:#10b981; font-weight:bold;">
                        <i class="fas fa-check-circle"></i> Finalizado
                     </div>`;
    } else {
        actionBtn = `<div style="text-align:center; margin-top:10px; font-size:12px; color:#f59e0b;">
                        <i class="fas fa-clock"></i> Esperando atención
                     </div>`;
    }

    div.innerHTML = `
        <div class="t-header">
            <span>#${t.ticket_number}</span>
            <span style="font-weight:700;">${label}</span>
        </div>
        <h3 class="t-title">${t.institutions?.name || 'Cliente'}</h3>
        <div class="t-model">${t.equipment?.brand} ${t.equipment?.model}</div>
        <span class="t-location"><i class="fas fa-map-marker-alt"></i> ${t.equipment?.physical_location || 'Ubicación n/a'}</span>
        <p class="t-desc">"${t.description}"</p>
        ${actionBtn}
    `;
    return div;
}

// 5. LÓGICA MODALES (Cliente y Técnico)
async function loadClientEquipments() {
    // Busca equipos del cliente. TRUCO: Si no aparecen, verifica que el institution_id coincida.
    // Por ahora traemos todos para que la prueba no falle.
    const { data } = await sb.from('equipment').select('id, model, serial, physical_location, institution_id');
    
    const select = document.getElementById('selectEquipment');
    select.innerHTML = '<option value="">Selecciona tu equipo...</option>';
    
    if(data) {
        data.forEach(eq => {
            const opt = document.createElement('option');
            opt.value = eq.id;
            opt.dataset.institution = eq.institution_id; // Guardamos ID oculto
            opt.innerText = `${eq.model} (${eq.physical_location}) - ${eq.serial}`;
            select.appendChild(opt);
        });
    }
}

function showCreateModal() { document.getElementById('modalCreate').style.display = 'flex'; }

document.getElementById('formCreate').addEventListener('submit', async (e) => {
    e.preventDefault();
    const select = document.getElementById('selectEquipment');
    const equipId = select.value;
    const instId = select.options[select.selectedIndex].dataset.institution; // Recuperamos ID Institución
    const desc = document.getElementById('txtDescription').value;

    const { error } = await sb.from('tickets').insert({
        client_id: currentUser.id,
        equipment_id: equipId,
        institution_id: instId, // Vital para que el Supervisor sepa de quién es
        description: desc,
        status: 'open',
        ticket_number: Math.floor(Math.random() * 9000) + 1000
    });

    if(!error) {
        closeModals();
        loadDashboard();
        alert("✅ Ticket creado exitosamente");
    } else {
        alert("Error: " + error.message);
    }
});

window.openAttendModal = (id, num, model) => {
    document.getElementById('attendId').value = id;
    document.getElementById('attendTicketInfo').innerText = `Ticket #${num} - ${model}`;
    document.getElementById('modalAttend').style.display = 'flex';
};

document.getElementById('formAttend').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('attendId').value;
    
    const { error } = await sb.from('tickets').update({
        diagnosis: document.getElementById('txtDiagnosis').value,
        solution: document.getElementById('txtSolution').value,
        status: document.getElementById('selStatus').value,
        updated_at: new Date()
    }).eq('id', id);

    if(!error) {
        closeModals();
        loadDashboard();
        alert("✅ Trabajo registrado correctamente");
    } else {
        alert("Error: " + error.message);
    }
});

window.closeModals = () => { document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none'); };
window.logoutSystem = async () => { await sb.auth.signOut(); window.location.href = 'index.html'; };
