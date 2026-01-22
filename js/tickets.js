// ==========================================
// CONTROLADOR DE TICKETS (V8.0 - GAD ENTERPRISE)
// ==========================================

let currentUser = null;
let userRole = null;
let selectedFile = null; // Variable para retener la foto antes de subir

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await verifySession();
        await loadDashboard();
        setupImagePreview(); // Inicializar listener de fotos
    } catch (e) {
        console.error("Critical Error:", e);
    }
});

// 1. CONFIGURACIÓN DE PREVISUALIZACIÓN DE FOTOS
function setupImagePreview() {
    const fileInput = document.getElementById('fileEvidence');
    if(!fileInput) return;

    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validar tipo y tamaño
        if (!file.type.startsWith('image/')) { alert('Solo se permiten imágenes (JPG, PNG).'); return; }
        if (file.size > 5 * 1024 * 1024) { alert('La imagen no puede superar los 5MB.'); return; }

        selectedFile = file; // Guardar en memoria
        
        // Mostrar preview
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = document.getElementById('imagePreview');
            const container = document.getElementById('previewContainer');
            const dropzone = document.getElementById('uploadDropZone');
            
            img.src = ev.target.result;
            container.style.display = 'block';
            dropzone.style.display = 'none'; // Ocultar zona de carga
        }
        reader.readAsDataURL(file);
    });
}

window.removeImage = () => {
    document.getElementById('fileEvidence').value = '';
    document.getElementById('previewContainer').style.display = 'none';
    document.getElementById('uploadDropZone').style.display = 'block';
    selectedFile = null;
};

// 2. SESIÓN Y ROL
async function verifySession() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { window.location.href = 'index.html'; return; }
    currentUser = user;

    const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).single();
    userRole = profile.role; 

    // UI Header
    const roleMap = { 'technician': 'Técnico', 'client': 'Cliente', 'supervisor': 'Supervisor' };
    document.getElementById('userDisplay').innerHTML = `<b>${profile.first_name || 'Usuario'}</b> (${roleMap[userRole]})`;

    // Configuración Vistas
    if (userRole === 'client') {
        document.getElementById('btnCreateTicket').style.display = 'flex';
        document.getElementById('dashboardTitle').innerText = 'Mis Reportes de Servicio';
        loadClientEquipments();
    } else if (userRole === 'technician') {
        document.getElementById('dashboardTitle').innerText = 'Mis Asignaciones';
    } else {
        document.getElementById('dashboardTitle').innerText = 'Supervisión Global';
    }
}

