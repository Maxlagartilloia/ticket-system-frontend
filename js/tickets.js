// ==========================================
// CONTROLADOR DE TICKETS (V5.0 - Enterprise Final)
// ==========================================

let currentUser = null;
let userRole = null;

// 1. INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await verifySession();
        await loadDashboard();
    } catch (error) {
        console.error("Critical Error:", error);
        // Evita pantalla blanca total mostrando un error amigable
        document.body.innerHTML = `<div style="padding:20px; text-align:center; color:#334155;">
            <h3>Error de Sistema</h3>
            <p>No se pudieron cargar los datos. Verifique su conexión.</p>
        </div>`;
    }
});

// 2. VERIFICACIÓN DE SESIÓN Y ROL
async function verifySession() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { window.location.href = 'index.html'; return; }
    currentUser = user;

    const { data: profile } = await sb
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    
    userRole = profile.role; 
    
    // UI: Mostrar Usuario
    const roleLabel = userRole === 'technician' ? 'Técnico' : (userRole === 'client' ? 'Cliente' : 'Supervisor');
    const userDisplay = document.getElementById('userDisplay');
    if(userDisplay) userDisplay.innerHTML = `<b>${profile.first_name || 'Usuario'}</b> (${roleLabel})`;

    // UI: Configuración según Rol
    const title = document.getElementById('dashboardTitle');
    const btnCreate = document.getElementById('btnCreateTicket');

    if (userRole === 'client') {
        if(title) title.innerText = 'Mis Reportes';
        if(btnCreate) {
            btnCreate.style.display = 'flex'; // Visible solo para cliente
            loadClientEquipments(); // Cargar equipos para el modal
        }
    } else if (userRole === 'technician') {
        if(title) title.innerText = 'Mis Asignaciones';
    } else {
        if(title) title.innerText = 'Supervisión Global';
    }
}

