const sb = supabase.createClient('https://esxojlfcjwtahkcrqxkd.supabase.co', 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y');

// Variables globales para control
let currentTicketId = null;

document.addEventListener("DOMContentLoaded", async () => {
    await loadTickets();     // Cargar el tablero
    await loadClients();     // Cargar lista para el formulario
    await loadTechnicians(); // Cargar lista para asignar
});

// =========================================================
// 1. CARGA DE TICKETS (TABLERO KANBAN)
// =========================================================
async function loadTickets() {
    // Traemos tickets con datos de Cliente y Equipo
    const { data: tickets, error } = await sb
        .from('tickets')
        .select(`
            *,
            institutions (name),
            equipment (brand, model, serial_number)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error cargando tickets:", error);
        return;
    }

    // Limpiar columnas
    const colOpen = document.getElementById('col-open');
    const colProg = document.getElementById('col-progress');
    const colClosed = document.getElementById('col-closed');
    
    colOpen.innerHTML = ''; colProg.innerHTML = ''; colClosed.innerHTML = '';
    
    let countOpen = 0, countProg = 0, countClosed = 0;

    tickets.forEach(t => {
        // Definir color de prioridad
        let prioColor = '#64748b'; // Gris (Baja)
        if(t.priority === 'Media') prioColor = '#f59e0b'; // Naranja
        if(t.priority === 'Alta') prioColor = '#ef4444'; // Rojo

        // Crear la tarjeta HTML
        const card = document.createElement('div');
        card.className = 'ticket-card';
        card.onclick = () => openViewModal(t.id); // Al hacer clic, abre el detalle
        
        // Borde izquierdo según prioridad
        card.style.borderLeft = `4px solid ${prioColor}`;

        // [MODIFICACIÓN] Agregamos el Badge de TIPO (Hardware/Software) para cumplir contrato
        const typeLabel = t.incident_type ? `<span class="badge-type" style="background:#e2e8f0; padding:2px 5px; border-radius:4px; font-size:10px; color:#475569; margin-left:5px;">${t.incident_type}</span>` : '';

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <span style="font-weight:bold; color:#1e293b;">${t.institutions?.name || 'Cliente Desconocido'}</span>
                <span class="badge-prio" style="background:${prioColor};">${t.priority || 'Media'}</span>
            </div>
            <div style="font-size:12px; margin-bottom:5px;">${typeLabel}</div>
            <div style="font-size:13px; color:#334155; margin-bottom:8px;">
                ${t.description.substring(0, 60)}${t.description.length > 60 ? '...' : ''}
            </div>
            <div class="ticket-meta">
                <span><i class="fas fa-print"></i> ${t.equipment?.model || 'General'}</span>
                <span>${new Date(t.created_at).toLocaleDateString()}</span>
            </div>
        `;

        // Distribuir en columnas
        if (t.status === 'open') { colOpen.appendChild(card); countOpen++; }
        else if (t.status === 'in_progress') { colProg.appendChild(card); countProg++; }
        else if (t.status === 'closed') { colClosed.appendChild(card); countClosed++; }
    });

    // Actualizar contadores
    document.getElementById('count-open').innerText = countOpen;
    document.getElementById('count-progress').innerText = countProg;
    document.getElementById('count-closed').innerText = countClosed;
}

// =========================================================
// 2. FORMULARIO NUEVO TICKET
// =========================================================

// Cargar Clientes en el Select
async function loadClients() {
    const { data } = await sb.from('institutions').select('id, name').order('name');
    const sel = document.getElementById('clientSelect');
    sel.innerHTML = '<option value="">-- Seleccione Cliente --</option>';
    data?.forEach(i => {
        sel.innerHTML += `<option value="${i.id}">${i.name}</option>`;
    });
}

// Cargar Equipos cuando cambian el cliente
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
        eqSel.innerHTML += `<option value="${e.id}">${e.brand} ${e.model} (${e.serial_number})</option>`;
    });
    eqSel.disabled = false;
};

// --- GUARDAR NUEVO TICKET ---
document.getElementById('createTicketForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('.btn-confirm');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    btn.disabled = true;

    try {
        const fileInput = document.getElementById('ticketFile');
        let publicUrl = null;

        // 1. Subir Foto (Si existe)
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await sb.storage
                .from('evidence')
                .upload(fileName, file);

            if (uploadError) throw uploadError;
            
            const { data: urlData } = sb.storage.from('evidence').getPublicUrl(fileName);
            publicUrl = urlData.publicUrl;
        }

        // 2. Insertar Ticket en Base de Datos
        // [AUDITORÍA] Agregamos incident_type para cumplir el requisito de clasificación
        const { error } = await sb.from('tickets').insert([{
            institution_id: document.getElementById('clientSelect').value,
            equipment_id: document.getElementById('equipSelect').value,
            description: document.getElementById('ticketDesc').value,
            priority: document.getElementById('ticketPriority').value,
            incident_type: document.getElementById('ticketType').value, // <--- CAMPO NUEVO
            status: 'open',
            image_url: publicUrl,
            created_at: new Date()
        }]);

        if (error) throw error;

        // 3. Éxito
        alert('✅ Ticket creado exitosamente');
        closeModal('newTicketModal');
        e.target.reset();
        loadTickets(); // Recargar tablero

    } catch (err) {
        alert('Error: ' + err.message);
    } finally {
        btn.innerHTML = 'Crear Ticket';
        btn.disabled = false;
    }
});