// 3. CARGAR DASHBOARD (Tickets)
async function loadDashboard() {
    const container = document.getElementById('ticketsGrid');
    const loading = document.getElementById('loadingMsg');
    
    // Consulta Enterprise: Tickets + Equipos + Instituciones
    let query = sb.from('tickets')
        .select(`
            *, 
            equipment ( model, brand, serial, physical_location ), 
            institutions ( name )
        `)
        .order('created_at', { ascending: false });

    // Filtros RLS Lógicos
    if (userRole === 'client') query = query.eq('client_id', currentUser.id);
    else if (userRole === 'technician') query = query.eq('technician_id', currentUser.id);

    const { data: tickets, error } = await query;
    if(loading) loading.style.display = 'none';

    if (error) { container.innerHTML = `<p style="color:red">Error DB: ${error.message}</p>`; return; }

    container.innerHTML = '';
    if (!tickets || tickets.length === 0) {
        container.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:50px; border:2px dashed #cbd5e1; border-radius:12px; color:#64748b;">
                <i class="fas fa-clipboard-check" style="font-size:32px; margin-bottom:10px;"></i>
                <p>No hay tickets pendientes.</p>
            </div>`;
        return;
    }

    tickets.forEach(t => container.appendChild(createTicketCard(t)));
}

// 4. RENDERIZADO VISUAL (Cards)
function createTicketCard(t) {
    const div = document.createElement('div');
    const statusClass = `status-${t.status}`; 
    const labels = { 'open': 'PENDIENTE', 'in_progress': 'EN PROCESO', 'closed': 'CERRADO' };
    
    // Datos seguros
    const clientName = t.institutions?.name || 'Cliente';
    const model = t.equipment ? `${t.equipment.brand || ''} ${t.equipment.model || ''}` : 'Equipo General';
    const location = t.equipment?.physical_location || 'Ubicación no especificada';
    const priority = t.priority || 'Media';
    
    // Iconos
    const photoBadge = t.photo_url ? `<i class="fas fa-camera" title="Ver Evidencia" style="color:#3b82f6; margin-left:5px;"></i>` : '';
    const priorityColor = priority === 'Alta' ? '#dc2626' : (priority === 'Baja' ? '#059669' : '#ea580c');

    div.className = `ticket-card ${statusClass}`;
    
    let actionBtn = '';
    // Lógica Botones
    if (userRole === 'technician' && t.status !== 'closed') {
        actionBtn = `<button onclick="openAttendModal('${t.id}', '${t.ticket_number}', '${model}')" class="btn-card" style="background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; margin-top:15px; width:100%; padding:10px; cursor:pointer;">
                        <i class="fas fa-tools"></i> Atender Ticket
                     </button>`;
    } else if (t.status === 'closed') {
        actionBtn = `<button onclick="window.open('print_ticket.html?id=${t.id}', '_blank')" class="btn-card" style="background:#f0fdf4; color:#059669; border:1px solid #bbf7d0; margin-top:15px; width:100%; padding:10px; cursor:pointer;">
                        <i class="fas fa-print"></i> Ver Reporte Oficial
                     </button>`;
    } else {
        actionBtn = `<div style="text-align:center; margin-top:15px; font-size:12px; color:#f59e0b; background:#fffbeb; padding:8px; border-radius:6px;">
                        <i class="fas fa-clock"></i> Asignado al técnico
                     </div>`;
    }

    div.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:12px; color:#64748b;">
            <span>#${t.ticket_number} ${photoBadge}</span>
            <span style="font-weight:bold;">${labels[t.status]}</span>
        </div>
        <h3 style="margin:0 0 5px 0; font-size:16px; color:#1e293b;">${clientName}</h3>
        <div style="font-weight:600; color:#2563eb; font-size:14px;">${model}</div>
        <div style="font-size:12px; color:#64748b; margin-bottom:8px;">${location}</div>
        
        <div style="font-size:12px; margin-bottom:10px;">
            <span style="color:#64748b;">Prioridad: </span> 
            <span style="font-weight:bold; color:${priorityColor}">${priority}</span>
        </div>

        <p style="font-size:13px; color:#334155; font-style:italic; background:#f8fafc; padding:10px; border-radius:8px; border-left:3px solid #cbd5e1;">
            "${t.description}"
        </p>
        ${actionBtn}
    `;
    return div;
}

// 5. LÓGICA DE CLIENTE: CARGAR EQUIPOS + AUTO-ASIGNACIÓN (CRÍTICO)
async function loadClientEquipments() {
    // CORRECCIÓN V8.0: Usamos 'technician_id' (según radiografía), NO 'default_technician_id'
    const { data } = await sb.from('equipment')
        .select(`
            id, model, brand, serial, physical_location, institution_id,
            institutions ( technician_id ) 
        `);
    
    const select = document.getElementById('selectEquipment');
    if(!select) return;
    select.innerHTML = '<option value="">Seleccione el equipo afectado...</option>';
    
    if(data) {
        data.forEach(eq => {
            const opt = document.createElement('option');
            opt.value = eq.id;
            // Guardamos datos para usarlos al guardar
            opt.dataset.institution = eq.institution_id;
            opt.dataset.tech = eq.institutions?.technician_id || ''; // <--- AQUÍ ESTÁ LA MAGIA CORREGIDA
            opt.innerText = `${eq.brand} ${eq.model} - ${eq.physical_location}`;
            select.appendChild(opt);
        });
    }
}

// 6. CREAR TICKET (SUBMIT)
const formCreate = document.getElementById('formCreate');
if(formCreate) {
    formCreate.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // UI Loading
        const btn = document.getElementById('btnSubmitReport');
        const originalContent = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

        try {
            const select = document.getElementById('selectEquipment');
            const equipId = select.value;
            const instId = select.options[select.selectedIndex].dataset.institution;
            const techId = select.options[select.selectedIndex].dataset.tech; // Auto-Asignación
            const desc = document.getElementById('txtDescription').value;
            
            // Obtener Prioridad
            const priorityInput = document.querySelector('input[name="priority"]:checked');
            const priority = priorityInput ? priorityInput.value : 'Media';

            let photoUrl = null;

            // A. SUBIR FOTO (Si existe)
            if (selectedFile) {
                const fileName = `${Date.now()}_${Math.floor(Math.random()*1000)}`;
                // Subir al bucket 'evidence'
                const { error: uploadError } = await sb.storage
                    .from('evidence')
                    .upload(fileName, selectedFile);

                if (uploadError) throw new Error("Error subiendo foto: " + uploadError.message);

                const { data: urlData } = sb.storage.from('evidence').getPublicUrl(fileName);
                photoUrl = urlData.publicUrl;
            }

            // B. CREAR TICKET
            const { error } = await sb.from('tickets').insert({
                client_id: currentUser.id,
                equipment_id: equipId,
                institution_id: instId,
                technician_id: techId || null, // Se asigna aquí
                description: desc,
                priority: priority,
                photo_url: photoUrl,
                status: 'open',
                ticket_number: Math.floor(Math.random() * 90000) + 10000
            });

            if (error) throw error;

            closeModals();
            loadDashboard();
            alert("✅ Reporte enviado exitosamente.");
            
            // Reset
            formCreate.reset();
            removeImage();

        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    });
}

// 7. ATENDER TICKET (TÉCNICO)
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

    if (!error) {
        closeModals();
        loadDashboard();
        alert("✅ Servicio registrado.");
    } else {
        alert("Error: " + error.message);
    }
});

// UTILIDADES
window.showCreateModal = () => { document.getElementById('modalCreate').style.display = 'flex'; };
window.closeModals = () => { document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none'); };
window.logoutSystem = async () => { await sb.auth.signOut(); window.location.href = 'index.html'; };