// 3. CARGAR EL DASHBOARD (Tickets)
async function loadDashboard() {
    const container = document.getElementById('ticketsGrid');
    const loading = document.getElementById('loadingMsg');
    
    // Consulta Relacional (Tickets + Equipos + Instituciones)
    let query = sb
        .from('tickets')
        .select(`
            *,
            equipment ( model, brand, serial, physical_location ),
            institutions ( name )
        `)
        .order('created_at', { ascending: false });

    // FILTROS SEGÚN ROL
    if (userRole === 'client') {
        query = query.eq('client_id', currentUser.id);
    } else if (userRole === 'technician') {
        query = query.eq('technician_id', currentUser.id);
    }
    // Supervisor ve todo

    const { data: tickets, error } = await query;
    
    if(loading) loading.style.display = 'none';

    if (error) {
        console.error("Error cargando tickets:", error);
        container.innerHTML = `<p style="color:#ef4444">Error de conexión: ${error.message}</p>`;
        return;
    }

    container.innerHTML = '';

    if (!tickets || tickets.length === 0) {
        container.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:60px; color:#94a3b8; border:2px dashed #cbd5e1; border-radius:12px;">
                <i class="fas fa-clipboard-check" style="font-size:32px; margin-bottom:10px;"></i>
                <p>No hay tickets pendientes.</p>
            </div>`;
        return;
    }

    // Renderizar Tarjetas
    tickets.forEach(t => {
        container.appendChild(renderTicketCard(t));
    });
}

// 4. RENDERIZADO VISUAL
function renderTicketCard(t) {
    const div = document.createElement('div');
    const statusColors = { 'open': '#ef4444', 'in_progress': '#f59e0b', 'closed': '#10b981' };
    const statusLabels = { 'open': 'PENDIENTE', 'in_progress': 'EN PROCESO', 'closed': 'FINALIZADO' };
    
    const color = statusColors[t.status] || '#cbd5e1';
    div.className = 'ticket-card';
    div.classList.add(`status-${t.status}`); // Mantiene compatibilidad CSS
    div.style.borderLeft = `5px solid ${color}`; 

    // Validación de datos (para evitar errores si falta info)
    const clientName = t.institutions?.name || 'Cliente';
    const equipmentInfo = t.equipment ? `${t.equipment.brand} ${t.equipment.model}` : 'Equipo no especificado';
    const location = t.equipment?.physical_location || 'Ubicación no disponible';

    // Botones de Acción
    let actionButton = '';
    
    if (userRole === 'technician' && t.status !== 'closed') {
        // TÉCNICO -> ATENDER
        actionButton = `
            <button onclick="setupAttendModal('${t.id}', '${t.ticket_number}', '${equipmentInfo}')" 
                class="btn-card" style="background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; margin-top:10px; width:100%; padding:8px; cursor:pointer; border-radius:6px;">
                <i class="fas fa-tools"></i> Atender / Diagnosticar
            </button>`;
    } else if (t.status === 'closed') {
        // TODOS -> IMPRIMIR
        actionButton = `
            <button onclick="window.open('print_ticket.html?id=${t.id}', '_blank')" 
                class="btn-card" style="background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; margin-top:10px; width:100%; padding:8px; cursor:pointer; border-radius:6px;">
                <i class="fas fa-print"></i> Ver Reporte
            </button>`;
    } else {
        // CLIENTE -> ESPERA
        actionButton = `<div style="margin-top:15px; text-align:center; font-size:12px; color:#f59e0b;">
            <i class="fas fa-clock"></i> Asignado al técnico
        </div>`;
    }

    div.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:12px; color:#64748b;">
            <span>#${t.ticket_number}</span>
            <span style="font-weight:bold; color:${color}">${statusLabels[t.status] || t.status}</span>
        </div>
        <h3 style="margin:0 0 5px 0; font-size:16px; color:#1e293b;">${clientName}</h3>
        <div style="font-size:13px; font-weight:600; color:#3b82f6;">${equipmentInfo}</div>
        <div style="font-size:12px; color:#64748b; margin-bottom:10px;">${location}</div>
        <p style="font-size:13px; color:#334155; font-style:italic; background:#f8fafc; padding:8px; border-radius:6px;">
            "${t.description}"
        </p>
        ${actionButton}
    `;
    return div;
}

// 5. LÓGICA DE CLIENTE: CREAR TICKET (¡AUTO-ASIGNACIÓN AQUÍ!)
async function loadClientEquipments() {
    // Traemos el equipo Y el técnico por defecto de la institución
    const { data } = await sb.from('equipment')
        .select(`
            id, model, serial, physical_location, institution_id,
            institutions ( default_technician_id )
        `);
    
    const select = document.getElementById('selectEquipment');
    if(!select) return;

    select.innerHTML = '<option value="">Selecciona tu equipo...</option>';
    
    if(data) {
        data.forEach(eq => {
            const opt = document.createElement('option');
            opt.value = eq.id;
            // Guardamos datos ocultos
            opt.dataset.institution = eq.institution_id;
            opt.dataset.tech = eq.institutions?.default_technician_id || ''; 
            opt.innerText = `${eq.model} (${eq.physical_location}) - ${eq.serial}`;
            select.appendChild(opt);
        });
    }
}

// Evento Guardar Ticket
const formCreate = document.getElementById('formCreate');
if(formCreate) {
    formCreate.addEventListener('submit', async (e) => {
        e.preventDefault();
        const select = document.getElementById('selectEquipment');
        const equipId = select.value;
        const instId = select.options[select.selectedIndex].dataset.institution;
        const techId = select.options[select.selectedIndex].dataset.tech; // <--- TÉCNICO AUTOMÁTICO
        const desc = document.getElementById('txtDescription').value;

        // Insertar Ticket con el Técnico YA asignado
        const { error } = await sb.from('tickets').insert({
            client_id: currentUser.id,
            equipment_id: equipId,
            institution_id: instId,
            technician_id: techId || null, // Asignación directa
            description: desc,
            status: 'open',
            ticket_number: Math.floor(Math.random() * 90000) + 10000
        });

        if (error) {
            alert("Error: " + error.message);
        } else {
            document.getElementById('modalCreate').style.display = 'none';
            formCreate.reset();
            loadDashboard();
            alert("✅ Ticket creado y asignado al técnico responsable.");
        }
    });
}

// Función para abrir modal (Expuesta globalmente)
window.showCreateModal = () => { document.getElementById('modalCreate').style.display = 'flex'; };


// 6. LÓGICA DE TÉCNICO: ATENDER
window.setupAttendModal = (id, num, info) => {
    document.getElementById('attendId').value = id;
    document.getElementById('attendTicketInfo').innerText = `Ticket #${num} | ${info}`;
    document.getElementById('modalAttend').style.display = 'flex';
};

const formAttend = document.getElementById('formAttend');
if(formAttend) {
    formAttend.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('attendId').value;
        
        const { error } = await sb.from('tickets').update({
            diagnosis: document.getElementById('txtDiagnosis').value,
            solution: document.getElementById('txtSolution').value,
            status: document.getElementById('selStatus').value,
            updated_at: new Date()
        }).eq('id', id);

        if (error) {
            alert("Error: " + error.message);
        } else {
            document.getElementById('modalAttend').style.display = 'none';
            formAttend.reset();
            loadDashboard();
            alert("✅ Trabajo registrado correctamente.");
        }
    });
}

// Utilidades Globales
window.closeModals = () => { document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none'); };
window.logoutSystem = async () => { await sb.auth.signOut(); window.location.href = 'index.html'; };
