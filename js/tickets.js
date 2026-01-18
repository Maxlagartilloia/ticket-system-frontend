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

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <span style="font-weight:bold; color:#1e293b;">${t.institutions?.name || 'Cliente Desconocido'}</span>
                <span class="badge-prio" style="background:${prioColor};">${t.priority || 'Media'}</span>
            </div>
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
        const { error } = await sb.from('tickets').insert([{
            institution_id: document.getElementById('clientSelect').value,
            equipment_id: document.getElementById('equipSelect').value,
            description: document.getElementById('ticketDesc').value,
            priority: document.getElementById('ticketPriority').value, // <--- AQUÍ CAPTURAMOS LA PRIORIDAD
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
    document.getElementById('viewDate').innerText = new Date(t.created_at).toLocaleString();
    document.