// =========================================================
// 3. VER DETALLE Y GESTIÓN (MODAL)
// =========================================================

// Abrir Modal con datos reales
window.openViewModal = async (ticketId) => {
    currentTicketId = ticketId;
    const modal = document.getElementById('viewTicketModal');
    
    // Resetear textos
    document.getElementById('viewTitle').innerText = `Ticket #${ticketId.substring(0,8)}...`;
    
    // Traer datos frescos
    const { data: t } = await sb.from('tickets')
        .select('*, institutions(name), equipment(brand, model), profiles(id, full_name)')
        .eq('id', ticketId)
        .single();

    if(!t) return;

    // Llenar campos
    document.getElementById('viewClient').innerText = t.institutions?.name;
    document.getElementById('viewEquip').innerText = `${t.equipment?.brand} ${t.equipment?.model}`;
    // Continuamos donde se quedó tu código...
    document.getElementById('viewDate').innerText = new Date(t.created_at).toLocaleString();
    document.getElementById('viewDesc').innerText = t.description;

    // [NUEVO] Llenar Badges de Tipo y Prioridad
    const typeBadge = document.getElementById('viewTypeBadge');
    if(typeBadge) typeBadge.innerText = t.incident_type || 'General';

    const prioBadge = document.getElementById('viewPriorityBadge');
    if(prioBadge) {
        prioBadge.innerText = t.priority || 'Media';
        prioBadge.style.background = t.priority === 'Alta' ? '#ef4444' : (t.priority === 'Baja' ? '#22c55e' : '#f59e0b');
    }

    // Imagen
    const imgCont = document.getElementById('viewImageContainer');
    if (t.image_url) {
        document.getElementById('viewImage').src = t.image_url;
        imgCont.style.display = 'block';
    } else {
        imgCont.style.display = 'none';
    }

    // Configurar Selectores de Gestión
    document.getElementById('changeStatusSelect').value = t.status;
    document.getElementById('assignTechSelect').value = t.technician_id || "";

    modal.style.display = 'flex';
};

// [RECUPERADO] Cargar Lista de Técnicos para asignar (Faltaba en tu código pegado)
async function loadTechnicians() {
    const { data } = await sb.from('profiles')
        .select('id, full_name')
        .eq('role', 'technician'); 
    
    const sel = document.getElementById('assignTechSelect');
    // Mantenemos la opción default de "Sin Asignar" y agregamos los técnicos
    sel.innerHTML = '<option value="">Sin Asignar</option>';
    data?.forEach(tech => {
        sel.innerHTML += `<option value="${tech.id}">${tech.full_name}</option>`;
    });
}

// [RECUPERADO] Guardar Asignación de Técnico
window.saveAssignment = async () => {
    const techId = document.getElementById('assignTechSelect').value;
    
    const { error } = await sb.from('tickets')
        .update({ technician_id: techId || null })
        .eq('id', currentTicketId);

    if(error) alert("Error al asignar: " + error.message);
    else {
        alert("✅ Técnico asignado correctamente");
        loadTickets(); // Refrescar tablero
    }
};

// [RECUPERADO] Actualizar Estado y Fecha de Cierre (Vital para el Reporte de Tiempos)
window.updateTicketStatus = async () => {
    const newStatus = document.getElementById('changeStatusSelect').value;
    
    // Si cierran el ticket, guardamos la fecha de cierre para cumplir el contrato (tiempos de respuesta)
    const updateData = { status: newStatus };
    if (newStatus === 'closed') {
        updateData.closed_at = new Date(); 
    }

    const { error } = await sb.from('tickets')
        .update(updateData)
        .eq('id', currentTicketId);

    if(error) alert("Error: " + error.message);
    else {
        loadTickets(); // Se moverá de columna automáticamente
        closeModal('viewTicketModal'); 
    }
};

// Utilitarios de Ventana
window.openNewTicketModal = () => document.getElementById('newTicketModal').style.display = 'flex';
window.closeModal = (id) => document.getElementById(id).style.display = 'none';.
