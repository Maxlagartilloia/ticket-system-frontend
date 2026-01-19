const sb = supabase.createClient('https://esxojlfcjwtahkcrqxkd.supabase.co', 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y');

// Variables globales para control
let currentTicketId = null;
let currentUserRole = null;
let currentUserInstitution = null;

document.addEventListener("DOMContentLoaded", async () => {
    await checkUserSession(); // 1. Ver quién soy (Supervisor o Cliente)
    await loadTickets();      // 2. Cargar el tablero
    await loadClients();      // 3. Cargar lista (filtrada si soy cliente)
    await loadTechnicians();  // 4. Cargar lista para asignar
});

// =========================================================
// 0. SEGURIDAD Y CONTEXTO
// =========================================================
async function checkUserSession() {
    const { data: { user } } = await sb.auth.getUser();
    if (user) {
        const { data: profile } = await sb.from('profiles')
            .select('role, institution_id') // Asumiendo que agregamos institution_id al perfil
            .eq('id', user.id)
            .single();
        
        currentUserRole = profile?.role;
        currentUserInstitution = profile?.institution_id;

        // Ajustes visuales si es Cliente
        if (currentUserRole === 'client') {
            // Ocultar elementos que el cliente no debe ver (ej: borrar tickets)
            // Aquí puedes agregar lógica extra si es necesario
        }
    }
}

// =========================================================
// 1. CARGA DE TICKETS (TABLERO KANBAN)
// =========================================================
async function loadTickets() {
    let query = sb.from('tickets')
        .select(`*, institutions (name), equipment (brand, model, serial_number)`)
        .order('created_at', { ascending: false });

    // FILTRO DE SEGURIDAD: Si soy cliente, solo veo mis tickets
    if (currentUserRole === 'client' && currentUserInstitution) {
        query = query.eq('institution_id', currentUserInstitution);
    }

    const { data: tickets, error } = await query;

    if (error) {
        console.error("Error cargando tickets:", error);
        return;
    }

    // Limpiar columnas
    const colOpen = document.getElementById('col-open');
    const colProg = document.getElementById('col-progress');
    const colClosed = document.getElementById('col-closed');
    
    if(colOpen) colOpen.innerHTML = ''; 
    if(colProg) colProg.innerHTML = ''; 
    if(colClosed) colClosed.innerHTML = '';
    
    let countOpen = 0, countProg = 0, countClosed = 0;

    tickets.forEach(t => {
        // Definir color de prioridad
        let prioColor = '#64748b'; 
        if(t.priority === 'Media') prioColor = '#f59e0b'; 
        if(t.priority === 'Alta') prioColor = '#ef4444'; 

        // Crear tarjeta
        const card = document.createElement('div');
        card.className = 'ticket-card';
        card.onclick = () => openViewModal(t.id); 
        card.style.borderLeft = `4px solid ${prioColor}`;

        const typeLabel = t.incident_type ? `<span class="badge-type" style="background:#e2e8f0; padding:2px 5px; border-radius:4px; font-size:10px; color:#475569; margin-left:5px;">${t.incident_type}</span>` : '';

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <span style="font-weight:bold; color:#1e293b;">${t.institutions?.name || 'Cliente'}</span>
                <span class="badge-prio" style="background:${prioColor};">${t.priority || 'Media'}</span>
            </div>
            <div style="font-size:12px; margin-bottom:5px;">${typeLabel}</div>
            <div style="font-size:13px; color:#334155; margin-bottom:8px;">
                ${t.description ? t.description.substring(0, 60) + '...' : 'Sin descripción'}
            </div>
            <div class="ticket-meta">
                <span><i class="fas fa-print"></i> ${t.equipment?.model || 'General'}</span>
                <span>${new Date(t.created_at).toLocaleDateString()}</span>
            </div>
        `;

        if (t.status === 'open') { colOpen.appendChild(card); countOpen++; }
        else if (t.status === 'in_progress') { colProg.appendChild(card); countProg++; }
        else if (t.status === 'closed') { colClosed.appendChild(card); countClosed++; }
    });

    document.getElementById('count-open').innerText = countOpen;
    document.getElementById('count-progress').innerText = countProg;
    document.getElementById('count-closed').innerText = countClosed;
}

// =========================================================
// 2. FORMULARIO NUEVO TICKET (Con Auto-Asignación)
// =========================================================

async function loadClients() {
    const sel = document.getElementById('clientSelect');
    sel.innerHTML = '<option value="">-- Seleccione Cliente --</option>';

    // Si soy CLIENTE, solo me cargo a mí mismo
    if (currentUserRole === 'client' && currentUserInstitution) {
        const { data } = await sb.from('institutions').select('id, name').eq('id', currentUserInstitution);
        data?.forEach(i => {
            sel.innerHTML += `<option value="${i.id}" selected>${i.name}</option>`;
        });
        sel.disabled = true; // Bloquear selección
        loadClientEquipment(currentUserInstitution); // Cargar mis equipos de una vez
    } else {
        // Si soy SUPERVISOR, cargo todos
        const { data } = await sb.from('institutions').select('id, name').order('name');
        data?.forEach(i => {
            sel.innerHTML += `<option value="${i.id}">${i.name}</option>`;
        });
        sel.disabled = false;
    }
}

window.loadClientEquipment = async (clientId) => {
    const eqSel = document.getElementById('equipSelect');
    if(!clientId) {
        eqSel.innerHTML = '<option value="">Seleccione primero un cliente</option>';
        eqSel.disabled = true;
        return;
    }
    
    eqSel.innerHTML = '<option>Cargando...</option>';
    const { data } = await sb.from('equipment')
        .select('id, brand, model, serial_number')
        .eq('institution_id', clientId)
        .order('model');

    eqSel.innerHTML = '<option value="">-- Seleccione Equipo --</option>';
    data?.forEach(e => {
        const brand = e.brand ? e.brand + ' ' : ''; 
        eqSel.innerHTML += `<option value="${e.id}">${brand}${e.model} (${e.serial_number})</option>`;
    });
    eqSel.disabled = false;
};

// --- GUARDAR TICKET (Lógica Inteligente) ---
document.getElementById('createTicketForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('.btn-confirm');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    btn.disabled = true;

    try {
        const clientId = document.getElementById('clientSelect').value;
        const fileInput = document.getElementById('ticketFile');
        let publicUrl = null;

        // 1. Subir Foto
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const { error: uploadError } = await sb.storage.from('evidence').upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data: urlData } = sb.storage.from('evidence').getPublicUrl(fileName);
            publicUrl = urlData.publicUrl;
        }

        // 2. AUTO-ASIGNACIÓN: Buscar Técnico por Defecto del Cliente
        // Nota: Asegúrate de tener una columna 'default_technician_id' en la tabla 'institutions'
        // Si no existe, esta parte simplemente no asignará a nadie y quedará 'open'.
        let assignedTech = null;
        let initialStatus = 'open';

        const { data: clientData } = await sb.from('institutions')
            .select('default_technician_id') 
            .eq('id', clientId)
            .single();

        if (clientData && clientData.default_technician_id) {
            assignedTech = clientData.default_technician_id;
            initialStatus = 'in_progress'; // ¡Pasa directo a proceso!
        }

        // 3. Insertar Ticket
        const { error } = await sb.from('tickets').insert([{
            institution_id: clientId,
            equipment_id: document.getElementById('equipSelect').value,
            description: document.getElementById('ticketDesc').value,
            priority: document.getElementById('ticketPriority').value,
            incident_type: document.getElementById('ticketType').value,
            status: initialStatus, // 'open' o 'in_progress'
            technician_id: assignedTech, // Se asigna solo si hay default
            image_url: publicUrl,
            created_at: new Date()
        }]);

        if (error) throw error;

        // Mensaje personalizado
        let msg = '✅ Ticket creado exitosamente.';
        if (assignedTech) msg += ' Asignado automáticamente al técnico de zona.';
        
        alert(msg);
        closeModal('newTicketModal');
        e.target.reset();
        loadTickets();

    } catch (err) {
        alert('Error: ' + err.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});


// =========================================================
// 3. VER DETALLE Y GESTIÓN
// =========================================================

window.openViewModal = async (ticketId) => {
    currentTicketId = ticketId;
    const modal = document.getElementById('viewTicketModal');
    
    document.getElementById('viewTitle').innerText = `Ticket #${ticketId.substring(0,8)}...`;
    
    const { data: t } = await sb.from('tickets')
        .select('*, institutions(name), equipment(brand, model), profiles(id, full_name)')
        .eq('id', ticketId)
        .single();

    if(!t) return;

    document.getElementById('viewClient').innerText = t.institutions?.name || '---';
    const brand = t.equipment?.brand ? t.equipment.brand + ' ' : '';
    document.getElementById('viewEquip').innerText = `${brand}${t.equipment?.model || '---'}`;
    document.getElementById('viewDate').innerText = new Date(t.created_at).toLocaleString();
    document.getElementById('viewDesc').innerText = t.description;

    const typeBadge = document.getElementById('viewTypeBadge');
    if(typeBadge) typeBadge.innerText = t.incident_type || 'General';

    const prioBadge = document.getElementById('viewPriorityBadge');
    if(prioBadge) {
        prioBadge.innerText = t.priority || 'Media';
        prioBadge.style.background = t.priority === 'Alta' ? '#ef4444' : (t.priority === 'Baja' ? '#22c55e' : '#f59e0b');
    }

    const imgCont = document.getElementById('viewImageContainer');
    if (t.image_url) {
        document.getElementById('viewImage').src = t.image_url;
        imgCont.style.display = 'block';
    } else {
        imgCont.style.display = 'none';
    }

    document.getElementById('changeStatusSelect').value = t.status;
    document.getElementById('assignTechSelect').value = t.technician_id || "";

    modal.style.display = 'flex';
};

async function loadTechnicians() {
    const { data } = await sb.from('profiles').select('id, full_name').eq('role', 'technician'); 
    const sel = document.getElementById('assignTechSelect');
    sel.innerHTML = '<option value="">Sin Asignar</option>';
    data?.forEach(tech => {
        sel.innerHTML += `<option value="${tech.id}">${tech.full_name}</option>`;
    });
}

window.saveAssignment = async () => {
    const techId = document.getElementById('assignTechSelect').value;
    // Si asigno manualmente, cambia a in_progress
    const status = techId ? 'in_progress' : 'open';
    
    const { error } = await sb.from('tickets')
        .update({ technician_id: techId || null, status: status })
        .eq('id', currentTicketId);

    if(error) alert("Error al asignar: " + error.message);
    else {
        alert("✅ Técnico asignado correctamente");
        loadTickets();
        closeModal('viewTicketModal');
    }
};

window.updateTicketStatus = async () => {
    const newStatus = document.getElementById('changeStatusSelect').value;
    const updateData = { status: newStatus };
    
    if (newStatus === 'closed') {
        const now = new Date();
        updateData.departure_time = now.toISOString(); 
    }

    const { error } = await sb.from('tickets')
        .update(updateData)
        .eq('id', currentTicketId);

    if(error) alert("Error: " + error.message);
    else {
        loadTickets(); 
        closeModal('viewTicketModal'); 
    }
};

window.openNewTicketModal = () => document.getElementById('newTicketModal').style.display = 'flex';
window.closeModal = (id) => document.getElementById(id).style.display = 'none';
